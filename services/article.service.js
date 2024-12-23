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

    async getFilteredArticles({ category, tag, search, limit, offset, user }) {
        let query = db('articles as a') // fetch articles
            .select(
                'a.id',
                'a.title',
                'a.summary',
                'a.thumbnail',
                'a.publication_date',
                'a.is_premium',
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

        if (user && user.valid_until && new Date(user.valid_until) > new Date()) {
            query = query
                .orderBy('a.is_premium', 'desc') // prioritize premium articles
                .orderBy('a.publication_date', 'desc'); // then order by publication date
        } else {
            query = query.orderBy('a.publication_date', 'desc');
        }
        
    
        if (category) {
            query = query.where(function() {
                this.where('sub.name', category).orWhere('main.name', category);
            });
        }
    
        if (tag) {
            query = query.havingRaw('FIND_IN_SET(?, tags)', [tag]);
        }

        if (search) {
            query = query.whereRaw(
              'MATCH (a.title, a.summary, a.content) AGAINST (? IN NATURAL LANGUAGE MODE)',
              [search]
            );
        }

        const articles = await query;
    
        let totalQuery = db('articles as a') // count total articles
            .countDistinct('a.id as count')
            .leftJoin('categories as sub', 'a.category_id', 'sub.id')
            .leftJoin('categories as main', 'sub.parent_id', 'main.id')
            .leftJoin('article_tags as at', 'a.id', 'at.article_id')
            .leftJoin('tags as t', 'at.tag_id', 't.id')
            .where('a.status', 'published');
    
        if (category) {
            totalQuery = totalQuery.where(function () {
                this.where('sub.name', category).orWhere('main.name', category);
            });
        }
    
        if (tag) {
            totalQuery = totalQuery.whereExists(function () {
                this.select('*')
                    .from('tags as t')
                    .join('article_tags as at', 't.id', 'at.tag_id')
                    .whereRaw('at.article_id = a.id')
                    .andWhere('t.name', tag);
            });
        }

        if (search) {
            totalQuery = totalQuery.whereRaw(
              'MATCH (a.title, a.summary, a.content) AGAINST (? IN NATURAL LANGUAGE MODE)',
              [search]
            );
        }

        const { count: total = 0 } = (await totalQuery.first()) || {};
    
        return { articles, total: parseInt(total, 10) };
    },

    async getCategories() {
        return await db('categories').select('name').orderBy('name');
    },

    async getCategoriesWithId() {
        return await db('categories')
        .select('id', 'name')
        .orderBy('name');
    },

    async getTags() {
        return await db('tags').select('name').orderBy('name');
    },

    async getArticleById(id) {
        const article = await db('articles as a')
            .select(
            'a.id',
            'a.title',
            'a.content',
            'a.thumbnail',
            'a.publication_date',
            'is_premium',
            'sub.name as subcategory_name',
            'main.name as maincategory_name',
            db.raw('GROUP_CONCAT(t.name ORDER BY t.name) as tags'),
            'u.full_name as writer_name'
            )
            .leftJoin('categories as sub', 'a.category_id', 'sub.id')
            .leftJoin('categories as main', 'sub.parent_id', 'main.id')
            .leftJoin('article_tags as at', 'a.id', 'at.article_id')
            .leftJoin('tags as t', 'at.tag_id', 't.id')
            .leftJoin('users as u', 'a.writer_id', 'u.id')
            .where('a.id', id)
            .andWhere('a.status', 'published')
            .groupBy('a.id', 'sub.name', 'main.name')
            .first();
        
        return article;
    },

    async getRelatedArticles(articleId, limit = 5) {
        const article = await db('articles as a')
            .select('a.category_id')
            .where('a.id', articleId)
            .andWhere('a.status', 'published')
            .first();
    
        return await db('articles as a')
            .select(
                'a.id',
                'a.title',
                'a.thumbnail',
                'a.summary',
                'a.publication_date',
                'sub.name as subcategory_name',
                'main.name as maincategory_name'
            )
            .leftJoin('categories as sub', 'a.category_id', 'sub.id')
            .leftJoin('categories as main', 'sub.parent_id', 'main.id')
            .where('a.status', 'published')
            .andWhere('a.id', '!=', articleId) // Exclude the current article
            .andWhere('a.category_id', article.category_id) // Match articles from the same category
            .orderBy('a.publication_date', 'desc') // Most recent first
            .limit(limit);
    },

    async submitArticle(writerId, { title, summary, content, category, thumbnail, tags }) {
        console.log('Inputs:', { writerId, title, summary, content, category, thumbnail, tags });
    
        const categoryId = parseInt(category, 10);
        if (!categoryId || isNaN(categoryId)) {
            throw new Error(`Invalid category ID: "${category}"`);
        }
    
        const [articleId] = await db('articles').insert({
            title,
            summary,
            content,
            category_id: categoryId,
            thumbnail,
            writer_id: writerId,
            status: 'pending',
        });
    
        if (tags && tags.length > 0) {
            const tagRecords = await db('tags').select('id', 'name').whereIn('name', tags);
            const tagIds = tagRecords.map((tag) => tag.id);
    
            await db('article_tags').insert(
                tagIds.map((tagId) => ({ article_id: articleId, tag_id: tagId }))
            );
        }
    
        return articleId;
    },    

    async getArticlesByWriter(writerId) {
        return await db('articles as a')
        .select(
            'a.id',
            'a.title',
            'a.status',
            'a.publication_date',
            'a.created_at',
            'c.name as category_name'
        )
        .leftJoin('categories as c', 'a.category_id', 'c.id')
        .where('a.writer_id', writerId)
        .orderBy('a.created_at', 'desc');
    },

    async updateArticle(articleId, { title, summary, content, category, tags, thumbnail }) {
        const categoryRecord = await db('categories')
        .select('id')
        .where('name', category)
        .first();

        if (!categoryRecord) {
        throw new Error(`Category "${category}" not found`);
        }

        const categoryId = categoryRecord.id;

        await db('articles')
        .where('id', articleId)
        .update({
            title,
            summary,
            content,
            category_id: categoryId,
            thumbnail,
            updated_at: db.fn.now(),
        });

        if (tags && tags.length > 0) {
            await db('article_tags').where('article_id', articleId).delete();

            const tagRecords = await db('tags').select('id', 'name').whereIn('name', tags);
            const tagIds = tagRecords.map((tag) => tag.id);

            await db('article_tags').insert(
                tagIds.map((tagId) => ({ article_id: articleId, tag_id: tagId }))
            );
        }
    },
};