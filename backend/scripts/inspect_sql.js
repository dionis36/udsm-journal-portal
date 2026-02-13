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

    let capture = false;
    let table = '';
    let buffer = [];

    for await (const line of rl) {
        if (line.includes('CREATE TABLE IF NOT EXISTS `journals`')) {
            capture = true;
            table = 'journals';
            buffer = [];
        } else if (line.includes('CREATE TABLE IF NOT EXISTS `journal_settings`')) {
            capture = true;
            table = 'journal_settings';
            buffer = [];
        }

        if (capture) {
            buffer.push(line);
            if (line.includes('ENGINE=')) {
                console.log(`\nTABLE: ${table}`);
                console.log(buffer.join('\n'));
                capture = false;
            }
        }
    }
}

inspect();
