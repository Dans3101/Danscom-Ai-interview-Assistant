const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Note the change here: we import GoogleGenerativeAI directly
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Initialize the library with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. Get the model using the correct method name
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post('/api/analyze', async (req, res) => {
    try {
        const { userInput, context } = req.body;

        if (!userInput) {
            return res.status(400).json({ error: "No input provided" });
        }

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
        res.status(500).json({ error: "The AI is currently unavailable." });
    }
});

const PORT = process.env.PORT || 10000;
// Using 0.0.0.0 helps Render bind the port correctly
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Danscom AI Backend live on port ${PORT}`);
});
