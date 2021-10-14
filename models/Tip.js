const mongoose = require('mongoose')

const TipsSchema = mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    level_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Level'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    points: {
        type: Number,
        default: 0
    },
    isEnabled: {
        type: Boolean,
        required: true,
        trim: true
    },
    urlFile: {
        type: String,
        default: ""
    },
    createdAt: {
        type: String,
        // default: Date.now()
    },
    updatedAt: {
        type: String,
        // default: Date.now()
    }
})

TipsSchema.methods.setImagegUrl = function setImagegUrl(filename) {
    const { AWS_HOST } = process.env
    this.urlFile = `${AWS_HOST}/tip_images/${filename}`
}

module.exports = mongoose.model('Tip', TipsSchema);