const fs = require("fs");
const path = require("path");

const { analyzeSubject } =
require("../services/analysisService");

exports.generateAnalysis = (req, res) => {

    const { subject } = req.params;

    const result = analyzeSubject(subject);

    const output = path.join(

        __dirname,

        "../analysis",

        `${subject}.json`

    );

    fs.writeFileSync(

        output,

        JSON.stringify(result, null, 4)

    );

    res.json(result);

};