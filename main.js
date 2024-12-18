import express from 'express';
import { engine } from 'express-handlebars';
import session from 'express-session';
import hbs_sections from 'express-handlebars-sections';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import guestRouter from './routes/guest.route.js';
import subscriberRouter from './routes/subscriber.route.js';
import writerRouter from './routes/writer.route.js';
import editorRouter from './routes/editor.route.js';
import adminRouter from './routes/admin.route.js';

import { authAdmin } from './middlewares/auth.mdw.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'newspaper_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'main',
  helpers: {
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },
    section: hbs_sections()
  }
}));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.use('/static', express.static('static'));

// middlewares
app.use(express.urlencoded({ //POST requests
    extended: true 
}));

app.use(async function (req, res, next) {
  //tba
  next();
});

app.use('/', guestRouter);
app.use('/subscriber', subscriberRouter);
app.use('/writer', writerRouter);
app.use('/editor', editorRouter);
app.use('/admin', authAdmin, adminRouter);

app.listen(3000, () => {
  console.log('Newspaper App is running at http://localhost:3000');
});