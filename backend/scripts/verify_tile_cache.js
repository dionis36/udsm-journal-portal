const http = require('http');

function request(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:4000${path}`, (res) => {
            let data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers }));
        }).on('error', reject);
    });
}

async function verifyCache() {
    try {
        console.log('--- Verifying Tile Cache Headers ---');
        const resTile = await request('/api/tiles/0/0/0.mvt');
        console.log(`Status: ${resTile.statusCode}`);
        console.log(`Cache-Control: ${resTile.headers['cache-control']}`);
        // Should be public, max-age=60 as per tiles.js

    } catch (err) {
        console.error('Verification failed:', err);
    }
}

verifyCache();
