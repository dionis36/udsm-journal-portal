const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

async function findAuthors() {
    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let inAuthors = false;
    const targetPids = [311, 317];

    for await (const line of rl) {
        if (line.includes('INSERT INTO `authors`')) {
            inAuthors = true;
            if (line.includes('VALUES')) {
                // Check if target pids are in the values part
                for (const pid of targetPids) {
                    if (line.includes(`, ${pid},`)) {
                        console.log(`Found PID ${pid} in first line of authors`);
                    }
                }
            }
            continue;
        }

        if (inAuthors) {
            if (line.trim().startsWith('INSERT INTO') || line.trim().startsWith('--') || line.trim() === '') {
                // Check if we hit next block or empty line
                if (line.trim() !== '') inAuthors = false;
                continue;
            }

            for (const pid of targetPids) {
                if (line.includes(`, ${pid},`)) {
                    console.log(`Found link for PID ${pid} in line: ${line.trim()}`);
                }
            }
        }
    }
}

findAuthors();
