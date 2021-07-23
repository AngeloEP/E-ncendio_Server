const mongoose = require('mongoose')

const UserBuyStoreSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    name: {
        type: String,
    },
    nameCss: {
        type: String,
    },
    type: {
        type: String,
    },
})

module.exports = mongoose.model('UserBuyStore', UserBuyStoreSchema);