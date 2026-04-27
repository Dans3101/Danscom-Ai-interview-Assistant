require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.get('/', (req, res) => {
    res.send("Danscom AI Interview Assistant Backend is ONLINE 🚀");
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { userInput, context } = req.body;

        if (!userInput) {
            return res.status(400).json({ error: "No user input received." });
        }

        // --- NEW SMART PROMPT ---
        const prompt = `
            You are the 'Danscom AI Interview Copilot'. 
            Current Context: ${context}
            
            The following text was captured from a live environment: "${userInput}"
            
            TASK:
            1. Detect if the text is an INTERVIEWER QUESTION or a CANDIDATE ANSWER.
            
            IF IT IS A QUESTION:
            - Provide a brilliant, high-level, and concise response the candidate can use. 
            - Start your response with "SUGGESTED ANSWER: "
            
            IF IT IS A CANDIDATE ANSWER:
            - Briefly critique it. 
            - Give a score out of 10 and one tip to make it better.
            - Start your response with "FEEDBACK: "
            
            Keep your total response under 60 words so it can be read quickly.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ feedback: text });
    } catch (error) {
        console.error("Gemini AI Error:", error);
        res.status(500).json({ error: "AI failed to respond." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Danscom AI Backend live on port ${PORT}`);
});
