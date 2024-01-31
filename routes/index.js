const express = require('express');

const db = require('../utils/db');
const { generateToken, verifyToken } = require('../utils/jwtHelper');
const { hashPassword } = require('../utils/bcryptHelper');

const router = express.Router()

router.get('/', (req, res) => {
  res.render('index')
})

router.get('/regulamin-sklepu', (req, res) => {
  res.render('rules')
})

router.get('/produkty', (req, res) => {
  res.render('products')
})

router.get('/konto', (req, res) => {
  res.redirect('logowanie')
})

router.get('/logowanie', (req, res) => {
  res.render('login', { message: null });
})

router.post('/logowanie', async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
  const user = await db.getUserByName(username); 
  if (user === null) {
    return res.render('login', { message: `Użytkownik o nazwie "${username}" nie istnieje.` });
  }
  console.log(user)
  res.render('login', { message: `${username}, ${password}` });
});

router.get('/rejestracja', (req, res) => {
  res.render('register')
})

router.post('/rejestracja', async (req, res) => {
  const { username, email, password0, password1 } = req.body;
  console.log(username, email, password0, password1)
  if (await db.checkIfUserExistsByName(username)) {
    return res.render('register', { errMessage: `Użytkownik o nazwie "${username}" już istnieje.` });
  }
  if (await db.checkIfUserExistsByEmail(email)) {
    return res.render('register', { errMessage: `Adres email "${email}" już istnieje.` });
  }
  if (password0 === undefined || password0 === null || password0.length === 0) {
    return res.render('register', { errMessage: 'Niepoprawne hasło.' });
  }
  if (password0 !== password1) {
    return res.render('register', { errMessage: 'Hasła nie są takie same.' });
  }
  const hashedPassword = await hashPassword(password0)
  await db.createUser(username, email, hashedPassword)
  res.render('login', { message: `Użytkownik "${username}" utworzony, możesz się zalogować` });
})

router.get('/koszyk', (req, res) => {
  res.send('Twój koszyk')
})

router.get('/kontakt', (req, res) => {
  res.send('Kontakt')
})


module.exports = router