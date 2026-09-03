const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const catalogPath = path.join(__dirname, "../../client/data/papers.json");
const localQueueDirectory = path.join(__dirname, "../uploads/pending");

function createSubmissionReference() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `EF-${date}-${suffix}`;
}

function checksum(buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
}

function isPublishedDuplicate(digest) {
    const papers = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    return papers.some((paper) => paper.checksum_sha256 === digest && paper.is_published !== false);
}

function duplicateError() {
    const error = new Error("This PDF has already been submitted or published");
    error.status = 409;
    return error;
}

function queueLocally({ buffer, metadata }) {
    fs.mkdirSync(localQueueDirectory, { recursive: true });
    const submissionDirectory = path.join(localQueueDirectory, metadata.checksumSha256);

    try {
        fs.mkdirSync(submissionDirectory);
    } catch (error) {
        if (error.code === "EEXIST") throw duplicateError();
        throw error;
    }

    try {
        fs.writeFileSync(path.join(submissionDirectory, "paper.pdf"), buffer, { flag: "wx" });
        fs.writeFileSync(
            path.join(submissionDirectory, "metadata.json"),
            `${JSON.stringify(metadata, null, 2)}\n`,
            { encoding: "utf8", flag: "wx" }
        );
    } catch (error) {
        fs.rmSync(submissionDirectory, { recursive: true, force: true });
        throw error;
    }

    return {
        provider: "local-review-queue",
        reference: metadata.reference,
    };
}

function isNotFound(error) {
    return error?.statusCode === "404" || error?.status === 404;
}

function isConflict(error) {
    return error?.statusCode === "409"
        || error?.status === 409
        || /already exists|duplicate/i.test(error?.message || "");
}

async function ensurePendingBucket(supabase, bucket) {
    const { data, error } = await supabase.storage.getBucket(bucket);
    if (data) return;
    if (error && !isNotFound(error)) throw error;

    const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: false,
        allowedMimeTypes: ["application/pdf", "application/json"],
        fileSizeLimit: 10 * 1024 * 1024,
    });
    if (createError && !isConflict(createError)) throw createError;
}

async function queueInSupabase({ buffer, metadata, projectUrl, secretKey, publicBucket }) {
    const pendingBucket = `${publicBucket}-pending`;
    const supabase = createClient(projectUrl, secretKey, {
        auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });
    await ensurePendingBucket(supabase, pendingBucket);

    const basePath = `submissions/${metadata.checksumSha256}`;
    const paperPath = `${basePath}/paper.pdf`;
    const metadataPath = `${basePath}/metadata.json`;
    const storage = supabase.storage.from(pendingBucket);
    const { error: paperError } = await storage.upload(paperPath, buffer, {
        contentType: "application/pdf",
        upsert: false,
    });

    if (paperError) {
        if (isConflict(paperError)) throw duplicateError();
        throw paperError;
    }

    const metadataBuffer = Buffer.from(`${JSON.stringify(metadata, null, 2)}\n`, "utf8");
    const { error: metadataError } = await storage.upload(metadataPath, metadataBuffer, {
        contentType: "application/json",
        upsert: false,
    });

    if (metadataError) {
        await storage.remove([paperPath]);
        throw metadataError;
    }

    return {
        provider: "supabase-private-review-queue",
        reference: metadata.reference,
    };
}

async function queueSubmission({ buffer, metadata }) {
    if (isPublishedDuplicate(metadata.checksumSha256)) throw duplicateError();

    const storageMode = String(process.env.EXAMFORGE_STORAGE_MODE || "").trim().toLowerCase();
    const projectUrl = String(process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
    const secretKey = String(process.env.SUPABASE_SECRET_KEY || "").trim();
    const publicBucket = String(process.env.SUPABASE_STORAGE_BUCKET || "academic-files").trim();
    const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

    if (storageMode === "local" || (!isProduction && (!projectUrl || !secretKey))) {
        return queueLocally({ buffer, metadata });
    }

    if (!projectUrl || !secretKey) {
        const configurationError = new Error("The private contribution queue is not configured");
        configurationError.status = 503;
        throw configurationError;
    }

    try {
        return await queueInSupabase({ buffer, metadata, projectUrl, secretKey, publicBucket });
    } catch (error) {
        if (error.status) throw error;
        const unavailable = new Error("The contribution review queue is temporarily unavailable");
        unavailable.status = 503;
        throw unavailable;
    }
}

module.exports = {
    checksum,
    createSubmissionReference,
    isPublishedDuplicate,
    localQueueDirectory,
    queueSubmission,
};
