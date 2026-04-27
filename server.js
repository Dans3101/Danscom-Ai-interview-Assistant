require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. Initialize Gemini with your API Key from Render Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- ROUTES ---

// Health Check: Open your-url.onrender.com/ in a browser to see if it's alive
app.get('/', (req, res) => {
    res.send("Danscom AI Interview Assistant Backend is ONLINE 🚀");
});

// The Main AI Analysis Route
app.post('/api/analyze', async (req, res) => {
    try {
        const { userInput, context } = req.body;

        if (!userInput) {
            return res.status(400).json({ error: "No user input received." });
        }

        const prompt = `
            You are a professional AI Interviewer for 'Danscom AI'.
            Role Context: ${context || 'General Professional Interview'}
            Candidate Answer: "${userInput}"
            
            Critique the answer:
            1. Score: X/10
            2. Content: Did they explain their impact?
            3. Feedback: One constructive tip to improve.
            Keep it encouraging and short.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ feedback: text });
    } catch (error) {
        console.error("Gemini AI Error:", error);
        res.status(500).json({ error: "AI failed to respond. Check API Key." });
    }
});

// Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
