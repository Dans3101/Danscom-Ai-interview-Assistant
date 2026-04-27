let recognition;
let isListening = false;
let timerInterval;
let seconds = 0;
let recognitionTimeout; // To handle the "pause" before sending to AI

const BACKEND_URL = "https://danscom-ai-interview-assistant.onrender.com"; 

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const timerDisplay = document.getElementById("timer");
const visualizer = document.getElementById("visualizer");

async function checkBackendStatus() {
  try {
    const response = await fetch(BACKEND_URL + "/");
    if (response.ok) {
      statusDot.classList.add("online");
      statusText.innerText = "AI System Online";
    }
  } catch (err) {
    statusText.innerText = "AI Offline (Waking up...)";
  }
}
checkBackendStatus();

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

if(startBtn) startBtn.onclick = () => startListening();
if(stopBtn) stopBtn.onclick = () => stopListening();

function startListening() {
  if (isListening) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition not supported.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true; // Important for hearing device sound quickly

  recognition.onstart = () => {
    isListening = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    visualizer.classList.add("active");
    document.getElementById("question").innerText = "Monitoring all audio...";
    startTimer();
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    // Show the user what is being heard in real-time
    const currentText = finalTranscript || interimTranscript;
    if(currentText) {
        document.getElementById("question").innerText = "Hearing: " + currentText;
    }

    // Debounce: Wait for 1.5 seconds of silence before sending to AI
    clearTimeout(recognitionTimeout);
    if (finalTranscript || interimTranscript) {
      recognitionTimeout = setTimeout(() => {
        getAIResponse(finalTranscript || interimTranscript);
      }, 1500); 
    }
  };

  recognition.onerror = (err) => {
    console.error("Speech Error:", err);
    if(err.error !== 'no-speech') stopListening();
  };

  recognition.onend = () => {
    // Auto-restart if we didn't manually stop (helps with mobile timeouts)
    if (isListening) {
        recognition.start();
    } else {
        stopTimer();
        visualizer.classList.remove("active");
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
  };

  recognition.start();
}

function stopListening() {
  isListening = false; // Mark as manually stopped
  if (recognition) {
    recognition.stop();
  }
}

async function getAIResponse(transcript) {
  if(!transcript.trim()) return;
  
  const answerElement = document.getElementById("answer");
  answerElement.innerText = "Danscom AI is analyzing...";

  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userInput: transcript,
        context: "Live Interview Environment (Hearing both Interviewer & Candidate)"
      })
    });

    const data = await response.json();
    answerElement.innerText = data.feedback || "Processing...";
    
    if (data.feedback) {
      // Cancel any current speech before starting new feedback
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance(data.feedback);
      window.speechSynthesis.speak(speech);
    }

  } catch (error) {
    answerElement.innerText = "Error: Backend unreachable.";
  }
}
