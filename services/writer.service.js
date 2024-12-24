import db from '../utils/db.js';

export default {
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

    async updateArticle(articleId, { title, summary, content, category_id, tags, thumbnail }) {
        await db('articles')
        .where('id', articleId)
        .update({
            title,
            summary,
            content,
            category_id,
            thumbnail,
            status: 'draft', // reset status if was rejected
            rejection_notes: null,
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