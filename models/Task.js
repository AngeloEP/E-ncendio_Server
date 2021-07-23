const mongoose = require('mongoose')

const TaskSchema = mongoose.Schema({
    league_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League'
    },
    message: {
        type: String,
    },
    type: { // Image, Word, Hangman, Tip, Profile, Login, 
        type: String,
    },
    mode: { // counts, uploads, vieweds, logins
        type: String,
    },
    total: {
        type: Number,
    }
})

module.exports = mongoose.model('Task', TaskSchema);