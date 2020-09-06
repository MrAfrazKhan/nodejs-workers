/*
    This service classifies inactive users on basis of 3 categories.
        1). 1-2 mins ago
        2). 2-3 mins ago (Doesn't include 2 here, only look for 3)
        3). 4-5 mins ago
*/

const {constants} = require('../db/db');
const MongoClient = require('mongodb').MongoClient;

/*
    Creates db connection object.
    
    @return {object} 
*/
async function dbConnection(){
    try {
        const dbConnection = await MongoClient.connect(constants.serverUrl,
                                {useUnifiedTopology: true, useNewUrlParser: true});
        return dbConnection;
    } catch (error) {
        console.log('Error while connecting to database.');
        throw error;
    }
};

/*
    Creates a new index on "meta.lastActivity" field as program has
    search queries highly based on this field.
    Also checks for index primarily if index exists.
*/
async function createLastActivityIndex(){

    var db;
    try {
        db = await dbConnection();
        const dbo = db.db(constants.database);
        const collection = dbo.collection(constants.collection);
        let indexes = await collection.listIndexes().toArray();
        let indexExists = false;

        indexes.forEach(index=>{
            if (index['key']['meta.lastActivity']){
                db.close();
                console.log('\n---------- Index on meta.lastActivity exists already.\n');
                indexExists = true;
            }
        });

        if(!indexExists){
            await collection.createIndex({'meta.lastActivity':1});
            db.close();
            console.log('\n---------- Index created on "meta.lastActivity" field of collection "users".\n');
        }
    
    } catch (error) {
        db.close();
        console.error('Error while creating index.');
        throw error;
    }
};

/*
    This method fecthes users which were inactive for given minutes.

    -- Query: 
          To categorize users based on inactivity for given 3 classes in readme file, 
          I am taking modulus of minutes of user's "meta.lastActivity" field with 5,
          which allows me to put expected cycle on categorization scheme if user's inactivity 
          exceeds 5 mins.
    
    @param {var} An integer representing minutes.
    @return {object} An array having all users with given minutes inactivity.
                     Each doc only has email field projected.
*/
async function fetchInactiveUsers(mins){

    var db;
    try {
        db = await dbConnection();
        const dbo = db.db(constants.database);
        const collection = dbo.collection(constants.collection);
        
        /*
            -- This pipeline fetches all users for which "meta.lastActivity" field
               is not null and they are inactive for given minutes including cycle constraint.
            -- Basically, It takes mod of users last activity minutes with 5 because our upper
               inactive bound is 5 mins and returns record if remainder is same as given minutes.
            -- Only user email is projected for query optimization, you can change it.

            NOTE: For now i am not taking in consideration seconds to check inactivity.
        */
        const pipeline = [
            {
                $match: {
                    $and: [
                        {
                            'meta.lastActivity':{
                                $exists: true
                            }
                        },
                        {
                            $expr:{
                                $eq: [
                                    {
                                        $mod:[
                                            {
                                                $add:[
                                                    {
                                                        $minute: '$meta.lastActivity'
                                                    },
                                                    1
                                                ]
                                            },
                                            5
                                        ]
                                    },
                                    mins
                                ]
                            }
                        }
                    ]
                }
            },
            {
                $project:{
                    email:1
                }
            }
        ];
        const data = await collection.aggregate(pipeline).toArray();
        db.close();
        return data;
    
    } catch (error) {
        db.close();
        console.error('Error while fetching inactive users for 1-2 mins.');
        throw error;
    }
};

/*
    This method classifies users for given inactivity categories and 
    saves data in an object/dictionary for each category.
*/
async function classifyUsers(){

    // This object contains data for each category
    // IMPORTANT: 2-3 range only inludes 3 because 2 is coverd in 1-2 range.
    var inactiveUsers = {
        '1To2_Mins' : [],
        '2To3_Mins' : [],
        '4To5_Mins' : []
    };

    try {

        // checks for meta.lastActivity index
        await createLastActivityIndex();
        
        // Fetch users inactive for 1-2 mins including 2 
        const _1MinsUsers = await fetchInactiveUsers(1);
        const _2MinsUsers = await fetchInactiveUsers(2);
        inactiveUsers['1To2_Mins'] = _1MinsUsers.concat(_2MinsUsers);

        // Fetch users inactive for 2-3 mins excluding 2
        const _3MinsUsers = await fetchInactiveUsers(3);
        inactiveUsers['2To3_Mins'] = _3MinsUsers;

        // Fetch users inactive for 4-5 mins
        const _4MinsUsers = await fetchInactiveUsers(4);
        const _5MinsUsers = await fetchInactiveUsers(0);
        inactiveUsers['4To5_Mins'] = _4MinsUsers.concat(_5MinsUsers);

        // just showing number of users returned for each category
        console.log(inactiveUsers['1To2_Mins'].length + ' - users were inactive 1-2mins ago.');
        console.log(inactiveUsers['2To3_Mins'].length + ' - users were inactive 2-3mins ago.');
        console.log(inactiveUsers['4To5_Mins'].length + ' - users were inactive 4-5mins ago.');


    } catch (error) {
        throw error;
    }
};

/*
    Main service function which classifies users in one minute interval loop.
*/
function main(){

    try {
        console.log('\n---------- Classify user service started...')
        setInterval(()=>{
            classifyUsers()
        },60000)
    } catch (error) {
        throw error;
    }
};

module.exports = main;
