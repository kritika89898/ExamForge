// GET /api/health: quick check that the API is deployed and configured.
// Never returns the key itself, only whether one is set.
module.exports = (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
        success: true,
        status: "ok",
        aiConfigured: Boolean(String(process.env.GEMINI_API_KEY || "").trim()),
    });
};
