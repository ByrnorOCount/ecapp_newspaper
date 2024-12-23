import express from 'express';
import articleService from '../services/article.service.js';
import commentService from '../services/comment.service.js';
import { isAuthenticated, restrictPremium } from '../middlewares/auth.mdw.js';
import pdfService from '../services/pdf.service.js';

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
      user: req.session.authUser
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
            user: req.session.authUser
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

router.get('/articles/:id', restrictPremium, async function (req, res) {
  try {
    const relatedArticles = await articleService.getRelatedArticles(req.params.id);
    const comments = await commentService.getCommentsByArticleId(req.params.id);

    res.render('guest/articleDetails', {
      article: req.article,
      relatedArticles,
      comments,
      user: req.session.authUser,
    });
  } catch (error) {
    console.log(error);
    res.redirect('/articles');
  }
});

router.post('/articles/:id/comment', isAuthenticated, async function (req, res) {
  const { articleId, content } = req.body;
  const userId = req.session.authUser.id;

  if (!content || !articleId) {
      return res.status(400).json({ error: 'Content and article ID are required' });
  }

  try {
      await commentService.addComment(articleId, userId, content);
      res.redirect(`/articles/${articleId}`);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.get('/articles/:id/download', restrictPremium, async function (req, res) {
  try {
    const article = await articleService.getArticleById(req.params.id);

    if (!req.session.authUser || !req.session.authUser.valid_until) {
      return res.redirect(`/articles/${req.params.id}`);
    }

    const isValidSubscription = new Date(req.session.authUser.valid_until) > new Date();
    if (!isValidSubscription) {
      return res.redirect(`/articles/${req.params.id}`);
    }

    const pdfBuffer = await pdfService.generateArticlePDF(article);

    res.setHeader('Content-Disposition', `attachment; filename="${article.title}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.log(error);
    res.redirect(`/articles/${req.params.id}`);
  }
});

export default router;