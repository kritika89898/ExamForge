const { getDataset } = require("../services/datasetService");
const { generatePrediction } = require("../services/geminiService");

exports.predict = async (req, res) => {
    console.log("Prediction API Hit");
    console.log(req.body);

    try {

        const { subject } = req.body;

        if (!subject) {

            return res.status(400).json({
                success: false,
                message: "Subject is required"
            });

        }

        const dataset = getDataset(subject);

        if (!dataset) {

            return res.status(404).json({
                success: false,
                message: "Dataset not found"
            });

        }

        const prediction = await generatePrediction(dataset);

        res.json({
            success: true,
            data: prediction
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};