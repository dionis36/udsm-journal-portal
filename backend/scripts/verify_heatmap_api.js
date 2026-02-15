const http = require('http');

function request(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:4000${path}`, (res) => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: Buffer.concat(data) }));
        }).on('error', reject);
    });
}

async function verify() {
    try {
        console.log('--- Verifying Impact Summary ---');
        const resmetrics = await request('/api/metrics/impact-summary');
        console.log(`Status: ${resmetrics.statusCode}`);
        console.log(`Body: ${resmetrics.body.toString()}`);

        console.log('\n--- Verifying Tile (Zoom 0) ---');
        const resTile = await request('/api/tiles/0/0/0.mvt');
        console.log(`Status: ${resTile.statusCode}`);
        console.log(`Size: ${resTile.body.length} bytes`);
        console.log(`Content-Type: ${resTile.headers['content-type']}`);

        console.log('\n--- Verifying Tile (Zoom 10) ---');
        const resTileHigh = await request('/api/tiles/10/500/500.mvt'); // Random tile, might be empty
        console.log(`Status: ${resTileHigh.statusCode}`);
        // 204 means empty, 200 means data.

    } catch (err) {
        console.error('Verification failed:', err);
    }
}

verify();
