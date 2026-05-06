const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('grievances.db');

db.all("SELECT sql FROM sqlite_master WHERE name='students'", (err, rows) => {
    fs.writeFileSync('schema2.json', JSON.stringify(rows, null, 2));
    console.log("Wrote schema2.json");
});
