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

export default router;