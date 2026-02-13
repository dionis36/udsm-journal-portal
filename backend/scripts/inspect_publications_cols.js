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

    for await (const line of rl) {
        if (line.includes('INSERT INTO `publications`')) {
            console.log('--- FULL PUBLICATIONS INSERT ---');
            console.log(line.substring(0, 3000));

            // Try to extract column names
            const match = line.match(/INSERT INTO `publications` \((.*?)\) VALUES/);
            if (match) {
                const cols = match[1].split(',').map(c => c.trim().replace(/`/g, ''));
                console.log('\n--- COLUMN LIST ---');
                cols.forEach((col, idx) => console.log(`${idx}: ${col}`));
            }
            return;
        }
    }
}

inspect();
