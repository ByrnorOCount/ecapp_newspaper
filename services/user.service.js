import db from '../utils/db.js';

export default {
    async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },
      
    async registerGoogleUser(fullName, email) {
        const [result] = await db.execute(
            'INSERT INTO users (full_name, email, role) VALUES (?, ?, ?)',
            [fullName, email, 'guest']
        );
        return { id: result.insertId, full_name: fullName, email, role: 'guest' };
    },

    async findById(id) {
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    }
}