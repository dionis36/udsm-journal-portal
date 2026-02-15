const db = require('../db');
const fs = require('fs');

async function checkCountry() {
    try {
        const res = await db.query(`SELECT count(*) FROM metrics WHERE country_id IS NOT NULL AND country_id != ''`);
        console.log(`Rows with country: ${res.rows[0].count}`);

        fs.writeFileSync('country_check.txt', `Rows with country: ${res.rows[0].count}\n`);

    } catch (err) {
        console.error(err);
        fs.writeFileSync('country_check.txt', err.message);
    } finally {
        process.exit();
    }
}

checkCountry();
