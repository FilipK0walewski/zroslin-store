const db = require('../utils/db');

async function sessionMiddleware(req, res, next) {
    if (req.session) {
        if (!req.session.isSavedInDb) {
            await db.saveSessionId(req.session.id)
            req.session.isSavedInDb = true
        }
    }
    next()
}

function globalMessagesMiddleware(req, res, next) {
    if (req.session && req.session.messages) {
        res.locals.messages = req.session.messages
        delete req.session.messages
    }

    res.addGlobalMessage = function (text, type) {
        if (!req.session.messages) {
            req.session.messages = []
        }
        req.session.messages.push({ text, type })
    }

    next()
}

function cartMiddleware(req, res, next) {
    if (!req.session.cart) {
        req.session.cart = {}
    }

    if (req.session && req.session.cart) {
        let cartCount = 0
        Object.keys(req.session.cart).forEach(key => {
            cartCount += req.session.cart[key]
        })
        res.locals.cartCount = cartCount
    }

    res.getCartData = async () => {
        const cart = req.session.cart
        const slugList = Object.keys(cart)
        let cartList = [], totalAmount = 0
        for (let i = 0; i < slugList.length; i++) {
            const slug = slugList[i]
            let product = await db.getProductDataForCart(slug)
            product['userNumber'] = cart[slug]
            totalAmount += product.price * product['userNumber']
            cartList.push(product)
        }
        return [cartList, totalAmount]
    }

    res.addProductToCart = function (slug, quantity) {
        req.session.cart[slug] = parseInt(quantity)
    }

    res.incrementCartItem = (slug) => {
        req.session.cart[slug] += 1
    }

    res.decrementCartItem = (slug) => {
        req.session.cart[slug] -= 1
    }

    res.deleteProductFromCart = function (slug) {
        delete req.session.cart[slug]
    }

    next()
}

module.exports = { cartMiddleware, globalMessagesMiddleware, sessionMiddleware }