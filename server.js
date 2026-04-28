require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * We use 'gemini-pro' as it is the most stable across all regions.
 * If you have access to newer models, you can update this string.
 */
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

app.get('/', (req, res) => {
    res.send("Danscom AI Interview Assistant Backend is ONLINE 🚀");
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { userInput, context } = req.body;

        if (!userInput || userInput.trim() === "") {
            return res.status(400).json({ feedback: "No clear audio detected." });
        }

        // The prompt is tuned to detect Interviewer vs Candidate 
        // and provide only short, readable text.
        const prompt = `
            You are the 'Danscom AI Interview Copilot'. 
            Context: ${context}
            Input Text: "${userInput}"
            
            1. If this is an INTERVIEWER QUESTION: Provide a brilliant, concise response starting with "SUGGESTED ANSWER: ".
            2. If this is a CANDIDATE ANSWER: Provide a score/10 and one tip starting with "FEEDBACK: ".
            
            IMPORTANT: Keep the response under 50 words. Be direct.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Send back text only
        res.json({ feedback: text });

    } catch (error) {
        console.error("❌ Gemini AI Error:", error);
        
        // Ensure we always return a text-based error message
        let errorMessage = "The AI is processing. Please repeat.";
        
        if (error.message.includes("404")) {
            errorMessage = "Model Error. Please check backend configuration.";
        }

        res.json({ feedback: errorMessage });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Danscom AI Backend live on port ${PORT}`);
});
