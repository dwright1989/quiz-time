
window.addEventListener("load", () => {
  const firebaseConfig = {
    apiKey: "AIzaSyBIx9m2RspAUHiMtINd96VQdWaprH-8m24",
    authDomain: "quizapp-765f0.firebaseapp.com",
    projectId: "quizapp-765f0",
    storageBucket: "quizapp-765f0.firebasestorage.app",
    messagingSenderId: "454149464659",
    appId: "1:454149464659:web:3e776c432ac2b4cb615ca6",
    measurementId: "G-4MKJ7T5YTQ"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  let gameCode = "";
  const hostScreen = document.getElementById("host-screen");
  const playerScreen = document.getElementById("player-screen");
  const codeInput = document.getElementById("code-input");
  const playerNameInput = document.getElementById("player-name");
  const questionArea = document.getElementById("question-area");
  const playerList = document.getElementById("player-list");

  const questions = [
    { q: "What color is the sky?", a: ["Blue", "Green", "Red"] },
    { q: "What is 2+2?", a: ["3", "4", "5"] },
  ];

  function generateGameCode() {
    return Math.random().toString(36).substr(2, 4).toUpperCase();
  }

  function startGame() {
    gameCode = generateGameCode();
    const joinUrl = `${window.location.origin}${window.location.pathname}?join=${gameCode}`;
    document.getElementById("game-code").innerHTML = `<h2>Game Code: ${gameCode}</h2><p>Or scan the QR to join!</p>`;

    new QRious({
      element: document.getElementById("qr-code"),
      value: joinUrl,
      size: 200
    });

    db.ref(`games/${gameCode}/players`).on('value', snapshot => {
      const players = snapshot.val() || {};
      playerList.innerHTML = "<h3>Players Joined:</h3>" +
        Object.values(players).map(name => `<p>${name}</p>`).join('');
    });
  }

  function generatePlayerQR() {
    const name = document.getElementById("qr-player-name").value.trim();
    if (!name || !gameCode) {
      alert("Enter a name and start a game first!");
      return;
    }

    const joinUrl = `${window.location.origin}${window.location.pathname}?join=${gameCode}&name=${encodeURIComponent(name)}`;

    new QRious({
      element: document.getElementById("player-qr-code"),
      value: joinUrl,
      size: 200
    });
  }

  function joinGame() {
    const code = codeInput.value.trim().toUpperCase();
    const name = playerNameInput.value.trim();

    if (!name) return alert("Please enter your name");

    db.ref(`games/${code}/players`).push(name);

    gameCode = code;
    hostScreen.classList.remove("active");
    playerScreen.classList.add("active");
    showQuestion(0);
  }

  function showQuestion(index) {
    const q = questions[index];
    if (!q) {
      questionArea.innerHTML = "<h2>Game Over!</h2>";
      return;
    }
    questionArea.innerHTML = `<h2>${q.q}</h2>` +
      q.a.map(ans => `<button onclick='answerQuestion(${index + 1})'>${ans}</button>`).join("<br>");
  }

  function answerQuestion(nextIndex) {
    showQuestion(nextIndex);
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get("join");
  const name = params.get("name");

  if (code) {
    codeInput.value = code;
  }
  if (name) {
    playerNameInput.value = name;
    joinGame();
  }
});
