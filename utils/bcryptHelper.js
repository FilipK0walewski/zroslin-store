const bcrypt = require('bcrypt');

module.exports = {
    async hashPassword(plainPassword) {
        return await bcrypt.hash(plainPassword, 10)
    },
    // async doPasswordMatch(password, hashedPassword) {

    // }
}