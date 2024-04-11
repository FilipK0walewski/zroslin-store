const selectAddress = `SELECT first_name, second_name, phone, email, city, zipcode, street, building, flat FROM addresses WHERE id = $1`

const insertAddress = `
    INSERT INTO addresses (first_name, second_name, phone, email, city, zipcode, street, building, flat) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
`

const updateAddress = `
    UPDATE addresses
    SET 
    first_name = $1,
    second_name = $2,
    phone = $3,
    email = $4,
    city = $5,
    zipcode = $6,
    street = $7,
    building = $8,
    flat = $9
    WHERE id = $10
`

const selectOrder = `SELECT shipping_method, address_id,  WHERE id = $1`

const updateOrderShippingMethod = `UPDATE orders SET shipping_method = $1 WHERE id = $2`

const updatePaymentAmount = `UPDATE payments SET amount = $1, status = $2 WHERE order_id = $3`

const selectOrderItems = `
    SELECT oi.product_id, oi.quantity, p.slug FROM order_items oi JOIN products p ON oi.product_id = p.id  WHERE order_id = $1
`

const insertOrderItem = `INSERT INTO order_items (product_id, order_id, quantity, price) VALUES ($1, $2, $3, $4)`

const deleteOrderItems = `DELETE FROM order_items WHERE order_id = $1`

module.exports = {
    selectAddress,
    insertAddress,
    updateAddress,
    selectOrder,
    updatePaymentAmount,
    selectOrderItems,
    insertOrderItem,
    deleteOrderItems
}