require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors()); // Critical: Allows your GitHub Page to talk to this server
app.use(express.json());

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

// Endpoint to handle interview questions/answers
app.post('/api/analyze', async (req, res) => {
    try {
        const { userInput, context } = req.body;

        const prompt = `
            You are an expert AI Interview Assistant. 
            Context: ${context || 'General Interview'}
            User Answer: "${userInput}"
            
            Provide a professional critique. 
            1. Rate the answer out of 10.
            2. Identify if they used the STAR method (Situation, Task, Action, Result).
            3. Give one specific tip for improvement.
            Keep the response concise and encouraging.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ feedback: text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "The AI is a bit tired. Try again!" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Danscom AI Backend running on port ${PORT}`);
});
