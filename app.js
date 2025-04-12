
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
let gameStarted = false;
const db = firebase.database();

const hostScreen = document.getElementById("host-screen");
const hostStartScreen = document.getElementById("host-start-screen");
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
  gameStarted = true;
  document.getElementById("scoreboard").style.display = "none";
  let index = 0;
  function nextQuestion() {
    if (index < questions.length) {
      db.ref(`games/${gameCode}/currentQuestion`).set(index);

      // Wait 10s for answering + 2s for showing correct answer
      setTimeout(() => {
        index++;
        nextQuestion();
      }, 12000); // 10s answer + 2s pause to show correct answer
    } else {
      // Game over
      db.ref(`games/${gameCode}/currentQuestion`).set(null);
    }
  }

  nextQuestion();
}


function newGame() {
  gameStarted = false;
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
      Object.values(players).map(player => `<p>${player.name}</p>`).join('');
    // Show Start Game button only if at least one player is present
    if (Object.keys(players).length > 0) {
      document.getElementById("start-game-container").style.display = "block";
    }
  });

  // Listen for question updates on the host screen too
  db.ref(`games/${gameCode}/currentQuestion`).on('value', snapshot => {
    const index = snapshot.val();
    if (index !== null) {
      showQuestion(index);
    } else if (gameStarted) {
      // Game is over, show final scores on host and hide timer and question
      document.getElementById("host-question-area").style.display = "none";
      document.getElementById("player-question-area").style.display = "none";
      document.getElementById("timer-container").style.display = "none";
      document.getElementById("host-timer-container").style.display = "none";
      showScores();
    }
  });
}

function joinGame() {
  const code = codeInput.value.trim().toUpperCase();
  const name = playerNameInput.value.trim();
  if (!name) return alert("Please enter your name");

  db.ref(`games/${code}/players`).push({
    name: name,
    score: 0
  });
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
    // Hide question UI
    document.getElementById("host-question-area").style.display = "none";
    document.getElementById("player-question-area").style.display = "none";
    document.getElementById("timer-container").style.display = "none";
    document.getElementById("host-timer-container").style.display = "none";
    // Show leaderboard
    showScores();
    return;
  }
  document.getElementById("host-question-area").style.display = "block";
  document.getElementById("player-question-area").style.display = "block";
  
  // Host: show question and answers 
  let hostHtml = `<h2>${q.q}</h2>`;
  hostHtml += q.a.map(ans => `<button class="answer-btn" disabled>${ans}</button>`).join("<br>");
  document.getElementById("host-question-area").innerHTML = hostHtml;

  hostStartScreen.style.display = "none";

  // Player: show question + answer buttons
  let html = `<h2>${q.q}</h2>`;
  html += q.a.map(ans => `<button class="answer-btn" onclick='selectAnswer(this, ${index}, "${ans}")'>${ans}</button>`).join("<br>");
  document.getElementById("player-question-area").innerHTML = html;

  // Show timer UI for host and player
  document.getElementById("timer-container").style.display = "block";
  document.getElementById("host-timer-container").style.display = "block";

  let timeLeft = 10;
  const timeDisplay = document.getElementById("time-left");
  const fill = document.getElementById("player-progress-fill");
  const hostTimeDisplay = document.getElementById("host-time-left");
  const hostFill = document.getElementById("host-progress-fill");

  timeDisplay.textContent = timeLeft;
  fill.style.width = "100%";
  hostTimeDisplay.textContent = timeLeft;
  hostFill.style.width = "100%";

  const countdown = setInterval(() => {
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    fill.style.width = (timeLeft * 10) + "%";
    hostTimeDisplay.textContent = timeLeft;
    hostFill.style.width = (timeLeft * 10) + "%";
    if (timeLeft <= 0) {
      clearInterval(countdown);

      // Highlight correct answer on host screen
      const correctAnswer = questions[index].a[1]; // assuming index 1 is always correct
      const hostButtons = document.querySelectorAll("#host-question-area button");
      hostButtons.forEach(btn => {
        if (btn.textContent === correctAnswer) {
          btn.classList.add("correct");
        }
      });
      // Highlight correct answer on player screen
      const playerButtons = document.querySelectorAll("#player-question-area .answer-btn");
      playerButtons.forEach(btn => {
        if (btn.textContent === correctAnswer) {
          btn.classList.add("correct");
        }
      });
    }
  }, 1000);
}

function selectAnswer(button, index, selectedAnswer) {
  // Remove highlight from any previously selected button
  const buttons = document.querySelectorAll("#player-question-area .answer-btn");
  buttons.forEach(btn => btn.classList.remove("selected"));

  // Highlight the clicked one
  button.classList.add("selected");

  // Send answer to database
  answerQuestion(index, selectedAnswer);
}


function answerQuestion(index, selectedAnswer) {
  const correctAnswer = questions[index].a[1]; // assuming index 1 is always the correct answer

  if (selectedAnswer === correctAnswer) {
    const playersRef = db.ref(`games/${gameCode}/players`);
    playersRef.once('value', snapshot => {
      const players = snapshot.val();
      const playerKey = Object.keys(players).find(key => players[key].name === playerNameInput.value);

      if (playerKey) {
        const currentScore = players[playerKey].score || 0;
        playersRef.child(playerKey).update({ score: currentScore + 1 });
      }
    });
  }

  console.log("Answered question", index);
}

function showScores() {
  setTimeout(() => {
    db.ref(`games/${gameCode}/players`).once('value', snapshot => {
      const players = snapshot.val() || {};

      const sortedPlayers = Object.values(players).sort((a, b) => (b.score || 0) - (a.score || 0));

      const html = sortedPlayers.map((p, i) => 
        `<p><strong>#${i + 1} ${p.name}</strong>: ${p.score || 0} point${p.score === 1 ? '' : 's'}</p>`
      ).join('');

      document.getElementById("score-list").innerHTML = html;
      document.getElementById("scoreboard").style.display = "block";
    });
  }, 1000); // wait 1s before showing scores
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
