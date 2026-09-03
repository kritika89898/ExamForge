const { findCurriculumSubject } = require("../services/curriculumService");
const {
    checksum,
    createSubmissionReference,
    queueSubmission,
} = require("../services/submissionService");

const allowedExamTypes = new Set(["Mid Semester", "End Semester"]);
const allowedMonths = new Set([
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]);

function isPdf(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 10) return false;
    const header = buffer.subarray(0, 5).toString("ascii") === "%PDF-";
    const ending = buffer.subarray(Math.max(0, buffer.length - 1024)).includes(Buffer.from("%%EOF"));
    return header && ending;
}

function cleanContributorName(value) {
    const name = String(value || "").trim();
    if (!name) return "Anonymous";
    if (name.length > 80 || /[\r\n<>]/.test(name)) return null;
    return name;
}

exports.uploadPDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Choose a PDF to contribute" });
        }

        if (!isPdf(req.file.buffer)) {
            return res.status(400).json({ success: false, message: "File content is not a valid PDF" });
        }

        const curriculumSubject = findCurriculumSubject(
            req.body?.branch,
            req.body?.semester,
            req.body?.subjectCode
        );
        if (!curriculumSubject) {
            return res.status(400).json({ success: false, message: "Choose a valid branch, semester and subject" });
        }

        const examType = String(req.body?.examType || "").trim();
        if (!allowedExamTypes.has(examType)) {
            return res.status(400).json({ success: false, message: "Choose Mid Semester or End Semester" });
        }

        const year = Number(req.body?.year);
        if (!Number.isInteger(year) || year < 2000 || year > new Date().getFullYear()) {
            return res.status(400).json({ success: false, message: "Choose a valid examination year" });
        }

        const month = String(req.body?.month || "").trim();
        if (!allowedMonths.has(month)) {
            return res.status(400).json({ success: false, message: "Choose a valid examination month" });
        }

        if (req.body?.authentic !== "true" || req.body?.publicConsent !== "true") {
            return res.status(400).json({
                success: false,
                message: "Confirm the authenticity and public-sharing statements",
            });
        }

        const contributorName = cleanContributorName(req.body?.contributorName);
        if (!contributorName) {
            return res.status(400).json({ success: false, message: "Contributor name contains unsupported characters" });
        }

        const digest = checksum(req.file.buffer);
        const reference = createSubmissionReference();
        const metadata = {
            reference,
            status: "pending_review",
            receivedAt: new Date().toISOString(),
            branchId: curriculumSubject.branchId,
            branch: curriculumSubject.branchShortName,
            programme: curriculumSubject.branchName,
            semester: curriculumSubject.semester,
            subjectCode: curriculumSubject.subjectCode,
            subjectName: curriculumSubject.subjectName,
            category: curriculumSubject.category,
            examType,
            year,
            month: month || null,
            contributorName,
            originalName: req.file.originalname,
            bytes: req.file.size,
            checksumSha256: digest,
        };

        const queued = await queueSubmission({ buffer: req.file.buffer, metadata });

        return res.status(202).json({
            success: true,
            message: "Paper submitted for review",
            data: {
                reference,
                status: "pending_review",
                storage: queued.provider,
                subject: `${curriculumSubject.subjectCode} - ${curriculumSubject.subjectName}`,
                exam: `${examType} ${year}`,
            },
        });
    } catch (error) {
        if (!error.status) console.error("Contribution upload failed:", error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : "Unable to submit this paper",
        });
    }
};

module.exports.isPdf = isPdf;
