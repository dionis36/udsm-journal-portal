const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

async function inspect() {
    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        if (line.includes('INSERT INTO `publications`')) {
            console.log('--- PUBLICATIONS INSERT HEADER ---');
            // Print the whole line (it might be long, so cut it reasonably but usually header is first)
            console.log(line.substring(0, 1000));
            return; // We only need the first one
        }
    }
}

inspect();
