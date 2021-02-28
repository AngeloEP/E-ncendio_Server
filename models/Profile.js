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
    league_image_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League'
    },
    league_word_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League'
    },
    league_four_image_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League'
    },
    score_image: {
        type: Number,
        required: true
    },
    score_word: {
        type: Number,
        required: true
    },
    score_four_image: {
        type: Number,
        required: true
    },
})

module.exports = mongoose.model('Profile', ProfileSchema);