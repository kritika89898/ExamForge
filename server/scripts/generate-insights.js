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

function allCombinations() {
    const papers = JSON.parse(fs.readFileSync(catalogPath, "utf8"))
        .filter((paper) => paper.is_published !== false);
    const groups = new Map();
    papers.forEach((paper) => {
        const key = `${paper.subject_code}|${paper.exam_type}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(paper);
    });

    const combinations = [];
    for (const group of groups.values()) {
        const sorted = [...group].sort((a, b) => a.year - b.year);
        for (let mask = 1; mask < (1 << sorted.length); mask += 1) {
            const pick = sorted.filter((_, index) => mask & (1 << index));
            const years = new Set(pick.map((paper) => paper.year));
            if (pick.length > MAX_PAPERS || years.size !== pick.length) continue;
            combinations.push({
                subjectCode: pick[0].subject_code,
                examType: pick[0].exam_type,
                paperIds: pick.map((paper) => paper.id).sort(),
            });
        }
    }
    return combinations;
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
