const mongoose = require('mongoose')

const TagHangmanAssociationsSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    hangman_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hangman'
    },
    associatedWord: {
        type: String,
        required: true,
        trim: true
    }
})

module.exports = mongoose.model('TagHangmanAssociation', TagHangmanAssociationsSchema);