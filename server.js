require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Initialize Gemini with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * 2026 UPDATE: Switching to 'gemini-2.5-flash' which is the current stable 
 * standard for low-latency interview tasks.
 */
let model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.get('/', (req, res) => {
    res.send("Danscom AI Interview Assistant Backend is ONLINE 🚀");
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { userInput, context } = req.body;

        if (!userInput || userInput.trim() === "") {
            return res.status(400).json({ feedback: "No clear audio detected." });
        }

        const prompt = `
            You are the 'Danscom AI Interview Copilot'. 
            Current Context: ${context}
            Text captured: "${userInput}"
            
            TASK:
            1. Detect if the text is an INTERVIEWER QUESTION or a CANDIDATE ANSWER.
            2. If QUESTION: Provide a brilliant, concise response starting with "SUGGESTED ANSWER: ".
            3. If ANSWER: Provide a score and tip starting with "FEEDBACK: ".
            Keep response under 60 words.
        `;

        // Attempt generation
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ feedback: text });

    } catch (error) {
        console.error("❌ Gemini AI Error:", error);
        
        // AUTO-RETRY LOGIC: If gemini-2.5-flash fails, try gemini-2.0-flash
        if (error.message.includes("404")) {
            try {
                console.log("🔄 Retrying with fallback model...");
                const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const result = await fallbackModel.generateContent("Test connection");
                res.json({ feedback: "Model updated. Please try speaking again!" });
                // Update the main model for future calls
                model = fallbackModel;
                return;
            } catch (retryErr) {
                res.json({ feedback: "Model Error: Please check your Google AI Studio project settings." });
            }
        } else {
            res.json({ feedback: "AI is busy. Please try that sentence again." });
        }
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Danscom AI Backend live on port ${PORT}`);
});
