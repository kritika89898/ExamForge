const express = require("express");

const {

generateAnalysis

} = require("../controllers/analysisController");

const router = express.Router();

router.get("/:subject", generateAnalysis);

module.exports = router;