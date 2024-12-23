import db from '../utils/db.js';

export default {
    async getAssignedCategories(editorId) {
        const results = await db('editor_categories')
        .select('category_id')
        .where('editor_id', editorId);
        return results.map(row => row.category_id);
    },

    async approveArticle(articleId, { category, tags, publicationDate }) {
        return db('articles')
        .where('id', articleId)
        .update({
            status: 'draft',
            category_id: category,
            tags: JSON.stringify(tags),
            publication_date: publicationDate
        });
    },
      
    async rejectArticle(articleId, { rejectionNotes }) {
        return db('articles')
        .where('id', articleId)
        .update({
            status: 'rejected',
            rejection_notes: rejectionNotes
        });
    },
}