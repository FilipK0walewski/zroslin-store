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

module.exports = { globalMessagesMiddleware }