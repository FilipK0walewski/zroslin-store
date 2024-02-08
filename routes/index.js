const express = require('express');

const db = require('../utils/db');
const { generateToken, verifyToken } = require('../utils/jwtHelper');
const { hashPassword, doPasswordsMatch } = require('../utils/bcryptHelper');
const { globalMessagesMiddleware } = require('../utils/middlewares')

const router = express.Router()
router.use(verifyToken)
router.use(globalMessagesMiddleware)

router.get('/', (req, res) => {
  res.render('index')
})

router.get('/produkty', async (req, res) => {
  let { q, kategoria, sortowanie, strona } = req.query;
  if (typeof q === 'string' && q.length === 0) {
    let redirectString = '/produkty', queryParams = [];
    if (kategoria) { queryParams.push(`kategoria=${kategoria}`) }
    if (sortowanie) { queryParams.push(`sortowanie=${sortowanie}`) }
    if (strona) { queryParams.push(`strona=${strona}`) }
    if (queryParams.length !== 0) redirectString = redirectString + '?' + queryParams.join('&')
    return res.redirect(redirectString)
  }
  strona = parseInt(strona) || 1
  const [categoryId, categoryParentId, categoryName] = await db.getCategoryData(kategoria)
  const subcategories = await db.getSubcategories(categoryId, categoryParentId)
  const categories = await db.getCategories(kategoria);
  const [products, numberOfPages] = await db.getProducts(q, categories, sortowanie, strona)
  res.render('products', { products, subcategories, numberOfPages, q, kategoria, sortowanie, strona })
})

router.get('/produkty/:slug', async (req, res) => {
  const product = await db.getProduct(req.params.slug)
  if (product === null) {
    return res.send('404')
  }
  res.send(product.name)
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
    res.locals.test = 'Jesteś już zalogowany.'
    return res.redirect('/konto')
  }
  res.render('login');
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
  res.clearCookie('jwt');
  req.session.messages = [{ text: 'Zostałeś poprawnie wylogowany.', type: 'info' }]
  res.redirect('/');
})

router.get('/cart', (req, res) => {
  res.send('Twój koszyk')
})

router.get('/contact', (req, res) => {
  res.send('Kontakt')
})

router.get('/regulamin-sklepu', (req, res) => {
  res.render('rules')
})

module.exports = router