const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const curriculumPath = path.join(__dirname, "../../client/data/curriculum.js");
let cachedBranches;

function getBranches() {
    if (!cachedBranches) {
        const sandbox = { window: {} };
        vm.runInNewContext(fs.readFileSync(curriculumPath, "utf8"), sandbox);
        cachedBranches = sandbox.window.EXAMFORGE_CURRICULUM.branches;
    }

    return cachedBranches;
}

function findCurriculumSubject(branchId, semester, subjectCode) {
    const branch = getBranches()[branchId];
    const semesterNumber = String(semester || "").trim();
    const code = String(subjectCode || "").trim();
    const subject = branch?.semesters?.[semesterNumber]?.find(([entryCode]) => entryCode === code);

    if (!branch || !subject) return null;

    return {
        branchId,
        branchName: branch.name,
        branchShortName: branch.shortName,
        semester: Number(semesterNumber),
        subjectCode: subject[0],
        subjectName: subject[1],
        category: subject[2],
    };
}

module.exports = {
    findCurriculumSubject,
    getBranches,
};
