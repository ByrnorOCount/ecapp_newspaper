import express from 'express';
import bcrypt from 'bcrypt';
import adminService from '../services/admin.service.js';
import articleService from '../services/article.service.js';
import editorService from '../services/editor.service.js';
import userService from '../services/user.service.js';
import { restrictToRole } from '../middlewares/auth.mdw.js';

const router = express.Router();
router.use(restrictToRole('admin'));

router.get('/', async function (req, res) {
    try {
      res.render('admin/dashboard');
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
router.post('/categories/add', async function (req, res) {
  const { name, parent_id } = req.body;
  console.log(req.body);
  try {
      await adminService.addCategory(name, parent_id === '' ? null : parent_id);
      res.redirect('/admin/categories');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error adding category');
  }
});
router.post('/categories/update/:id', async function (req, res) {
  const { name, parent_id } = req.body;
  try {
      await adminService.updateCategory(req.params.id, name, parent_id === '' ? null : parent_id);
      res.redirect('/admin/categories');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error updating category');
  }
});
router.post('/categories/delete/:id', async function (req, res) {
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
router.post('/tags/add', async function (req, res) {
  const { name } = req.body;
  try {
      await adminService.addTag(name);
      res.redirect('/admin/tags');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error adding tag');
  }
});
router.post('/tags/update/:id', async function (req, res) {
  const { name } = req.body;
  try {
      await adminService.updateTag(req.params.id, name);
      res.redirect('/admin/tags');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error updating tag');
  }
});
router.post('/tags/delete/:id', async function (req, res) {
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
router.post('/articles/:id/status', async function (req, res) {
  const { status } = req.body;
  try {
      await adminService.updateArticleStatus(req.params.id, status);
      res.redirect('/admin/articles');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error updating article status');
  }
});
router.post('/articles/add', async function (req, res) {
    const { title, summary, content, category_id, writer_id, thumbnail, status, is_premium } = req.body;
    try {
        await adminService.addArticle(title, summary, content, category_id, writer_id, thumbnail, status, is_premium);
        res.redirect('/admin/articles');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding article');
    }
});
router.post('/articles/update/:id', async function (req, res) {
  const { title, summary, content, category_id, writer_id, is_premium, rejection_notes, tags } = req.body;
  try {
      const articleData = {
          title,
          summary,
          content,
          category_id,
          writer_id,
          is_premium: is_premium === 'on',
          rejection_notes,
      };
      const tagIds = Array.isArray(tags) ? tags.map(Number) : [Number(tags)];
      await adminService.updateArticleWithTags(req.params.id, articleData, tagIds);
      res.redirect('/admin/articles');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error updating article');
  }
});
router.post('/articles/delete/:id', async function (req, res) {
  try {
      await adminService.deleteArticle(req.params.id);
      res.redirect('/admin/articles');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error deleting article');
  }
});



router.get('/users', async function (req, res) {
  try {
      const users = await adminService.getUsers();
      const editors = await adminService.getEditors();
      res.render('admin/users', { 
        users,
        editors,
      });
  } catch (err) {
      console.error(err);
      res.status(500).send('Error loading users');
  }
});
router.post('/users/add', async function (req, res) {
  const { full_name, pen_name, email, password, role, date_of_birth } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await userService.registerUser({
        fullName: full_name,
        penName: pen_name,
        email,
        hashedPassword,
        role,
        date_of_birth,
    }); 
    res.redirect('/admin/users');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error creating user');
  }
});
router.post('/users/update/:id', async function (req, res) {
  try {
      await adminService.updateUser(req.params.id, req.body);
      res.redirect('/admin/users');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error updating user');
  }
});
router.post('/users/delete/:id', async function (req, res) {
  try {
      await adminService.deleteUser(req.params.id);
      res.redirect('/admin/users');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error deleting user');
  }
});

router.put('/users/renew/:id', async function (req, res) {
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