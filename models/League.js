const mongoose = require('mongoose')

const LeagueSchema = mongoose.Schema({
    level: {
        type: Number,
        required: true,
        trim: true
    }
})

module.exports = mongoose.model('League', LeagueSchema);