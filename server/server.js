const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const pdfRoutes = require("./routes/pdfRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const subjectRoutes = require("./routes/subjectRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/pdf", pdfRoutes);
app.use("/api/predict", predictionRoutes);
app.use("/api/subjects", subjectRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, "../client")));

// Frontend homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

// Any other frontend route (optional but recommended)
app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(__dirname, "../client/index.html"));
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});