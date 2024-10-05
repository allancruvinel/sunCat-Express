import express from 'express';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { fileURLToPath } from 'url';
import { body, validationResult } from 'express-validator'; // Importando 'body' e 'validationResult'
import path from 'path';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCHzj77xG8u_sq9DNMCa_BqiE0wHkH9cVc",
    authDomain: "suncat-3804a.firebaseapp.com",
    projectId: "suncat-3804a",
    storageBucket: "suncat-3804a.appspot.com",
    messagingSenderId: "799526486887",
    appId: "1:799526486887:web:c71691689791a3cb29e5c2",
    measurementId: "G-THWZQNJ6QV"
};

// Inicializa o Firebase
const firebase = initializeApp(firebaseConfig);
const auth = getAuth(firebase);

// Inicializa o aplicativo Express
const app = express();

// Middleware para JSON
app.use(express.json());

// Rota para cadastro
app.post('/cadastro', 
    // Validações
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres'),
    async (req, res) => {
        // Verifica erros de validação
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Usuário criado:', user.email);
            res.json({ message: 'Usuário criado com sucesso!', user: user.email });
        } catch (error) {
            // Verifica os códigos de erro do Firebase
            let errorMessage;
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este email já está em uso.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'O email fornecido é inválido.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
                    break;
                case '(auth/email-already-in-use':
                    errorMessage = 'Email já cadastrado'
                default:
                    errorMessage = 'Erro ao criar usuário: ' + error.message;
            }
            console.error('Erro ao criar usuário:', errorMessage);
            res.status(400).json({ error: errorMessage });
        }
});

// Rota para login
app.post('/login', 
    // Validações
    body('email').isEmail().withMessage('Email inválido'),
    body('password').exists().withMessage('A senha é obrigatória'),
    async (req, res) => {
        // Verifica erros de validação
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Usuário autenticado:', user.email);
            res.json({ message: 'Login bem-sucedido!', user: user.email });
        } catch (error) {
            // Verifica os códigos de erro do Firebase
            let errorMessage;
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Usuário não encontrado.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Senha incorreta.';
                    break;
                case "auth/invalid-credential":
                    errorMessage = 'Credenciais Invalidas'
                default:
                    errorMessage = 'Erro ao autenticar usuário: ' + error.message;
            }
            console.error('Erro ao autenticar usuário:', errorMessage);
            res.status(401).json({ error: errorMessage });
        }
});

// Rota simples de GET
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Configuração da porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
