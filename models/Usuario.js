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
    city: {
        type: String,
        required: true,
        trim: true
    },
    fireRelation: {
        type: String,
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
    isBlocked: {
        type: Boolean,
        default: false,
        trim: true
    },
    isFireRelated: {
        type: Boolean,
        required: true,
        trim: true
    },
    isAdmin: {
        type: Boolean,
        required: true,
        trim: true
    },

    // geometry: [{
    //     type: Number,
    // }],
    registerAt: {
        type: String,
    }
})

UsuariosSchema.methods.setImagegUrl = function setImagegUrl(filename) {
    console.log("filename: ", filename)
    const { PORT, AWS_HOST } = process.env
    this.urlFile = `${AWS_HOST}/profile_images/${filename}`
}

module.exports = mongoose.model('Usuario', UsuariosSchema);