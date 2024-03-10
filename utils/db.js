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

async function getCategoryData(categorySlug) {
    try {
        const result = await pool.query('SELECT id, parent_id, name FROM categories WHERE slug = $1', [categorySlug])
        if (result.rows.length === 0) {
            return [null, null]
        }
        return [result.rows[0].id, result.rows[0].parent_id, result.rows[0].name]
    } catch (err) {
        throw err;
    }
}

async function getSubcategories(categoryId, parentId) {
    if (categoryId === null) {
        const result = await pool.query('SELECT name, slug FROM categories WHERE parent_id is null')
        return result.rows
    }
    const result = await pool.query('SELECT name, slug FROM categories WHERE parent_id = $1', [categoryId])
    if (result.rows.length !== 0) {
        return result.rows
    }
    const parentResult = await pool.query('SELECT name, slug FROM categories WHERE parent_id = $1', [parentId])
    return parentResult.rows
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

        let orderBy = 'name';
        let direction = 'ASC'

        if (sort) {
            orderBy = sort
            if (sort[0] === '-') {
                direction = 'DESC'
                orderBy = orderBy.substring(1)
            }
            if (orderBy === 'cena') {
                orderBy = 'price'
            } else if (orderBy === 'alfabetycznie') {
                orderBy = 'name'
            } else {
                orderBy = 'name'
                direction = 'ASC'
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

        const countQuery = `SELECT COUNT(1) AS count FROM products WHERE 1 = 1${queryConditions}`

        const result = await pool.query(query, values)
        const countResult = await pool.query(countQuery, values)
        return [result.rows, Math.ceil(countResult.rows[0].count / limit)];
    } catch (err) {
        throw err;
    }
}

async function getProductData(productSlug) {
    try {
        const result = await pool.query('SELECT id, slug, name, description, quantity, stock, price, color FROM products WHERE slug = $1', [productSlug])
        if (result.rows.length === 0) {
            return [null, null]
        }
        const imageResult = await pool.query('SELECT url FROM images WHERE product_id = $1', [result.rows[0].id])
        return [result.rows[0], imageResult.rows]
    } catch (err) {
        throw err;
    }
}

async function getProductDataForCart(productSlug) {
    try {
        const result = await pool.query('SELECT id, slug, name, quantity, stock, price FROM products WHERE slug = $1', [productSlug])
        if (result.rows.length === 0) {
            return [null, null]
        }
        let data = result.rows[0]
        const imageResult = await pool.query('SELECT url FROM images WHERE product_id = $1 limit 1', [result.rows[0].id])
        data['image'] = imageResult.rows[0].url
        return data
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
    getProductData,
    getProductDataForCart,
    getCategoryData,
    getSubcategories
};