const fs = require("fs");
const path = require("path");

function getDataset(subject) {

    const fileName = subject.toLowerCase() + ".json";

    const filePath = path.join(__dirname, "../data", fileName);

    if (!fs.existsSync(filePath)) {
        return null;
    }

    const data = fs.readFileSync(filePath, "utf8");

    return JSON.parse(data);
}

module.exports = {
    getDataset
};