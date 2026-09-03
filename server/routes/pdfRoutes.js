const express = require("express");
const multer = require("multer");
const path = require("node:path");

const { uploadPDF } = require("../controllers/pdfController");

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 20 },
    fileFilter: (req, file, callback) => {
        const correctExtension = path.extname(file.originalname).toLowerCase() === ".pdf";
        const correctType = file.mimetype === "application/pdf";

        if (!correctExtension || !correctType) {
            const error = new Error("Only PDF files are accepted");
            error.status = 400;
            callback(error);
            return;
        }

        callback(null, true);
    },
});

router.post("/upload", upload.single("pdf"), uploadPDF);

module.exports = router;
