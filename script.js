let recognition;
let isListening = false;

// Update this to your ACTUAL Render URL after you deploy
const BACKEND_URL = "https://danscom-ai-interview-assistant.onrender.com"; 

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

// Ensure buttons exist before assigning clicks
if(startBtn) startBtn.onclick = () => startListening();
if(stopBtn) stopBtn.onclick = () => stopListening();

function startListening() {
  if (isListening) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Your browser does not support speech recognition. Try Chrome.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;

  recognition.onstart = () => {
    isListening = true;
    document.getElementById("question").innerText = "Listening... Speak now.";
    startBtn.disabled = true; // Visual feedback
    stopBtn.disabled = false;
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript;
    document.getElementById("question").innerText = "You said: " + transcript;
    
    // Send to your Render Backend
    getAIResponse(transcript);
  };

  recognition.onerror = (err) => {
    console.error("Speech Error:", err);
    isListening = false;
  };

  recognition.onend = () => {
    isListening = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  };

  recognition.start();
}

function stopListening() {
  if (recognition) {
    recognition.stop();
  }
}

async function getAIResponse(transcript) {
  const answerElement = document.getElementById("answer");
  answerElement.innerText = "Danscom AI is thinking...";

  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userInput: transcript,
        context: "Professional Job Interview"
      })
    });

    const data = await response.json();
    
    if (data.feedback) {
      answerElement.innerText = data.feedback;
    } else {
      answerElement.innerText = "AI couldn't process that. Check Render logs.";
    }

  } catch (error) {
    answerElement.innerText = "Error connecting to backend. Is Render awake?";
    console.error("Fetch Error:", error);
  }
}
