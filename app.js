
const firebaseConfig = {
  apiKey: "AIzaSyBIx9m2RspAUHiMtINd96VQdWaprH-8m24",
  authDomain: "quizapp-765f0.firebaseapp.com",
  databaseURL: "https://quizapp-765f0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "quizapp-765f0",
  storageBucket: "quizapp-765f0.appspot.com",
  messagingSenderId: "454149464659",
  appId: "1:454149464659:web:3e776c432ac2b4cb615ca6",
  measurementId: "G-4MKJ7T5YTQ"
};

firebase.initializeApp(firebaseConfig);
let isHost = false;
const db = firebase.database();

const hostScreen = document.getElementById("host-screen");
const playerScreen = document.getElementById("player-screen");
const joinArea = document.getElementById("join-container");
const codeInput = document.getElementById("code-input");
const playerNameInput = document.getElementById("player-name");
const questionArea = document.getElementById("question-area");
const playerList = document.getElementById("player-list");
const waitingScreen = document.getElementById("waiting-for-host");

let gameCode = "";
const questions = [
  { q: "What color is the sky?", a: ["Blue", "Green", "Red"] },
  { q: "What is 2+2?", a: ["3", "4", "5"] },
];

function generateGameCode() {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
}

function startGame() {
  let index = 0;
  db.ref(`games/${gameCode}/currentQuestion`).set(0);
   timer = setInterval(() => {
        index++;
        if (index < questions.length) {
          db.ref(`games/${gameCode}/currentQuestion`).set(index);
        } else {
          clearInterval(timer);
        }
      }, 10000); // 10 seconds
}

function newGame() {
  isHost = true;
  gameCode = generateGameCode();
  const joinUrl = "https://dwright1989.github.io/quiz-time/index.html?join=" + gameCode;
  document.getElementById("game-code").innerHTML = `<h2>Game Code: ${gameCode}</h2><p>Or scan the QR to join!</p>`;

  new QRious({
    element: document.getElementById("qr-code"),
    value: joinUrl,
    size: 200
  });

  db.ref(`games/${gameCode}/players`).on('value', snapshot => {
    const players = snapshot.val() || {};
    playerList.innerHTML = `<h3>Players Joined:</h3>` +
      Object.values(players).map(name => `<p>${name}</p>`).join('');
    // Show Start Game button only if at least one player is present
    if (Object.keys(players).length > 0) {
      document.getElementById("start-game-container").style.display = "block";
    }
  });

  // Listen for question updates on the host screen too
  db.ref(`games/${gameCode}/currentQuestion`).on('value', snapshot => {
    const index = snapshot.val();
    if (index !== null) showQuestion(index);
  });
}

function joinGame() {
  const code = codeInput.value.trim().toUpperCase();
  const name = playerNameInput.value.trim();
  if (!name) return alert("Please enter your name");

  db.ref(`games/${code}/players`).push(name);
  joinArea.style.display = "none";

  gameCode = code;
  hostScreen.classList.remove("active");
  playerScreen.classList.add("active");
  waitingScreen.style.display = "block";

  // Only show question when currentQuestion is triggered
  db.ref(`games/${gameCode}/currentQuestion`).on('value', snapshot => {
    const index = snapshot.val();
    if (index !== null){
      waitingScreen.style.display = "none"; // Hides waiting screen for players
      showQuestion(index);
    }
  });
}

function showQuestion(index) {
  const q = questions[index];
  if (!q) {
    questionArea.innerHTML = "<h2>Game Over!</h2>";
    return;
  }

  // Show timer UI
  document.getElementById("timer-container").style.display = "block";

  let html = `<h2>${q.q}</h2>`;

  // Only show answer buttons if NOT host
  if (!isHost) {
    html += q.a.map(ans => `<button onclick='answerQuestion(${index})'>${ans}</button>`).join("<br>");
  }

  questionArea.innerHTML = html;

  let timeLeft = 10;
  const timeDisplay = document.getElementById("time-left");
  const fill = document.getElementById("progress-fill");

  timeDisplay.textContent = timeLeft;
  fill.style.width = "100%";

  const countdown = setInterval(() => {
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    fill.style.width = (timeLeft * 10) + "%";

    if (timeLeft <= 0) {
      clearInterval(countdown);
    }
  }, 1000);
}

function answerQuestion(index) {
  console.log("Answered question", index);
}

// Auto-join via ?join=CODE
window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("join");
  if (code && codeInput) {
    hostScreen.classList.remove("active");
    joinArea.classList.add("active");
    playerScreen.classList.add("active");
    codeInput.value = code;
  }
});
