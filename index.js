import express from 'express';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { body, validationResult } from 'express-validator'; 
import { fileURLToPath } from 'url';
import path from 'path';
import swaggerJsDoc from 'swagger-jsdoc'; // Importar swagger-jsdoc
import swaggerUi from 'swagger-ui-express'; // Importar swagger-ui-express
import admin from 'firebase-admin'; // Importar Firebase Admin SDK
import { getGroqApiResponse } from './services/AIService.js';
import popularPerguntaERespostasNoBanco from './services/QuestionService.js'
import pool from './db.js'; // Importa o pool de conexão
import getUserIdByEmail from './services/UserService.js'

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

// Inicializa o Firebase Auth
const firebase = initializeApp(firebaseConfig);
const auth = getAuth(firebase);

// Inicializa o Firebase Admin para o Realtime Database
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://suncat-3804a.firebaseio.com" // Substitua pelo URL do seu banco de dados
});
const db = admin.database();

// Inicializa o aplicativo Express
const app = express();

// Middleware para JSON
app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Permite todas as origens
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200); // Responde ao preflight
    }
    next();
});

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

        const { email, password, city, country } = req.body;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const query = `
            INSERT INTO usuario (email, city, country)
            VALUES ($1, $2, $3) RETURNING *;
            `;
            const values = [email, city, country];
            const result = await pool.query(query, values);  // Usando o pool de conexão importado

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

app.get('/totalscore', async (req, res) => {
    try {
        // Consultar as maiores pontuações ordenadas por total_score em modo decrescente
        const query = `
            SELECT u.email, s.total_score, s.ultima_atualizacao
            FROM score s
            JOIN usuario u ON s.usuario_id = u.id
            ORDER BY s.total_score DESC;
        `;
        
        const result = await pool.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Nenhuma pontuação encontrada.' });
        }

        // Retornar a lista de emails, pontuações e última atualização
        const scores = result.rows.map(row => ({
            email: row.email,
            total_score: row.total_score,
            ultima_atualizacao: row.ultima_atualizacao
        }));

        res.json(scores);
    } catch (error) {
        console.error('Erro ao obter as pontuações:', error);
        res.status(500).json({ message: 'Erro ao obter as pontuações.' });
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
            console.log("user ",user.accessToken);
            res.json({ message: 'Login bem-sucedido!', user: user.email,access_token: user.accessToken });
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

 app.post('/commitanswer', async (req, res) => {
    const { pergunta_id, alternativa_id } = req.body;

    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.status(403).send('Autorização necessária.');
    }

    const token = authorizationHeader.split('Bearer ')[1];
    var decoded = parseJwt(token);
    console.log("decoded ", decoded);
    const usuario_id = await getUserIdByEmail(decoded.email);

    try {
        // 1. Consultar no banco de dados se a resposta está correta
        const query = `
            SELECT correta,id
            FROM resposta
            WHERE pergunta_id = $1 AND alternativa_id = $2;
        `;
        
        const values = [pergunta_id, alternativa_id];
        const result = await pool.query(query, values);
        const resposta_id = result.rows[0].id;
        const isCorrect = result.rows[0].correta;

        // 1.5. Consultar no banco de dados para buscar a dificuldade da pergunta
        const queryPergunta = `
            SELECT dificuldade
            FROM pergunta
            WHERE id = $1;
        `;
        
        const valuesPergunta = [pergunta_id];
        const resultPergunta = await pool.query(queryPergunta, valuesPergunta);
        const dificuldadePergunta = resultPergunta.rows[0].dificuldade;

        // 2. Verificar se a resposta foi encontrada
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Pergunta ou alternativa não encontrada.' });
        }



        // 3. Inserir o resultado na tabela 'resultado'
        const insertQuery = `
            INSERT INTO resultado (usuario_id, pergunta_id, resposta_id, correta)
            VALUES ($1, $2, $3, $4) RETURNING id;
        `;
        const insertValues = [usuario_id, pergunta_id, resposta_id, isCorrect];
        await pool.query(insertQuery, insertValues);

        // 4. Atualizar ou inserir o score do usuário
        if (isCorrect) {
            // Aumento no total_score
            const pontosGanhos = 10 * dificuldadePergunta;

            // Verificar se o usuário já tem um score
            const scoreQuery = `
                SELECT id, total_score
                FROM score
                WHERE usuario_id = $1;
            `;
            const scoreValues = [usuario_id];
            const scoreResult = await pool.query(scoreQuery, scoreValues);

            if (scoreResult.rows.length > 0) {
                // Se o usuário já tem um score, faça um UPDATE
                const scoreId = scoreResult.rows[0].id;
                const totalScoreAtual = scoreResult.rows[0].total_score;
                const novoTotalScore = totalScoreAtual + pontosGanhos;

                const updateScoreQuery = `
                    UPDATE score
                    SET total_score = $1, ultima_atualizacao = CURRENT_TIMESTAMP
                    WHERE id = $2;
                `;
                const updateScoreValues = [novoTotalScore, scoreId];
                await pool.query(updateScoreQuery, updateScoreValues);
            } else {
                // Se não houver registro, faça um INSERT
                const insertScoreQuery = `
                    INSERT INTO score (usuario_id, total_score)
                    VALUES ($1, $2) RETURNING id;
                `;
                const insertScoreValues = [usuario_id, pontosGanhos];
                await pool.query(insertScoreQuery, insertScoreValues);
            }

            // 5. Responder ao usuário com a mensagem de acerto
            res.json({ success: true, message: 'Você acertou!', score: pontosGanhos });
        } else {
            // 5. Responder ao usuário com a mensagem de erro
            res.json({ success: false, message: 'Você errou!' });
        }
    } catch (error) {
        console.error('Erro ao verificar a resposta:', error);
        res.status(500).json({ message: 'Erro ao verificar a resposta.' });
    }
});
/**
 * @swagger
 * /niveis:
 *   get:
 *     summary: Retorna todos os níveis de dificuldade
 *     responses:
 *       200:
 *         description: Uma lista de níveis de dificuldade
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nivel:
 *                     type: string
 *                     example: "Fácil"
 *                   nivel_en:
 *                     type: string
 *                     example: "Easy"
 */
app.get('/niveis', (req, res) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.status(403).send('Autorização necessária.');
    }

    const token = authorizationHeader.split('Bearer ')[1];
    var decoded = parseJwt(token);
    console.log("decoded ",decoded)
    const niveis = [
        { nivel: 'Fácil', nivel_en: '1' },
        { nivel: 'Médio', nivel_en: '2' },
        { nivel: 'Difícil', nivel_en: '3' }
    ];

    res.json(niveis);
});

// Rota para obter pergunta e resposta do ChatGPT
/**
 * @swagger
 * /getQuestionAndAnswer:
 *   post:
 *     summary: Obtenha uma resposta da IA do ChatGPT
 *     tags: [ChatGPT]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 example: "O que é Firebase?"
 *     responses:
 *       200:
 *         description: Resposta gerada pelo ChatGPT
 *       500:
 *         description: Erro ao chamar a API do ChatGPT
 */
app.post('/getQuestionAndAnswer', async (req, res) => {
    const {tema,nivel} = req.body;
    
    // if (!question) {
    //     return res.status(400).json({ error: 'Pergunta é obrigatória' });
    // }

    try {
        const answer = await getGroqApiResponse({tema,nivel});

        //salvar no banco pergunta e respostas
        answer.id = await popularPerguntaERespostasNoBanco(answer,nivel);

        res.json({ answer });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao obter resposta do ChatGPT '+error });
    }
});

function parseJwt (token) {
    const base64Url = token.split('.')[1]; // Pega a segunda parte (payload)
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Ajuste para base64
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload); // Retorna o payload em JSON
}
// Configuração da porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});