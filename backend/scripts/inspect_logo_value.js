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

    let inSettings = false;

    for await (const line of rl) {
        if (line.includes('INSERT INTO `journal_settings`')) {
            inSettings = true;
        } else if (line.trim().startsWith('--') || (line.includes('INSERT INTO `') && !line.includes('journal_settings'))) {
            inSettings = false;
        }

        if (inSettings) {
            const matches = line.matchAll(/\(\s*(\d+)\s*,\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*'((?:[^']|'')*)'/g);
            for (const match of matches) {
                const jid = parseInt(match[1]);
                const key = match[2];
                const val = match[3];
                if (jid === 1 && key === 'pageHeaderLogoImage') {
                    console.log(`LOGO VAL: ${val}`);
                }
            }
        }
    }
}

inspect();
