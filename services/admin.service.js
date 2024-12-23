import db from '../utils/db.js';

export default {
    async getEditors() {
        return await db('users')
          .select('*')
          .where('role', 'editor');
    },

    async assignCategories(editor_id, category_id) {
        if (!editor_id || !Array.isArray(category_id)) {
            throw new Error('Invalid input: editor_id must be provided, and category_id must be an array');
        }
    
        try {
            await db.transaction(async function (trx) {
                await db('editor_categories')
                    .where({ editor_id: editor_id })
                    .delete()
                    .transacting(trx);
    
                if (category_id.length === 0) return;
    
                const assignments = category_id.map((catId) => ({
                    editor_id: editor_id,
                    category_id: catId,
                }));
    
                await db('editor_categories')
                    .insert(assignments)
                    .transacting(trx);
            });
        } catch (error) {
            throw new Error(`Failed to assign categories: ${error.message}`);
        }
    },    

    async getCategories() {
        return await db('categories').select('name').orderBy('name');
    },

    async addCategory(data) {
        const { name, parent_id } = data;
        const [id] = await db('categories').insert({ name, parent_id }).returning('id');
        return { id };
    },

    async updateCategory(id, data) {
        const { name, parent_id } = data;
        await db('categories').where({ id }).update({ name, parent_id });
        return;
    },

    async deleteCategory(id) {
        await db('categories').where({ id }).del();
        return;
    },

    async getTags() {
        return await db('tags').select('*');
    },

    async addTag(data) {
        const { name } = data;
        const [id] = await db('tags').insert({ name }).returning('id');
        return { id };
    },

    async updateTag(id, data) {
        const { name } = data;
        await db('tags').where({ id }).update({ name });
        return;
    },

    async deleteTag(id) {
        await db('tags').where({ id }).del();
        return;
    },

    async getArticles() {
        return await db('articles')
            .select('id', 'title', 'status', 'is_premium', 'views', 'publication_date');
    },

    async updateArticleStatus(id, status) {
        await db('articles').where({ id }).update({ status });
        return;
    },

    async getUsers() {
        return await db('users').select('id', 'full_name', 'email', 'role', 'created_at');
    },

    async renewSubscriber(id) {
        const newExpiry = knex.raw('NOW() + INTERVAL 7 DAY');
        await db('users').where({ id }).update({ subscriber_expiry: newExpiry });
        return;
    }
}