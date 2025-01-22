const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');
const deleteFile = require('../util/file.js');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const Product = require('../models/product.js');
// const Cart = require('../models/cart.js');
const Order = require('../models/order.js');
const User = require('../models/user.js');

ITEMS_PER_PAGE = 1;

//get product in shop.js
exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/product-list.pug', {
                //Mảng product có thể rỗng  
                prods: products,
                docTitle: 'Product list',
                path: '/products',
                totalProducts: totalItems,
                curPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            console.log(err);
        })
}

//get product in detail
exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    //parameter 'product' return an array at index 0
    Product.findById(prodId)
        .then(products => {
            res.render('shop/product-detail', {
                product: products,
                pageTitle: products.title,
                path: '/products'
            });
        })
        .catch(err => console.log(err));
}

//get index in shop.js
exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/index.pug', {
                //Mảng product có thể rỗng  
                prods: products,
                docTitle: 'Shop',
                path: '/',
                totalProducts: totalItems,
                curPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            console.log(err);
        })
}

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items;
            // console.log(products);
            res.render('shop/cart.pug', {
                path: '/cart',
                pageTitle: 'Your cart',
                products: products,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            console.log(err);
        })
};

//add a product to a cart
exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            // console.log(product);
            return req.user.addToCart(product);
        })
        .then(result => {
            // console.log(result);
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
        })

};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.removeFromCart(prodId)
        .then(result => {
            console.log('Deleted from User model!');
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
        })
}

exports.getCheckout = (req, res, next) => {
    let products;
    let total = 0;
    req.user
        .populate('cart.items.productId')
        .then(user => {
            products = user.cart.items;
            total = 0;
            products.forEach(p => {
                total += p.quantity * p.productId.price;
            })

            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: products.map((p) => {
                    /** CHANGED STRUCTURE FOR STRIPE */
                    return {
                        price_data: {
                            product_data: {
                                name: p.productId.title,
                                description: p.productId.description,
                            },
                            unit_amount: p.productId.price * 100,
                            currency: 'usd',
                        },
                        quantity: p.quantity,
                    };
                }),
                /** INCLUDE 'mode' KEY */
                mode: 'payment',
                success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // http://localhost:3000/checkout/success
                cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
            });
        })
        .then((session) => {
            res.render('shop/checkout.pug', {
                path: '/checkout',
                pageTitle: 'Checkout',
                products: products,
                isAuthenticated: req.session.isLoggedIn,
                totalSum: total,
                sessionId: session.id
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })

}

exports.getCheckoutSuccess = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        /** NO execPopulate method -- removed */
        .then((user) => {
            console.log(user.cart.items);
            const products = user.cart.items.map((i) => {
                return {
                    quantity: i.quantity,
                    product: { ...i.productId._doc },
                };
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user,
                },
                products: products,
            });
            return order.save();
        })
        .then((result) => {
            return req.user.clearCart();
        })
        .then((result) => {
            res.redirect('/orders');
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getOrders = (req, res, next) => {
    Order.find({ "user.userId": req.user._id })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => console.log(err));
}

exports.postOrder = (req, res, next) => {
    req.user.populate('cart.items.productId').then(user => {
        const products = user.cart.items.map(i => {
            //sao chep đối tượng
            return { quantity: i.quantity, product: { ...i.productId._doc } }
        });
        const order = new Order({
            user: {
                email: req.user.email,
                userId: req.user._id
            },
            products: products
        });
        return order.save();
    })
        .then(result => {
            return req.user.clearCart();
        })
        .then(result => {
            res.redirect('/orders');
        })
        .catch(err => {
            console.log(err);
        });
}

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId).then(order => {
        if (!order) {
            next(new Error('No order found!'));
            return res.redirect('/500');
        }
        if (order.user.userId.toString() !== req.user._id.toString()) {
            next(new Error('Unauthorized'));
            return res.redirect('/500');
        }
        const fileName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', fileName);

        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; fileName="' + invoicePath + '"');
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
        pdfDoc.fontSize(26).text('Invoice', {
            underline: true
        });
        pdfDoc.text('----------------------------');

        let totalPrice = 0;
        order.products.forEach(prod => {
            totalPrice += prod.quantity * parseInt(prod.product.price);
            pdfDoc.fontSize(14).text(
                prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price
            )
        })
        pdfDoc.fontSize(14).text('Total : $' + totalPrice);
        pdfDoc.end();
        // fs.readFile(invoicePath, (err, data) => {
        //     if (err) {
        //         return next(err);
        //     }
        //     res.setHeader("Content-Type", "application/pdf");
        //     res.send(data);
        //     res.end();
        // });
        const file = fs.createReadStream(invoicePath);
        file.pipe(res);
    })
        .catch(err => {
            next(err);
        })
}


