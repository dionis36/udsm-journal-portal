const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

async function findLine() {
    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let lineNum = 0;
    for await (const line of rl) {
        lineNum++;
        if (line.includes('INSERT INTO `journals`')) {
            console.log(`Found JOURNALS insert at line: ${lineNum}`);
        }
        if (line.includes('INSERT INTO `journal_settings`')) {
            console.log(`Found SETTINGS insert at line: ${lineNum}`);
        }
    }
}

findLine();
