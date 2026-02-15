const db = require('../db');
const fs = require('fs');

async function checkTables() {
    try {
        let output = '';

        // 2. Inspect platform_articles
        const articles = await db.query(`
            SELECT * FROM platform_articles LIMIT 3
        `);
        output += '--- Platform Articles ---\n';
        output += JSON.stringify(articles.rows, null, 2) + '\n\n';

        // 3. Inspect research_items
        const research = await db.query(`
            SELECT * FROM research_items LIMIT 3
        `);
        output += '--- Research Items ---\n';
        output += JSON.stringify(research.rows, null, 2) + '\n\n';

        fs.writeFileSync('schema_check_v2.txt', output);
        console.log('Written to schema_check_v2.txt');

    } catch (err) {
        console.error(err);
        fs.writeFileSync('schema_check_v2.txt', err.message);
    } finally {
        process.exit();
    }
}

checkTables();
