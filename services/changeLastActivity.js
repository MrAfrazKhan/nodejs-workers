const {constants} = require('../helpers/constans');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');

var userEmails = [];

MongoClient.connect(constants.serverUrl,
    {useUnifiedTopology: true, useNewUrlParser: true},
        function(err, db) {

            if (err) throw err;
            const dbo = db.db(constants.database);
            const collection = dbo.collection(constants.collection);
            const pipeline = [
                {
                    $match : {size: 10}
                },
                {
                    $project: 
                    {
                        email:1,
                        meta:
                        {
                            lastActivity:1
                        }
                    }
                }
            ];

            collection.aggregate(pipeline,(err, data)=>{
                if(err) throw err
                console.log(data)
                db.close()
            });
  });
