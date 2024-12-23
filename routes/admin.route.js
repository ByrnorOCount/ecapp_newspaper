import express from 'express';
import adminService from '../services/admin.service.js';
import articleService from '../services/article.service.js';
import { restrictToRole } from '../middlewares/auth.mdw.js';

const router = express.Router();
router.use(restrictToRole('admin'));

router.get('/', async function (req, res) {
    try {
      const editors = await adminService.getEditors();
      const categories = await articleService.getCategoriesWithId();
      const draftArticles = await articleService.getDraftArticles();
      const rejectedArticles = await articleService.getRejectedArticles();

      res.render('admin/dashboard', {
          editors,
          categories,
          draftArticles,
          rejectedArticles
      });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading dashboard');
    }
});

router.get('/categories', async function (req, res) {
  try {
      const categories = await adminService.getCategories();
      res.render('admin/categories', { 
        categories 
      });
  } catch (err) {
      console.error(err);
      res.status(500).send('Error loading categories');
  }
});

router.post('/categories', async function (req, res) {
  try {
      await adminService.addCategory(req.body);
      res.redirect('/admin/categories');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error adding category');
  }
});

router.put('/categories/:id', async function (req, res) {
  try {
      await adminService.updateCategory(req.params.id, req.body);
      res.redirect('/admin/categories');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error updating category');
  }
});

router.delete('/categories/:id', async function (req, res) {
  try {
      await adminService.deleteCategory(req.params.id);
      res.redirect('/admin/categories');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error deleting category');
  }
});

router.get('/tags', async function (req, res) {
  try {
      const tags = await adminService.getTags();
      res.render('admin/tags', { tags });
  } catch (err) {
      console.error(err);
      res.status(500).send('Error loading tags');
  }
});

router.post('/tags', async function (req, res) {
  try {
      await adminService.addTag(req.body);
      res.redirect('/admin/tags');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error adding tag');
  }
});

router.put('/tags/:id', async function (req, res) {
  try {
      await adminService.updateTag(req.params.id, req.body);
      res.redirect('/admin/tags');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error updating tag');
  }
});

router.delete('/tags/:id', async function (req, res) {
  try {
      await adminService.deleteTag(req.params.id);
      res.redirect('/admin/tags');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error deleting tag');
  }
});

router.get('/articles', async function (req, res) {
  try {
      const articles = await adminService.getArticles();
      res.render('admin/articles', { articles });
  } catch (err) {
      console.error(err);
      res.status(500).send('Error loading articles');
  }
});

router.put('/articles/:id/status', async function (req, res) {
  try {
      await adminService.updateArticleStatus(req.params.id, req.body.status);
      res.redirect('/admin/articles');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error updating article status');
  }
});

router.get('/users', async function (req, res) {
  try {
      const users = await adminService.getUsers();
      res.render('admin/users', { users });
  } catch (err) {
      console.error(err);
      res.status(500).send('Error loading users');
  }
});

router.put('/users/:id/renew', async function (req, res) {
  try {
      await adminService.renewSubscriber(req.params.id);
      res.redirect('/admin/users');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error renewing subscriber');
  }
});

router.post('/assign-categories', async function (req, res) {
    console.log(req.body);
    const { editors: editor_id, categories: category_id } = req.body;
  
    try {
      await adminService.assignCategories(editor_id, category_id);
      res.status(200).send('Categories assigned successfully');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error assigning categories');
    }
});

export default router;