const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

async function getHeader(tableName) {
    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line.includes(`INSERT INTO \`${tableName}\``)) {
            console.log(`${tableName} HEADER:`, line.split(' VALUES')[0] + ' VALUES');
            rl.close();
            return;
        }
    }
}

async function run() {
    await getHeader('submission_files');
    await getHeader('publication_galleys');
}

run();
