const mongoose = require('mongoose')

const LevelSchema = mongoose.Schema({
    level: {
        type: Number,
        required: true,
        trim: true
    }
})

module.exports = mongoose.model('Level', LevelSchema);