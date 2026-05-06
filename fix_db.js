const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('grievances.db');

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS students", (err) => {
        if(err) console.error(err);
        else console.log("Dropped old students table.");
    });
});
