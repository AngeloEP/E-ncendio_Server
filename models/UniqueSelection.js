const mongoose = require('mongoose')

const UniqueSelectionSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    level_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Level'
    },
    keyWord: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl_1: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl_2: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl_3: {
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
    },
    updatedAt: {
        type: String,
    }
})

UniqueSelectionSchema.methods.setImagesUrls = function setImagesUrls( filename1, filename2, filename3 ) {
    const { PORT, AWS_HOST } = process.env
    this.imageUrl_1 = `${AWS_HOST}/unique_selection_images/${filename1}`
    this.imageUrl_2 = `${AWS_HOST}/unique_selection_images/${filename2}`
    this.imageUrl_3 = `${AWS_HOST}/unique_selection_images/${filename3}`
}

module.exports = mongoose.model('UniqueSelection', UniqueSelectionSchema);