const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

async function debugAuthors() {
    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const authors = new Map();
    let currentBlock = '';

    for await (const line of rl) {
        if (line.includes('INSERT INTO `authors`')) currentBlock = 'authors';
        else if (line.includes('INSERT INTO `author_settings`')) currentBlock = 'author_settings';
        else if (line.trim().startsWith('--') || (line.includes('INSERT INTO `') && !line.includes('VALUES'))) currentBlock = '';

        if (currentBlock === 'authors') {
            const matches = line.matchAll(/\(([^)]+)\)/g);
            for (const match of matches) {
                const vals = match[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
                if (vals.length >= 4) {
                    const aid = parseInt(vals[0]);
                    const pid = parseInt(vals[3]);
                    authors.set(aid, { pid, givenName: '', familyName: '' });
                }
            }
        }

        if (currentBlock === 'author_settings') {
            const matches = line.matchAll(/\(\s*(\d+)\s*,\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*'((?:[^']|'')*)'/g);
            for (const match of matches) {
                const aid = parseInt(match[1]);
                const key = match[2];
                const val = match[3];
                if (authors.has(aid)) {
                    const a = authors.get(aid);
                    if (key === 'givenName') a.givenName = val;
                    if (key === 'familyName') a.familyName = val;
                }
            }
        }
    }

    // Check specific publication (e.g., pid 1)
    console.log('--- Debugging Authors for PID 1 ---');
    for (const [aid, a] of authors) {
        if (a.pid === 1) {
            console.log(`AuthorID: ${aid}, Name: ${a.givenName} ${a.familyName}`);
        }
    }
}

debugAuthors();
