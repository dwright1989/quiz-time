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
const codeInput = document.getElementById("code-input");
const playerNameInput = document.getElementById("player-name");
const questionArea = document.getElementById("question-area");
const playerList = document.getElementById("player-list");

let gameCode = generateGameCode();
const joinUrl = `${window.location.origin}${window.location.pathname}?join=${gameCode}`;

document.addEventListener("DOMContentLoaded", () => {
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
  });
});

// Start questions only when the host clicks start
function startGame() {
  showQuestion(0);
};

const questions = [
  { q: "What color is the sky?", a: ["Blue", "Green", "Red"] },
  { q: "What is 2+2?", a: ["3", "4", "5"] },
];

function generateGameCode() {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
}


function joinGame() {
  const code = codeInput.value.trim().toUpperCase();
  const name = playerNameInput.value.trim();

  if (!name) return alert("Please enter your name");

  db.ref(`games/${code}/players`).push(name);

  gameCode = code;
  hostScreen.classList.remove("active");
  playerScreen.classList.add("active");
  // Listen for question updates
  db.ref(`games/${gameCode}/currentQuestion`).on('value', snapshot => {
    const index = snapshot.val();
    if (index === "end") {
      questionArea.innerHTML = "<h2>Game Over!</h2>";
    } else if (typeof index === "number") {
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
  questionArea.innerHTML = `<h2>${q.q}</h2>` +
    q.a.map(ans => `<button onclick='answerQuestion(${index})'>${ans}</button>`).join("<br>");
}

function answerQuestion(nextIndex) {
  // Just a placeholder — you can expand to check answers
  if (isHost) {
    db.ref(`games/${gameCode}/currentQuestion`).set(currentIndex + 1);
  }
}

// Auto-join via ?join=CODE
window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("join");

  if (code && codeInput) {
    hostScreen.classList.remove("active");
    playerScreen.classList.add("active");
    codeInput.value = code;
  }
});
