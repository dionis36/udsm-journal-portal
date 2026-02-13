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

    for await (const line of rl) {
        if (line.includes('INSERT INTO `authors`')) {
            foundAuthors = true;
            continue;
        }
        if (foundAuthors && line.trim().startsWith('(')) {
            console.log('--- FIRST AUTHOR ROW ---');
            console.log(line.substring(0, 1000));
            break;
        }
    }
}

inspectSQL();
