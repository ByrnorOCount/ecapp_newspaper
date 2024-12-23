import express from 'express';
import adminService from '../services/admin.service.js';

const router = express.Router();

router.get('/', function (req, res) {
    res.render('admin/dashboard');
});

router.post('/assign-categories', async function (req, res) {
    const { editorId, categoryIds } = req.body;
  
    try {
      await adminService.assignCategories(editorId, categoryIds);
      res.status(200).send('Categories assigned successfully');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error assigning categories');
    }
  });

export default router;