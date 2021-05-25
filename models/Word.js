const mongoose = require('mongoose')

const WordsSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    level_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Level'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    difficulty: {
        type: String,
        default: "Ninguna",
        trim: true
    },
    points: {
        type: Number,
        default: 0,
    },
    isEnabled: {
        type: Boolean,
        required: true,
        trim: true
    },
    createdAt: {
        type: String,
    },
    updatedAt: {
        type: String,
    }
})

module.exports = mongoose.model('Word', WordsSchema);