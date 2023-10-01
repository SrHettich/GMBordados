const express = require('express')
const req = require('express/lib/request')
const rota = express.Router()
const mongoose = require('mongoose')
require("../models/Pedido")
const Pedido = mongoose.model('pedidos')
const multer  = require('multer')
const {eAdmin} = require('../helpers/eAdmin')
const {eClient} = require('../helpers/eClient')
const nodemailer = require("nodemailer")
require("../models/Usuario")
const Usuario = mongoose.model('usuarios')
require('../config/multer')

const aws = require('aws-sdk')
const multerS3 = require('multer-s3')

aws.config.update(
    {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.ACCESS_KEY_SECRET,
        region: process.env.DEFAULT_REGION
    }
)


const upload = multer({
    storage: multerS3({
        s3: new aws.S3(),
        bucket: 'upload-gmbordados',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read',
        key: function(req, file, cb)
        {
            let nome = Date.now()+"-"+file.originalname
            cb(null, nome)
        }
    })
})




rota.post("/pedidos/novo", eClient, upload.single('arquivo'),  (req, res) =>
{
    const data = new Date()

    const dia = String(data.getDate()).padStart(2, '0')
const mes = String(data.getMonth() + 1).padStart(2, '0')
const ano = data.getFullYear()

const hora = String(data.getHours() - 3).padStart(2, '0')
const min = String(data.getMinutes()).padStart(2, '0')
const seg = String(data.getSeconds()).padStart(2, '0')

const now = `${dia}/${mes}/${ano} | ${hora}:${min}:${seg}`

    var erros = []
    
    if(!req.body.cliente || typeof req.body.cliente == undefined || req.body.cliente == null)
    {
        erros.push({texto: "Nome do cliente inválido!"})
    }

    if(req.body.cliente.length < 2)
    {
        erros.push({texto: 'Nome do cliente precisa ter mais de 1 caractére'})
    }

    if(!req.body.pedido || typeof req.body.pedido == undefined || req.body.pedido == null)
    {
        erros.push({texto: "Nome do pedido inválido!"})
    }

    if(!req.body.quant || typeof req.body.quant == undefined || req.body.quant == null || req.body.quant < 1)
    {
        erros.push({texto: "Insira uma quantidade válida"})
    }

    if(req.file === null || req.file === undefined )
    {
        erros.push({texto: "Insira um arquivo que corresponda ao seu pedido!"})
        
    }

    if(erros.length > 0)
    {
        res.render('usuario/meuspedidos', {erros: erros})
    }
else{    if(!req.body.descri || typeof req.body.descri == undefined || req.body.descri == null || req.body.descri.length == 0)
    {
        req.body.descri = '(SEM DESCRIÇÃO)'
    }
    const novoPedido = 
    {
        cliente: req.body.cliente,
        pedido: req.body.pedido,
        descri: req.body.descri,
        quant: req.body.quant,
        arquivo: req.file.location,
        data: now,
        email: req.user.email
    }
    new Pedido(novoPedido).save().then(() =>
    {
        
        req.flash('success_msg', 'Pedido realizado com sucesso!')
        res.redirect('/usuario/pedidos')
    }).catch((erro) =>
    {
        req.flash('error_msg', 'Houve um erro ao realizar o pedido')
        res.redirect("/usuario/pedidos")
    })
}
})

rota.get("/pedidos", eAdmin,(req, res) =>
{
    const pageOptions = {
        page: parseInt(req.query.page, 10) || 0
        
    }

    Pedido.find({}, {},{skip:10 * pageOptions.page,limit: 10}).sort({data: 'desc'}).lean().then((pedidos) =>
    {
        res.render('admin/meuspedidos', {pedidos})
    }).catch((erro) =>
    {
        req.flash("error_msg", "Houve um erro")
        res.redirect("/")
    })
    
})





rota.get("/pedidos/edit/:id", (req, res) => 
{
    Pedido.findOne({_id:req.params.id}).lean().then((pedido) =>
    
    {
    res.render("usuario/editpedidos", {pedido: pedido})
}).catch((erro) =>
{
    req.flash("error_msg", "Este pedido não existe")
    res.redirect("/admin/pedidos")
})



})

rota.post("/pedidos/edit",upload.single('arquivo'), eClient,(req, res) =>


{
    const data = new Date()

    const dia = String(data.getDate()).padStart(2, '0')
const mes = String(data.getMonth() + 1).padStart(2, '0')
const ano = data.getFullYear()

const hora = String(data.getHours() -3).padStart(2, '0')
const min = String(data.getMinutes()).padStart(2, '0')
const seg = String(data.getSeconds()).padStart(2, '0')

const now = `${dia}/${mes}/${ano} | ${hora}:${min}:${seg}`




    var erros = []
    
    if(!req.body.cliente || typeof req.body.cliente == undefined || req.body.cliente == null)
    {
        erros.push({texto: "Nome do cliente inválido!"})
    }

    if(req.body.cliente.length < 2)
    {
        erros.push({texto: 'Nome do cliente precisa ter mais de 1 caractére'})
    }

    if(!req.body.pedido || typeof req.body.pedido == undefined || req.body.pedido == null)
    {
        erros.push({texto: "Nome do pedido inválido!"})
    }

    if(!req.body.quant || typeof req.body.quant == undefined || req.body.quant == null || req.body.quant < 1)
    {
        erros.push({texto: "Insira uma quantidade válida"})
    }

    if( typeof req.file.filename === undefined || req.file.filename == null || req.file.filename === 'undefined')
    {
        erros.push({texto: "Por favor insira um arquivo"})
    }
    if(erros.length > 0)
    {
        res.render('usuario/meuspedidos', {erros: erros})
    }
    
else{    
    
    if(!req.body.descri || typeof req.body.descri == undefined || req.body.descri == null || req.body.descri.length == 0)
    {
        req.body.descri = '(SEM DESCRIÇÃO)'
    }

    Pedido.where({_id:req.body.id}).updateOne(
        {
            cliente:req.body.cliente,
            pedido:req.body.pedido,
            descri:req.body.descri,
            quant:req.body.quant,
            arquivo:req.file.filename,
            data: now
        }
    ).then(() =>
    {
        req.flash("success_msg", "Pedido editado com sucesso!")
        res.redirect("/usuario/pedidos")
    }).catch((erro) =>
    {
        req.flash("error_msg", "Houve um erro ao editar pedido!")
        res.redirect("/usuario/pedidos")
    })
}})

rota.post("/pedidos/delete", eClient, (req, res) =>
{
    Pedido.deleteOne({_id:req.body.id}).then(() =>
    {
        req.flash('success_msg', "Pedido deletado com sucesso!")
        res.redirect("/usuario/pedidos")
    }).catch((erro) =>
    {
        req.flash("error_msg", "Houve um erro ao deletar o pedido!")
        res.redirect("/usuario/pedidos")
    })
})

rota.post("/pedidos/concluir", eAdmin, (req, res) => 
{
    Pedido.where({_id:req.body.id}).updateOne(
        {
            estado:req.body.estado = "Concluído"
        }).then(() =>
        {
            req.flash("success_msg", "Pedido concluído!")

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
                replyTo: "gmbordados@gmail.com",
                subject: "Seu pedido foi concluído!",
                text: "Muito obrigado por sua espera, seu pedido foi finalizado e está pronto para a retirada ou em breve entregaremos a você!"
            }).then(info =>
                {
                    res.redirect("/admin/pedidos")
                    
                })
            } main().catch(console.error)

            
        }).catch((erro) =>
        {
            req.flash("error_msg", "Houve um erro ao concluir o pedido!")
            res.redirect("/admin/pedidos")
        })
})

rota.get('/usuarios', eAdmin, (req,res) =>
{
    Usuario.find().lean().then((usuarios) =>
    {
        res.render("admin/usuarios", {usuarios:usuarios})
    }).catch((erro) =>
    {
        req.flash('error_msg', "Houve um erro ao listar usuários!")
        res.redirect('/')
    })
    
})

rota.post("/promover", eAdmin, (req,res) =>
{

            Usuario.where({email:req.body.email}).updateOne({eAdmin:req.body.eAdmin = 1}).then(() =>
            {
                req.flash('success_msg', "Promovido com sucesso!")
                res.redirect('/admin/usuarios')
            }).catch((erro) =>
            {
                req.flash('error_msg', "Erro ao promover usuário!")
                res.redirect('/admin/usuarios')
            })
})


rota.post("/rebaixar", eAdmin, (req,res) =>
{
    Usuario.where({email:req.body.email}).updateOne({eAdmin:req.body.eAdmin = 0}).then(() =>
                {
                    req.flash('success_msg', "Usuário rebaixado com sucesso!")
                    res.redirect('/admin/usuarios')
                }).catch((erro) =>
                {
                    req.flash('error_msg', "Houve um erro ao rebaixar o usuário!")
                    res.redirect('/')
                })
})

rota.post('/usuarios/pesq', eAdmin, (req,res) =>
{
    Usuario.find({email: new RegExp(req.body.pesqUsuario, 'gi')}).lean().then((usuarios) =>
    {
        res.render('admin/usuarios', {usuarios})
    }).catch((erro) =>
    {
        req.flash('error_msg', "Houve um erro ao pesquisar usuário!")
        res.redirect('/admin/usuarios')
    })
})


module.exports = rota
