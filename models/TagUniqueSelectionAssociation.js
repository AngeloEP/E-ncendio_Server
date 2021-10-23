const mongoose = require('mongoose')

const TagUniqueSelectionAssociationsSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    uniqueSelection_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UniqueSelection'
    },
    keyWord: {
        type: String,
        required: true,
        trim: true
    }
})

module.exports = mongoose.model('TagUniqueSelectionAssociation', TagUniqueSelectionAssociationsSchema);