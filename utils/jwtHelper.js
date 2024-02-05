const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET || 'your_secret_key';

module.exports = {
    generateToken(username) {
        return jwt.sign({ username }, secretKey);
    },
    verifyToken(req, res, next) {
        const token = req.cookies.jwt;
        if (token) {
            jwt.verify(token, secretKey, (err, decoded) => {
                if (err) {
                    res.clearCookie('jwt')
                } else {
                    req.user = decoded
                    res.locals.user = decoded
                }
            })
        }
        next()
    }
};