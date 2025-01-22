const Product = require('../models/product.js');
const mongodb = require('mongodb');
const fileHelper = require('../util/file.js');

const { validationResult } = require('express-validator');
const { ValidationError } = require('sequelize');

const mongoose = require('mongoose');

const ObjectId = mongodb.ObjectId;

//get a form in admin.js
exports.getForm = (req, res, next) => {
    res.render('admin/edit-product.pug', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        isAuthenticated: req.session.isLoggedIn,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
}

// submit a form in admin.js to create a product
exports.sendForm = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;

    if (!image) {
        return res.status(422).render('admin/edit-product.pug', {
            pageTitle: 'Add Product',
            path: '/admin/edit-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: 'Attach file is not an image',
            validationErrors: []
        });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product.pug', {
            pageTitle: 'Add Product',
            path: '/admin/edit-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    const imageUrl = image.path;

    //Replace the code was commented below by using this:
    const product = new Product({
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description,
        userId: req.user._id
    });
    product
        .save()
        .then(result => {
            console.log('Created Product');
            res.redirect('/')
        })
        .catch(err => {
            // console.log(err);
            //thay vi validate, chung ta se gui khach hang toi mot trang khac vi khong phai luc nao ho cung muon tro lai trang loi
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

//get an edit form in admin.js
exports.getEditProduct = (req, res, next) => {
    //Assum the path like /admin/add-product/id?edit=true
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product.pug', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                isAuthenticated: req.session.isLoggedIn,
                hasError: false,
                errorMessage: null,
                validationErrors: []
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found!'));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: prodId, userId: req.user._id })
        })
        .then(() => {
            console.log('DESTROYED!')
            res.status(200).json({ message: 'Success!' });
        })
        .catch(err => {
            res.status(500).json({ message: 'Deleting product failed!' });
        })
}

//edit product form after post
exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updateTitle = req.body.title;
    const updatePrice = req.body.price;
    const updateImage = req.file;
    const updateDesc = req.body.description;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product.pug', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                _id: prodId,
                title: updateTitle,
                price: updatePrice,
                description: updateDesc,
                validationErrors: []
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    //This method will return only single entry in the data table
    Product.findById(prodId)
        .then(product => {
            if (product) {
                if (product.userId.toString() !== req.user._id.toString()) {
                    return res.redirect('/');
                }
                product.title = updateTitle;
                product.price = updatePrice;
                if (updateImage) {
                    fileHelper.deleteFile(product.imageUrl);
                    product.imageUrl = updateImage.path;
                }
                product.description = updateDesc;
                return product.save().then(result => {
                    console.log('UPDATED!');
                    res.redirect('/admin/products');
                });
            }
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}

exports.getProduct = (req, res, next) => {
    Product.find({ userId: req.user._id })
        .then((products) => {
            res.render('admin/products.pug', {
                //Mảng product có thể rỗng
                prods: products,
                docTitle: 'Admin Products',
                path: '/admin/products',
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}
