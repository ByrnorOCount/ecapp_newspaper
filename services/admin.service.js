import db from '../utils/db.js';

export default {
    async getCategories() {
        return await db('categories as c')
            .leftJoin('categories as p', 'c.parent_id', 'p.id')
            .select('c.id', 'c.name', 'c.parent_id', 'p.name as parent_name')
            .orderBy('c.id');
    },
    async addCategory(name, parentId = null) {
        return await db('categories').insert({
            name: name,
            parent_id: parentId,
        });
    },
    async updateCategory(id, name, parentId = null) {
        return await db('categories')
            .where('id', id)
            .update({
                name: name,
                parent_id: parentId || null,
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
            .orderBy('id');
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
            .orderBy('a.status')
            .orderBy('a.publication_date', 'desc');
    },
    async addArticle(title, summary, content, category_id, writer_id, thumbnail, status, is_premium) {
        return await db('articles').insert({
            title: title,
            summary: summary,
            content: content,
            category_id: category_id,
            writer_id: writer_id,
            thumbnail: thumbnail,
            status: status,
            is_premium: is_premium
        });
    },
    async updateArticle(id, updatedFields) {
        return await db('articles')
            .where('id', id)
            .update({
                ...updatedFields,
                updated_at: db.fn.now(),
            });
    },
    async updateArticleWithTags(id, articleData, tags) {
        const trx = await db.transaction();
        try {
            await trx('articles').where('id', id).update(articleData);
            await trx('article_tags').where('article_id', id).del();
            const tagInserts = tags.map(tagId => ({ article_id: id, tag_id: tagId }));
            await trx('article_tags').insert(tagInserts);
            await trx.commit();
        } catch (err) {
            await trx.rollback();
            throw err;
        }
    },
    async updateArticleStatus(id, status) {
        return await db('articles')
            .where('id', id)
            .update({ status: status });
    },
    async deleteArticle(id) {
        return await db('articles')
            .where('id', id)
            .del();
    },


   
    async updateUser(id, data) {
        return await db('users').where('id', id).update(data);
    },
    async deleteUser(id) {
        return await db('users').where('id', id).delete();
    },
    async getUsers() {
        return await db('users')
            .select('id', 'full_name', 'pen_name', 'email', 'role', 'date_of_birth', 'created_at')
            .orderBy('id');
    },

    async renewSubscriber(id) {
        return await db('users')
            .where('id', id)
            .update({ subscriber_expiry: db.raw('NOW() + INTERVAL 7 DAY') });
    },
    async getEditors() {
        return await db('users')
          .select('*')
          .where('role', 'editor');
    },
    async assignCategories(editor_id, category_id) {
        console.log('Editor ID:', editor_id);
        console.log('Category IDs:', category_id);
        
        if (!editor_id || !Array.isArray(category_id) || category_id.some(isNaN)) {
            throw new Error('Invalid input: editor_id must be provided, and category_id must be an array of numbers');
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
}