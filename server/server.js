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

// API
app.use("/api/pdf", pdfRoutes);
app.use("/api/predict", predictionRoutes);
app.use("/api/subjects", subjectRoutes);

// Static frontend
app.use(express.static(path.join(__dirname, "../client")));

// Homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});