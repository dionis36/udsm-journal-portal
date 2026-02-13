const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

async function inspectDates() {
    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let found = false;
    let count = 0;

    for await (const line of rl) {
        if (line.includes("INSERT INTO `publications`")) {
            found = true;
            continue;
        }
        if (found && line.trim().startsWith('(')) {
            // (pid, access, date_pub, last_mod, ...)
            const vals = line.match(/\(([^)]+)\)/)[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
            console.log(`PID: ${vals[0]}, DatePub: ${vals[2]}, LastMod: ${vals[3]}`);
            count++;
            if (count > 20) break;
        }
    }
}

inspectDates();
