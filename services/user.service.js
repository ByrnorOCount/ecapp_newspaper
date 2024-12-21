import db from '../utils/db.js';

export default {
    async findByEmail(email) {
        return await db('users')
            .select('*')
            .where('email', email)
            .first();
    },

    async findById(id) {
        return await db('users')
            .select('*')
            .where('id', id)
            .first();
    },

    async registerUser(fullName, penName, email, hashedPassword) {
        return await db('users')
            .insert({
                full_name: fullName,
                pen_name: penName || null, // allow null if pen name is not provided
                email,
                password: hashedPassword,
                role: 'guest',
            });
    },

    async registerGoogleUser(fullName, email) {
        return await db('users')
            .insert({
                full_name: fullName,
                email,
                role: 'guest',
            });
    },

    async getUserByEmail(email) {
        return await db('users')
            .select('*')
            .where('email', email)
            .first();
    },

    async getUserById(id) {
        return await db('users')
            .select('*')
            .where('id', id)
            .first();
    },
    
    add(entity) {
        return db('users').insert(entity);
    }
};