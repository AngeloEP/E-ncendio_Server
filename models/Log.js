const mongoose = require('mongoose')

const LoginsSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    loginAt: {
        type: String,
        // default: Date.now()
    },
    logoutAt: {
        type: String,
        // default: Date.now()
    }
    
})

module.exports = mongoose.model('Log', LoginsSchema);