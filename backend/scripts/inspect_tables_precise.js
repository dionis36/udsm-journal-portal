const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

async function inspectTable(tableName) {
    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let foundHeader = false;
    let rowsVisited = 0;

    for await (const line of rl) {
        if (line.includes(`INSERT INTO \`${tableName}\``)) {
            console.log(`HEADER: ${line.substring(0, 1000)}`);
            foundHeader = true;
            continue;
        }
        if (foundHeader && line.trim().startsWith('(')) {
            console.log(`ROW: ${line.substring(0, 1000)}`);
            rowsVisited++;
            if (rowsVisited > 3) break;
        }
    }
}

async function run() {
    await inspectTable('submission_files');
    console.log('\n');
    await inspectTable('publication_galleys');
}

run();
