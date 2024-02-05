const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const session = require('express-session');

const shop = require('./routes/index.js');
// const shop = require('./routes/api.js');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

app.use('/', shop);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});