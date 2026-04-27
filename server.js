require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Try using the latest flash model string
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

        const prompt = `
            You are the 'Danscom AI Interview Copilot'. 
            Current Context: ${context}
            
            The following text was captured from a live environment: "${userInput}"
            
            TASK:
            1. Detect if the text is an INTERVIEWER QUESTION or a CANDIDATE ANSWER.
            
            IF IT IS A QUESTION:
            - Provide a brilliant, high-level, and concise response.
            - Start with "SUGGESTED ANSWER: "
            
            IF IT IS A CANDIDATE ANSWER:
            - Briefly critique it. 
            - Score out of 10 and one tip.
            - Start with "FEEDBACK: "
            
            Keep response under 60 words.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ feedback: text });
    } catch (error) {
        console.error("Gemini AI Error:", error);
        
        // This ensures the frontend stops saying "Processing..." even if there's an error
        let errorMessage = "AI currently unavailable. Check Render logs.";
        
        if (error.message.includes("404")) {
            errorMessage = "Model Error: Please check the model name in server.js.";
        }

        res.json({ feedback: errorMessage });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Danscom AI Backend live on port ${PORT}`);
});
