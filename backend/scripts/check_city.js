const db = require('../db');
const fs = require('fs');

async function checkCity() {
    try {
        const res = await db.query(`SELECT count(*) FROM metrics WHERE city IS NOT NULL AND city != ''`);
        console.log(`Rows with city: ${res.rows[0].count}`);

        const resTotal = await db.query(`SELECT count(*) FROM metrics`);
        console.log(`Total rows: ${resTotal.rows[0].count}`);

        fs.writeFileSync('city_check.txt', `Rows with city: ${res.rows[0].count}\nTotal rows: ${resTotal.rows[0].count}\n`);

    } catch (err) {
        console.error(err);
        fs.writeFileSync('city_check.txt', err.message);
    } finally {
        process.exit();
    }
}

checkCity();
