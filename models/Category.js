const mongoose = require('mongoose')

const CategorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    isVisible: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: String,
    },
    updatedAt: {
        type: String,
    }
})

module.exports = mongoose.model('Category', CategorySchema);