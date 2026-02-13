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

    let printing = false;
    let linesPrinted = 0;

    for await (const line of rl) {
        if (line.includes('INSERT INTO `journals`')) {
            printing = true;
            console.log('--- FOUND INSERT STATEMENT ---');
            console.log(line.substring(0, 200));
            continue;
        }

        if (printing) {
            console.log(`DATA LINE: ${line.substring(0, 200)}`);
            linesPrinted++;
            if (linesPrinted > 10) break;
            if (line.trim().endsWith(';')) {
                console.log('--- END OF STATEMENT ---');
                break;
            }
        }
    }
}

inspect();
