const getCategoryBySlug = `SELECT id, name, slug, parent_id FROM categories WHERE slug = $1`

const getRootCategories = `SELECT name, slug FROM categories WHERE parent_id IS NULL`

const getSubcategories = `SELECT name, slug FROM categories WHERE parent_id = $1`

module.exports = {
    getCategoryBySlug,
    getRootCategories,
    getSubcategories
}