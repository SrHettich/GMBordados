const express = require('express')
require('dotenv').config()
const req = require('express/lib/request')
const rota = express.Router()
const mongoose = require('mongoose')
require("../models/Usuario")
const Usuario = mongoose.model("usuarios")
const bcrypt = require('bcrypt')
const passport = require("passport")
const multer  = require('multer')
const {eAdmin} = require('../helpers/eAdmin')
const {eClient} = require('../helpers/eClient')
require("../models/Pedido")
const Pedido = mongoose.model('pedidos')
const nodemailer = require("nodemailer")
const crypto = require('crypto')



rota.get("/", (req, res) =>
{
    res.render("usuario/index")
})

rota.get("/registrar", (req, res) =>
{
    res.render("usuario/registrar")
})

rota.post("/registro", (req, res) =>
{
    
    function validateEmail(email) 
    {
        const regex = /^[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+.[a-zA-Z]$/
        return regex.test(email)
        
    }

    var erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null)
    {
        erros.push({texto: "Insira um nome válido!"})
    }

     if(req.body.nome.length < 2)
    {
        erros.push({texto: 'Nome do cliente precisa ter mais de 1 caractére'})
    }

    if(!req.body.email || typeof req.body.email == undefined || req.body.email == null || !validateEmail(req.body.email))
    {
        erros.push({texto: "Email inválido!"})
    }
    
    if(!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null)
    {
        erros.push({texto: "Insira uma senha válida!"})
    }

    if(req.body.senha.length < 6)
    {
        erros.push({texto: "Senha precisar ter ao menos 6 caractéres!"})
    }

    if(req.body.senha != req.body.senha2)
    {
        erros.push({texto: "As senhas são diferentes, tente novamente!"})
    }

    if(erros.length > 0)
    {
        res.render('usuario/registrar', {erros: erros})
    }

    else
    {
        Usuario.findOne({email: req.body.email}).then((usuario) =>
        {
            if(usuario)
            {
                req.flash('error_msg', "Já existe um usuário com esse email em nosso sistema!")
                res.redirect('/usuario/registrar')
            }
            else
            {
                const novoUsuario =
                {
                nome:req.body.nome,
                email:req.body.email,
                senha:req.body.senha
                }

            bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(novoUsuario.senha, salt, function(err, hash) {
                        
                        if(err)
                        {
                            req.flash('error_msg', "Houve um erro ao cadastrar o usuário!")
                            res.redirect('/usuario/registrar')
                        }

                        novoUsuario.senha = hash
                        
                        new Usuario(novoUsuario).save().then(() =>
                        {
                           req.flash('success_msg', "Cadastro realizado com sucesso!")

                           async function main()
    {
        const user = "jeann1.hettich@gmail.com"
        const pass = process.env.SENHA

        const transporter = nodemailer.createTransport(
            {
                host: "smtp.gmail.com",
                port: 587,
                service: "gmail",
                secure: false,
                auth: {user, pass}
            })

            let info = await transporter.sendMail({
                from: user,
                to: req.body.email,
                replyTo: "jeann.hettich@gmail.com",
                subject: "Sua conta foi criada com sucesso!",
                text: "Muito obrigado por se cadastrar em nosso site, seja bem-vindo!"
            }).then(info =>
                {
                    res.redirect('/')
                    
                })
            } main().catch(console.error)
                           
                           
                        }).catch((erro) =>
                        {
                           req.flash('error_msg', "Houve um erro ao realizar o cadastro!")
                           res.redirect("/usuario/registrar")
                        })

                        

                    })
                })

            }
        }).catch((erro) =>
        {
            req.flash('error_msg', "Houve um erro interno!")
            res.redirect('/usuario/registrar')
            console.error()
        })   
    }
})

rota.get('/login', (req, res) =>
{
    res.render('usuario/login')
})

rota.post('/login', (req, res, next) =>
{
    passport.authenticate("local", 
    {
        successRedirect: "/",
        failureRedirect: "/usuario/login",
        failureFlash: true,
        successFlash: true
    })(req, res, next)

    
})

rota.get("/pedidos", eClient,(req, res) =>
{
    const pageOptions = {
        page: parseInt(req.query.page, 10) || 0
    }

    

    Pedido.find({email: req.user.email},{}, {skip: 10 * pageOptions.page,limit: 10}).sort({data: 'desc'}).lean().then((pedidos) =>
    {
        res.render('usuario/meuspedidos', {pedidos:pedidos})
    }).catch((erro) =>
    {
        req.flash("error_msg", "Houve um erro")
        res.redirect("/")
    })
    
})

rota.post('/pedidos/pesquisa', eClient,(req, res) =>
{
    if(req.user.eAdmin == 0)
    {
    Pedido.find({pedido: new RegExp(req.body.pesquisa, 'gi')} && {email: new RegExp(req.user.email)}).lean().then((pedidos) =>
    {
        res.render('usuario/meuspedidos', {pedidos:pedidos})
    }).catch((erro) =>
    {
        req.flash('error_msg', "Houve um erro ao tentar pesquisar!")
        res.redirect('/usuario/pedidos')
    })}
    else
    {
        Pedido.find({pedido: new RegExp(req.body.pesquisa, 'gi')}).lean().then((pedidos) =>
        {
            res.render('usuario/meuspedidos', {pedidos:pedidos})
        }).catch((erro) =>
        {
            req.flash('error_msg', "Houve um erro ao tentar pesquisar!")
            res.redirect('/usuario/pedidos')
        })
    }
    
})

rota.get("/logout", eClient, (req,res,next)=>{
    req.logOut((err)=>{
        if(err){return next(err)}    
    req.flash('success_msg', "Você saiu de sua conta!")
    res.redirect("/")
    })
})

rota.get("/pedidos/edit/:id", (req, res) => 
{
    Pedido.findOne({_id:req.params.id}).lean().then((pedido) =>
    
    {
    res.render("usuario/editpedidos", {pedido: pedido})
}).catch((err) =>
{
    req.flash("error_msg", "Este pedido não existe")
    res.redirect("/usuario/pedidos")
})
})

rota.get("/forgot_password", (req, res) =>
{
    res.render('usuario/forgotpassword')
})

rota.post("/forgot_password", async (req, res) =>
{
    const {email} = req.body 
    try{
    const user = await Usuario.findOne({email})

    if(!user)
    {
        req.flash('error_msg', "Esse usuário não existe! ")
    }

    const token = crypto.randomBytes(20).toString('hex')

    const now = new Date()
    now.setHours(now.getHours() + 1)

    await Usuario.findByIdAndUpdate(user.id,
        {
            '$set':{
                token: token,
                passwordResetExpires: now
            }
        })

        async function main()
    {
        const user = "jeann1.hettich@gmail.com"
        const pass = process.env.SENHA

        const transporter = nodemailer.createTransport(
            {
                host: "smtp.gmail.com",
                port: 587,
                service: "gmail",
                secure: false,
                auth: {user, pass}
            })

            let info = await transporter.sendMail({
                from: user,
                to: email,
                replyTo: "jeann.hettich@gmail.com",
                subject: "Esqueceu sua senha?",
                html: `Use esse token ${token}`,
                context: { token }
            }).then(info =>
                {
                    res.redirect('/usuario/reset_password')
                    
                })
            } main().catch(console.error)

    } catch(erro)
    {
        req.flash('error_msg', "Erro ao recuperar senha, tente novamente!")
        res.redirect('/usuario/forgot_password')
    }
})

rota.get('/reset_password', (req, res) =>
{
    res.render('usuario/resetpassword')
})

rota.post('/reset_password', async (req, res) =>
{
    const { email, token, senha, senha2} = req.body

    var erros = []

    try
    {
        const user = await Usuario.findOne({email}).select('+passwordResetExpires token')

    if(!user)
    {
        erros.push({texto: "Usuário não encontrado, tente novamente"})
    }

    if(token !== user.token)
    {
        erros.push({texto: "Token inválido!"})
    }

    if(senha.length < 6 || !senha || typeof senha == undefined || senha == null)
    {
        erros.push({texto: "Insira uma senha válida, a senha deve conter ao menos 6 caractéres"})
    }

    if(senha !== senha2)
    {
        erros.push({texto: "As senhas são diferentes, tente novamente!"})
    }

    const now = new Date()

    if(user.passwordResetExpires > now)
    {
        req.flash('error_msg', "O Token expirou, solicite um novo")
    }

    if(erros.length > 0)
    {
        res.render('usuario/resetpassword', {erros: erros})
    }

    else
    {

        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(senha, salt, function(err, hash) {

                if(err)
                {
                    req.flash('error_msg', "Houve um erro ao redefinir senha, tente novamente")
                    res.render('/usuario/reset_password')
                }

                user.senha = hash

                user.save()

    req.flash('success_msg', "Senha redefinida com sucesso!")
    res.redirect('/usuario/login')
            })})
    
    }


    } catch(erro)
    {
        req.flash('error_msg', "Houve um erro ao redefinir a senha, tente novamente")
        res.redirect('/')
    }
    
})
module.exports = rota