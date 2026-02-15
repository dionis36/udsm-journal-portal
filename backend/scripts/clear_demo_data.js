const db = require('../db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function clearDemoData() {
    console.log('🧹 Clearing existing demo data...\n');

    try {
        // Count before deletion
        const countBefore = await db.query('SELECT COUNT(*) as count FROM readership_geodata');
        console.log(`📊 Current events in database: ${countBefore.rows[0].count}`);

        if (countBefore.rows[0].count > 0) {
            console.log('\n⚠️  WARNING: This will delete ALL readership events!');
            console.log('   Continuing in 2 seconds...\n');

            await new Promise(resolve => setTimeout(resolve, 2000));

            // Delete all readership data
            await db.query('TRUNCATE TABLE readership_geodata CASCADE');
            console.log('✅ Cleared readership_geodata table');

            // Verify deletion
            const countAfter = await db.query('SELECT COUNT(*) as count FROM readership_geodata');
            console.log(`\n📊 Events remaining: ${countAfter.rows[0].count}`);

            if (countAfter.rows[0].count === 0) {
                console.log('✨ Database is clean and ready for fresh demo data!');
            }
        } else {
            console.log('ℹ️  Database is already empty, no data to clear.');
        }

    } catch (error) {
        console.error('❌ Error clearing data:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

clearDemoData();
