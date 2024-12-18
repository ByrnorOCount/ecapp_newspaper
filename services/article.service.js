import db from '../utils/db.js';

export default {
    async getFeaturedArticles() {
        return await db('articles')
        .select('id', 'title', 'category_id', 'summary', 'thumbnail', 'publication_date')
        .where('status', 'published')
        .andWhere('publication_date', '>=', db.raw('NOW() - INTERVAL 1 WEEK'))
        .orderBy('publication_date', 'desc')
        .limit(4);
    },
    
    async getMostViewedArticles() {
        return await db('articles')
        .select('id', 'title', 'category_id', 'summary', 'thumbnail', 'publication_date')
        .where('status', 'published')
        .orderBy('views', 'desc')
        .limit(10);
    },

    async getLatestArticles() {
        return await db('articles')
        .select('id', 'title', 'category_id', 'summary', 'thumbnail', 'publication_date')
        .where('status', 'published')
        .orderBy('publication_date', 'desc')
        .limit(10);
    },

    async getTopCategoriesWithLatestArticle() {
        return await db('categories as c')
        .select('c.id as category_id', 'c.name as category_name', 'a.id as article_id', 'a.title as article_title')
        .leftJoin('articles as a', 'c.id', 'a.category_id')
        .where('a.status', 'published')
        .whereRaw('a.publication_date = (SELECT MAX(publication_date) FROM articles WHERE category_id = c.id)')
        .limit(10);
    }
}