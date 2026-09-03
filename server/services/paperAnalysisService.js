const fs = require("fs");
const path = require("path");

const catalogPath = path.join(__dirname, "../../client/data/papers.json");
const localPaperDirectory = path.join(__dirname, "../../output/pdf");
const maxPaperCount = 3;
const maxCombinedBytes = 18 * 1024 * 1024;

function hasPdfSignature(buffer) {
    return Buffer.isBuffer(buffer)
        && buffer.length >= 5
        && buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

function readCatalog() {
    return JSON.parse(fs.readFileSync(catalogPath, "utf8"));
}

function parsePaperIds(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string" || !value.trim()) return [];

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function parseUploadYears(value) {
    return parsePaperIds(value).map(Number);
}

function resolveCatalogSelection(ids) {
    const cleanIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
    const published = new Map(
        readCatalog()
            .filter((paper) => paper.is_published !== false)
            .map((paper) => [paper.id, paper])
    );

    const selected = cleanIds.map((id) => published.get(id)).filter(Boolean);

    if (selected.length !== cleanIds.length) {
        const error = new Error("One or more selected papers are unavailable");
        error.status = 400;
        throw error;
    }

    return selected;
}

function publicPaperUrl(paper) {
    const projectUrl = String(process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
    const bucket = String(process.env.SUPABASE_STORAGE_BUCKET || "academic-files").trim();

    if (!projectUrl || !bucket || !paper.storage_path) return "";

    const storagePath = String(paper.storage_path)
        .split("/")
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join("/");

    return `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${storagePath}`;
}

async function fetchPublishedPaper(paper) {
    const localName = paper.local_demo_url ? path.basename(paper.local_demo_url) : "";
    const localPath = localName ? path.join(localPaperDirectory, localName) : "";

    if (localPath && fs.existsSync(localPath)) {
        return fs.readFileSync(localPath);
    }

    const url = publicPaperUrl(paper);
    if (!url) {
        const error = new Error("Archive storage is not configured for the selected paper");
        error.status = 503;
        throw error;
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
        const error = new Error(`Selected paper could not be loaded from archive storage (${response.status})`);
        error.status = 502;
        throw error;
    }

    const declaredSize = Number(response.headers.get("content-length") || 0);
    if (declaredSize > 10 * 1024 * 1024) {
        const error = new Error("A selected paper is larger than the 10 MB analysis limit");
        error.status = 400;
        throw error;
    }

    return Buffer.from(await response.arrayBuffer());
}

function validateComparison({ selectedPapers, uploads, uploadYears, examType, subjectCode }) {
    const files = Array.isArray(uploads) ? uploads : [];
    const allowedExamTypes = new Set(["Mid Semester", "End Semester"]);
    const cleanSubjectCode = String(subjectCode || "").trim();

    if (!allowedExamTypes.has(examType)) {
        const error = new Error("Choose Mid Semester or End Semester papers");
        error.status = 400;
        throw error;
    }

    if (!cleanSubjectCode || cleanSubjectCode.length > 50 || cleanSubjectCode.includes("..")) {
        const error = new Error("A valid subject code is required");
        error.status = 400;
        throw error;
    }

    if (selectedPapers.length + files.length !== maxPaperCount) {
        const error = new Error(`Choose exactly ${maxPaperCount} papers from different years`);
        error.status = 400;
        throw error;
    }

    if (selectedPapers.some((paper) => paper.exam_type !== examType)) {
        const error = new Error("Mid Semester and End Semester papers cannot be mixed");
        error.status = 400;
        throw error;
    }

    if (selectedPapers.some((paper) => paper.subject_code !== cleanSubjectCode)) {
        const error = new Error("All selected papers must belong to the same subject");
        error.status = 400;
        throw error;
    }

    if (uploadYears.length !== files.length) {
        const error = new Error("Choose a year for every uploaded paper");
        error.status = 400;
        throw error;
    }

    const years = [
        ...selectedPapers.map((paper) => Number(paper.year)),
        ...uploadYears.map(Number),
    ];
    const maximumYear = new Date().getFullYear() + 1;

    if (years.some((year) => !Number.isInteger(year) || year < 2000 || year > maximumYear)) {
        const error = new Error("Every paper must have a valid examination year");
        error.status = 400;
        throw error;
    }

    if (new Set(years).size !== maxPaperCount) {
        const error = new Error("All three papers must be from different years");
        error.status = 400;
        throw error;
    }

    return { files, years };
}

async function collectAnalysisSources({ paperIds, uploads, uploadYears, examType, subjectCode }) {
    const selectedPapers = resolveCatalogSelection(paperIds);
    const comparison = validateComparison({
        selectedPapers,
        uploads,
        uploadYears,
        examType,
        subjectCode,
    });
    const { files } = comparison;

    const sources = [];

    for (const paper of selectedPapers) {
        const buffer = await fetchPublishedPaper(paper);
        sources.push({
            buffer,
            label: `${paper.subject_name} - ${paper.exam_type} ${paper.year}`,
            origin: "ExamForge archive",
        });
    }

    files.forEach((file, index) => {
        if (!hasPdfSignature(file.buffer)) {
            const error = new Error(`${file.originalname} is not a valid PDF`);
            error.status = 400;
            throw error;
        }

        sources.push({
            buffer: file.buffer,
            label: `${subjectCode} - ${examType} ${uploadYears[index]} (${file.originalname})`,
            origin: "Private upload",
        });
    });

    const totalBytes = sources.reduce((sum, source) => sum + source.buffer.length, 0);
    if (totalBytes > maxCombinedBytes) {
        const error = new Error("The combined papers must be 18 MB or smaller");
        error.status = 400;
        throw error;
    }

    return sources;
}

module.exports = {
    collectAnalysisSources,
    hasPdfSignature,
    maxPaperCount,
    parsePaperIds,
    parseUploadYears,
    resolveCatalogSelection,
    validateComparison,
};
