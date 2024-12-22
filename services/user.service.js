import db from '../utils/db.js';
import bcrypt from 'bcrypt';

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

    async registerUser({ fullName, penName, email, hashedPassword, date_of_birth }) {
        return await db('users')
            .insert({
                full_name: fullName,
                pen_name: penName || null, // allow null if pen name is not provided
                email,
                password: hashedPassword,
                date_of_birth,
                role: 'reader',
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

    async updateUserInfo(userId, { full_name, pen_name, email, date_of_birth }) {
        const updatedData = {
            full_name,
            email,
            date_of_birth,
        };

        if (pen_name) {
            updatedData.pen_name = pen_name;
        }

        return await db('users')
            .where('id', userId)
            .update(updatedData);
    },

    async updatePassword(userId, currentPassword, newPassword) {
        const user = await db('users').where('id', userId).first();

        if (!user) {
            throw new Error('User not found');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            throw new Error('Incorrect current password');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db('users')
            .where('id', userId)
            .update({ password: hashedPassword });

        return { message: 'Password updated successfully' };
    },
};