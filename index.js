// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import express from 'express';

// Initialize Express app
const app = express();

// Middleware para JSON
app.use(express.json());

// Rota simples de GET
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Rota simples de POST
app.post('/echo', (req, res) => {
    res.json({ message: 'Received', data: req.body });
});

// Configuração da porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCHzj77xG8u_sq9DNMCa_BqiE0wHkH9cVc",
  authDomain: "suncat-3804a.firebaseapp.com",
  projectId: "suncat-3804a",
  storageBucket: "suncat-3804a.appspot.com",
  messagingSenderId: "799526486887",
  appId: "1:799526486887:web:c71691689791a3cb29e5c2",
  measurementId: "G-THWZQNJ6QV"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);
const auth = getAuth();

// Handle form submission (Client-side code assumed to be in the browser environment)
if (typeof document !== 'undefined') {
  const form = document.getElementById('signup-form');
  const message = document.getElementById('signup-message');

  form.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent form from submitting

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Successfully created user
        const user = userCredential.user;
        message.textContent = "Usuário criado com sucesso: " + user.email;
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        message.textContent = `Erro: ${errorCode} - ${errorMessage}`;
      });
  });
}
