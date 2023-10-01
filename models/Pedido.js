const { text } = require("body-parser")
const mongoose = require("mongoose")
const Schema = mongoose.Schema
const data = new Date()


const dia = String(data.getDate()).padStart(2, '0')
const mes = String(data.getMonth() + 1).padStart(2, '0')
const ano = data.getFullYear()

const hoje = `${dia}/${mes}/${ano}`



//Model

const Pedido = new Schema(
    {
        cliente:
        {
            type: String,
            require: true
        },
        
        pedido:
        {
            type: String,
            require: true
        },

        descri:
        {
            type: String,
            require: true
        },

        quant:
        {
            type: Number,
            require: true
        },

        arquivo:
        {
            type: String,
            require: true
        },

        data:
        {
            type: String,
            
        },

        estado:
        {
            type: String,
            default: "Em andamento..."
        },
        email:
        {
            type: String,
            require: true
        }

    })

    

mongoose.model("pedidos", Pedido)