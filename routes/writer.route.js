import express from 'express';
import multer from 'multer';
import articleService from '../services/article.service.js';
import writerService from '../services/writer.service.js';
import { restrictToRole } from '../middlewares/auth.mdw.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'static/images/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.get('/articles', restrictToRole('writer'), async function (req, res) {
    try {
      const articles = await writerService.getArticlesByWriter(req.session.authUser.id);
      const categories = await articleService.getCategoriesWithId();
      res.render('writer/submitArticle', {
        articles,
        categories
      });
    } catch (error) {
      console.error('Error fetching writer articles:', error);
      res.status(500).send('An error occurred while fetching articles.');
    }
});

router.post('/articles', restrictToRole('writer'), upload.single('thumbnail'), async function (req, res) {
    const { title, summary, content, category, tags } = req.body;
    const parsedCategory = parseInt(category, 10);
    const thumbnail = req.file ? `/static/images/${req.file.filename}` : null;
    try {
      await writerService.submitArticle(req.session.authUser.id, {
        title,
        summary,
        content,
        category: parsedCategory,
        thumbnail,
        tags: tags ? tags.split(',').map((tag) => tag.trim()) : [],
      });
      res.redirect('/articles');
    } catch (err) {
      console.log(err);
      res.status(500).send('Error submitting article');
    }
});

router.post('/articles/:id/edit', async function (req, res) {
    const { title, summary, content, category, tags } = req.body;
    const thumbnail = req.file ? `/static/images/${req.file.filename}` : null;
    try {
      await writerService.updateArticle(req.params.id, {
        title,
        summary,
        content,
        category,
        tags,
        thumbnail,
      });
      res.redirect('/articles');
    } catch (err) {
      console.log(err);
      res.status(500).send('Error updating article');
    }
});

export default router;