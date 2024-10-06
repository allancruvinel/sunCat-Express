import pool from '../db.js'

async function popularPerguntaERespostasNoBanco(jsonData,nivel) {
    const { question, answers } = jsonData;

    try {
        // 1. Inserir a pergunta na tabela 'pergunta'
        const perguntaQuery = `
            INSERT INTO pergunta (texto,dificuldade)
            VALUES ($1,$2) RETURNING id;
        `;
        const perguntaResult = await pool.query(perguntaQuery, [question,nivel]);
        const perguntaId = perguntaResult.rows[0].id;

        console.log('Pergunta inserida com ID:', perguntaId);

        // 2. Inserir as respostas na tabela 'resposta'
        for (const key in answers) {
            const { resposta, correto } = answers[key];

            const respostaQuery = `
                INSERT INTO resposta (pergunta_id, texto, correta, alternativa_id)
                VALUES ($1, $2, $3, $4);
            `;
            await pool.query(respostaQuery, [perguntaId, resposta, correto, key]);  // 'key' representa a letra da alternativa (a, b, c, d, e)
            console.log(`Resposta ${key} inserida com sucesso!`);
        }
        
        console.log('Pergunta e respostas inseridas com sucesso!');
        return perguntaId;
    } catch (error) {
        console.error('Erro ao popular pergunta e respostas:', error);
    }
}

export default popularPerguntaERespostasNoBanco;