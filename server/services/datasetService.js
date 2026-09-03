const fs = require("fs");
const path = require("path");

function getDataset(subject) {

    if (typeof subject !== "string") {
        return null;
    }

    const normalizedSubject = subject.trim().toLowerCase();

    if (!/^[a-z0-9_-]{1,50}$/.test(normalizedSubject)) {
        return null;
    }

    const fileName = normalizedSubject + ".json";

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
