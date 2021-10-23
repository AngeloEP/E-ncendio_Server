const multer = require('multer')
const multerS3 = require('multer-s3')
const AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  signatureVersion: 'v4'
});
const S3 = new AWS.S3();
const path = require('path')
let fileFilter = function (req, file, cb) {
  const filetypes = /jpeg|JPEG|jpg|JPG|png|PNG|gif|GIF/;
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

const getUniqFileName = (originalname) => {
  const name = originalname.split(".")[0];
  const ext = originalname.split('.')[1];
  return `${name}.${ext}`;
}

const uploadS3MultipleUniqueSelection = multer({
    storage: multerS3({
      s3: S3,
      acl: 'public-read',
      bucket: process.env.AWS_BUCKET_NAME,
      metadata: (req, file, callBack) => {
          callBack(null, { fieldName: file.fieldname })
      },
      key: (req, file, callBack) => {
        const fileName = getUniqFileName(file.originalname);
        const s3_inner_directory = 'unique_selection_images';
        const finalPath = `${s3_inner_directory}/${fileName}`;
        // var fullPath = 'products/' + file.originalname;//If you want to save into a folder concat de name of the folder to the path
        callBack(null, finalPath)
      }
    }),
    limits: { fileSize: 2000000 }, // In bytes: 2000000 bytes = 2 MB
    fileFilter: fileFilter
  }).array('images', 3);

module.exports = uploadS3MultipleUniqueSelection;