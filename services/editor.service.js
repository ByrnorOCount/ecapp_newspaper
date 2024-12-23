import db from '../utils/db.js';

export default {
    async getAssignedCategories(editorId) {
        const results = await db.query(
          `SELECT category_id FROM editor_categories WHERE editor_id = ?`,
          [editorId]
        );
        return results.map(row => row.category_id);
    }, 
    async approveArticle(articleId, { category, tags, publicationDate }) {
        return db.query(
          `UPDATE articles
           SET status = 'pending',
               category_id = ?,
               tags = ?,
               publication_date = ?
           WHERE id = ?`,
          [category, JSON.stringify(tags), publicationDate, articleId]
        );
    },
      
    async rejectArticle(articleId, { rejectionNotes }) {
        return db.query(
          `UPDATE articles
           SET status = 'rejected',
               rejection_notes = ?
           WHERE id = ?`,
          [rejectionNotes, articleId]
        );
    },
}