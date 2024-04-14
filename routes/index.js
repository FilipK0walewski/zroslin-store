const express = require('express');
console.log(process.env.STRIPE_KEY)
const stripe = require("stripe")(process.env.STRIPE_KEY);

const db = require('../utils/db');
const helpers = require('../utils/helpers')
const queries = require('../src/queries')

const { generateToken, verifyToken } = require('../utils/jwtHelper');
const { hashPassword, doPasswordsMatch } = require('../utils/bcryptHelper');
const { cartMiddleware, globalMessagesMiddleware, sessionMiddleware } = require('../utils/middlewares')

const router = express.Router()
router.use(verifyToken)
router.use(cartMiddleware)
router.use(globalMessagesMiddleware)
router.use(sessionMiddleware)

const controller = require('../controllers/views')

router.get('/', controller.renderHomePage)

router.get('/produkty', async (req, res) => {
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
  const [categoryId, categoryParentId, categoryName] = await db.getCategoryData(kategoria)
  const subcategories = await db.getSubcategories(categoryId, categoryParentId)
  const categories = await db.getCategories(kategoria);
  const [products, numberOfPages] = await db.getProducts(q, categories, sortowanie, strona)
  res.render('products', { products, subcategories, numberOfPages, q, kategoria, sortowanie, strona })
})

router.get('/produkty/:slug', async (req, res) => {
  const [product, images] = await db.getProductData(req.params.slug)
  if (product === null) {
    return res.send('404')
  }
  res.render('product', { product, images })
})

router.get('/konto', async (req, res) => {
  if (!req.user) {
    return res.redirect('/logowanie')
  }
  const email = await db.getUserEmailByName(req.user.username)
  res.render('account', { user: req.user, email })
})

router.get('/logowanie', (req, res) => {
  if (req.user) {
    res.addGlobalMessage('Jesteś już zalogowany', 'info')
    return res.redirect('/konto')
  }
  res.render('login')
})

router.post('/logowanie', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.getUserByName(username);
  if (user === null) {
    return res.render('login', { loginValidationMessage: `Użytkownik o nazwie "${username}" nie istnieje.` });
  }
  if (!await doPasswordsMatch(password, user.password)) {
    return res.render('login', { loginValidationMessage: `Niepoprawne hasło.` });
  }
  const token = generateToken(user.username)
  res.cookie('jwt', token, { httpOnly: true, secure: true, sameSite: 'strict' })
  res.addGlobalMessage('Zostałeś zalogowany.', 'info')
  res.redirect('/konto')
});

router.get('/rejestracja', (req, res) => {
  if (req.user) {
    return res.redirect('/konto')
  }
  res.render('register')
})

router.post('/rejestracja', async (req, res) => {
  const { username, email, password0, password1 } = req.body;
  if (await db.checkIfUserExistsByName(username)) {
    return res.render('register', { registrationValidationMessage: `Użytkownik o nazwie "${username}" już istnieje.` });
  }
  if (await db.checkIfUserExistsByEmail(email)) {
    return res.render('register', { registrationValidationMessage: `Adres email "${email}" jest zajęty.` });
  }
  if (password0 === undefined || password0 === null || password0.length === 0) {
    return res.render('register', { registrationValidationMessage: 'Niepoprawne hasło.' });
  }
  if (password0 !== password1) {
    return res.render('register', { registrationValidationMessage: 'Hasła nie są takie same.' });
  }
  const hashedPassword = await hashPassword(password0)
  await db.createUser(username, email, hashedPassword)
  res.addGlobalMessage(`Użytkownik "${username}" utworzony, możesz się zalogować`, 'success')
  res.redirect('/logowanie')
})

router.get('/logout', (req, res) => {
  res.clearCookie('jwt')
  res.addGlobalMessage('Zostałeś poprawnie wylogowany.', 'info')
  res.redirect('/')
})

router.get('/koszyk', async (req, res) => {
  const [cart, totalAmount] = await res.getCartData()
  res.render('cart', { cart, totalAmount })
})

router.post('/koszyk/:slug', (req, res) => {
  res.addProductToCart(req.params.slug, req.body.ilosc)
  res.redirect(`/koszyk`)
})

router.post('/koszyk/usun/:slug', (req, res) => {
  res.deleteProductFromCart(req.params.slug)
  res.redirect('/koszyk')
})

router.get('/dostawa', (req, res) => {
  if (!req.session.cart || Object.keys(req.session.cart).length === 0) {
    res.addGlobalMessage('Twój koszyk jest pusty.', 'info')
    return res.redirect('/')
  }
  if (!req.session.shippingData) {
    req.session.shippingData = {
      name: 'Marcin',
      surname: 'Najman',
      phone: '123123123',
      email: 'marcin@gmail.com',
      city: 'Częstochowa',
      zipcode: '11-111',
      street: 'testowa',
      building: 1,
    }
  }
  res.render('shipping', { user: req.user, shippingData: req.session.shippingData })
})

router.post('/dostawa', (req, res) => {
  const formData = req.body
  if (!/^\d{9}$/.test(formData.phone)) {
    return res.render('shipping', { user: req.user, shippingData: formData, validationMessage: 'Niepoprawny numer telefonu.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    return res.render('shipping', { user: req.user, shippingData: formData, validationMessage: 'Niepoprawny adres email.' })
  }
  if (!/^\d{2}-\d{3}$/.test(formData.zipcode)) {
    return res.render('shipping', { user: req.user, shippingData: formData, validationMessage: 'Niepoprawny kod pocztowy.' })
  }
  if (!['inpostCourier'].includes(formData.shippingMethod)) {
    return res.render('shipping', { user: req.user, shippingData: formData, validationMessage: 'Niepoprawny metoda dostawy.' })
  }

  req.session.shippingMethod = formData.shippingMethod
  delete formData['shippingMethod']
  req.session.shippingData = formData
  res.redirect('/podsumowanie')
})

router.get('/podsumowanie', async (req, res) => {
  if (!req.session.cart || Object.keys(req.session.cart).length === 0) {
    res.addGlobalMessage('Twój koszyk jest pusty.', 'info')
    return res.redirect('/')
  } else if (!req.session.shippingData) {
    res.addGlobalMessage('Uzupełnij dane dostawy.', 'info')
    return res.redirect('/dostawa')
  }

  const [cart, cartAmount] = await res.getCartData()
  const totalAmount = cartAmount * 100 + 1576

  if (!req.session.order) {
    // CREATE ADDRESS
    const addressResult = await db.pool.query(queries.insertAddress, [
      req.session.shippingData.name,
      req.session.shippingData.surname,
      req.session.shippingData.phone,
      req.session.shippingData.email,
      req.session.shippingData.city,
      req.session.shippingData.zipcode,
      req.session.shippingData.street,
      req.session.shippingData.building,
      req.session.shippingData.flat,
    ])
    const addressId = addressResult.rows[0].id

    // CREATE ORDER
    let userId = null
    if (req.user) {
      const userResult = await db.pool.query('SELECT id FROM users WHERE username = $1', [req.user.username])
      userId = userResult.rows[0].id
    }

    const orderResult = await db.pool.query(
      'INSERT INTO orders (shipping_method, user_id, session_id, address_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.session.shippingMethod, userId, req.session.id, addressId]
    )
    const orderId = orderResult.rows[0].id

    for (let i = 0; i < cart.length; i++) {
      const cartItem = cart[i]
      const quantity = req.session.cart[cartItem.slug]
      await db.pool.query(queries.insertOrderItem, [cartItem.id, orderId, quantity, cartItem.price])
    }

    // CREATE PAYMENT
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'pln'
    })

    await db.pool.query(
      'INSERT INTO payments (amount, currency, stripe_payment_id, client_secret, order_id, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [paymentIntent.amount, paymentIntent.currency, paymentIntent.id, paymentIntent.client_secret, orderId, paymentIntent.status]
    )
    req.session.order = { id: orderId, addressId, paymentId: paymentIntent.id, paymentClientSecret: paymentIntent.client_secret }
  } else {
    const orderId = req.session.order.id

    // CHECK IF ADDRESS CHANGED
    const addressResult = await db.pool.query(queries.selectAddress, [req.session.order.addressId])
    const addressData = addressResult.rows[0]
    if (helpers.doObjectsAreEqual(addressData, req.session.shippingData) === false) {
      await db.pool.query(queries.updateAddress, [
        req.session.shippingData.name,
        req.session.shippingData.surname,
        req.session.shippingData.phone,
        req.session.shippingData.email,
        req.session.shippingData.city,
        req.session.shippingData.zipcode,
        req.session.shippingData.street,
        req.session.shippingData.building,
        req.session.shippingData.flat,
        req.session.order.addressId
      ])
    }

    // CHECK IF CART CHANGED
    const orderItemsResult = await db.pool.query(queries.selectOrderItems, [orderId])
    const currentCartMap = {}
    for (let orderItem of orderItemsResult.rows) {
      currentCartMap[orderItem.slug] = orderItem.quantity
    }

    if (helpers.doObjectsAreEqual(currentCartMap, req.session.cart) === false) {
      // UPDATE ORDER ITEMS IN DATABASE
      await db.pool.query(queries.deleteOrderItems, [orderId])
      for (let i = 0; i < cart.length; i++) {
        const cartItem = cart[i]
        const quantity = req.session.cart[cartItem.slug]
        await db.pool.query(queries.insertOrderItem, [cartItem.id, orderId, quantity, cartItem.price])
      }

      // UPDATE STRIPE PAYMENT INTENT
      const paymentIntent = await stripe.paymentIntents.update(
        req.session.order.paymentId, { amount: totalAmount }
      );

      // UPDATE DATABSE PAYMENT
      await db.pool.query(queries.updatePaymentAmount, [totalAmount, paymentIntent.status, orderId])
    }
  }

  res.render('checkout', {
    clientSecret: req.session.order.paymentClientSecret,
    cart,
    totalAmount,
    shippingData: req.session.shippingData
  })
})

router.get('/kontakt', (req, res) => {
  res.send('Kontakt')
})

router.get('/regulamin-sklepu', (req, res) => {
  res.render('rules')
})

router.get('/potwierdzenie-platnosci', async (req, res) => {
  const { payment_intent, payment_intent_client_secret, redirect_status } = req.query
  const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent)
  const paymentResult = await db.pool.query(
    'UPDATE payments SET status = $3, redirect_status = $4 WHERE stripe_payment_id = $1 AND client_secret = $2 RETURNING order_id',
    [payment_intent, payment_intent_client_secret, paymentIntent.status, redirect_status]
  )
  const orderId = paymentResult.rows[0].order_id
  res.render('paymentConfirmation', { orderId, status: paymentIntent.status })
})

router.post('/webhook-test', async (req, res) => {
  const event = req.body;

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(paymentIntent)

      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
    case 'payment_intent.created':
      console.log(event.data.object);
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
});

router.get('/test', (req, res) => {
  res.render('test')
})

module.exports = router