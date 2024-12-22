import express from 'express';
import { engine } from 'express-handlebars';
import session from 'express-session';
import hbs_sections from 'express-handlebars-sections';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import passport from 'passport';
import flash from 'connect-flash';

import guestRouter from './routes/guest.route.js';
import subscriberRouter from './routes/subscriber.route.js';
import writerRouter from './routes/writer.route.js';
import editorRouter from './routes/editor.route.js';
import adminRouter from './routes/admin.route.js';
import authRoutes from './routes/auth.route.js';

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

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(express.urlencoded({ //POST requests
  extended: true 
}));

app.use('/static', express.static('static'));

app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'main',
  helpers: {
    formatDate(date, mode = 'default') {
      const d = new Date(date);
      if (mode === 'input') {
          return d.toISOString().split('T')[0]; // YYYY-MM-DD mode
      }
      return d.toLocaleDateString(); // default MM-DD-YYYY mode
    },
    section: hbs_sections(),
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    lte: (a, b) => a <= b, // less
    gte: (a, b) => a >= b, // greater
    eq: (a, b) => a === b,
    neq: (a, b) => a !== b,
    split(str, delimiter) {
      if (!str || !delimiter) return [];
      return str.split(delimiter);
    },
    selected(value, selectedValue) {
      return value === selectedValue ? 'selected' : '';
    },
    or() {
      return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    },
    and() {
      return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
    }
  }
}));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

// middlewares
app.use(function (req, res, next) {
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  next();
});

app.use(function (req, res, next) {
  if (!['/login', '/register', '/logout'].includes(req.path)) {
    req.session.previousPage = req.originalUrl;
  }
  next();
});

app.use(async function (req, res, next) {
  if (!req.session.auth) {
      req.session.auth = false;
  }
  res.locals.auth = req.session.auth;
  res.locals.authUser = req.session.authUser;
  next();
});

app.use('/', guestRouter);
app.use('/subscriber', subscriberRouter);
app.use('/writer', writerRouter);
app.use('/editor', editorRouter);
app.use('/admin', authAdmin, adminRouter);
app.use('/', authRoutes);

app.listen(3000, function () {
  console.log('Newspaper App is running at http://localhost:3000');
});