const path = require('path');
const fs = require('fs');

const express = require('express');

const multer = require('multer');
const bodyParser = require('body-parser');

const session = require('express-session');
const MongoDBstore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

const getError = require('./controllers/404.js');

const mongoose = require('mongoose');
//Mongoose is automatically handle connecting without using database.js
// const mongoConnect = require('./util/database.js').mongoConnect;
const User = require('./models/user.js');

const MONGO_URL = process.env.MONGO_URL;

const app = express();
const store = new MongoDBstore({
    url: MONGODB_URL,
    collection: 'sessions'
})

const csrfProtection = csrf();

//sign pug as default engine:
app.set('view engine', 'pug');
//where should system find template engine?
app.set('views', 'views');

const adminRouter = require('./routes/admin.js');
const shopRouter = require('./routes/shop.js');
const authRouter = require('./routes/auth.js');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    const acceptedImageTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    acceptedImageTypes.includes(file.mimetype) ? cb(null, true) : cb(null, false);
};

const upload = multer({ storage: storage, fileFilter: fileFilter });
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

//logging in file
const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flag: 'a' }
)

// for secure
app.use(helmet());

//for compressing
app.use(compression());

//for logging 
app.use(morgan('combined', { stream: accessLogStream }));

//parser the data into object which can accessible
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.single("image"));
//use public file
//__dirname return path of current file
//concat paths to only one valid path
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(
    session({ secret: 'my secret', resave: false, saveUninitialized: false, store: store })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user._id)
            .then(user => {
                req.user = user;
                next();
            })
            .catch(err => {
                console.log(err);
            })
    }
    else {
        next();
    }
})

app.use((req, res, next) => {
    //thiet lap cac bien cuc bo d hien thi
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})

app.use('/admin', adminRouter);
app.use(shopRouter);
app.use(authRouter);
app.use('/', getError.get404page);

mongoose.connect(process.env.MONGO_URL)
    .then(result => {
        app.listen(process.env.PORT || 3000, () => {
            console.log('App is listening on port 3000');
        });
    })
    .catch(err => {
        console.log(err);
    })

