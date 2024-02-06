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

async function getUserEmailByName(username) {
    try {
        const result = await pool.query('SELECT email FROM users WHERE username = $1', [username]);
        return result.rows.length === 1 ? result.rows[0].email : null;
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

async function getCategories(categorySlug) {
    try {
        const result = await pool.query('SELECT * FROM GetCategoryHierarchy($1)', [categorySlug])
        return result.rows
    } catch (err) {
        throw err;
    }
}

async function getProducts(q, categories, sort, page) {
    try {
        const limit = 24;
        let offset = 0;
        if (page) {
            offset = (page - 1) * limit;
        }

        let orderBy = 'id';
        let direction = 'ASC'

        if (sort) {
            const matches = sort.match(/^([-+](\w+))$/);            
            if (matches) {
                const [sign, column] = matches;
                orderBy = column
                direction = sign === '-' ? 'DESC' : 'ASC'
            }
        }
        
        let queryConditions = ''
        const values = []
        if (q) {
            queryConditions += ' AND name ILIKE $' + (values.length + 1)
            values.push(`%${q}%`)
        }
        if (categories.length !== 0 && categories.length != 31) {
            queryConditions += ' AND (1 = 0'
            for (let category of categories) {
                queryConditions += ' OR category_id = $' + (values.length + 1)
                values.push(category.id)
            }
            queryConditions += ')'
        }

        const query = `
            SELECT name, slug, price,
            (SELECT url FROM images where product_id = p.id ORDER BY id LIMIT 1) AS image
            FROM products p
            WHERE 1 = 1
            ${queryConditions}
            ORDER BY ${orderBy} ${direction} LIMIT ${limit} OFFSET ${offset}
        `
        
        console.log(query)
        const countQuery = `SELECT COUNT(1) AS count FROM products WHERE 1 = 1${queryConditions}`
        
        const result = await pool.query(query, values)
        const countResult = await pool.query(countQuery, values)
        return [result.rows, Math.ceil(countResult.rows[0].count / limit)];
    } catch (err) {
        throw err;
    }
}

async function getProduct(productSlug) {
    try {
        const result = await pool.query('SELECT * FROM products WHERE slug = $1', [productSlug])
        return result.rows.length === 0 ? null : result.rows[0]
    } catch (err) {
        throw err;
    }
}

module.exports = { 
    getUserByName, 
    getUserEmailByName, 
    checkIfUserExistsByName, 
    checkIfUserExistsByEmail, 
    createUser,
    getCategories,
    getProducts,
    getProduct
};