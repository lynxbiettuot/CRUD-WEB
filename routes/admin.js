const express = require('express');

const path = require('path');

const productController = require('../controllers/admin.js');

const exp = require('constants');

const router = express.Router();

const middlewareAuth = require('../middleware/auth.js');

const { body } = require('express-validator');

// /admin/add-product => GET
router.get('/add-product', middlewareAuth, productController.getForm);

// /admin/add-product => POST
router.post('/add-product',
    [
        body('title').isString().isLength({ min: 3 }).trim().notEmpty(),
        body('price').isFloat().notEmpty(),
        body('description').isLength({ min: 5, max: 400 }).trim().notEmpty()
    ], middlewareAuth, productController.sendForm);

// /admin/products => GET
router.get('/products', middlewareAuth, productController.getProduct);


router.get('/edit-product/:productId', middlewareAuth, productController.getEditProduct);

router.post('/edit-product',
    [
        body('title').isString().isLength({ min: 3 }).trim(),
        body('price').isFloat(),
        body('description').isLength({ min: 5, max: 400 }).trim()
    ], middlewareAuth, productController.postEditProduct);

//Change post method to delete
router.delete('/product/:productId', middlewareAuth, productController.deleteProduct);

// module.exports = router;
module.exports = router;
