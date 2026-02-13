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

    let foundCreate = false;
    let foundInsert = false;
    let sampleCount = 0;

    for await (const line of rl) {
        // Get CREATE TABLE structure
        if (line.includes('CREATE TABLE IF NOT EXISTS `author_settings`')) {
            foundCreate = true;
            console.log('--- AUTHOR_SETTINGS TABLE STRUCTURE ---');
        }

        if (foundCreate) {
            console.log(line);
            if (line.includes('ENGINE=')) {
                foundCreate = false;
                console.log('\n');
            }
        }

        // Get INSERT header to see column order
        if (line.includes('INSERT INTO `author_settings`') && !foundInsert) {
            foundInsert = true;
            console.log('--- AUTHOR_SETTINGS INSERT HEADER ---');
            const match = line.match(/INSERT INTO `author_settings` \((.*?)\) VALUES/);
            if (match) {
                const cols = match[1].split(',').map(c => c.trim().replace(/`/g, ''));
                cols.forEach((col, idx) => console.log(`${idx}: ${col}`));
            }
            console.log('\n--- SAMPLE DATA (First 5) ---');
        }

        // Get sample rows
        if (foundInsert && sampleCount < 5) {
            const matches = line.matchAll(/\(([^)]+)\)/g);
            for (const match of matches) {
                if (sampleCount >= 5) break;
                console.log(`Row ${sampleCount + 1}: ${match[1].substring(0, 200)}`);
                sampleCount++;
            }
        }

        if (sampleCount >= 5) break;
    }
}

inspect();
