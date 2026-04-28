require('dotenv').config(); // Note: Changed 'Require' to 'require' (lowercase is standard)
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Initialize Gemini with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/** * CHANGE: Switched to "gemini-pro" to fix the 404 error 
 * found in your Render logs. This model is globally supported.
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

        const prompt = `
            You are the 'Danscom AI Interview Copilot'. 
            Current Context: ${context}
            
            Text captured: "${userInput}"
            
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
        
        // Better error categorization for your frontend
        let userMessage = "AI encountered an issue. Please try speaking again.";
        
        if (error.message.includes("404")) {
            userMessage = "Model not found. Ensure 'gemini-pro' is used.";
        } else if (error.message.includes("API_KEY")) {
            userMessage = "API Key error. Check Render environment variables.";
        }

        res.json({ feedback: userMessage });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Danscom AI Backend live on port ${PORT}`);
});
