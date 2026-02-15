const db = require('../db');

async function checkMetadata() {
    try {
        const result = await db.query('SELECT metadata FROM platform_journals WHERE journal_id = 1');
        const metadata = result.rows[0]?.metadata || {};

        console.log('Current Metadata:', JSON.stringify(metadata, null, 2));

        if (!metadata.impact_metrics) {
            console.log('❌ Impact metrics missing. Updating...');

            const newMetadata = {
                ...metadata,
                impact_metrics: {
                    jif: 1.42,
                    citescore: 1.8,
                    sjr: 0.45,
                    h5_index: 12,
                    h5_median: 18,
                    quartile: 'Q2',
                    percentile: 65,
                    last_updated: new Date().toISOString().split('T')[0]
                }
            };

            await db.query('UPDATE platform_journals SET metadata = $1 WHERE journal_id = 1', [newMetadata]);
            console.log('✅ Impact metrics updated successfully.');
        } else {
            console.log('✅ Impact metrics already exist.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

require('dotenv').config();
checkMetadata();
