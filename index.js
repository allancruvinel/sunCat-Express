// Import the functions you need from the SDKs you need
import express from 'express';
import path from 'path';
import { initializeApp } from "firebase/app";
import { fileURLToPath } from 'url'; 
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
// Middleware para JSON
app.use(express.json());

// Rota simples de GET
app.get('/', (req, res) => {
    res.send('Hello World!');
});



// Rota para lidar com o POST do formulário
app.post('/cadastro', (req, res) => {
    console.log(req.body); // Mostra os dados enviados no terminal
    res.json({ message: 'Dados recebidos', data: req.body });
});

// Servir arquivos estáticos (HTML, JS, CSS) da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota simples de GET
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
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
