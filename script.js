let recognition;
let isListening = false;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

startBtn.onclick = () => startListening();
stopBtn.onclick = () => stopListening();

function startListening() {
  if (isListening) return;

  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  recognition.lang = "en-US";
  recognition.continuous = true;

  recognition.onstart = () => {
    isListening = true;
    document.getElementById("question").innerText = "Listening...";
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript;

    document.getElementById("question").innerText = transcript;

    getAIResponse(transcript);
  };

  recognition.onerror = (err) => {
    console.error(err);
  };

  recognition.start();
}

function stopListening() {
  if (recognition) {
    recognition.stop();
    isListening = false;
  }
}

async function getAIResponse(question) {
  document.getElementById("answer").innerText = "Thinking...";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional interview assistant. Give short, confident, natural answers."
          },
          {
            role: "user",
            content: question
          }
        ]
      })
    });

    const data = await response.json();
    const answer = data.choices[0].message.content;

    document.getElementById("answer").innerText = answer;

  } catch (error) {
    document.getElementById("answer").innerText = "Error getting response.";
    console.error(error);
  }
            }
