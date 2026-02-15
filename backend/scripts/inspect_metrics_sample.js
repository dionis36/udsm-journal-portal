const db = require('../db');

async function inspectMetrics() {
    try {
        const res = await db.query(`
            SELECT * FROM metrics LIMIT 5
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspectMetrics();
