const express = require('express');

const router = express.Router();

const User = require('../models/user.js');

const authController = require('../controllers/auth.js');

const { check, body } = require('express-validator');

router.get('/login', authController.getLogin);

router.post('/login',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter an email again!')
            .normalizeEmail(),
        body('password', 'Password is invalid')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post(
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter an email again!')
            .custom((value, { req }) => {
                return User.findOne({ email: value })
                    .then(userData => {
                        if (userData) {
                            return Promise.reject('Email has already exist, try again!')
                        }
                    })
            }).normalizeEmail(),
        body('password', 'Please enter a password with only numbers and text and at least 5 characters!')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword').trim().custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password have to match!');
            }
            return true;
        })
    ],
    authController.postSignup
);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
