let recognition;
let isListening = false;
let timerInterval;
let seconds = 0;

const BACKEND_URL = "https://danscom-ai-interview-assistant.onrender.com"; 

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const timerDisplay = document.getElementById("timer");
const visualizer = document.getElementById("visualizer");

// 1. Check if Backend is Online immediately
async function checkBackendStatus() {
  try {
    const response = await fetch(BACKEND_URL + "/");
    if (response.ok) {
      statusDot.classList.add("online");
      statusText.innerText = "AI System Online";
    }
  } catch (err) {
    statusText.innerText = "AI Offline (Waking up...)";
    console.log("Backend is likely sleeping on Render free tier.");
  }
}
checkBackendStatus();

// 2. Timer Functions
function startTimer() {
  seconds = 0;
  timerDisplay.innerText = "00:00";
  timerInterval = setInterval(() => {
    seconds++;
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    timerDisplay.innerText = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// 3. Speech Recognition Logic
if(startBtn) startBtn.onclick = () => startListening();
if(stopBtn) stopBtn.onclick = () => stopListening();

function startListening() {
  if (isListening) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition not supported in this browser.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;

  recognition.onstart = () => {
    isListening = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    visualizer.classList.add("active"); // Start bouncing bars
    document.getElementById("question").innerText = "Listening... Speak clearly.";
    startTimer();
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript;
    document.getElementById("question").innerText = "You: " + transcript;
    getAIResponse(transcript);
  };

  recognition.onerror = (err) => {
    console.error("Speech Error:", err);
    stopListening();
  };

  recognition.onend = () => {
    isListening = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    visualizer.classList.remove("active"); // Stop bouncing bars
    stopTimer();
  };

  recognition.start();
}

function stopListening() {
  if (recognition) {
    recognition.stop();
  }
}

// 4. API Call to Render
async function getAIResponse(transcript) {
  const answerElement = document.getElementById("answer");
  answerElement.innerText = "Danscom AI is analyzing your answer...";

  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userInput: transcript,
        context: "Software Developer/System Architect Interview"
      })
    });

    const data = await response.json();
    answerElement.innerText = data.feedback || "No feedback received.";
    
    // Voice output (Optional: AI speaks back)
    if (data.feedback) {
      const speech = new SpeechSynthesisUtterance(data.feedback);
      window.speechSynthesis.speak(speech);
    }

  } catch (error) {
    answerElement.innerText = "Error: Could not reach the AI server.";
  }
}
