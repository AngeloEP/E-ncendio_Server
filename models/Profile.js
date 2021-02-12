const mongoose = require('mongoose')

const ProfileSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    level_image_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Level'
    },
    level_word_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Level'
    },
    level_four_image_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Level'
    },
    league_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League'
    },
    score: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('Profile', ProfileSchema);