const express = require("express");
const multer = require("multer");
const path = require("path");

const { predict } = require("../controllers/predictionController");

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 3,
        fields: 10,
    },
    fileFilter: (req, file, callback) => {
        const isPdf = file.mimetype === "application/pdf"
            && path.extname(file.originalname).toLowerCase() === ".pdf";

        if (!isPdf) {
            const error = new Error("Only PDF files are accepted for analysis");
            error.status = 400;
            callback(error);
            return;
        }

        callback(null, true);
    },
});

router.post("/", upload.array("pdfs", 3), predict);

module.exports = router;
