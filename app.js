//Dependencias
const express = require('express')
require('dotenv').config()
const { engine } = require('express-handlebars')
const bodyParser = require('body-parser')
const app = express()
const admin = require('./router/admin')
const path = require('path')
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('connect-flash')
const moment = require('moment')
require("./models/Pedido")
const usuario = require("./router/usuario")
//Config
const multer = require('multer')
const eAdmin = require("./helpers/eAdmin")
const db = require('./config/db')
const cookie = require('cookie-session')
const MongoStore = require('connect-mongo')

const passport = require("passport")

require('./config/auth')(passport)


//Sessão
app.use(session({
    store: MongoStore.create({ mongoUrl: db.mongoURI }),
    secret: 'foo',
    saveUninitialized: true,
    resave: false
  }));
  
//passport
app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

//Midleware
app.use((req, res, next) =>
{
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    res.locals.user = req.user || null
    res.locals.eAdmin = req.user ? req.user.eAdmin == 1 ? req.user.eAdmin: null:null
    next()
})
//body-parser
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

//handlebars
app.engine('handlebars', engine({
    defaultLayout: 'main',

}))
app.set('view engine', 'handlebars')
app.set('views', './views')

//mongoose
mongoose.Promise = global.Promise
mongoose.connect(db.mongoURI).then(() =>
{
    console.log('Conectado ao mongo!')
}).catch((console.error()))

//public
app.use(express.static(path.join(__dirname, 'public')))

//Rotas
app.use('/admin', admin)

app.use('/usuario', usuario)

app.get('/', (req, res) =>
{
    res.render("index")
})

//multer
var storage = multer.diskStorage({
    filename: function(req, file, cb)
    {
        let nome = Date.now()+"-"+file.originalname
        cb(null, nome)
    },
    destination: function(req, file, cb)
    {
        let path = "/images"
        cb(null, path)
    }
})

var upload = multer({storage})
module.exports = upload



//Outros
const PORT =  process.env.PORT ||3000
app.listen(PORT, () =>
{
    console.log("Rodando!")
})