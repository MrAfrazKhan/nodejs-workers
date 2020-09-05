/*
    This is startup file.

    NOTE: please make sure that you have set server url, db, collection name
          in db.js file of db folder.

    --  Run the file
    --  Press 1: Change activity of 10 random users.
    --  Press 2: Start 1 min interval loop which classifies users.
*/

const {services} = require('./workers/index');
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/*
    Start handler funcion of  program. Takes input from user.
*/
const start = async () =>{

    console.log("\n--- PRESS 1: Update last activity for 10 random users.\n"+
        "--- PRESS 2: Classify Users.\n\nEnter choice: ");
    for await (const line of rl) {
        if (line === '1'){
            await services.changeUserActivity();
            break
        }
        services.classifyUsers();
    }
};

// calling start function
start();

rl.on("close", function() {
    console.log("BYE BYE !!!");
    process.exit(0);
});