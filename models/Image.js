const mongoose = require('mongoose')

const ImagesSchema = mongoose.Schema({
    filename: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    level_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Level'
    },
    imageUrl: {
        type: String,
        required: true,
        trim: true
    },
    difficulty: {
        type: String,
        required: true,
        trim: true
    },
    points: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updatedAt: {
        type: Date,
        default: Date.now()
    }
    
})

ImagesSchema.methods.setImagegUrl = function setImagegUrl(filename) {
    const { PORT, APP_HOST } = process.env
    this.imageUrl = `${APP_HOST}:${PORT}/public/${filename}`
}

module.exports = mongoose.model('Image', ImagesSchema);