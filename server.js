require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Check if API key exists
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in Render Environment Variables");
    process.exit(1);
}

// ✅ Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY);

// ✅ Updated Gemini model
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
});

// ✅ Home route
app.get('/', (req, res) => {
    res.send("Danscom AI Interview Assistant Backend is ONLINE 🚀");
});

// ✅ Main AI route
app.post('/api/analyze', async (req, res) => {

    try {

        const { userInput, context } = req.body;

        // ✅ Validate input
        if (!userInput || userInput.trim() === "") {
            return res.status(400).json({
                feedback: "No clear audio detected."
            });
        }

        // ✅ AI Prompt
        const prompt = `
You are the "Danscom AI Interview Copilot".

Current Context:
${context}

Captured Text:
"${userInput}"

TASK:

1. Detect whether the text is:
- an INTERVIEWER QUESTION
OR
- a CANDIDATE ANSWER

IF IT IS AN INTERVIEWER QUESTION:
- Provide a smart, professional, concise answer.
- Start with:
"SUGGESTED ANSWER:"

IF IT IS A CANDIDATE ANSWER:
- Briefly critique it.
- Give:
  - score out of 10
  - one improvement tip
- Start with:
"FEEDBACK:"

RULES:
- Keep response under 60 words
- Make answers natural and confident
`;

        // ✅ Send to Gemini
        const result = await model.generateContent(prompt);

        // ✅ Extract response text
        const response = await result.response;
        const text = response.text();

        // ✅ Send back to frontend
        res.json({
            feedback: text
        });

    } catch (error) {

        console.error("❌ Gemini AI Error:", error);

        let userMessage =
            "AI encountered an issue. Please try speaking again.";

        // ✅ Better error handling
        if (error.message?.includes("404")) {
            userMessage =
                "Gemini model not found. Check model name.";
        }

        else if (error.message?.includes("API_KEY")) {
            userMessage =
                "Invalid Gemini API Key.";
        }

        else if (error.message?.includes("quota")) {
            userMessage =
                "Gemini free quota exceeded.";
        }

        res.status(500).json({
            feedback: userMessage
        });
    }
});

// ✅ Render port setup
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Danscom AI Backend live on port ${PORT}`);
});