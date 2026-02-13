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

    let printingSub = false;
    let printingPub = false;
    let subCount = 0;
    let pubCount = 0;

    for await (const line of rl) {
        if (line.includes('CREATE TABLE IF NOT EXISTS `submissions`')) {
            printingSub = true;
            console.log('\n--- SUBMISSIONS TABLE ---');
        } else if (line.includes('CREATE TABLE IF NOT EXISTS `publications`')) {
            printingPub = true;
            console.log('\n--- PUBLICATIONS TABLE ---');
        }

        if (printingSub) {
            console.log(line);
            if (line.includes('ENGINE=')) printingSub = false;
        }

        if (printingPub) {
            console.log(line);
            if (line.includes('ENGINE=')) printingPub = false;
        }

        // Also grab sample data
        if (line.includes('INSERT INTO `submissions`') && subCount < 1) {
            console.log('\n--- SUBMISSION DATA SAMPLE ---');
            console.log(line.substring(0, 500));
            subCount++;
        }
        if (line.includes('INSERT INTO `publications`') && pubCount < 1) {
            console.log('\n--- PUBLICATION DATA SAMPLE ---');
            console.log(line.substring(0, 500));
            pubCount++;
        }
    }
}

inspect();
