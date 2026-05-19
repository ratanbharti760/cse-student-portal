const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');
const db = require('./db'); // Aapki purani db.js file se connection lega

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static Folders setup (HTML files aur uploaded files serve karne ke liye)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 📁 MULTER FILE UPLOAD CONFIGURATION
// ==========================================

// 1. PDF Ke liye Disk Storage (File hardware me save hogi)
const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads/'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const uploadPDF = multer({ storage: pdfStorage });

// 2. Excel ke liye Memory Storage (RAM me processing ke liye)
const excelStorage = multer.memoryStorage();
const uploadExcel = multer({ storage: excelStorage });


// ==========================================
// 🚀 ALL API ROUTES (GET, POST, UPLOADS)
// ==========================================

// Existing Route: Get all teachers
app.get('/api/teachers', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM teachers');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Existing Route: Add single teacher
app.post('/api/teachers', async (req, res) => {
    const { name, specialization } = req.body;
    try {
        const [result] = await db.query('INSERT INTO teachers (name, specialization) VALUES (?, ?)', [name, specialization]);
        res.json({ id: result.insertId, name, specialization });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📄 NEW ROUTE: PDF Document Upload API
app.post('/api/upload-pdf', uploadPDF.single('studentPdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Koi PDF file select nahi ki gayi!" });
        }
        const studentId = req.body.studentId;
        const fileUrl = `/uploads/${req.file.filename}`;

        // Hum safe side query chala rahe hain, agar column na ho toh server crash nahi hoga
        await db.query('UPDATE students SET document_path = ? WHERE id = ?', [fileUrl, studentId]).catch(e => console.log("Note: Students table check status or update error skipped"));

        res.json({ success: true, message: "PDF Upload ho gayi aur server par save ho gayi!", path: fileUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 📊 NEW ROUTE: Excel Bulk Data Import API
app.post('/api/upload-excel', uploadExcel.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Excel file select karein!" });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheetName]);

        let insertedRows = 0;
        for (let row of sheetData) {
            const teacherName = row.Name || row.name || row.NAME; 
            const specialization = row.Specialization || row.specialization || row.SPECIALIZATION;

            if (teacherName && specialization) {
                await db.query('INSERT INTO teachers (name, specialization) VALUES (?, ?)', [teacherName, specialization]);
                insertedRows++;
            }
        }
        res.json({ success: true, message: `Excel parse ho gaya! Total ${insertedRows} rows database me add ho gaye.` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Excel sheet data format match nahi hua." });
    }
});

// Fallback Route: Serve index.html for UI
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Server Start
app.listen(PORT, () => {
    console.log(`Production Server running on port ${PORT}`);
});