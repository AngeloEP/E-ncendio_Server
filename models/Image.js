const mongoose = require('mongoose')

const ImagesSchema = mongoose.Schema({
    filename: {
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
    imageUrl: {
        type: String,
        required: true,
        trim: true
    },
    difficulty: {
        type: String,
        default: "Ninguna",
        trim: true
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
    createdAt: {
        type: String,
        // default: Date.now()
    },
    updatedAt: {
        type: String,
        // default: Date.now()
    },
    
})

ImagesSchema.methods.setImagegUrl = function setImagegUrl(filename) {
    const { PORT, AWS_HOST } = process.env
    // this.imageUrl = `${APP_HOST}:${PORT}/public/${filename}`
    this.imageUrl = `${AWS_HOST}/images/${filename}`
}

module.exports = mongoose.model('Image', ImagesSchema);