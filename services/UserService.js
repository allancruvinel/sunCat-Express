import pool from '../db.js'

async function getUserIdByEmail(email) {
    const query = 'SELECT id FROM usuario WHERE email = $1;';
    const values = [email];

    try {
        const result = await pool.query(query, values);

        if (result.rows.length > 0) {
            const userId = result.rows[0].id;
            console.log('ID do usuário:', userId);
            return userId;
        } else {
            console.log('Usuário não encontrado.');
            return null;
        }
    } catch (error) {
        console.error('Erro ao buscar o ID do usuário:', error);
        throw error;
    }
}

export default getUserIdByEmail;