import db from '../utils/db.js';

export default {
    async assignCategories({ editorId, categoryIds }) {
        await db.query(`DELETE FROM editor_categories WHERE editor_id = ?`, [editorId]);
      
        const values = categoryIds.map(categoryId => [editorId, categoryId]);
        if (values.length > 0) {
          await db.query(`INSERT INTO editor_categories (editor_id, category_id) VALUES ?`, [values]);
        }
    }
}