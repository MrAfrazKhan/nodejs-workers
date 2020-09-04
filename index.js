var {activityService} = require('./services/changeLastActivity');
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const start = async () =>{

    console.log("\n--- PRESS 1: Update last activity for 10 random users.\n"+
        "--- PRESS 2: Start worker.\n\nEnter choice: ");
    for await (const line of rl) {
        if (line === '1'){
            await activityService.changeUsersActivity();
            break;
        }
        console.log('Worker started');
        break;
    }
};
start();

rl.on("close", function() {
    console.log("BYE BYE !!!");
    process.exit(0);
});