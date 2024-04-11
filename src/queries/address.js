const insertAddress = `
    INSERT INTO addressess (first_name, second_name, phone, email, city, zipcode, street, building, flat) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
`

const updateAddress = `
    UPDATE addressess
    SET 
    first_name = $1,
    second_name = $2,
    phone = $3,
    email = $4,
    city = $5,
    zipcode = $6,
    street = $7,
    building = $8,
    flat = $10
    WHERE id = $10
`

module.exports = {
    insertAddress,
    updateAddress
}