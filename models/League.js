const mongoose = require('mongoose')

const LeagueSchema = mongoose.Schema({
    league: {
        type: String,
        required: true,
        trim: true,
        unique: true
    }
})

module.exports = mongoose.model('League', LeagueSchema);