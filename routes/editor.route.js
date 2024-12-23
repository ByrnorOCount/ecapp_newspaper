import express from 'express';
import articleService from '../services/article.service.js';
import editorService from '../services/editor.service.js';
import { restrictToRole } from '../middlewares/auth.mdw.js';

const router = express.Router();

router.get('/drafts', restrictToRole('editor'), async function (req, res) {
    try {
        const editorId = req.session.authUser.id;
        const assignedCategories = await editorService.getAssignedCategories(editorId);
        const draftArticles = await articleService.getDraftArticlesByCategories(assignedCategories);
        res.render('editor/reviewArticles', { draftArticles });
      } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching draft articles');
      }
});

router.post('/approve/:id', restrictToRole('editor'), async function (req, res) {
    const { id } = req.params;
    const { category, tags, publicationDate } = req.body;
  
    try {
      const parsedCategory = parseInt(category, 10);
      const parsedDate = new Date(publicationDate);
  
      if (isNaN(parsedCategory) || isNaN(parsedDate.getTime())) {
        return res.status(400).send('Invalid category or publication date');
      }
  
      await articleService.approveArticle(id, {
        category: parsedCategory,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        publicationDate: parsedDate,
      });
  
      res.redirect('/drafts');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error approving article');
    }
});

router.post('/reject/:id', restrictToRole('editor'), async function (req, res) {
    const { id } = req.params;
    const { rejectionNotes } = req.body;
  
    try {
      await articleService.rejectArticle(id, { rejectionNotes });
  
      res.redirect('/drafts');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error rejecting article');
    }
});  

export default router;