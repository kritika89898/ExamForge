const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const pdfRoutes = require("./routes/pdfRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const subjectRoutes = require("./routes/subjectRoutes");

const app = express();

function getPublicStorageConfig() {
    const projectUrl = String(process.env.SUPABASE_URL || "")
        .trim()
        .replace(/\/$/, "");
    const bucket = String(process.env.SUPABASE_STORAGE_BUCKET || "academic-files").trim();

    return {
        provider: "supabase",
        publicBaseUrl: projectUrl && bucket
            ? `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}`
            : "",
        bucket,
    };
}

app.disable("x-powered-by");
app.use(cors({
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
        : true,
}));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
    res.json({ success: true, status: "ok" });
});

// Only public storage information is sent to the browser. The service-role key
// remains server-side and is used solely by the local upload script.
app.get("/runtime-config.js", (req, res) => {
    const storageConfig = getPublicStorageConfig();

    res.type("application/javascript");
    res.set("Cache-Control", "no-store");

    if (!storageConfig.publicBaseUrl) {
        res.send("// Using the public static Supabase Storage configuration.");
        return;
    }

    const serializedConfig = JSON.stringify(storageConfig).replace(/</g, "\\u003c");
    res.send(`window.EXAMFORGE_STORAGE_CONFIG = Object.freeze(${serializedConfig});`);
});

// API
app.use("/api/pdf", pdfRoutes);
app.use("/api/predict", predictionRoutes);
app.use("/api/subjects", subjectRoutes);

// Static frontend
app.use("/demo-papers", express.static(path.join(__dirname, "../output/pdf"), {
    index: false,
}));
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
