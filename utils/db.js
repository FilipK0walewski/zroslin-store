const { Pool } = require('pg');

const pool = new Pool({
    user: 'zroslin',
    host: 'localhost',
    database: 'zroslin',
    password: 'zroslin',
    port: 5432,
});

async function getUserByName(username) {
    try {
        const result = await pool.query('SELECT id, username, password FROM users WHERE username = $1', [username]);
        return result.rows.length === 1 ? result.rows[0] : null;
    } catch (err) {
        throw err;
    }
}

async function checkIfUserExistsByName(username) {
    try {
        const result = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
        return result.rows.length === 0 ? false : true
    } catch (err) {
        throw err;
    }
}

async function checkIfUserExistsByEmail(email) {
    try {
        const result = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
        return result.rows.length === 0 ? false : true
    } catch (err) {
        throw err;
    }
}

async function createUser(username, email, password) {
    try {
        await pool.query('INSERT INTO users(username, email, password) VALUES($1, $2, $3)', [username, email, password])
    } catch (err) {
        throw err;
    }
}

module.exports = { getUserByName, checkIfUserExistsByName, checkIfUserExistsByEmail, createUser };