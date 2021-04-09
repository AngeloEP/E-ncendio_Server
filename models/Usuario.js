const mongoose = require('mongoose')

const UsuariosSchema = mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        trim: true // Eliminar espacios en blanco
    },
    lastname: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        required: true,
        trim: true
    },
    phone: {
        type: Number,
        required: true,
        trim: true
    },
    urlFile: {
        type: String
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    isExpert: {
        type: Boolean,
        required: true,
        trim: true
    },
    register: {
        type: Date,
        default: Date.now()
    }
})

UsuariosSchema.methods.setImagegUrl = function setImagegUrl(filename) {
    console.log("filename: ", filename)
    const { PORT, APP_HOST } = process.env
    this.urlFile = `${APP_HOST}:${PORT}/public/profile_images/${filename}`
}

module.exports = mongoose.model('Usuario', UsuariosSchema);