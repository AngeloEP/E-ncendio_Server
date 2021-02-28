const mongoose = require('mongoose')

const WordsSchema = mongoose.Schema({
    level_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Level'
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    difficulty: {
        type: String,
        required: true,
        trim: true
    },
    points: {
        type: Number,
        required: true,
    },
})

module.exports = mongoose.model('Word', WordsSchema);