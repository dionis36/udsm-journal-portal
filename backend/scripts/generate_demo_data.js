const db = require('../db');
require('dotenv').config();

/**
 * Generate Rich Demo Data for UDSM Analytics Competition
 * 
 * Creates 10,000+ realistic readership events distributed globally
 * with minimal clustering to showcase geographic reach.
 * 
 * Distribution:
 * - 120+ cities across 6 continents
 * - Weighted by realistic academic readership patterns
 * - Time-distributed over 6 months
 */

// Global city distribution (120 cities across all continents)
const GLOBAL_CITIES = [
    // Africa (20 cities - 20% weight)
    { city: 'Dar es Salaam', lat: -6.7924, lng: 39.2083, country: 'TZ', weight: 3 },
    { city: 'Nairobi', lat: -1.2864, lng: 36.8172, country: 'KE', weight: 2 },
    { city: 'Lagos', lat: 6.5244, lng: 3.3792, country: 'NG', weight: 2 },
    { city: 'Cape Town', lat: -33.9249, lng: 18.4241, country: 'ZA', weight: 2 },
    { city: 'Johannesburg', lat: -26.2041, lng: 28.0473, country: 'ZA', weight: 2 },
    { city: 'Accra', lat: 5.6037, lng: -0.1870, country: 'GH', weight: 1 },
    { city: 'Kampala', lat: 0.3476, lng: 32.5825, country: 'UG', weight: 1 },
    { city: 'Addis Ababa', lat: 9.0320, lng: 38.7469, country: 'ET', weight: 1 },
    { city: 'Kigali', lat: -1.9706, lng: 30.1044, country: 'RW', weight: 1 },
    { city: 'Lusaka', lat: -15.4167, lng: 28.2833, country: 'ZM', weight: 1 },
    { city: 'Harare', lat: -17.8252, lng: 31.0335, country: 'ZW', weight: 1 },
    { city: 'Dakar', lat: 14.6937, lng: -17.4441, country: 'SN', weight: 1 },
    { city: 'Abidjan', lat: 5.3600, lng: -4.0083, country: 'CI', weight: 1 },
    { city: 'Casablanca', lat: 33.5731, lng: -7.5898, country: 'MA', weight: 1 },
    { city: 'Cairo', lat: 30.0444, lng: 31.2357, country: 'EG', weight: 2 },
    { city: 'Tunis', lat: 36.8065, lng: 10.1815, country: 'TN', weight: 1 },
    { city: 'Algiers', lat: 36.7372, lng: 3.0865, country: 'DZ', weight: 1 },
    { city: 'Nairobi', lat: -1.2921, lng: 36.8219, country: 'KE', weight: 1 },
    { city: 'Maputo', lat: -25.9655, lng: 32.5832, country: 'MZ', weight: 1 },
    { city: 'Gaborone', lat: -24.6282, lng: 25.9231, country: 'BW', weight: 1 },

    // Europe (30 cities - 25% weight)
    { city: 'London', lat: 51.5074, lng: -0.1278, country: 'GB', weight: 3 },
    { city: 'Paris', lat: 48.8566, lng: 2.3522, country: 'FR', weight: 2 },
    { city: 'Berlin', lat: 52.5200, lng: 13.4050, country: 'DE', weight: 2 },
    { city: 'Amsterdam', lat: 52.3676, lng: 4.9041, country: 'NL', weight: 2 },
    { city: 'Stockholm', lat: 59.3293, lng: 18.0686, country: 'SE', weight: 1 },
    { city: 'Oslo', lat: 59.9139, lng: 10.7522, country: 'NO', weight: 1 },
    { city: 'Copenhagen', lat: 55.6761, lng: 12.5683, country: 'DK', weight: 1 },
    { city: 'Brussels', lat: 50.8503, lng: 4.3517, country: 'BE', weight: 1 },
    { city: 'Vienna', lat: 48.2082, lng: 16.3738, country: 'AT', weight: 1 },
    { city: 'Zurich', lat: 47.3769, lng: 8.5417, country: 'CH', weight: 1 },
    { city: 'Madrid', lat: 40.4168, lng: -3.7038, country: 'ES', weight: 2 },
    { city: 'Barcelona', lat: 41.3851, lng: 2.1734, country: 'ES', weight: 1 },
    { city: 'Rome', lat: 41.9028, lng: 12.4964, country: 'IT', weight: 1 },
    { city: 'Milan', lat: 45.4642, lng: 9.1900, country: 'IT', weight: 1 },
    { city: 'Athens', lat: 37.9838, lng: 23.7275, country: 'GR', weight: 1 },
    { city: 'Lisbon', lat: 38.7223, lng: -9.1393, country: 'PT', weight: 1 },
    { city: 'Dublin', lat: 53.3498, lng: -6.2603, country: 'IE', weight: 1 },
    { city: 'Edinburgh', lat: 55.9533, lng: -3.1883, country: 'GB', weight: 1 },
    { city: 'Manchester', lat: 53.4808, lng: -2.2426, country: 'GB', weight: 1 },
    { city: 'Birmingham', lat: 52.4862, lng: -1.8904, country: 'GB', weight: 1 },
    { city: 'Helsinki', lat: 60.1695, lng: 24.9354, country: 'FI', weight: 1 },
    { city: 'Warsaw', lat: 52.2297, lng: 21.0122, country: 'PL', weight: 1 },
    { city: 'Prague', lat: 50.0755, lng: 14.4378, country: 'CZ', weight: 1 },
    { city: 'Budapest', lat: 47.4979, lng: 19.0402, country: 'HU', weight: 1 },
    { city: 'Bucharest', lat: 44.4268, lng: 26.1025, country: 'RO', weight: 1 },
    { city: 'Belgrade', lat: 44.7866, lng: 20.4489, country: 'RS', weight: 1 },
    { city: 'Kiev', lat: 50.4501, lng: 30.5234, country: 'UA', weight: 1 },
    { city: 'Moscow', lat: 55.7558, lng: 37.6173, country: 'RU', weight: 2 },
    { city: 'Istanbul', lat: 41.0082, lng: 28.9784, country: 'TR', weight: 2 },
    { city: 'Geneva', lat: 46.2044, lng: 6.1432, country: 'CH', weight: 1 },

    // North America (20 cities - 20% weight)
    { city: 'New York', lat: 40.7128, lng: -74.0060, country: 'US', weight: 3 },
    { city: 'Los Angeles', lat: 34.0522, lng: -118.2437, country: 'US', weight: 2 },
    { city: 'Chicago', lat: 41.8781, lng: -87.6298, country: 'US', weight: 2 },
    { city: 'Houston', lat: 29.7604, lng: -95.3698, country: 'US', weight: 1 },
    { city: 'Boston', lat: 42.3601, lng: -71.0589, country: 'US', weight: 2 },
    { city: 'San Francisco', lat: 37.7749, lng: -122.4194, country: 'US', weight: 2 },
    { city: 'Washington DC', lat: 38.9072, lng: -77.0369, country: 'US', weight: 2 },
    { city: 'Seattle', lat: 47.6062, lng: -122.3321, country: 'US', weight: 1 },
    { city: 'Toronto', lat: 43.6532, lng: -79.3832, country: 'CA', weight: 2 },
    { city: 'Vancouver', lat: 49.2827, lng: -123.1207, country: 'CA', weight: 1 },
    { city: 'Montreal', lat: 45.5017, lng: -73.5673, country: 'CA', weight: 1 },
    { city: 'Ottawa', lat: 45.4215, lng: -75.6972, country: 'CA', weight: 1 },
    { city: 'Mexico City', lat: 19.4326, lng: -99.1332, country: 'MX', weight: 2 },
    { city: 'Philadelphia', lat: 39.9526, lng: -75.1652, country: 'US', weight: 1 },
    { city: 'Miami', lat: 25.7617, lng: -80.1918, country: 'US', weight: 1 },
    { city: 'Atlanta', lat: 33.7490, lng: -84.3880, country: 'US', weight: 1 },
    { city: 'Denver', lat: 39.7392, lng: -104.9903, country: 'US', weight: 1 },
    { city: 'Phoenix', lat: 33.4484, lng: -112.0740, country: 'US', weight: 1 },
    { city: 'Austin', lat: 30.2672, lng: -97.7431, country: 'US', weight: 1 },
    { city: 'San Diego', lat: 32.7157, lng: -117.1611, country: 'US', weight: 1 },

    // Asia (30 cities - 25% weight)
    { city: 'Beijing', lat: 39.9042, lng: 116.4074, country: 'CN', weight: 2 },
    { city: 'Shanghai', lat: 31.2304, lng: 121.4737, country: 'CN', weight: 2 },
    { city: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'JP', weight: 3 },
    { city: 'Seoul', lat: 37.5665, lng: 126.9780, country: 'KR', weight: 2 },
    { city: 'Singapore', lat: 1.3521, lng: 103.8198, country: 'SG', weight: 2 },
    { city: 'Hong Kong', lat: 22.3193, lng: 114.1694, country: 'HK', weight: 2 },
    { city: 'Mumbai', lat: 19.0760, lng: 72.8777, country: 'IN', weight: 3 },
    { city: 'Delhi', lat: 28.7041, lng: 77.1025, country: 'IN', weight: 2 },
    { city: 'Bangalore', lat: 12.9716, lng: 77.5946, country: 'IN', weight: 2 },
    { city: 'Bangkok', lat: 13.7563, lng: 100.5018, country: 'TH', weight: 2 },
    { city: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, country: 'MY', weight: 1 },
    { city: 'Jakarta', lat: -6.2088, lng: 106.8456, country: 'ID', weight: 2 },
    { city: 'Manila', lat: 14.5995, lng: 120.9842, country: 'PH', weight: 1 },
    { city: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297, country: 'VN', weight: 1 },
    { city: 'Hanoi', lat: 21.0285, lng: 105.8542, country: 'VN', weight: 1 },
    { city: 'Taipei', lat: 25.0330, lng: 121.5654, country: 'TW', weight: 1 },
    { city: 'Dhaka', lat: 23.8103, lng: 90.4125, country: 'BD', weight: 1 },
    { city: 'Karachi', lat: 24.8607, lng: 67.0011, country: 'PK', weight: 1 },
    { city: 'Lahore', lat: 31.5204, lng: 74.3587, country: 'PK', weight: 1 },
    { city: 'Tehran', lat: 35.6892, lng: 51.3890, country: 'IR', weight: 1 },
    { city: 'Dubai', lat: 25.2048, lng: 55.2708, country: 'AE', weight: 2 },
    { city: 'Tel Aviv', lat: 32.0853, lng: 34.7818, country: 'IL', weight: 1 },
    { city: 'Riyadh', lat: 24.7136, lng: 46.6753, country: 'SA', weight: 1 },
    { city: 'Doha', lat: 25.2854, lng: 51.5310, country: 'QA', weight: 1 },
    { city: 'Colombo', lat: 6.9271, lng: 79.8612, country: 'LK', weight: 1 },
    { city: 'Kathmandu', lat: 27.7172, lng: 85.3240, country: 'NP', weight: 1 },
    { city: 'Yangon', lat: 16.8661, lng: 96.1951, country: 'MM', weight: 1 },
    { city: 'Phnom Penh', lat: 11.5564, lng: 104.9282, country: 'KH', weight: 1 },
    { city: 'Osaka', lat: 34.6937, lng: 135.5023, country: 'JP', weight: 1 },
    { city: 'Kyoto', lat: 35.0116, lng: 135.7681, country: 'JP', weight: 1 },

    // Oceania (10 cities - 5% weight)
    { city: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'AU', weight: 2 },
    { city: 'Melbourne', lat: -37.8136, lng: 144.9631, country: 'AU', weight: 2 },
    { city: 'Brisbane', lat: -27.4698, lng: 153.0251, country: 'AU', weight: 1 },
    { city: 'Perth', lat: -31.9505, lng: 115.8605, country: 'AU', weight: 1 },
    { city: 'Auckland', lat: -36.8485, lng: 174.7633, country: 'NZ', weight: 1 },
    { city: 'Wellington', lat: -41.2865, lng: 174.7762, country: 'NZ', weight: 1 },
    { city: 'Adelaide', lat: -34.9285, lng: 138.6007, country: 'AU', weight: 1 },
    { city: 'Canberra', lat: -35.2809, lng: 149.1300, country: 'AU', weight: 1 },
    { city: 'Christchurch', lat: -43.5321, lng: 172.6362, country: 'NZ', weight: 1 },
    { city: 'Gold Coast', lat: -28.0167, lng: 153.4000, country: 'AU', weight: 1 },

    // South America (10 cities - 5% weight)
    { city: 'São Paulo', lat: -23.5505, lng: -46.6333, country: 'BR', weight: 2 },
    { city: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, country: 'BR', weight: 2 },
    { city: 'Buenos Aires', lat: -34.6037, lng: -58.3816, country: 'AR', weight: 2 },
    { city: 'Lima', lat: -12.0464, lng: -77.0428, country: 'PE', weight: 1 },
    { city: 'Bogotá', lat: 4.7110, lng: -74.0721, country: 'CO', weight: 1 },
    { city: 'Santiago', lat: -33.4489, lng: -70.6693, country: 'CL', weight: 1 },
    { city: 'Caracas', lat: 10.4806, lng: -66.9036, country: 'VE', weight: 1 },
    { city: 'Quito', lat: -0.1807, lng: -78.4678, country: 'EC', weight: 1 },
    { city: 'Brasília', lat: -15.8267, lng: -47.9218, country: 'BR', weight: 1 },
    { city: 'Montevideo', lat: -34.9011, lng: -56.1645, country: 'UY', weight: 1 },
];

// Calculate total weight for weighted selection
const TOTAL_WEIGHT = GLOBAL_CITIES.reduce((sum, city) => sum + city.weight, 0);

// Weighted random selection
function selectCity() {
    let random = Math.random() * TOTAL_WEIGHT;
    for (const city of GLOBAL_CITIES) {
        random -= city.weight;
        if (random <= 0) return city;
    }
    return GLOBAL_CITIES[GLOBAL_CITIES.length - 1];
}

// Generate random date within last 6 months
function randomDate() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000));
    const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
    return new Date(randomTime);
}

async function generateDemoData() {
    console.log('🚀 Starting demo data generation...');
    console.log(`📍 Using ${GLOBAL_CITIES.length} cities across 6 continents`);

    try {
        // Get existing articles
        const articlesResult = await db.query('SELECT item_id FROM platform_articles LIMIT 20');
        const articles = articlesResult.rows;

        if (articles.length === 0) {
            console.error('❌ No articles found! Please seed platform_articles table first.');
            process.exit(1);
        }

        console.log(`📚 Found ${articles.length} articles`);
        console.log('📊 Generating 10,000 readership events...');

        const startTime = Date.now();
        let successCount = 0;

        for (let i = 0; i < 10000; i++) {
            const city = selectCity();
            const article = articles[Math.floor(Math.random() * articles.length)];
            const eventType = Math.random() > 0.3 ? 'PDF_DOWNLOAD' : 'ABSTRACT_VIEW';
            const weight = Math.random() > 0.7 ? 2 : 1;
            const timestamp = randomDate();

            try {
                await db.query(`
                    INSERT INTO readership_geodata (
                        journal_id, item_id, location_point, 
                        city_name, country_code, event_type, timestamp, weight
                    ) VALUES (
                        1, $1,
                        ST_SetSRID(ST_MakePoint($2, $3), 4326),
                        $4, $5, $6, $7, $8
                    )
                `, [
                    article.item_id,
                    city.lng, city.lat,
                    city.city, city.country,
                    eventType, timestamp, weight
                ]);

                successCount++;

                if ((i + 1) % 1000 === 0) {
                    console.log(`  ✓ Progress: ${i + 1}/10,000 events created`);
                }
            } catch (err) {
                console.error(`  ⚠️  Failed to insert event ${i + 1}:`, err.message);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n✅ Demo data generation complete!');
        console.log(`   📊 Created: ${successCount} events`);
        console.log(`   ⏱️  Duration: ${duration}s`);
        console.log(`   🌍 Distribution: ${GLOBAL_CITIES.length} cities worldwide`);

        // Show distribution stats
        const statsResult = await db.query(`
            SELECT 
                COUNT(DISTINCT country_code) as countries,
                COUNT(DISTINCT city_name) as cities,
                COUNT(*) as total_events
            FROM readership_geodata
        `);

        const stats = statsResult.rows[0];
        console.log('\n📈 Database Statistics:');
        console.log(`   🌐 Countries: ${stats.countries}`);
        console.log(`   🏙️  Cities: ${stats.cities}`);
        console.log(`   📖 Total Events: ${stats.total_events}`);

    } catch (error) {
        console.error('❌ Error generating demo data:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Run the script
generateDemoData();
