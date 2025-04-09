
document.addEventListener("DOMContentLoaded", () => {
  const firebaseConfig = {
    apiKey: "AIzaSyBIx9m2RspAUHiMtINd96VQdWaprH-8m24",
    authDomain: "quizapp-765f0.firebaseapp.com",
    projectId: "quizapp-765f0",
    storageBucket: "quizapp-765f0.appspot.com",
    messagingSenderId: "454149464659",
    appId: "1:454149464659:web:3e776c432ac2b4cb615ca6",
    measurementId: "G-4MKJ7T5YTQ"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  const btn = document.getElementById("start-btn");
  const qrCanvas = document.getElementById("qr-code");
  const gameCodeDiv = document.getElementById("game-code");

  function generateGameCode() {
    return Math.random().toString(36).substr(2, 4).toUpperCase();
  }

  function startGame() {
    const code = generateGameCode();
    const url = "https://dwright1989.github.io/quiz-time/index.html?join=" + code;

    gameCodeDiv.innerHTML = `<h2>Game Code: ${code}</h2><p>Scan this QR code to join:</p>`;

    new QRious({
      element: qrCanvas,
      value: url,
      size: 200
    });

    console.log("QR code generated with URL:", url);
  }

  btn.addEventListener("click", startGame);
});
