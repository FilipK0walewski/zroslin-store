const bcrypt = require('bcrypt');

module.exports = {
    async hashPassword(plainPassword) {
        return await bcrypt.hash(plainPassword, 10)
    },
    async doPasswordsMatch(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword)
    }
}