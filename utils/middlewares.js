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

function authMiddleware(req, res, next) {
    
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

module.exports = { cartMiddleware, globalMessagesMiddleware }