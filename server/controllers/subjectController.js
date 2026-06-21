const fs = require("fs");
const path = require("path");

exports.getSubjects = (req, res) => {

    const dataFolder = path.join(__dirname, "../data");

    const files = fs.readdirSync(dataFolder);

    const subjects = files.map(file => file.replace(".json", "").toUpperCase());

    res.json({
        success: true,
        subjects
    });

};