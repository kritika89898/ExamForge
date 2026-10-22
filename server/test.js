const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { after, before, test } = require("node:test");

const app = require("./server");
const {
    HttpError,
    configuredModels,
    hasPdfSignature,
    listParam,
    resolveCatalogSelection,
    validateComparison,
    validatePrediction,
} = require("../client/api/predict")._internal;

const crypto = require("node:crypto");

function checksum(buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
}

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
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.status, "ok");
    assert.equal(typeof body.aiConfigured, "boolean");
});

test("CSE-AI Semester 4, 5 and 6 catalog contains unique papers that exist in the repo", () => {
    const clientDirectory = path.join(__dirname, "../client");
    const papers = JSON.parse(fs.readFileSync(path.join(clientDirectory, "data/papers.json"), "utf8"));
    const ids = new Set(papers.map((paper) => paper.id));
    const filePaths = new Set(papers.map((paper) => paper.file_path));
    const completeSets = [
        [4, 2022],
        [4, 2023],
        [5, 2022],
        [5, 2023],
        [5, 2025],
    ];

    assert.equal(papers.length, 76);
    assert.equal(ids.size, papers.length);
    assert.equal(filePaths.size, papers.length);
    assert.equal(papers.filter((paper) => paper.semester === 6).length, 20);
    completeSets.forEach(([semester, year]) => {
        const set = papers.filter((paper) => paper.semester === semester && paper.year === year);
        assert.equal(set.filter((paper) => paper.exam_type === "Mid Semester").length, 5);
        assert.equal(set.filter((paper) => paper.exam_type === "End Semester").length, 5);
    });
    assert.equal(papers.every((paper) => [4, 5, 6].includes(paper.semester)), true);
    papers.forEach((paper) => {
        assert.match(paper.file_path, /^papers\/semester-[4-6]\/[A-Z0-9_]+\.pdf$/);
        const pdf = fs.readFileSync(path.join(clientDirectory, paper.file_path));
        assert.equal(pdf.length, paper.file_size, paper.file_path);
        assert.equal(checksum(pdf), paper.checksum_sha256, paper.file_path);
    });
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

const mlEndSemester = [
    "igdtuw-cseai-s5-bai301-end-2022",
    "igdtuw-cseai-s5-bai301-end-2023",
    "igdtuw-cseai-s5-bai301-end-2025",
];

function predictUrl(params) {
    return `${baseUrl}/api/predict?${new URLSearchParams(params)}`;
}

// Replaces Gemini with a stub for one test. Calls to other hosts (the test
// server itself) still go through the real fetch.
async function withFakeGemini(respond, run) {
    const realFetch = global.fetch;
    const previousKey = process.env.GEMINI_API_KEY;
    const previousModel = process.env.GEMINI_MODEL;
    const calls = [];

    process.env.GEMINI_API_KEY = "test-key";
    delete process.env.GEMINI_MODEL;
    global.fetch = async (url, options) => {
        if (!String(url).startsWith("https://generativelanguage.googleapis.com/")) {
            return realFetch(url, options);
        }
        const model = String(url).match(/models\/([^:]+):/)[1];
        calls.push({ model, body: JSON.parse(options.body) });
        return respond(model, calls.length);
    };

    try {
        await run(calls);
    } finally {
        global.fetch = realFetch;
        if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = previousKey;
        if (previousModel === undefined) delete process.env.GEMINI_MODEL;
        else process.env.GEMINI_MODEL = previousModel;
    }
}

function geminiReply(prediction, status = 200) {
    const body = status === 200
        ? { candidates: [{ content: { parts: [{ text: JSON.stringify(prediction) }] } }] }
        : { error: { message: "quota exceeded" } };
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

test("AI Studio validates its request before calling AI", async () => {
    const response = await fetch(predictUrl({ subjectCode: "../../secret", examType: "End Semester", paperIds: "" }));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { success: false, message: "A valid subject code is required" });

    const wrongMethod = await fetch(`${baseUrl}/api/predict`, { method: "DELETE" });
    assert.equal(wrongMethod.status, 405);
});

test("AI Studio explains when the Gemini key is not configured", async () => {
    const previousKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
        const response = await fetch(predictUrl({
            subjectCode: "BAI 301",
            examType: "End Semester",
            paperIds: mlEndSemester.join(","),
        }));
        const body = await response.json();
        assert.equal(response.status, 503);
        assert.match(body.message, /not configured/);
    } finally {
        if (previousKey !== undefined) process.env.GEMINI_API_KEY = previousKey;
    }
});

test("AI Studio accepts only published catalog paper IDs", () => {
    const selected = resolveCatalogSelection([
        "igdtuw-cseai-s5-bai301-mid-2025",
        "igdtuw-cseai-s5-bai301-end-2025",
    ]);

    assert.equal(selected.length, 2);
    assert.equal(selected.every((paper) => paper.subject_code === "BAI 301"), true);
    assert.throws(() => resolveCatalogSelection(["not-a-published-paper"]), /unavailable/);
    assert.deepEqual(listParam('["paper-one","paper-two"]'), ["paper-one", "paper-two"]);
    assert.deepEqual(listParam("paper-one,paper-two"), ["paper-one", "paper-two"]);
});

test("AI Studio accepts one to three papers of one subject and exam type from different years", () => {
    const mid2025 = resolveCatalogSelection(["igdtuw-cseai-s5-bai301-mid-2025"]);
    const uploads = [{ year: 2024 }, { year: 2023 }];

    assert.deepEqual(
        validateComparison({ selectedPapers: mid2025, uploads, examType: "Mid Semester", subjectCode: "BAI 301" }),
        [2025, 2024, 2023]
    );

    const mixed = resolveCatalogSelection(["igdtuw-cseai-s5-bai301-mid-2025", "igdtuw-cseai-s5-bai301-end-2025"]);
    assert.throws(
        () => validateComparison({ selectedPapers: mixed, uploads: [{ year: 2024 }], examType: "Mid Semester", subjectCode: "BAI 301" }),
        /cannot be mixed/
    );
    assert.throws(
        () => validateComparison({ selectedPapers: mid2025, uploads: [{ year: 2025 }, { year: 2024 }], examType: "Mid Semester", subjectCode: "BAI 301" }),
        /different year/
    );
    assert.deepEqual(
        validateComparison({ selectedPapers: mid2025, uploads: [], examType: "Mid Semester", subjectCode: "BAI 301" }),
        [2025]
    );
    assert.deepEqual(
        validateComparison({ selectedPapers: mid2025, uploads: [{ year: 2023 }], examType: "Mid Semester", subjectCode: "BAI 301" }),
        [2025, 2023]
    );
    assert.throws(
        () => validateComparison({ selectedPapers: [], uploads: [], examType: "Mid Semester", subjectCode: "BAI 301" }),
        /between 1 and 3/
    );
    assert.throws(
        () => validateComparison({ selectedPapers: mid2025, uploads: [{ year: 2024 }, { year: 2023 }, { year: 2022 }], examType: "Mid Semester", subjectCode: "BAI 301" }),
        /between 1 and 3/
    );
    assert.throws(
        () => validateComparison({ selectedPapers: mid2025, uploads, examType: "Mid Semester", subjectCode: "BAI 303" }),
        /selected subject/
    );
});

test("AI Studio rejects uploaded files with spoofed PDF metadata", async () => {
    const fake = Buffer.from("not a PDF").toString("base64");
    const response = await fetch(`${baseUrl}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            subjectCode: "BAI 301",
            examType: "Mid Semester",
            paperIds: [],
            uploads: [2023, 2024, 2025].map((year) => ({ name: `paper-${year}.pdf`, year, data: fake })),
        }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.message, /not a valid PDF/);
    assert.equal(hasPdfSignature(Buffer.from("%PDF-1.4")), true);
});

test("AI Studio rejects uploads over the 3 MB request budget", async () => {
    const big = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(3 * 1024 * 1024)]).toString("base64");
    const response = await fetch(`${baseUrl}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            subjectCode: "BAI 301",
            examType: "Mid Semester",
            paperIds: ["igdtuw-cseai-s5-bai301-mid-2025", "igdtuw-cseai-s5-bai301-mid-2023"],
            uploads: [{ name: "big.pdf", year: 2024, data: big }],
        }),
    });
    assert.equal(response.status, 413);
    assert.match((await response.json()).message, /3 MB/);
});

test("AI Studio sends three archive PDFs to Gemini and lets the CDN cache the result", async () => {
    const prediction = {
        importantTopics: ["Bias-variance trade-off"],
        likelyQuestions: ["Explain overfitting with an example."],
    };

    await withFakeGemini(() => geminiReply(prediction), async (calls) => {
        const response = await fetch(predictUrl({
            subjectCode: "BAI 301",
            examType: "End Semester",
            paperIds: mlEndSemester.join(","),
        }));
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.deepEqual(body.data.importantTopics, prediction.importantTopics);
        assert.equal(body.data.sourceCount, 3);
        assert.match(response.headers.get("cache-control"), /s-maxage=\d+/);

        assert.equal(calls.length, 1);
        assert.equal(calls[0].model, "gemini-3.5-flash-lite");
        const pdfParts = calls[0].body.contents[0].parts.filter((part) => part.inlineData);
        assert.equal(pdfParts.length, 3);
        assert.equal(Buffer.from(pdfParts[0].inlineData.data, "base64").subarray(0, 5).toString(), "%PDF-");
    });
});

test("AI Studio falls back to the next model when the first is out of quota", async () => {
    const prediction = { importantTopics: ["Topic"], likelyQuestions: ["Question?"] };

    await withFakeGemini(
        (model) => model === "gemini-3.5-flash-lite" ? geminiReply(null, 429) : geminiReply(prediction),
        async (calls) => {
            const response = await fetch(predictUrl({
                subjectCode: "BAI 301",
                examType: "End Semester",
                paperIds: mlEndSemester.join(","),
            }));
            assert.equal(response.status, 200);
            assert.deepEqual(calls.map((call) => call.model), ["gemini-3.5-flash-lite", "gemini-3.8-flash"]);
        }
    );

    await withFakeGemini(() => geminiReply(null, 429), async () => {
        const response = await fetch(predictUrl({
            subjectCode: "BAI 301",
            examType: "End Semester",
            paperIds: mlEndSemester.join(","),
        }));
        const body = await response.json();
        assert.equal(response.status, 429);
        assert.match(body.message, /try again/i);
        assert.equal(response.headers.get("cache-control"), "no-store");
    });
});

test("AI Studio analyses a single paper and tells Gemini there is no cross-year comparison", async () => {
    const prediction = { importantTopics: ["Topic"], likelyQuestions: ["Question?"] };

    await withFakeGemini(() => geminiReply(prediction), async (calls) => {
        const response = await fetch(predictUrl({
            subjectCode: "BAI 301",
            examType: "End Semester",
            paperIds: "igdtuw-cseai-s5-bai301-end-2025",
        }));
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.data.sourceCount, 1);
        const parts = calls[0].body.contents[0].parts;
        assert.equal(parts.filter((part) => part.inlineData).length, 1);
        assert.match(parts[0].text, /Only one paper is supplied/);
    });
});

test("AI Studio tells Gemini how many years it is comparing", async () => {
    const prediction = { importantTopics: ["Topic"], likelyQuestions: ["Question?"] };

    await withFakeGemini(() => geminiReply(prediction), async (calls) => {
        const response = await fetch(predictUrl({
            subjectCode: "BAI 301",
            examType: "End Semester",
            paperIds: "igdtuw-cseai-s5-bai301-end-2022,igdtuw-cseai-s5-bai301-end-2025",
        }));
        assert.equal(response.status, 200);
        assert.match(calls[0].body.contents[0].parts[0].text, /The 2 supplied papers/);
    });
});

test("GEMINI_MODEL overrides the default model list", () => {
    const previous = process.env.GEMINI_MODEL;
    process.env.GEMINI_MODEL = "gemini-3.8-flash, bad model!";
    try {
        assert.deepEqual(configuredModels(), ["gemini-3.8-flash"]);
    } finally {
        if (previous === undefined) delete process.env.GEMINI_MODEL;
        else process.env.GEMINI_MODEL = previous;
    }
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
    assert.throws(() => validatePrediction({ importantTopics: [], likelyQuestions: [] }), HttpError);
});

test("Contribute page sends contributors to the Google Form", () => {
    const page = fs.readFileSync(path.join(__dirname, "../client/admin/upload.html"), "utf8");
    assert.match(page, /href="https:\/\/forms\.gle\/[A-Za-z0-9]+"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
    assert.doesNotMatch(page, /upload\.js|type="file"/);
});
