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
        return await db('categories as c')
            .leftJoin('categories as p', 'c.parent_id', 'p.id')
            .select('c.id', 'c.name', 'c.parent_id', 'p.name as parent_name')
            .orderBy('c.id');
    },
    
    async addCategory(name, parentId = null) {
        return await db('categories')
            .insert({
                name: name,
                parent_id: parentId || null,
            });
    },

    async updateCategory(id, name, parentId = null) {
        return await db('categories')
            .where('id', id)
            .update({
                name: name,
                parent_id: parentId,
            });
    },

    async deleteCategory(id) {
        return await db('categories')
            .where('id', id)
            .del();
    },

    async getTags() {
        return await db('tags')
            .select('id', 'name')
            .orderBy('name');
    },

    async addTag(name) {
        return await db('tags')
            .insert({ name: name })
            .returning('id');
    },

    async updateTag(id, name) {
        return await db('tags')
            .where('id', id)
            .update({ name: name });
    },

    async deleteTag(id) {
        return await db('tags')
            .where('id', id)
            .del();
    },

    async getArticles() {
        return await db('articles as a')
            .select(
                'a.id',
                'a.title',
                'a.status',
                'a.is_premium',
                'a.views',
                'a.publication_date',
                'c.name as category_name',
                'u.full_name as writer_name'
            )
            .leftJoin('categories as c', 'a.category_id', 'c.id')
            .leftJoin('users as u', 'a.writer_id', 'u.id')
            .orderBy('a.publication_date', 'desc');
    },

    async updateArticleStatus(id, status) {
        return await db('articles')
            .where('id', id)
            .update({ status: status });
    },

    async getUsers() {
        return await db('users')
            .select('id', 'full_name', 'email', 'role', 'created_at')
            .orderBy('created_at', 'desc');
    },

    async renewSubscriber(id) {
        return await db('users')
            .where('id', id)
            .update({ subscriber_expiry: db.raw('NOW() + INTERVAL 7 DAY') });
    },

    async assignCategories(editorId, categoryIds) {
        return await db.transaction(async (trx) => {
            await db('editor_categories')
                .where({ editor_id: editorId })
                .delete()
                .transacting(trx);

            if (categoryIds.length > 0) {
                const assignments = categoryIds.map((categoryId) => ({
                    editor_id: editorId,
                    category_id: categoryId,
                }));
                await db('editor_categories')
                    .insert(assignments)
                    .transacting(trx);
            }
        });
    },
}