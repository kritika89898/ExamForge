const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { after, before, test } = require("node:test");

process.env.EXAMFORGE_STORAGE_MODE = "local";

const app = require("./server");
const { getDataset } = require("./services/datasetService");
const { validatePrediction } = require("./services/geminiService");
const { findCurriculumSubject } = require("./services/curriculumService");
const {
    checksum,
    localQueueDirectory,
    queueSubmission,
} = require("./services/submissionService");
const {
    hasPdfSignature,
    parsePaperIds,
    parseUploadYears,
    resolveCatalogSelection,
    validateComparison,
} = require("./services/paperAnalysisService");

let baseUrl;
let server;

before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    server.closeAllConnections();
    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    });
});

test("health endpoint reports that the API is ready", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, status: "ok" });
});

test("runtime configuration exposes only the public Supabase storage URL", async () => {
    const previousUrl = process.env.SUPABASE_URL;
    const previousBucket = process.env.SUPABASE_STORAGE_BUCKET;

    process.env.SUPABASE_URL = "https://example-project.supabase.co/";
    process.env.SUPABASE_STORAGE_BUCKET = "academic-files";

    try {
        const response = await fetch(`${baseUrl}/runtime-config.js`);
        const body = await response.text();

        assert.equal(response.status, 200);
        assert.match(response.headers.get("content-type"), /^application\/javascript/);
        assert.match(body, /https:\/\/example-project\.supabase\.co\/storage\/v1\/object\/public\/academic-files/);
        assert.doesNotMatch(body, /SERVICE_ROLE/);
    } finally {
        if (previousUrl === undefined) delete process.env.SUPABASE_URL;
        else process.env.SUPABASE_URL = previousUrl;

        if (previousBucket === undefined) delete process.env.SUPABASE_STORAGE_BUCKET;
        else process.env.SUPABASE_STORAGE_BUCKET = previousBucket;
    }
});

test("CSE-AI Semester 4 and 5 demo catalog contains unique subject-specific papers", () => {
    const catalogPath = path.join(__dirname, "../client/data/papers.json");
    const papers = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    const ids = new Set(papers.map((paper) => paper.id));
    const storagePaths = new Set(papers.map((paper) => paper.storage_path));
    const semester5_2025 = papers.filter((paper) => paper.year === 2025 && paper.semester === 5);
    const completeSets = [
        [4, 2022],
        [4, 2023],
        [5, 2022],
        [5, 2023],
        [5, 2025],
    ];

    assert.equal(papers.length, 56);
    assert.equal(ids.size, papers.length);
    assert.equal(storagePaths.size, papers.length);
    assert.equal(semester5_2025.length, 10);
    completeSets.forEach(([semester, year]) => {
        const set = papers.filter((paper) => paper.semester === semester && paper.year === year);
        assert.equal(set.filter((paper) => paper.exam_type === "Mid Semester").length, 5);
        assert.equal(set.filter((paper) => paper.exam_type === "End Semester").length, 5);
    });
    assert.equal(papers.every((paper) => [4, 5].includes(paper.semester)), true);
    assert.equal(papers.every((paper) => paper.local_demo_url?.endsWith(".pdf")), true);
    assert.equal(papers.some((paper) => /consumer psychology|nptel/i.test(paper.subject_name)), false);
});

test("official curriculum map covers all seven branches and eight semesters", () => {
    const curriculumPath = path.join(__dirname, "../client/data/curriculum.js");
    const sandbox = { window: {} };
    vm.runInNewContext(fs.readFileSync(curriculumPath, "utf8"), sandbox);

    const branches = sandbox.window.EXAMFORGE_CURRICULUM.branches;
    assert.deepEqual(
        Object.keys(branches),
        ["cse", "cse-ai", "it", "aiml", "ece", "ece-ai", "mae"]
    );

    Object.values(branches).forEach((branch) => {
        assert.deepEqual(Object.keys(branch.semesters), ["1", "2", "3", "4", "5", "6", "7", "8"]);
        Object.values(branch.semesters).forEach((subjects) => {
            assert.equal(subjects.length > 0, true);
            assert.equal(subjects.every((subject) => subject.length === 3), true);
        });
        assert.match(branch.sourceUrl, /^https:\/\/www\.igdtuw\.ac\.in\/IGDTUW\/uploads\/\d+\.pdf$/);
    });
});

test("contributions resolve subjects from the official curriculum", () => {
    assert.deepEqual(findCurriculumSubject("cse-ai", "5", "BAI 301"), {
        branchId: "cse-ai",
        branchName: "Computer Science & Engineering (Artificial Intelligence)",
        branchShortName: "CSE-AI",
        semester: 5,
        subjectCode: "BAI 301",
        subjectName: "Machine Learning",
        category: "DCC",
    });
    assert.equal(findCurriculumSubject("cse-ai", "5", "FAKE 999"), null);
});

test("subjects endpoint returns the available datasets", async () => {
    const response = await fetch(`${baseUrl}/api/subjects`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.subjects, ["DBMS", "OS"]);
});

test("dataset lookup accepts subject codes but rejects path-like input", () => {
    assert.equal(getDataset(" DBMS ").subject, "DBMS");
    assert.equal(getDataset("../../package"), null);
    assert.equal(getDataset(null), null);
});

test("prediction endpoint validates its request before calling AI", async () => {
    const response = await fetch(`${baseUrl}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "../../secret" }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
        success: false,
        message: "A valid subject is required",
    });
});

test("AI Studio accepts only published catalog paper IDs", () => {
    const selected = resolveCatalogSelection([
        "igdtuw-cseai-s5-bai301-mid-2025",
        "igdtuw-cseai-s5-bai301-end-2025",
    ]);

    assert.equal(selected.length, 2);
    assert.equal(selected.every((paper) => paper.subject_code === "BAI 301"), true);
    assert.throws(
        () => resolveCatalogSelection(["not-a-published-paper"]),
        /unavailable/
    );
    assert.deepEqual(parsePaperIds('["paper-one","paper-two"]'), ["paper-one", "paper-two"]);
    assert.deepEqual(parseUploadYears("[2023,2024]"), [2023, 2024]);
});

test("AI Studio compares one exam type across three different years", () => {
    const mid2025 = resolveCatalogSelection(["igdtuw-cseai-s5-bai301-mid-2025"]);
    const uploads = [{}, {}];

    assert.deepEqual(
        validateComparison({
            selectedPapers: mid2025,
            uploads,
            uploadYears: [2024, 2023],
            examType: "Mid Semester",
            subjectCode: "BAI 301",
        }).years,
        [2025, 2024, 2023]
    );

    const mixed = resolveCatalogSelection([
        "igdtuw-cseai-s5-bai301-mid-2025",
        "igdtuw-cseai-s5-bai301-end-2025",
    ]);
    assert.throws(
        () => validateComparison({
            selectedPapers: mixed,
            uploads: [{}],
            uploadYears: [2024],
            examType: "Mid Semester",
            subjectCode: "BAI 301",
        }),
        /cannot be mixed/
    );

    assert.throws(
        () => validateComparison({
            selectedPapers: mid2025,
            uploads,
            uploadYears: [2025, 2024],
            examType: "Mid Semester",
            subjectCode: "BAI 301",
        }),
        /different years/
    );
});

test("AI Studio rejects uploaded files with spoofed PDF metadata", async () => {
    const form = new FormData();
    form.append("subject", "BAI 301 Machine Learning");
    form.append("subjectCode", "BAI 301");
    form.append("examType", "Mid Semester");
    form.append("paperIds", "[]");
    form.append("uploadYears", "[2023,2024,2025]");
    form.append("pdfs", new Blob(["not a PDF"], { type: "application/pdf" }), "paper-2023.pdf");
    form.append("pdfs", new Blob(["not a PDF"], { type: "application/pdf" }), "paper-2024.pdf");
    form.append("pdfs", new Blob(["not a PDF"], { type: "application/pdf" }), "paper-2025.pdf");

    const response = await fetch(`${baseUrl}/api/predict`, {
        method: "POST",
        body: form,
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.message, /not a valid PDF/);
    assert.equal(hasPdfSignature(Buffer.from("%PDF-1.4")), true);
});

test("AI prediction output contains topics and questions but no study plan", () => {
    const result = validatePrediction({
        importantTopics: ["Regular languages"],
        likelyQuestions: ["Explain the pumping lemma."],
        studyStrategy: "This field must not be exposed.",
    });

    assert.deepEqual(result, {
        importantTopics: ["Regular languages"],
        likelyQuestions: ["Explain the pumping lemma."],
    });
    assert.equal("studyStrategy" in result, false);
});

test("PDF upload rejects non-PDF files", async () => {
    const form = new FormData();
    form.append("department", "CSE");
    form.append("semester", "4");
    form.append("subject", "DBMS");
    form.append("pdf", new Blob(["not a PDF"], { type: "text/plain" }), "paper.txt");

    const response = await fetch(`${baseUrl}/api/pdf/upload`, {
        method: "POST",
        body: form,
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, "Only PDF files are accepted");
});

test("PDF upload rejects a file with spoofed PDF metadata", async () => {
    const form = new FormData();
    form.append("department", "CSE");
    form.append("semester", "4");
    form.append("subject", "DBMS");
    form.append("pdf", new Blob(["not a PDF"], { type: "application/pdf" }), "paper.pdf");

    const response = await fetch(`${baseUrl}/api/pdf/upload`, {
        method: "POST",
        body: form,
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).message, "File content is not a valid PDF");
});

function appendContributionFields(form, overrides = {}) {
    const values = {
        branch: "cse-ai",
        semester: "5",
        subjectCode: "BAI 301",
        examType: "Mid Semester",
        year: "2024",
        month: "October",
        contributorName: "",
        authentic: "true",
        publicConsent: "true",
        ...overrides,
    };
    Object.entries(values).forEach(([key, value]) => form.append(key, value));
}

test("contribution upload requires authenticity and public-sharing consent", async () => {
    const pdf = Buffer.from("%PDF-1.4\n% consent-test\n%%EOF");
    const form = new FormData();
    appendContributionFields(form, { publicConsent: "false" });
    form.append("pdf", new Blob([pdf], { type: "application/pdf" }), "consent-test.pdf");

    const response = await fetch(`${baseUrl}/api/pdf/upload`, { method: "POST", body: form });
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /authenticity and public-sharing/);
});

test("contribution upload enters the private local review queue", async () => {
    const pdf = Buffer.from("%PDF-1.4\n% valid-contribution\n%%EOF");
    const form = new FormData();
    appendContributionFields(form);
    form.append("pdf", new Blob([pdf], { type: "application/pdf" }), "machine-learning-mid-2024.pdf");

    const response = await fetch(`${baseUrl}/api/pdf/upload`, {
        method: "POST",
        body: form,
    });
    const body = await response.json();

    assert.equal(response.status, 202);
    assert.equal(body.success, true);
    assert.equal(body.data.status, "pending_review");
    assert.equal(body.data.storage, "local-review-queue");
    assert.match(body.data.reference, /^EF-\d{8}-[A-F0-9]{8}$/);

    const submissionDirectory = path.join(localQueueDirectory, checksum(pdf));
    const metadata = JSON.parse(fs.readFileSync(path.join(submissionDirectory, "metadata.json"), "utf8"));
    assert.equal(fs.existsSync(path.join(submissionDirectory, "paper.pdf")), true);
    assert.equal(metadata.subjectCode, "BAI 301");
    assert.equal(metadata.examType, "Mid Semester");
    assert.equal(metadata.status, "pending_review");
    fs.rmSync(submissionDirectory, { recursive: true, force: true });
});

test("contribution upload blocks duplicate PDFs", async () => {
    const pdf = Buffer.from("%PDF-1.4\n% duplicate-contribution\n%%EOF");

    async function submit() {
        const form = new FormData();
        appendContributionFields(form, { year: "2023" });
        form.append("pdf", new Blob([pdf], { type: "application/pdf" }), "duplicate.pdf");
        return fetch(`${baseUrl}/api/pdf/upload`, { method: "POST", body: form });
    }

    const first = await submit();
    const second = await submit();
    assert.equal(first.status, 202);
    assert.equal(second.status, 409);
    assert.match((await second.json()).message, /already been submitted or published/);

    const submissionDirectory = path.join(localQueueDirectory, checksum(pdf));
    fs.rmSync(submissionDirectory, { recursive: true, force: true });
});

test("production contributions fail closed when the private queue is not configured", async () => {
    const previous = {
        mode: process.env.EXAMFORGE_STORAGE_MODE,
        nodeEnv: process.env.NODE_ENV,
        url: process.env.SUPABASE_URL,
        secret: process.env.SUPABASE_SECRET_KEY,
    };
    const pdf = Buffer.from("%PDF-1.4\n% production-config-test\n%%EOF");

    process.env.EXAMFORGE_STORAGE_MODE = "";
    process.env.NODE_ENV = "production";
    process.env.SUPABASE_URL = "";
    process.env.SUPABASE_SECRET_KEY = "";

    try {
        await assert.rejects(
            queueSubmission({ buffer: pdf, metadata: { checksumSha256: checksum(pdf) } }),
            (error) => error.status === 503 && /not configured/.test(error.message)
        );
    } finally {
        process.env.EXAMFORGE_STORAGE_MODE = previous.mode;
        if (previous.nodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previous.nodeEnv;
        if (previous.url === undefined) delete process.env.SUPABASE_URL;
        else process.env.SUPABASE_URL = previous.url;
        if (previous.secret === undefined) delete process.env.SUPABASE_SECRET_KEY;
        else process.env.SUPABASE_SECRET_KEY = previous.secret;
    }
});
