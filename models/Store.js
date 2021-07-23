const mongoose = require('mongoose')

const StoreSchema = mongoose.Schema({
    name: {
        type: String,
    },
    nameCss: {
        type: String,
    },
    type: {
        type: String,
    },
    firePoints: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model('Store', StoreSchema);