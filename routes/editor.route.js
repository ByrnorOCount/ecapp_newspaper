import express from 'express';
import editorService from '../services/editor.service.js';
import adminService from '../services/admin.service.js';
import { restrictToRole } from '../middlewares/auth.mdw.js';

const router = express.Router();
router.use(restrictToRole('editor'));

router.get('/drafts', async function (req, res) {
  try {
      const editorId = req.session.authUser.id;
      const assignedCategories = await editorService.getAssignedCategories(editorId);
      const draftArticles = await editorService.getDraftArticlesByCategories(assignedCategories);
      const processedArticles = await editorService.getProcessedArticlesByEditor(editorId);

      const categories = await adminService.getCategories();
      const tags = await adminService.getTags();

      const draftArticlesWithTags = await Promise.all(
        draftArticles.map(async (article) => {
            const tags = await editorService.getTagsForArticle(article.id);
            return {
                ...article,
                tags: tags.map(tag => tag.name).join(', '),
            };
        })
      );
      res.render('editor/reviewArticles', { 
        draftArticles: draftArticlesWithTags,
        processedArticles,
        categories,
        tags
       });
  } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching draft articles');
  }
});

router.post('/approve/:id', async function (req, res) {
  const { id } = req.params;
  const { categories, tags, publicationDate } = req.body;
  try {
      const parsedCategory = parseInt(categories, 10);
      const parsedDate = new Date(publicationDate);

      if (isNaN(parsedCategory) || isNaN(parsedDate.getTime())) {
          return res.status(400).send('Invalid category or publication date');
      }

      const tagsArray = Array.isArray(tags) ? tags : [];

      await editorService.approveArticle(id, {
          category: parsedCategory,
          tags: tagsArray,
          publicationDate: parsedDate,
          editorId: req.session.authUser.id
      });

      res.redirect('/editor/drafts');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error approving article');
  }
});

router.post('/reject/:id', async function (req, res) {
  const { id } = req.params;
  const { rejectionNotes } = req.body;

  try {
      if (!rejectionNotes.trim()) {
          return res.status(400).send('Rejection notes cannot be empty');
      }

      await editorService.rejectArticle(id, { rejectionNotes });

      res.redirect('/editor/drafts');
  } catch (err) {
      console.error(err);
      res.status(500).send('Error rejecting article');
  }
});

export default router;