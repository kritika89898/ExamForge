const { getDataset } = require("../services/datasetService");
const { generatePrediction } = require("../services/geminiService");
const {
    collectAnalysisSources,
    parsePaperIds,
    parseUploadYears,
} = require("../services/paperAnalysisService");

function validSubject(value) {
    if (typeof value !== "string") return false;

    const subject = value.trim();
    return subject.length >= 2
        && subject.length <= 100
        && !subject.includes("..")
        && !subject.includes("\\")
        && /^[\p{L}\p{N} ()&.,+'’:/-]+$/u.test(subject);
}

exports.predict = async (req, res) => {
    try {
        const subject = req.body?.subject?.trim();

        if (!validSubject(subject)) {
            return res.status(400).json({
                success: false,
                message: "A valid subject is required",
            });
        }

        const paperIds = parsePaperIds(req.body?.paperIds);
        const uploadYears = parseUploadYears(req.body?.uploadYears);
        const examType = req.body?.examType?.trim();
        const subjectCode = req.body?.subjectCode?.trim();
        let sources;

        if (paperIds.length || req.files?.length) {
            sources = await collectAnalysisSources({
                paperIds,
                uploads: req.files,
                uploadYears,
                examType,
                subjectCode,
            });
        } else {
            const dataset = getDataset(subject);
            if (!dataset) {
                return res.status(400).json({
                    success: false,
                    message: "Select or upload at least one previous-year paper",
                });
            }

            sources = [{
                label: `${dataset.subject} existing question dataset`,
                origin: "ExamForge dataset",
                text: [
                    ...dataset.importantTopics.map((topic) => `Topic: ${topic}`),
                    ...dataset.previousQuestions.map((question) => `Question: ${question}`),
                ].join("\n"),
            }];
        }

        const prediction = await generatePrediction({
            subject,
            examType: examType || "Previous examinations",
            sources,
        });

        return res.json({
            success: true,
            data: {
                ...prediction,
                sourceCount: sources.length,
                sources: sources.map(({ label, origin }) => ({ label, origin })),
            },
        });
    } catch (error) {
        if (!error.status) {
            console.error("Prediction failed:", error);
        }

        return res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : "Unable to analyse the selected papers",
        });
    }
};
