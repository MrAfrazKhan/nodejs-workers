var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, {useUnifiedTopology: true, useNewUrlParser: true},function(err, db) {
    if (err) throw err;
    const dbo = db.db('assignment');
    const collection = dbo.collection('users');
    
    dbo.collection('users').countDocuments({}, function(err, data){
        if(err){
            console.log(err);
        }
        console.log(data);
        db.close();
    })
  });