const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
    MongoClient.connect('mongodb+srv://hoangvlinh09012004:09012004@cluster0.nswmi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
        .then(client => {
            console.log('Connected');
            //storing connection in database
            _db = client.db();
            callback();
        })
        .catch(err => {
            console.log(err);
            throw err;
        })
}

const getDb = () => {
    //return access to that database<tra lai quyen truy cap>
    if (_db) {
        return _db;
    }
    throw 'No database found!';
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
