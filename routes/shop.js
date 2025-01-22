const express = require('express');

const path = require('path');

const rootDir = require('../util/path.js');

const router = express.Router();

const adminData = require('./admin.js');

const shopController = require('../controllers/shop.js');

const middlewareAuth = require('../middleware/auth.js');

//Home page
router.get('/', shopController.getIndex);

//list of porducts
router.get('/products', shopController.getProducts);

//detail
router.get('/products/:productId', shopController.getProduct);

// // router.get('/products/delete');

//cart
router.get('/cart', middlewareAuth, shopController.getCart);

//add to cart
router.post('/cart', middlewareAuth, shopController.postCart);

//delete in cart
router.post('/cart-delete-item', middlewareAuth, shopController.postCartDeleteProduct);

router.get('/checkout', middlewareAuth, shopController.getCheckout);

router.get('/checkout/success', shopController.getCheckoutSuccess);

router.get('/checkout/cancel', shopController.getCheckout);

// // //checkout
// // router.get('/checkout', shopController.getCheckout);

router.post('/create-order', middlewareAuth, shopController.postOrder);

router.get('/orders', middlewareAuth, shopController.getOrders);

router.get('/orders/:orderId', middlewareAuth, shopController.getInvoice);

module.exports = router;