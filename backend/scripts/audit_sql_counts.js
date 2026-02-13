const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

async function countArticles() {
    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    let currentBlock = '';
    let submissionCount = 0;
    let publicationCount = 0;
    let authorCount = 0;

    for await (const line of rl) {
        if (line.includes('INSERT INTO `submissions`')) {
            currentBlock = 'submissions';
        } else if (line.includes('INSERT INTO `publications`')) {
            currentBlock = 'publications';
        } else if (line.includes('INSERT INTO `authors`')) {
            currentBlock = 'authors';
        } else if (line.trim().startsWith('INSERT INTO `') || line.trim().startsWith('--')) {
            currentBlock = '';
        }

        if (currentBlock === 'submissions') {
            const matches = line.match(/\(([^)]+)\)/g);
            if (matches) submissionCount += matches.length;
        } else if (currentBlock === 'publications') {
            const matches = line.match(/\(([^)]+)\)/g);
            if (matches) publicationCount += matches.length;
        } else if (currentBlock === 'authors') {
            const matches = line.match(/\(([^)]+)\)/g);
            if (matches) authorCount += matches.length;
        }
    }

    console.log('--- SQL DUMP AUDIT ---');
    console.log(`Total Submissions: ${submissionCount}`);
    console.log(`Total Publications: ${publicationCount}`);
    console.log(`Total Authors: ${authorCount}`);
}

countArticles();
