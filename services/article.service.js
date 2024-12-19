import db from '../utils/db.js';

export default {
    async getFeaturedArticles() {
        return await db('articles as a')
            .select(
                'a.id',
                'a.title',
                'sub.name as subcategory_name',
                'main.name as maincategory_name',
                'a.summary',
                'a.thumbnail',
                'a.publication_date'
            )
            .leftJoin('categories as sub', 'a.category_id', 'sub.id')
            .leftJoin('categories as main', 'sub.parent_id', 'main.id')
            .where('a.status', 'published')
            .andWhere('a.publication_date', '>=', db.raw('NOW() - INTERVAL 1 WEEK'))
            .orderBy('a.publication_date', 'desc')
            .limit(4);
    },

    async getMostViewedArticles() {
        return await db('articles as a')
            .select(
                'a.id',
                'a.title',
                'sub.name as subcategory_name',
                'main.name as maincategory_name',
                'a.summary',
                'a.thumbnail',
                'a.publication_date'
            )
            .leftJoin('categories as sub', 'a.category_id', 'sub.id')
            .leftJoin('categories as main', 'sub.parent_id', 'main.id')
            .where('a.status', 'published')
            .orderBy('a.views', 'desc')
            .limit(10);
    },

    async getLatestArticles() {
        return await db('articles as a')
            .select(
                'a.id',
                'a.title',
                'sub.name as subcategory_name',
                'main.name as maincategory_name',
                'a.summary',
                'a.thumbnail',
                'a.publication_date'
            )
            .leftJoin('categories as sub', 'a.category_id', 'sub.id')
            .leftJoin('categories as main', 'sub.parent_id', 'main.id')
            .where('a.status', 'published')
            .orderBy('a.publication_date', 'desc')
            .limit(10);
    },

    async getTopCategoriesWithLatestArticle() {
        return await db('categories as sub')
            .select(
                'main.id as maincategory_id',
                'main.name as maincategory_name',
                'sub.id as subcategory_id',
                'sub.name as subcategory_name',
                'a.id as article_id',
                'a.title as article_title'
            )
            .leftJoin('articles as a', 'sub.id', 'a.category_id')
            .leftJoin('categories as main', 'sub.parent_id', 'main.id')
            .where('a.status', 'published')
            .whereRaw('a.publication_date = (SELECT MAX(publication_date) FROM articles WHERE category_id = sub.id)')
            .limit(10);
    },

    async getFilteredArticles({ category, tag, limit, offset }) {
        let query = db('articles as a')
            .select(
                'a.id',
                'a.title',
                'a.summary',
                'a.thumbnail',
                'a.publication_date',
                'sub.name as subcategory_name',
                'main.name as maincategory_name',
                db.raw('GROUP_CONCAT(t.name ORDER BY t.name) as tags')
            )
            .leftJoin('categories as sub', 'a.category_id', 'sub.id')
            .leftJoin('categories as main', 'sub.parent_id', 'main.id')
            .leftJoin('article_tags as at', 'a.id', 'at.article_id')
            .leftJoin('tags as t', 'at.tag_id', 't.id')
            .where('a.status', 'published')
            .groupBy('a.id', 'sub.name', 'main.name')
            .limit(limit)
            .offset(offset);
    
        if (category) {
            query = query.where(function() {
                this.where('sub.name', category).orWhere('main.name', category);
            });
        }
    
        if (tag) {
            query = query.havingRaw('FIND_IN_SET(?, tags)', [tag]);
        }
    
        const articles = await query;
    
        let totalQuery = db('articles as a')
            .countDistinct('a.id as count')
            .leftJoin('categories as sub', 'a.category_id', 'sub.id')
            .leftJoin('categories as main', 'sub.parent_id', 'main.id')
            .leftJoin('article_tags as at', 'a.id', 'at.article_id')
            .leftJoin('tags as t', 'at.tag_id', 't.id')
            .where('a.status', 'published');
    
        if (category) {
            totalQuery = totalQuery.where('sub.name', category);
        }
    
        if (tag) {
            totalQuery = totalQuery.havingRaw('FIND_IN_SET(?, GROUP_CONCAT(t.name ORDER BY t.name))', [tag]);  // Filter by tag
        }
    
        const [{ count: total } = { count: 0 }] = await totalQuery;
        if (total === undefined) {
            total = 0;
        }
        return { articles, total: parseInt(total, 10) };
    },    

    async getCategories() {
        return await db('categories').select('name').orderBy('name');
    },

    async getTags() {
        return await db('tags').select('name').orderBy('name');
    }
};