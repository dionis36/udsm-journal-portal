const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

async function inspectFiles() {
    const fileStream = fs.createReadStream(SQL_FILE_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let activeTable = '';
    const tables = ['submission_files', 'publication_galleys', 'submission_file_settings'];

    for await (const line of rl) {
        for (const table of tables) {
            if (line.includes(`INSERT INTO \`${table}\``)) {
                console.log(`--- ${table.toUpperCase()} ---`);
                console.log(line.substring(0, 1000));
                activeTable = table;
            }
        }
    }
}

inspectFiles();
