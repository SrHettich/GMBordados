const { text } = require("body-parser")
const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Usuario = new Schema(
    {
        nome:{
            type: String,
            required: true
        },
        email:{
            type: String,
            required: true
        },

        eAdmin:{
            type: Number,
            default: 0
        },

        senha:{
            type: String,
            required: true
        },
        token:{
            type: String,
            select: false
        },
        passwordResetExpires:{
            type: String,
            select: false
        }
    })

mongoose.model("usuarios", Usuario)