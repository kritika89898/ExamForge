const path = require("path");

exports.uploadPDF = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "No PDF uploaded"
            });

        }

        const { department, semester, subject } = req.body;

        res.json({

            success: true,

            message: "PDF uploaded successfully.",

            data: {

                department,

                semester,

                subject,

                filename: req.file.filename,

                originalName: req.file.originalname

            }

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};