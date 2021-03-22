const multer = require('multer')
const path = require('path')

const storage = (dest) => multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './storage/imgs')
    },
    filename: function (req, file, cb) {
      cb(null, `${file.originalname}`)
    }
})
   
const upload = multer({ storage })

module.exports = upload;