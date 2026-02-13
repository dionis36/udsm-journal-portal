const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

async function inspectSQL() {
    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let foundAuthors = false;
    let foundSettings = false;

    for await (const line of rl) {
        if (line.includes('INSERT INTO `authors`')) {
            console.log('--- AUTHORS INSERT ---');
            console.log(line.substring(0, 500));
            foundAuthors = true;
        }
        if (line.includes('INSERT INTO `author_settings`')) {
            console.log('--- AUTHOR SETTINGS INSERT ---');
            console.log(line.substring(0, 500));
            foundSettings = true;
        }
        if (foundAuthors && foundSettings) break;
    }
}

inspectSQL();
