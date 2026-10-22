const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const pdfRoutes = require("./routes/pdfRoutes");
const predictHandler = require("../client/api/predict");

const app = express();

app.disable("x-powered-by");
app.use(cors({
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
        : true,
}));

app.get("/api/health", require("../client/api/health"));

// API
app.use("/api/pdf", express.json({ limit: "100kb" }), pdfRoutes);
// Same handler that runs as a Vercel Function in production.
app.all("/api/predict", express.json({ limit: "5mb" }), predictHandler);

// Static frontend
app.use(express.static(path.join(__dirname, "../client")));

// Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found",
    });
});

app.use((err, req, res, next) => {
    if (err.name === "MulterError") {
        const messages = {
            LIMIT_FILE_SIZE: "Each PDF must be 10 MB or smaller",
            LIMIT_FILE_COUNT: "Choose no more than 3 PDF files",
        };
        const message = messages[err.code] || "Unable to upload PDF";

        return res.status(400).json({ success: false, message });
    }

    if (err.status) {
        return res.status(err.status).json({
            success: false,
            message: err.message,
        });
    }

    console.error(err);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});

const PORT = Number(process.env.PORT) || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;
