let recognition;
let isListening = false;
let timerInterval;
let seconds = 0;
let recognitionTimeout;

const BACKEND_URL = "https://danscom-ai-interview-assistant.onrender.com"; 

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const timerDisplay = document.getElementById("timer");
const visualizer = document.getElementById("visualizer");

// 1. Cleaner Timer (Standard 1-second ticks)
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

// 2. Optimized Recognition
function startListening() {
  if (isListening) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    visualizer.classList.add("active");
    startTimer();
    document.getElementById("question").innerText = "Monitoring interview...";
  };

  recognition.onresult = (event) => {
    let currentTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      currentTranscript += event.results[i][0].transcript;
    }

    document.getElementById("question").innerText = "Hearing: " + currentTranscript;

    // WAIT LONGER (2 seconds) before sending to AI to capture full questions
    clearTimeout(recognitionTimeout);
    recognitionTimeout = setTimeout(() => {
      if(currentTranscript.trim().length > 5) {
        getAIResponse(currentTranscript);
      }
    }, 2000); 
  };

  recognition.onend = () => {
    if (isListening) recognition.start(); // Auto-restart if it drops
  };

  recognition.start();
}

async function getAIResponse(transcript) {
  const answerElement = document.getElementById("answer");
  answerElement.innerText = "Danscom AI analyzing...";

  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput: transcript, context: "Live Interview" })
    });

    const data = await response.json();
    
    // TEXT ONLY - No speech synthesis here
    answerElement.innerText = data.feedback || "Check connection.";

  } catch (error) {
    answerElement.innerText = "Error: Backend unreachable.";
  }
}

function stopListening() {
  isListening = false;
  if (recognition) recognition.stop();
  stopTimer();
  visualizer.classList.remove("active");
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

if(startBtn) startBtn.onclick = startListening;
if(stopBtn) stopBtn.onclick = stopListening;
