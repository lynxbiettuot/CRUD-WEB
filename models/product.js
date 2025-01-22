const mongoose = require('mongoose');
// const { STRING } = require('sequelize');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Product', productSchema);

// const { get } = require('mongoose');
// const mongodb = require('mongodb');
// const getDb = require('../util/database.js').getDb;

// class Product {
//     constructor(title, price, description, imageUrl, id, userId) {
//         this.title = title;
//         this.price = price;
//         this.description = description;
//         this.imageUrl = imageUrl;
//         this._id = id ? new mongodb.ObjectId(id) : null;
//         this.userId = userId;
//     }

//     save() {
//         const db = getDb();
//         let dbOp;
//         if (this._id) {
//             dbOp = db.collection('products').updateOne({ _id: this._id }, { $set: this });
//         } else {
//             dbOp = db.collection('products').insertOne(this);
//         }
//         return dbOp.then(result => {
//             // console.log(result);
//             return this;
//         }).catch(err => {
//             console.log(err);
//         });
//     }

//     static fetchAll() {
//         const db = getDb();
//         return db.collection('products').find().toArray().then(products => {
//             // console.log(products);
//             return products;
//         }).catch(err => {
//             console.log(err);
//         });
//     }

//     //find byId of a single product
//     static findById(prodId) {
//         const db = getDb();
//         return db.collection('products')
//             .find({ _id: new mongodb.ObjectId(prodId) })
//             .next()
//             .then(product => {
//                 // console.log(product);
//                 return product;
//             })
//             .catch(err => {
//                 console.log(err);
//             })
//     }

//     //delete data by Id
//     static deleteById(prodId) {
//         const db = getDb();
//         return db.collection('products')
//             .deleteOne({ _id: new mongodb.ObjectId(prodId) })
//             .then((result) => {
//                 //if this product is added to cart of User, we should delete it when deleting in Products model
//                 return db
//                     .collection('users')
//                     //an empty in filter to update the all documents returned in the collection
//                     .updateMany({},
//                         {
//                             //pull remove from an existing array with values that match specified conditions
//                             $pull:
//                             {
//                                 'cart.items':
//                                 {
//                                     productId: new mongodb.ObjectId(prodId)
//                                 },
//                             },
//                         }
//                     )
//             })
//             .then(result => {
//                 console.log('Deleted from Products model!');
//             })
//             .catch(err => {
//                 console.log(err);
//             })
//     }
// }
