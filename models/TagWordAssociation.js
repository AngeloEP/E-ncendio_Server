const mongoose = require('mongoose')

const TagWordAssociationsSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    word_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Word'
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }
})

module.exports = mongoose.model('TagWordAssociation', TagWordAssociationsSchema);