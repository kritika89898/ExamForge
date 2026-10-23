#!/usr/bin/env node
// Pre-generates AI Studio answers for every combination of 1-3 archive papers
// (same subject and exam type, different years) and saves them as static files
// in client/data/insights/. AI Studio loads these instantly instead of calling
// Gemini, so students get fast answers and the free AI quota is saved.
//
// Usage (from the server folder):
//   node scripts/generate-insights.js                      # uses the live site
//   node scripts/generate-insights.js http://localhost:5000
//   node scripts/generate-insights.js --force              # regenerate existing files
//
// The site's own /api/predict does the work, so the Gemini key stays on the
// server. Run this after adding new papers to client/data/papers.json, then
// commit the new files in client/data/insights/.

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const args = process.argv.slice(2);
const force = args.includes("--force");
const baseUrl = (args.find((arg) => /^https?:\/\//.test(arg)) || "https://exam-forge-coral.vercel.app").replace(/\/$/, "");

const clientDirectory = path.join(__dirname, "../../client");
const catalogPath = path.join(clientDirectory, "data/papers.json");
const insightsDirectory = path.join(clientDirectory, "data/insights");
const MAX_PAPERS = 3;
const PAUSE_MS = 1500;

// Must match loadStoredInsights() in client/prediction.js.
function insightFileName(paperIds) {
    return `${[...paperIds].sort().join("__")}.json`;
}

const normalizeCode = (value) => String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
// Must match codeKeys() in client/prediction.js ("BMA 110 / BEC 110" matches either code).
const codeKeys = (code) => [normalizeCode(code), ...String(code || "").split("/").map(normalizeCode).filter(Boolean)];

function loadBranches() {
    const sandbox = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(clientDirectory, "data/curriculum.js"), "utf8"), sandbox);
    return sandbox.window.EXAMFORGE_CURRICULUM.branches;
}

function paperInBranch(paper, branchId, branch) {
    if (Array.isArray(paper.branches)) return paper.branches.includes(branchId);
    return String(paper.programme || "").replace(/^B\.Tech\s*/i, "").trim() === branch.shortName;
}

// Every 1-3 paper selection AI Studio can offer: per branch, semester, subject
// card and exam type, papers from different years (mirrors client/prediction.js).
function allCombinations() {
    const papers = JSON.parse(fs.readFileSync(catalogPath, "utf8"))
        .filter((paper) => paper.is_published !== false);
    const combinations = new Map();

    Object.entries(loadBranches()).forEach(([branchId, branch]) => {
        Object.entries(branch.semesters).forEach(([semester, entries]) => {
            const inSemester = papers.filter((paper) => Number(paper.semester) === Number(semester)
                && paperInBranch(paper, branchId, branch));
            const listed = new Set(entries.flatMap(([code]) => codeKeys(code)));
            const subjects = [...entries.map(([code]) => code)];
            inSemester.forEach((paper) => {
                const key = normalizeCode(paper.subject_code);
                if (!listed.has(key)) {
                    listed.add(key);
                    subjects.push(paper.subject_code);
                }
            });

            subjects.forEach((subjectCode) => {
                const keys = codeKeys(subjectCode);
                ["Mid Semester", "End Semester"].forEach((examType) => {
                    const group = inSemester
                        .filter((paper) => keys.includes(normalizeCode(paper.subject_code)) && paper.exam_type === examType)
                        .sort((a, b) => a.year - b.year);
                    for (let mask = 1; mask < (1 << group.length); mask += 1) {
                        const pick = group.filter((_, index) => mask & (1 << index));
                        const years = new Set(pick.map((paper) => paper.year));
                        if (pick.length > MAX_PAPERS || years.size !== pick.length) continue;
                        const paperIds = pick.map((paper) => paper.id).sort();
                        const id = paperIds.join("__");
                        if (!combinations.has(id)) combinations.set(id, { subjectCode, examType, paperIds });
                    }
                });
            });
        });
    });
    return [...combinations.values()];
}

function toStoredInsight(combination, data) {
    return {
        subjectCode: combination.subjectCode,
        examType: combination.examType,
        paperIds: combination.paperIds,
        importantTopics: data.importantTopics,
        likelyQuestions: data.likelyQuestions,
        sourceCount: data.sourceCount,
        sources: data.sources,
        generatedAt: new Date().toISOString(),
    };
}

async function main() {
    fs.mkdirSync(insightsDirectory, { recursive: true });
    const combinations = allCombinations();
    let created = 0;
    let skipped = 0;

    console.log(`${combinations.length} combinations, using ${baseUrl}`);

    for (const combination of combinations) {
        const file = path.join(insightsDirectory, insightFileName(combination.paperIds));
        if (!force && fs.existsSync(file)) {
            skipped += 1;
            continue;
        }

        const url = `${baseUrl}/api/predict?${new URLSearchParams({
            subjectCode: combination.subjectCode,
            examType: combination.examType,
            paperIds: combination.paperIds.join(","),
        })}`;
        const response = await fetch(url);
        const body = await response.json().catch(() => ({}));

        if (!response.ok || !body.success) {
            console.error(`Stopped at ${insightFileName(combination.paperIds)}: ${response.status} ${body.message || ""}`);
            if (response.status === 429) console.error("Free AI limit reached. Run again later to continue; finished files are kept.");
            process.exitCode = 1;
            break;
        }

        fs.writeFileSync(file, `${JSON.stringify(toStoredInsight(combination, body.data), null, 2)}\n`);
        created += 1;
        console.log(`saved ${insightFileName(combination.paperIds)}`);
        if (response.headers.get("x-vercel-cache") !== "HIT") {
            await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
        }
    }

    console.log(`Done: ${created} created, ${skipped} already existed.`);
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}

module.exports = { allCombinations, insightFileName, toStoredInsight };
