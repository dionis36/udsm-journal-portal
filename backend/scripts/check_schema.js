const db = require('../db');
const fs = require('fs');

async function checkSchema() {
    try {
        let output = 'Connected to DB via db.js\n';

        const tables = ['readership_geodata', 'metrics', 'geoip_cities'];

        for (const table of tables) {
            output += `\n--- ${table} ---\n`;
            const res = await db.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [table]);
            res.rows.forEach(row => {
                output += `${row.column_name}: ${row.data_type}\n`;
            });
        }
        fs.writeFileSync('schema_output.txt', output);
        console.log('Schema written to schema_output.txt');

    } catch (err) {
        console.error('Error:', err);
        fs.writeFileSync('schema_output.txt', 'Error: ' + err.message);
    } finally {
        process.exit();
    }
}

checkSchema();
