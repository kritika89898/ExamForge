const fs = require("fs");
const path = require("path");

exports.getSubjects = (req, res) => {

    try {

    const dataFolder = path.join(__dirname, "../data");

    const files = fs.readdirSync(dataFolder);

    const subjects = files
        .filter((file) => path.extname(file).toLowerCase() === ".json")
        .map((file) => path.basename(file, ".json").toUpperCase())
        .sort();

    res.json({
        success: true,
        subjects
    });

    } catch (err) {
        console.error("Unable to list subjects:", err);
        res.status(500).json({
            success: false,
            message: "Unable to list subjects",
        });
    }

};
