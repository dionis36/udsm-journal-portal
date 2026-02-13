const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

async function inspectSettings() {
    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let count = 0;
    let found = false;

    for await (const line of rl) {
        if (line.includes("INSERT INTO `submission_file_settings`")) {
            found = true;
            continue;
        }
        if (found && line.trim().startsWith('(')) {
            console.log(line.substring(0, 1000));
            count++;
            if (count > 20) break;
        }
    }
}

inspectSettings();
