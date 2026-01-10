// ================= LOAD ENV =================
require('dotenv').config();

// ================= CORE MODULES =================
const path = require('path');

// ================= EXTERNAL MODULES =================
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');

// ================= LOCAL MODULES =================
const router = require('./routes/router');
const rootDir = require('./utils/pathUtil');
const ErrorController = require('./controllers/error');

// ================= APP INIT =================
const app = express();

// ================= ENV VARIABLES =================
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

// ================= SAFETY CHECK =================
if (!MONGO_URI) {
  console.error('❌ MONGO_URI missing in .env file');
  process.exit(1);
}

// ================= VIEW ENGINE =================
app.set('view engine', 'ejs');
app.set('views', 'views');

// ================= SESSION STORE =================
const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: 'sessions',
});

// ================= MIDDLEWARES =================

// Body parser
app.use(express.urlencoded({ extended: false }));

// Static files
app.use(express.static(path.join(rootDir, 'public')));

// Session middleware
app.use(
  session({
    name: 'rojgar.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ================= GLOBAL LOCALS =================
app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session?.isLoggedIn || false;
  res.locals.user = req.session?.user || null;
  res.locals.role = req.session?.user?.role || null;
  next();
});

// ================= ROUTES =================
app.use(router);

// ================= 404 HANDLER =================
app.use(ErrorController.pageNotFound);

// ================= SERVER + DB =================
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
