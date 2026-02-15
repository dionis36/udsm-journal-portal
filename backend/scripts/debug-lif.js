const LiveImpactFactorService = require('../services/live-impact-factor');

async function debugLIF() {
    try {
        console.log('Debugging LIF Calculation...');
        const service = new LiveImpactFactorService();
        const result = await service.calculate(1);
        console.log('LIF Result:', result);
    } catch (error) {
        console.error('LIF Error:', error);
    } finally {
        process.exit();
    }
}

require('dotenv').config();
// Mock DB for independent run if needed, but easier to use existing db module
// We assume we are running in backend root
debugLIF();
