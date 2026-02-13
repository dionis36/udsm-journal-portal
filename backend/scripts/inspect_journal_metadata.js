const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

async function inspectJournalSettings() {
    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let found = false;
    let count = 0;

    for await (const line of rl) {
        if (line.includes("INSERT INTO `journal_settings`")) {
            found = true;
            continue;
        }
        if (found && line.trim().startsWith('(')) {
            // (journal_id, locale, setting_name, setting_value)
            const matches = line.match(/\((\d+),\s*'([^']*)',\s*'([^']*)',\s*'((?:[^']|'')*)'/);
            if (matches) {
                console.log(`Key: ${matches[3]}, Value: ${matches[4].substring(0, 100)}${matches[4].length > 100 ? '...' : ''}`);
            }
            count++;
            if (count > 100) break;
        }
    }
}

inspectJournalSettings();
