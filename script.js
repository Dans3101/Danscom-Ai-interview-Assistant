let recognition;
let isListening = false;
let timerInterval;
let seconds = 0;
let recognitionTimeout;

// Screen Monitoring Variables
let screenStream;
let screenInterval;

const BACKEND_URL = "https://danscom-ai-interview-assistant.onrender.com"; 

const startBtn = document.getElementById("startBtn");
const screenBtn = document.getElementById("screenBtn"); // New button
const stopBtn = document.getElementById("stopBtn");
const timerDisplay = document.getElementById("timer");
const visualizer = document.getElementById("visualizer");
const canvas = document.getElementById("snapshotCanvas");

// 1. Timer Logic
function startTimer() {
  if (timerInterval) return; // Don't start twice
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
  timerInterval = null;
}

// 2. SCREEN MONITORING LOGIC (The "Eyes")
async function startScreenMonitoring() {
  try {
    // Request screen share permission
    screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { cursor: "always" },
        audio: false 
    });

    document.getElementById("status-text").innerText = "Screen Monitor Active";
    startBtn.disabled = true;
    screenBtn.disabled = true;
    stopBtn.disabled = false;
    startTimer();

    // Take a snapshot every 5 seconds
    screenInterval = setInterval(captureScreen, 5000);

    // If user clicks "Stop Sharing" on the browser bar
    screenStream.getVideoTracks()[0].onended = () => stopAll();

  } catch (err) {
    console.error("Screen Share Error:", err);
    alert("Could not start screen monitoring.");
  }
}

async function captureScreen() {
  if (!screenStream) return;

  const video = document.createElement('video');
  video.srcObject = screenStream;
  await video.play();

  // Draw current frame to hidden canvas
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert to Base64 (low quality to save data/speed)
  const base64Image = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
  
  // Send to Backend
  sendScreenToAI(base64Image);

  // Cleanup temporary video element
  video.pause();
  video.srcObject = null;
}

async function sendScreenToAI(base64Data) {
  const answerElement = document.getElementById("answer");
  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze-screen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Data })
    });
    const data = await response.json();
    if (data.feedback) {
        answerElement.innerText = data.feedback;
    }
  } catch (error) {
    console.error("Screen API Error:", error);
  }
}

// 3. VOICE LOGIC (The "Ears")
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
    screenBtn.disabled = true;
    stopBtn.disabled = false;
    visualizer.classList.add("active");
    startTimer();
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    document.getElementById("question").innerText = "Hearing: " + transcript;

    clearTimeout(recognitionTimeout);
    recognitionTimeout = setTimeout(() => {
      if(transcript.trim().length > 5) getAIResponse(transcript);
    }, 2000); 
  };

  recognition.onend = () => { if (isListening) recognition.start(); };
  recognition.start();
}

async function getAIResponse(transcript) {
  document.getElementById("answer").innerText = "Analyzing audio...";
  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput: transcript, context: "Live Interview" })
    });
    const data = await response.json();
    document.getElementById("answer").innerText = data.feedback || "Done.";
  } catch (e) { console.error(e); }
}

// 4. STOP EVERYTHING
function stopAll() {
  isListening = false;
  if (recognition) recognition.stop();
  if (screenInterval) clearInterval(screenInterval);
  if (screenStream) {
    screenStream.getTracks().forEach(track => track.stop());
    screenStream = null;
  }
  stopTimer();
  visualizer.classList.remove("active");
  startBtn.disabled = false;
  screenBtn.disabled = false;
  stopBtn.disabled = true;
  document.getElementById("status-text").innerText = "AI System Online";
}

if(startBtn) startBtn.onclick = startListening;
if(screenBtn) screenBtn.onclick = startScreenMonitoring;
if(stopBtn) stopBtn.onclick = stopAll;
