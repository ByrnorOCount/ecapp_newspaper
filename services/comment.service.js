import db from '../utils/db.js';

export default {
    async getCommentsByArticleId(articleId) {
        return await db('comments as c')
            .select(
                'c.id',
                'c.content',
                'c.comment_date',
                'u.full_name as username'
            )
            .leftJoin('users as u', 'c.user_id', 'u.id')
            .where('c.article_id', articleId)
            .orderBy('c.comment_date', 'desc');
    },
    
    async addComment(articleId, userId, content) {
        return await db('comments')
            .insert({
                article_id: articleId,
                user_id: userId,
                content: content,
                comment_date: db.raw('NOW()'),
            });
    }
}