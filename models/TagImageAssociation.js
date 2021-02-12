const mongoose = require('mongoose')

const TagImageAssociationSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    image_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image'
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }
})

module.exports = mongoose.model('TagImageAssociation', TagImageAssociationSchema);