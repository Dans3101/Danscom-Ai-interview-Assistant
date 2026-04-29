require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Updated Gemini Model (supports both text + vision)
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
});

// Home Route
app.get('/', (req, res) => {
    res.send("Danscom AI Interview Assistant Backend is ONLINE 🚀");
});

// ========================================
// 1. AUDIO / TEXT ANALYSIS ROUTE
// ========================================
app.post('/api/analyze', async (req, res) => {
    try {
        const { userInput, context } = req.body;

        if (!userInput || userInput.trim() === "") {
            return res.status(400).json({
                feedback: "No clear audio detected."
            });
        }

        const prompt = `
You are 'Danscom AI Interview Copilot'.

Context:
${context || "No previous context"}

Input Text:
"${userInput}"

Instructions:
1. If it's an INTERVIEWER QUESTION:
   - Provide a brilliant, concise suggested answer.
2. If it's a CANDIDATE ANSWER:
   - Provide feedback and a score out of 10.

Keep the response under 50 words.
`;

        const result = await model.generateContent(prompt);

        const response = await result.response;
        const text = response.text();

        res.json({
            feedback: text
        });

    } catch (error) {
        console.error("❌ Audio Error:", error);

        res.status(500).json({
            feedback: "AI is processing audio..."
        });
    }
});

// ========================================
// 2. SCREEN / IMAGE ANALYSIS ROUTE
// ========================================
app.post('/api/analyze-screen', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                error: "No image received"
            });
        }

        const prompt = `
You are an AI Interview Assistant.

Analyze this screenshot carefully.

Rules:
1. If you see an interview question:
   - Provide a short suggested answer.
2. If you see code:
   - Give a quick coding improvement tip.
3. If no clear question exists:
   - Reply with "Monitoring screen..."

Keep the response under 50 words.
`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: image,
                    mimeType: "image/jpeg"
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        res.json({
            feedback: text
        });

    } catch (error) {
        console.error("❌ Vision Error:", error);

        res.status(500).json({
            feedback: "Screen analysis paused."
        });
    }
});

// ========================================
// START SERVER
// ========================================
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Danscom AI Backend live on port ${PORT}`);
});