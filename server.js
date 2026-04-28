require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Increase limit to handle Base64 images from screen snapshots
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Models
const textModel = genAI.getGenerativeModel({ model: "gemini-pro" });
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.get('/', (req, res) => {
    res.send("Danscom AI Interview Assistant Backend is ONLINE 🚀");
});

// 1. AUDIO ANALYSIS ROUTE
app.post('/api/analyze', async (req, res) => {
    try {
        const { userInput, context } = req.body;
        if (!userInput || userInput.trim() === "") {
            return res.status(400).json({ feedback: "No clear audio detected." });
        }

        const prompt = `
            You are 'Danscom AI Interview Copilot'. 
            Context: ${context}
            Input Text: "${userInput}"
            1. If it's an INTERVIEWER QUESTION: Provide a brilliant, concise SUGGESTED ANSWER.
            2. If it's a CANDIDATE ANSWER: Provide FEEDBACK and a score/10.
            Keep it under 50 words.
        `;

        const result = await textModel.generateContent(prompt);
        res.json({ feedback: result.response.text() });
    } catch (error) {
        console.error("❌ Audio Error:", error);
        res.json({ feedback: "AI is processing audio..." });
    }
});

// 2. NEW: SCREEN ANALYSIS ROUTE (VISION)
app.post('/api/analyze-screen', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: "No image received" });

        const prompt = "You are an interview assistant. Look at this screenshot. If you see an interview question, provide a short SUGGESTED ANSWER. If you see the candidate's code or answer, provide a quick tip. Keep it under 50 words. If no question is visible, just say 'Monitoring screen...'";

        const result = await visionModel.generateContent([
            prompt,
            { inlineData: { data: image, mimeType: "image/jpeg" } }
        ]);

        res.json({ feedback: result.response.text() });
    } catch (error) {
        console.error("❌ Vision Error:", error);
        res.json({ feedback: "Screen analysis paused." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Danscom AI Backend live on port ${PORT}`);
});
