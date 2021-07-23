const mongoose = require('mongoose')

const DailyTaskSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    league_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League'
    },
    message: {
        type: String,
    },
    type: { // Image, Word, Hangman, Tip, Login, 
        type: String,
    },
    mode: { // counts, uploads, vieweds, logins
        type: String,
    },
    total: {
        type: Number,
    },
    newCount: {
        type: Number,
        default: 0
    },
    isClaimed: {
        type: Boolean,
    },
    isActivated: {
        type: Boolean,
    },
    createdAt: {
        type: String,
    },
    updatedAt: {
        type: String,
    }
})

module.exports = mongoose.model('DailyTask', DailyTaskSchema);