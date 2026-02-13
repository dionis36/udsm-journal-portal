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

    const journalIds = new Set();

    for await (const line of rl) {
        if (line.includes('INSERT INTO `journal_settings`')) {
            // Matches: (1, 'locale', ...
            const matches = line.matchAll(/\(\s*(\d+)\s*,/g);
            for (const match of matches) {
                journalIds.add(match[1]);
            }
        }
    }
    console.log('Unique Journal IDs in Settings:', Array.from(journalIds).join(', '));
}

inspect();
