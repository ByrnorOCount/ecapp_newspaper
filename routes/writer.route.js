import express from 'express';
import multer from 'multer';
import articleService from '../services/article.service.js';
import writerService from '../services/writer.service.js';
import { restrictToRole } from '../middlewares/auth.mdw.js';

const router = express.Router();
router.use(restrictToRole('writer'));

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

router.get('/articles', async function (req, res) {
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

router.post('/articles', upload.single('thumbnail'), async function (req, res) {
    const { title, summary, content, category, tags } = req.body;
    const parsedCategory = parseInt(category, 10);
    const thumbnail = req.file ? `${req.file.filename}` : null;
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

router.get('/articles/:id/edit', async function (req, res) {
  try {
      const articleId = req.params.id;
      const article = await articleService.getArticleById(articleId);
      const categories = await articleService.getCategoriesWithId();
      console.log(article);

      res.render('writer/editArticle', {
          article,
          categories,
      });
  } catch (error) {
      console.error('Error fetching article for editing:', error);
      res.status(500).send('An error occurred while fetching the article.');
  }
});

router.post('/articles/:id/edit', upload.single('thumbnail'), async function (req, res) {
  const articleId = req.params.id;
  const { title, summary, content, category, tags } = req.body;
  const parsedCategory = parseInt(category, 10);
  const thumbnail = req.file ? `${req.file.filename}` : null;

  try {
      await writerService.updateArticle(articleId, {
          title,
          summary,
          content,
          category_id: parsedCategory,
          thumbnail,
          tags: tags ? tags.split(',').map((tag) => tag.trim()) : [],
      });
      res.redirect('/writer/articles');
  } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).send('An error occurred while updating the article.');
  }
});

export default router;