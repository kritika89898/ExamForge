const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function fail(message) {
    throw new Error(message);
}

function normalizeStoragePath(value) {
    const storagePath = String(value || "").replace(/\\/g, "/").replace(/^\/+/, "");

    if (!storagePath || storagePath.includes("..") || !storagePath.toLowerCase().endsWith(".pdf")) {
        fail("Storage path must be a relative .pdf path without '..' segments.");
    }

    return storagePath;
}

function encodeStoragePath(storagePath) {
    return storagePath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

async function uploadPaper(localFile, requestedStoragePath, options = {}) {
    const projectUrl = String(process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
    const secretKey = String(process.env.SUPABASE_SECRET_KEY || "").trim();
    const bucket = String(process.env.SUPABASE_STORAGE_BUCKET || "academic-files").trim();
    const resolvedFile = path.resolve(localFile || "");
    const storagePath = normalizeStoragePath(requestedStoragePath);

    if (!projectUrl || !secretKey || !bucket) {
        fail("Set SUPABASE_URL, SUPABASE_STORAGE_BUCKET, and SUPABASE_SECRET_KEY first.");
    }

    if (!fs.existsSync(resolvedFile) || !fs.statSync(resolvedFile).isFile()) {
        fail(`PDF file not found: ${resolvedFile}`);
    }

    const file = fs.readFileSync(resolvedFile);
    if (file.length > MAX_FILE_SIZE) fail("PDF must be 20 MB or smaller.");
    if (file.subarray(0, 5).toString("ascii") !== "%PDF-") fail("File content is not a valid PDF.");

    const supabase = createClient(projectUrl, secretKey, {
        auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
        },
    });
    const { error } = await supabase.storage.from(bucket).upload(storagePath, file, {
        contentType: "application/pdf",
        upsert: Boolean(options.upsert),
    });

    if (error) fail(`Supabase upload failed: ${error.message}`);

    return {
        bucket,
        storagePath,
        publicUrl: `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeStoragePath(storagePath)}`,
        bytes: file.length,
    };
}

async function main() {
    const args = process.argv.slice(2);
    const upsert = args.includes("--upsert");
    const positional = args.filter((argument) => argument !== "--upsert");

    if (positional.length !== 2) {
        fail("Usage: npm run storage:upload -- <local-pdf> <storage-path> [--upsert]");
    }

    const result = await uploadPaper(positional[0], positional[1], { upsert });
    console.log(`Uploaded ${result.bytes} bytes to ${result.bucket}/${result.storagePath}`);
    console.log(result.publicUrl);
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = { normalizeStoragePath, uploadPaper };
