const mongoose = require('mongoose')

const ImagesSchema = mongoose.Schema({
    filename: {
        type: String,
        required: true,
        trim: true
    }
})

module.exports = mongoose.model('Image', ImagesSchema);