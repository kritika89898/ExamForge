const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const MAX_FILE_SIZE = 20 * 1024 * 1024;

async function setupStorage() {
    const projectUrl = String(process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
    const secretKey = String(process.env.SUPABASE_SECRET_KEY || "").trim();
    const bucket = String(process.env.SUPABASE_STORAGE_BUCKET || "academic-files").trim();
    const pendingBucket = `${bucket}-pending`;

    if (!projectUrl || !secretKey || !bucket) {
        throw new Error("Set SUPABASE_URL, SUPABASE_STORAGE_BUCKET, and SUPABASE_SECRET_KEY first.");
    }

    const supabase = createClient(projectUrl, secretKey, {
        auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
        },
    });
    const options = {
        public: true,
        allowedMimeTypes: ["application/pdf"],
        fileSizeLimit: MAX_FILE_SIZE,
    };
    const { data: existingBucket, error: lookupError } = await supabase.storage.getBucket(bucket);

    if (lookupError && lookupError.statusCode !== "404" && lookupError.status !== 404) {
        throw new Error(`Unable to inspect Storage bucket: ${lookupError.message}`);
    }

    const operation = existingBucket
        ? supabase.storage.updateBucket(bucket, options)
        : supabase.storage.createBucket(bucket, options);
    const { error } = await operation;

    if (error) throw new Error(`Unable to configure Storage bucket: ${error.message}`);

    const { data: existingPending, error: pendingLookupError } = await supabase.storage.getBucket(pendingBucket);
    if (pendingLookupError && pendingLookupError.statusCode !== "404" && pendingLookupError.status !== 404) {
        throw new Error(`Unable to inspect pending bucket: ${pendingLookupError.message}`);
    }

    const pendingOptions = {
        public: false,
        allowedMimeTypes: ["application/pdf", "application/json"],
        fileSizeLimit: 10 * 1024 * 1024,
    };
    const pendingOperation = existingPending
        ? supabase.storage.updateBucket(pendingBucket, pendingOptions)
        : supabase.storage.createBucket(pendingBucket, pendingOptions);
    const { error: pendingError } = await pendingOperation;
    if (pendingError) throw new Error(`Unable to configure pending bucket: ${pendingError.message}`);

    return { bucket, created: !existingBucket, pendingBucket, pendingCreated: !existingPending };
}

if (require.main === module) {
    setupStorage()
        .then(({ bucket, created, pendingBucket, pendingCreated }) => {
            console.log(`${created ? "Created" : "Updated"} public PDF bucket: ${bucket}`);
            console.log(`${pendingCreated ? "Created" : "Updated"} private review bucket: ${pendingBucket}`);
        })
        .catch((error) => {
            console.error(error.message);
            process.exitCode = 1;
        });
}

module.exports = { setupStorage };
