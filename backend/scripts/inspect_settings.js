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

    const keys = new Set();
    let inSettings = false;

    for await (const line of rl) {
        if (line.includes('INSERT INTO `journal_settings`')) {
            inSettings = true;
        } else if (line.trim().startsWith('--') || (line.includes('INSERT INTO `') && !line.includes('journal_settings'))) {
            inSettings = false;
        }

        if (inSettings) {
            const matches = line.matchAll(/\(\s*(\d+)\s*,\s*'[^']*'\s*,\s*'([^']+)'/g);
            for (const match of matches) {
                const jid = parseInt(match[1]);
                const key = match[2];
                if (jid === 1) {
                    // Check for image candidates
                    if (/image|logo|cover|header|home/i.test(key)) {
                        keys.add(key);
                    }
                }
            }
        }
    }
    console.log('IMAGE CANDIDATES:', Array.from(keys).sort().join(', '));
}

inspect();
