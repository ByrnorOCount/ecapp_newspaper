import express from 'express';
import articleService from '../services/article.service.js';

const router = express.Router();

router.get('/', async function (req, res){
  const featuredArticles = await articleService.getFeaturedArticles();
  const mostViewedArticles = await articleService.getMostViewedArticles();
  const latestArticles = await articleService.getLatestArticles();
  const topCategories = await articleService.getTopCategoriesWithLatestArticle();

  res.render('guest/home', {
    featuredArticles,
    mostViewedArticles,
    latestArticles,
    topCategories
  });
});

router.get('/articles', async function (req, res) {
  try {
    const { category, tag, page = 1, search } = req.query;
    const categories = await articleService.getCategories();
    const tags = await articleService.getTags();
    const parsedPage = parseInt(page, 10);
    const currentPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
    const limit = 10;
    const offset = (currentPage - 1) * limit;

    const { articles, total } = await articleService.getFilteredArticles({
      category,
      tag,
      search,
      limit,
      offset,
    });

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const validPage = currentPage > totalPages ? totalPages : currentPage;
    const validOffset = (validPage - 1) * limit;

    const { articles: validArticles } = 
      validPage !== currentPage ? 
          await articleService.getFilteredArticles({
            category,
            tag,
            search,
            limit,
            offset: validOffset,
          }) : { articles, total };
    
    res.render('guest/articleList', {
      articles: validArticles,
      totalArticles: total,
      currentPage: validPage,
      totalPages,
      category,
      tag,
      categories,
      tags,
      search,
    });
  } catch (error) {
    console.log(error);
    res.redirect('/articles');
  }
});

router.get('/articles/:id', async function (req, res) {
  try {
    const article = await articleService.getArticleById(req.params.id);
    const relatedArticles = await articleService.getRelatedArticles(req.params.id);

    res.render('guest/articleDetails', {
      article,
      relatedArticles
    });
  } catch {
    res.redirect('/articles');
  }
});

export default router;