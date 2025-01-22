const mongodb = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userShema = new Schema({
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                quantity: { type: Number, required: true }
            }
        ]
    }
});

//because this one is a method of userSchema, so this keyword will refer to userSchema
userShema.methods.addToCart = function (product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });
    //if find
    let newQuantity = 1;
    const updateCartItems = [...this.cart.items];
    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updateCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updateCartItems.push({ productId: product._id, quantity: newQuantity });
    }

    const updatedCart = {
        items: updateCartItems
    };
    this.cart = updatedCart;
    return this.save();
}


userShema.methods.removeFromCart = function (prodId) {
    const updateCartItems = this.cart.items.filter(i => {
        return i.productId.toString() !== prodId.toString();
    });
    this.cart.items = updateCartItems;
    return this.save();
}

userShema.methods.clearCart = function () {
    this.cart = { items: [] };
    return this.save();
}

module.exports = mongoose.model('Users', userShema);

// const getDb = require('../util/database.js').getDb;
// class User {
//     constructor(username, email, cart, id) {
//         this.name = username;
//         this.email = email;
//         this.cart = cart;// {items: []}
//         this._id = id;
//     }

//     save() {
//         const db = getDb();
//         return db.collection('users').insertOne(this);
//     }

// addToCart(product) {
//     const cartProductIndex = this.cart.items.findIndex(cp => {
//         return cp.productId.toString() === product._id.toString();
//     });
//     //if find
//     let newQuantity = 1;
//     const updateCartItems = [...this.cart.items];
//     if (cartProductIndex >= 0) {
//         newQuantity = this.cart.items[cartProductIndex].quantity + 1
//         updateCartItems[cartProductIndex].quantity = newQuantity;
//     } else {
//         updateCartItems.push({ productId: new mongodb.ObjectId(product._id), quantity: newQuantity });
//     }

//     const updatedCart = {
//         items: updateCartItems
//     };
//     const db = getDb();
//     return db.collection('users').updateOne(
//         { _id: new mongodb.ObjectId(this._id) },
//         { $set: { cart: updatedCart } }
//     );
// }

// getCart() {
//     const db = getDb();
//     const productIds = this.cart.items.map(i => {
//         return i.productId;
//     });
//     return db
//         .collection('products')
//         .find({ _id: { $in: productIds } })
//         .toArray()
//         .then(products => {
//             return products.map(p => {
//                 return {
//                     ...p,
//                     quantity: this.cart.items.find(i => {
//                         return i.productId.toString() === p._id.toString();
//                     }).quantity
//                 };
//             });
//         })
//         .catch(err => {
//             console.log(err);
//         })
// }

//     deleteItemFromCart(prodId) {
//         const updateCartItems = this.cart.items.filter(i => {
//             return i.productId.toString() !== prodId.toString();
//         });
//         const db = getDb();
//         return db.collection('users').updateOne(
//             { _id: new mongodb.ObjectId(this._id) },
//             { $set: { cart: { items: updateCartItems } } }
//         );
//     }

//     addOrder() {
//         const db = getDb();
//         return this.getCart().then(products => {
//             const order = {
//                 items: products,
//                 user: {
//                     _id: new mongodb.ObjectId(this._id),
//                     name: this.name
//                 }
//             }
//             return db.collection('orders').insertOne(order)
//         })
//             .then(result => {
//                 return db
//                     .collection('users')
//                     .updateOne(
//                         { _id: new mongodb.ObjectId(this._id) },
//                         { $set: { cart: { items: [] } } }
//                     );
//             });
//     }

//     getOrders() {
//         const db = getDb();
//         return db.collection('orders').find({ 'user._id': new mongodb.ObjectId(this._id) }).toArray();
//     }

//     static findById(userId) {
//         const db = getDb();
//         return db
//             .collection('users')
//             .findOne({ _id: new mongodb.ObjectId(userId) })
//             .then(user => {
//                 // console.log(user);
//                 return user;
//             }).catch(err => {
//                 console.log(err);
//             })
//     }
// }
