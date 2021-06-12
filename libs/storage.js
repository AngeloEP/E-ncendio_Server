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
   
const obj = multer({
  // storage,
  limits: {
    fileSize: 3 * 1024 * 1024
  },
  fileFilter: fileFilter,
  storage: multerS3({
    s3: S3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const fileName = getUniqFileName(file.originalname);
      const s3_inner_directory = 'images';
      const finalPath = `${s3_inner_directory}/${fileName}`;
      
      file.filename = fileName;
      
      cb(null, finalPath );
    }    
  })
  // dest: path.join(__dirname, "../storage/profiles_images"),
});

const upload = multer(obj).single('image');

module.exports = upload;