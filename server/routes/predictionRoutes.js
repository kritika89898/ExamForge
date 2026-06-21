const express = require("express");
const { predict } = require("../controllers/predictionController");

const router = express.Router();

// Browser testing
router.get("/:subject", (req, res) => {
    req.body = {
        subject: req.params.subject
    };
    predict(req, res);
});

// (Keep this if you also want POST support)
router.post("/", predict);

module.exports = router;