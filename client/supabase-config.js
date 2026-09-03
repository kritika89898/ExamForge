// Static-hosting fallback. When the Express server is used, /runtime-config.js
// provides the public Supabase URL from server environment variables first.
// It is safe to expose the project URL and public bucket name. Never put the
// service-role key or any other secret in this browser file.
window.EXAMFORGE_STORAGE_CONFIG = window.EXAMFORGE_STORAGE_CONFIG || Object.freeze({
    provider: "supabase",
    publicBaseUrl: "https://fbynqfblhilqwstmbjnl.supabase.co/storage/v1/object/public/academic-files",
    bucket: "academic-files",
});
