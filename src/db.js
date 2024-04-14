const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'zroslin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'zroslin',
    password: process.env.DB_PASSWORD || 'zroslin',
    port: process.env.DB_PORT || 5432,
});

const query = async (text, params) => {
    try {
        const start = Date.now();
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query:', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Error executing query:', { text, error });
        throw error;
    }
};

module.exports = { query }