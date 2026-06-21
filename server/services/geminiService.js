const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generatePrediction(dataset) {

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash"
    });

    const prompt = `
You are an experienced university professor.

Subject: ${dataset.subject}

Semester: ${dataset.semester}

Important Topics:
${dataset.importantTopics.map((t) => "- " + t).join("\n")}

Previous Year Questions:
${dataset.previousQuestions.map((q) => "- " + q).join("\n")}

Based on these previous year questions:

Generate:

1. 10 predicted exam questions
2. 8 most important topics
3. A short study strategy

Return ONLY valid JSON in this format:

{
  "predictedQuestions": [],
  "importantTopics": [],
  "studyStrategy": ""
}
`;
    const result = await model.generateContent(prompt);

    const response = await result.response;

    let text = response.text().trim();

    if (text.startsWith("```json")) {
        text = text.replace(/^```json\s*/, "");
    }

    if (text.startsWith("```")) {
        text = text.replace(/^```\s*/, "");
    }

    if (text.endsWith("```")) {
        text = text.replace(/```$/, "");
    }

    return JSON.parse(text);
}

module.exports = {
    generatePrediction
};