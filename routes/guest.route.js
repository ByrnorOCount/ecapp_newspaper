import express from 'express';

const router = express.Router();

router.get('/', function (req, res){
  res.render('guest/home');
});

export default router;