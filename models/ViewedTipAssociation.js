const mongoose = require('mongoose')

const ViewedTipAsspciationsSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    tip_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tip'
    },
})

module.exports = mongoose.model('ViewedTipAssociation', ViewedTipAsspciationsSchema);