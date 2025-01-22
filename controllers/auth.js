const User = require('../models/user.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

//Sending mail
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // upgrade later with STARTTLS
    //config your host server with email and application password
    auth: {
        user: "hoangvlinh09012004@gmail.com",
        pass: "qlti yxso kzba pxhg",
    },
});

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    res.render('auth/login.pug', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
        },
        validationErrors: []
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array())
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                // req.flash('error', 'Invalid email');
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: "Invalid email or password",
                    oldInput: {
                        email: email,
                        password: password,
                    },
                    validationErrors: []
                });
            }
            //this will return boolean
            // req.flash('error', 'Invalid email or password');
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        //dam bao du lieu dong bo
                        return req.session.save(err => {
                            res.redirect('/');
                        })
                    }
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: "Invalid email or password",
                        oldInput: {
                            email: email,
                            password: password,
                        },
                        validationErrors: []
                    });
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/login');
    })
}

exports.getSignup = (req, res, next) => {
    res.render('auth/signup.pug', {
        path: '/signup',
        pageTitle: 'Sign up',
        isAuthenticated: false,
        errorMessage: req.flash('error'),
        oldInput: {
            email: "",
            password: "",
            confirmPassword: ""
        },
        validationErrors: []
    })
}

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {

        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword
            },
            validationErrors: errors.array()
        });
    }

    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const newUser = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            });
            return newUser.save();
        })
        .then(result => {
            res.redirect('/login');
            return transporter.sendMail({
                //send from your server to the mail which has registration
                from: "hoangvlinh09012004@gmail.com",
                to: "hoangvlinh2kk4@gmail.com", // list of receivers
                subject: "Hello ✔", // Subject line
                text: "Hello world?", // plain text body
                html: "<b>Hello world?</b>", // html body
            })
                .then(result => {
                    // console.log("Message sent %s", info.messageId)
                    // console.log(result);
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}

exports.getReset = (req, res, next) => {
    res.render('auth/reset.pug', {
        path: '/reset',
        pageTitle: 'Reset password',
        errorMessage: req.flash('error')
    })
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found!');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect('/');
                return transporter.sendMail({
                    //send from your server to the mail which has registration
                    from: "hoangvlinh09012004@gmail.com",
                    to: req.body.email, // list of receivers
                    subject: "Password reset", // Subject line
                    text: "Hello world?", // plain text body
                    html: `
                        <p>You requested a password reset</p>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password
                    `
                })
                    .then(ans => {
                        // console.log("Message sent %s", info.messageId)
                        console.log(ans);
                    })
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    })
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: new Date() } })
        .then(user => {
            res.render('auth/new-password.pug', {
                path: '/new-password',
                pageTitle: 'New password',
                errorMessage: [],
                passwordToken: token,
                userId: user._id.toString()
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: new Date() },
        _id: userId
    })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}