const express = require('express')
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
  res.render('login')
})

router.get('/rejestracja', (req, res) => {
  res.render('register')
})

router.get('/koszyk', (req, res) => {
    res.send('Twój koszyk')
})

router.get('/kontakt', (req, res) => {
  res.send('Kontakt')
})


module.exports = router