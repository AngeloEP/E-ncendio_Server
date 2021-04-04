const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: path.join(__dirname, "../storage/imgs"),
    // destination: function (req, file, cb) {
    //   cb(null, './storage/imgs')
    // },
    filename: function (req, file, cb) {
      cb(null, `${file.originalname}`)
    }
})

let fileFilter = function (req, file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname));
  if (mimetype && extname) {
      cb(null, true);
  } else {
      cb({
          success: false,
          message: 'Tipo de archivo inválido, solo se permiten de tipo: jpeg|jpg|png|gif.'
      });
  }
};
   
const obj = multer({
  storage,
  dest: path.join(__dirname, "../storage/profiles_images"),
  limits: {
      fileSize: 3 * 1024 * 1024
  },
  fileFilter: fileFilter
});

const upload = multer(obj).single('image');

module.exports = upload;