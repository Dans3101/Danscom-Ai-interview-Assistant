const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // This allows your GitHub Page to talk to this server
app.use(express.json());

app.post('/interview/analyze', async (req, res) => {
    const { userText } = req.body;
    // Here is where you will eventually call the Gemini/OpenAI API
    res.json({ feedback: "I heard you say: " + userText + ". Great start!" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

