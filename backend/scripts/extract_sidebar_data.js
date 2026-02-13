const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

async function extractSpecificMetadata() {
    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let found = false;
    const targets = ['editorialTeam', 'authorInformation', 'librarianInformation', 'readerInformation', 'masthead', 'focusScopeDesc'];
    const results = {};

    for await (const line of rl) {
        if (line.includes("INSERT INTO `journal_settings`")) {
            found = true;
            continue;
        }
        if (found && line.trim().startsWith('(')) {
            for (const target of targets) {
                if (line.includes(`'${target}'`)) {
                    const matches = line.match(/\(\d+,\s*'[^']*',\s*'([^']*)',\s*'((?:[^']|'')*)'/);
                    if (matches) {
                        results[target] = matches[2].replace(/''/g, "'");
                    }
                }
            }
        }
    }

    for (const [key, val] of Object.entries(results)) {
        console.log(`--- ${key} ---`);
        console.log(val.substring(0, 500) + (val.length > 500 ? '...' : ''));
    }
}

extractSpecificMetadata();
