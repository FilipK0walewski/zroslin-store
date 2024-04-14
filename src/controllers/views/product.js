const db = require('../../db/index')
const { getCategoryBySlug, getRootCategories, getSubcategories } = require('../../queries/category')

const renderProductsPage = async (req, res) => {
    let { q, kategoria, sortowanie, strona } = req.query;
    strona = parseInt(strona) || 1
    if (typeof q === 'string' && q.length === 0) {
        let redirectString = '/produkty', queryParams = [];
        if (kategoria) { queryParams.push(`kategoria=${kategoria}`) }
        if (sortowanie) { queryParams.push(`sortowanie=${sortowanie}`) }
        if (strona) { queryParams.push(`strona=${strona}`) }
        if (queryParams.length !== 0) redirectString = redirectString + '?' + queryParams.join('&')
        return res.redirect(redirectString)
    }
    const category = await db.query(getCategoryBySlug, kategoria)
    const categoryQuery = category.length === 0 ? getRootCategories : getCategoryBySlug 
    const subcategories = await db.query(categoryId, categoryParentId)
    const categories = await db.getCategories(kategoria);
    const [products, numberOfPages] = await db.getProducts(q, categories, sortowanie, strona)
    res.render('products', { products, subcategories, numberOfPages, q, kategoria, sortowanie, strona })
}

const renderProductDetailPage = async (req, res) => {

}


module.exports = {
    renderProductsPage,
    renderProductDetailPage
}