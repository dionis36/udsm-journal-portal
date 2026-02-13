const { Pool } = require('pg');

// Create a new pool using connection details from environment variables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add SSL if production requires it (Heroku/Render usually do)
    // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = {
    /**
     * Helper function to execute queries on the pool.
     * Logs query execution time in development.
     * @param {string} text - The SQL query string
     * @param {Array} params - The parameters for the SQL query
     */
    query: async (text, params) => {
        const start = Date.now();
        try {
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            // console.log('executed query', { text, duration, rows: res.rowCount });
            return res;
        } catch (error) {
            console.error('Error executing query', { text, error });
            throw error;
        }
    },
    /**
     * Helper to get a client from the pool for transactions.
     * Remember to release() the client when done!
     */
    getClient: () => pool.connect(),
};
