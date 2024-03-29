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
    imageTagCount: {
        type: Number,
        default: 0
    },
    wordTagCount: {
        type: Number,
        default: 0
    },
    hangmanTagCount: {
        type: Number,
        default: 0
    },
    uniqueSelectionTagCount: {
        type: Number,
        default: 0
    },
    tipViewed: {
        type: Number,
        default: 0
    },
    editProfileCount: {
        type: Number,
        default: 0
    },
    uploadImageCount: {
        type: Number,
        default: 0
    },
    uploadWordCount: {
        type: Number,
        default: 0
    },
    uploadHangmanCount: {
        type: Number,
        default: 0
    },
    uploadUniqueSelectionCount: {
        type: Number,
        default: 0
    },
    uploadTipCount: {
        type: Number,
        default: 0
    },
    score: {
        type: Number,
        required: true
    },
    firePoints: {
        type: Number,
        default: 0,
    },
    frameUsed: {
        type: String,
        default: ""
    },
    frameUsedCss: {
        type: String,
        default: ""
    },
    nicknameUsed: {
        type: String,
        default: ""
    },
    dropLeague: {
        type: Boolean,
        default: false
    },
})

module.exports = mongoose.model('Profile', ProfileSchema);