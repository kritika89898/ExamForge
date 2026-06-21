const subjectRoutes = require("./routes/subjectRoutes");
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const pdfRoutes = require("./routes/pdfRoutes");
const predictionRoutes = require("./routes/predictionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../client")));

app.use("/api/pdf", pdfRoutes);
app.use("/api/predict", predictionRoutes);
app.use("/api/subjects", subjectRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "ExamForge Backend Running 🚀"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});