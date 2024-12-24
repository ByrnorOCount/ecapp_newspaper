import db from '../utils/db.js';

export default {
    async getAssignedCategories(editorId) {
        const results = await db('editor_categories')
            .select('category_id')
            .where('editor_id', editorId);
        return results.map(row => row.category_id);
    },

    async getDraftArticlesByCategories(categoryIds) {
        if (categoryIds.length === 0) {
            return [];
        }

        return db('articles as a')
            .join('categories as c', 'a.category_id', 'c.id')
            .where('a.status', 'draft')
            .whereIn('a.category_id', categoryIds)
            .select('a.*', 'c.name as category_name')
            .orderBy('id');
    },

    async getTagsForArticle(articleId) {
        return db('article_tags as at')
            .join('tags as t', 'at.tag_id', 't.id')
            .where('at.article_id', articleId)
            .select('t.name');
    },

    async approveArticle(articleId, { category, tags, publicationDate, editorId }) {
        const trx = await db.transaction();
    
        try {
            await trx('articles')
                .where('id', articleId)
                .update({
                    status: 'published',
                    category_id: category,
                    publication_date: publicationDate,
                    approved_by: editorId,
                    updated_at: db.fn.now(),
                });
    
            if (tags && tags.length > 0) {
                const tagIds = [];
                for (const tagName of tags) {
                    const [tag] = await trx('tags')
                        .insert({ name: tagName })
                        .onConflict('name')
                        .ignore()
                        .returning('id');
                    tagIds.push(tag?.id || (await trx('tags').where('name', tagName).first()).id);
                }
    
                await trx('article_tags').where('article_id', articleId).del();
    
                const articleTagMappings = tagIds.map(tagId => ({
                    article_id: articleId,
                    tag_id: tagId,
                }));
                await trx('article_tags').insert(articleTagMappings);
            }
    
            await trx.commit();
        } catch (err) {
            await trx.rollback();
            throw err;
        }
    },
    
    async rejectArticle(articleId, { rejectionNotes }, editorId) {
        return db('articles')
            .where('id', articleId)
            .update({
                status: 'rejected',
                rejection_notes: rejectionNotes,
                approved_by: editorId,
                updated_at: db.fn.now()
            });
    },    

    async getProcessedArticlesByEditor(editorId) {
        return db('articles as a')
            .join('categories as c', 'a.category_id', 'c.id')
            .leftJoin('users as w', 'a.writer_id', 'w.id')
            .select(
                'a.id',
                'a.title',
                'a.status',
                'a.category_id',
                'a.created_at',
                'c.name as category_name',
                'w.pen_name as writer_pen_name'
            )
            .whereIn('a.status', ['rejected', 'published'])
            .andWhere('a.approved_by', editorId)
            .orderBy('a.created_at', 'desc');
    },
}