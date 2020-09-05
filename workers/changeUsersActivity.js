/*
    This service updates lastActivity for randomly picked
    users from database to max 5 mins ago from current time.
*/

const {constants} = require('../db/db');
const MongoClient = require('mongodb').MongoClient;

/*
    This function fecthes 10 random users from database.
    
    @return {object} return users array
*/
function fetchRandomUsers(){

    return new Promise((resolve, reject)=>{

        // connecting to database
        MongoClient.connect(constants.serverUrl,
            {useUnifiedTopology: true, useNewUrlParser: true},
                function(err, db) {
        
                    if (err){
                        console.error('Error while fetching random users.');
                        reject(err);
                    }
                    const dbo = db.db(constants.database);
                    const collection = dbo.collection(constants.collection);
                    
                    // pipeline for fetching aggregated user result
                    const pipeline = [
                        {
                            $sample : {size: 10}
                        },
                        {
                            $project: 
                            {
                                email:1
                            }
                        }
                    ];
        
                    // calling aggregate mongodb function and converting result
                    // to an array. 
                    collection.aggregate(pipeline).toArray((err, data)=>{
                        if (err){
                            console.error('Error while fetching random users.');
                            reject(err);
                        }
                        db.close();
                        resolve(data);
                    });
                });
    });
};

/*
    This function updates lastActivity field of all 10 fetched users.
    
    @param {object} Array of random 10 users fetched. 
*/
function updateUsersActivity(users){

    return new Promise((resolve, reject)=>{

        // connecting to database
        MongoClient.connect(constants.serverUrl,
            {useUnifiedTopology: true, useNewUrlParser: true},
                function(err, db) {
        
                    if (err){
                        console.error('Error while updating users activity.');
                        reject(err);
                    }
                    const dbo = db.db(constants.database);
                    const collection = dbo.collection(constants.collection);
                    
                    // A counter to detect end of loop through users array
                    var updatedUsers = 0;

                    try {
                        users.forEach(user => {
                        
                            // Number of minutes randomly generated upto 5 to subtract from current time. 
                            const mins = Math.floor(Math.random() * 5) + 1;
                            const currentTime = new Date().getTime();

                            // Current time updated to generated random minutes 
                            const updatedTime = new Date(currentTime-(mins*60000));
                            
                            // User last Activity update expression 
                            const updateExp = {$set:{"meta.lastActivity" : updatedTime}};
    
                            // Updating single user activity on each iteration
                            collection.updateOne({email: user['email']}, updateExp, (err, data)=>{

                                if(err){
                                    console.error('Error while updating users last activity.');
                                    reject(err);            
                                }

                                updatedUsers++;
                                console.log(`${updatedUsers}: "${user['email']}" last activity updated to ${mins}min ago.`);
                                
                                // closing connection and resolving promise if all users last activity updated.
                                if (updatedUsers === users.length){
                                    db.close();
                                    resolve('Users activity updated successfully.');
                                }
                            })
                        });   
                    } catch (error) {
                        console.error('Error while updating users last activity.');
                        reject(error);
                    };
                });
    });
};

/*
    Main service function acting as controller.
    
    @param {object} Array of random 10 users fetched. 
*/
async function main(){

    try {
        var users = await fetchRandomUsers();
        console.info('\n---------- 10 randome users fetched successfully.\n');
        var updatedData = await updateUsersActivity(users);
        console.info(`\n---------- ${updatedData}\n`);

    } catch (error) {
        throw error;
    }
};

module.exports = main;