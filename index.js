import express from 'express';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { body, validationResult } from 'express-validator'; 
import { fileURLToPath } from 'url';
import path from 'path';
import swaggerJsDoc from 'swagger-jsdoc'; // Importar swagger-jsdoc
import swaggerUi from 'swagger-ui-express'; // Importar swagger-ui-express

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Configuração do Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Suncat API',
            version: '1.0.0',
            description: 'API para cadastro e login de usuários',
        },
        servers: [
            {
                url: 'http://localhost:3000', // URL do servidor
            },
        ],
    },
    apis: [`${__dirname}/index.js`], // Caminho do arquivo onde estão as rotas
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rota para cadastro
/**
 * @swagger
 * /cadastro:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Erro de validação ou ao criar usuário
 */
app.post('/cadastro', 
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres'),
    async (req, res) => {
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
                default:
                    errorMessage = 'Erro ao criar usuário: ' + error.message;
            }
            console.error('Erro ao criar usuário:', errorMessage);
            res.status(400).json({ error: errorMessage });
        }
});

// Rota para login
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Faz login de um usuário existente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *       401:
 *         description: Erro de autenticação
 */
app.post('/login', 
    body('email').isEmail().withMessage('Email inválido'),
    body('password').exists().withMessage('A senha é obrigatória'),
    async (req, res) => {
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
            let errorMessage;
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Usuário não encontrado.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Senha incorreta.';
                    break;
                default:
                    errorMessage = 'Erro ao autenticar usuário: ' + error.message;
            }
            console.error('Erro ao autenticar usuário:', errorMessage);
            res.status(401).json({ error: errorMessage });
        }
});

// Configuração da porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
