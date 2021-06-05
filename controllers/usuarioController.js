const Usuario = require('../models/Usuario')
const Word = require('../models/Word')
const Image = require('../models/Image')
const Log = require('../models/Log')
const Hangman = require('../models/Hangman')
const Tip = require('../models/Tip')
const Profile = require('../models/Profile')
const Level = require('../models/Level')
const League = require('../models/League')
const bcryptjs = require('bcryptjs')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const path = require('path')
const multer = require('multer')
const multerS3 = require('multer-s3')
const AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  signatureVersion: 'v4'
});
const S3 = new AWS.S3();
const moment = require('moment-timezone');
const mongoose = require('mongoose')

// const storage = multer.diskStorage({
//     destination: path.join(__dirname, "../storage/profiles_images"),
//     filename: (req, file, cb) => {
//       cb(null, `${file.originalname.split(".")[0]}-${Date.now()}.${file.mimetype.split("/")[1]}`);
//     }
// })

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

const getUniqFileName = (originalname) => {
    const name = originalname.split(".")[0];
    const ext = originalname.split('.')[1];
    return `${name}.${ext}`;
  }

const obj = multer({
    // storage,
    // dest: path.join(__dirname, "../storage/profiles_images"),
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
          const s3_inner_directory = 'profile_images';
          const finalPath = `${s3_inner_directory}/${fileName}`;
          
          file.filename = fileName;
          
          cb(null, finalPath );
        }
      }),
});

const upload = multer(obj).single('image');

exports.cargarImagenUsuario = async (req, res, next) => {
    upload(req, res, function (error) {
        if (error) { //instanceof multer.MulterError
            console.log(error)
            if (error.code == 'LIMIT_FILE_SIZE') {
                return res.status(500).json({ msg: 'Tamaño del archivo demasiado grande, el límite es de 1 MB' })
            }
            return res.status(500).json({ msg: error.message});
        } else {
            if (!req.file) {
                console.log("No a seleccionado una imagen....")
                // return res.status(400).json({ msg: 'No ha adjuntado la imagen de su perfil' })
            }
            next();
        }
    })
}

exports.crearUsuario = async (req, res, next) => {

    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }
    
    // Extraer email y password
    const { email, password } = req.body

    try {
        // Revisar que el usuario registrado sea único
        let usuario = await Usuario.findOne({ email })

        if (usuario) {
            return res.status(400).json({ msg: 'El usuario ya existe' })
        }

        // Crea el nuevo usuario
        usuario = new Usuario(req.body)

        if ( req.file ) {
            const { filename } = req.file
            usuario.setImagegUrl(filename)
        }

        // Hashear el password
        const salt = await bcryptjs.genSalt(10)
        usuario.password = await bcryptjs.hash(password, salt)
        usuario.registerAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
        // if (usuario.isExpert) {
        //     usuario.isAdmin = true
        // } else {
        //     usuario.isAdmin = false
        // }
        usuario.isAdmin = false

        // Guardar el nuevo usuario
        await usuario.save()

        // Crear y firmar el JWT
        const payload = {
            usuario: {
                id: usuario.id
            }
        }
        // Firmar el JWT
        jwt.sign(payload, process.env.SECRETA, {
            expiresIn: 3600 // 1 hora?
        }, async (error, token) => {
            if (error) throw error;

            // crear registro de cuando se logeo
            let login = new Log();
            login.user_id = usuario.id;
            login.loginAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
            login.logoutAt = moment().add(1, 'hour').tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
            await login.save()

            // Mensaje de confirmación
            res.json({ token: token })
        });
        next();
        

    } catch (error) {
        console.log(error)
        res.status(400).json({ msg: 'Hubo un errror al tratar de crear usuario'})
    }
}

exports.obtenerPerfilUsuario = async (req, res) => {
    try {
        const perfil = await Profile.findOne({ user_id: req.usuario.id })
                                    .populate("league_id")
                                    .populate("level_image_id")
                                    .populate("level_word_id")
                                    .populate("level_four_image_id");
        res.json(perfil)
    } catch (error) {
        console.log(error)
        res.status(400).send('Hubo un errror al tratar de obtener el perfil del usuario')
    }
}

exports.obtenerNivelImagenesUsuario = async (req, res) => {
    try {
        const perfil = await Profile.findOne({ user_id: req.usuario.id });
        const nivelImagenes = await Level.findOne({ _id : perfil.level_image_id });
        res.json(nivelImagenes)
    } catch (error) {
        console.log(error)
        res.status(400).send('Hubo un errror al tratar de obtener el nivel de imágenes del usuario')
    }
}

exports.obtenerRangoDeEdades = async (req, res) => {
    try {
        let usuarios = {};
        usuarios.range = [ "9-13", "14-20", "21-25", "26-40"]
        usuarios.total = []
        usuarios.total.push(
            await Usuario.countDocuments( { age: {$gte: 9, $lte: 13} } ),
            await Usuario.countDocuments( { age: {$gte: 14, $lte: 20} } ),
            await Usuario.countDocuments( { age: {$gte: 21, $lte: 25} } ),
            await Usuario.countDocuments( { age: {$gte: 26, $lte: 40} } )
        );

        res.json(usuarios)
    } catch (error) {
        console.log(error)
        res.status(400).send('Hubo un errror al tratar de obtener el rango de edades de los usuarios')
    }
}

exports.modificarUsuario = async (req, res) => {

    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        const {
            firstname,
            lastname,
            phone,
            age,
            gender,
        } = req.body;
        // Comprobar si existe el usuario
        let usuarioAntiguo = await Usuario.findById(req.params.id)

        let perfilAntiguo = await Profile.findOne({ user_id: usuarioAntiguo._id })
        let ligaAntigua = await League.findOne({ _id: perfilAntiguo.league_id })

        if (!usuarioAntiguo) {
            return res.status(404).json({ msg: "No existe ese Perfil de Usuario" })
        }

        if ( req.params.id.toString() !== req.usuario.id ) {
            return res.status(401).json({ msg: "No Autorizado, no puede editar el Perfil de este Usuario" })
        }

        let addPoints = 0;
        if (ligaAntigua.league === "Plata") addPoints = 7; else addPoints = 5;
        let nuevoPerfil = {};
        nuevoPerfil.score = perfilAntiguo.score
        if ( firstname != usuarioAntiguo.firstname ) nuevoPerfil.score += addPoints; 
        if ( lastname != usuarioAntiguo.lastname ) nuevoPerfil.score += addPoints; 
        if ( phone != usuarioAntiguo.phone ) nuevoPerfil.score += addPoints; 
        if ( age != usuarioAntiguo.age ) nuevoPerfil.score += addPoints; 
        if ( gender != usuarioAntiguo.gender ) nuevoPerfil.score += addPoints;
        

        if ( req.file ) {
            let { filename } = req.file
            // usuarioAntiguo.setImagegUrl(filename)

            arrayNewFilename = filename.split(".")
            filename = arrayNewFilename[0]
            

            let arrayUrl = usuarioAntiguo.urlFile.split("/");
            let filenameDelete = arrayUrl.slice(-1)[0];
            const deleteParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: "profile_images/" + filenameDelete
            }
            
            S3.deleteObject(deleteParams, function(err, data) {
                if (err) {
                    res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la imagen de usuario en AWS' })
                }
            });
            usuarioAntiguo.setImagegUrl(filename+"."+arrayNewFilename.slice(-1)[0])
            await usuarioAntiguo.save()
            nuevoPerfil.score += 5;
        }

        if ( nuevoPerfil.score >= ligaAntigua.pointsNextLeague ) {
            let nuevaLiga = ""
            switch (ligaAntigua.league) {
                case "Bronce":
                    nuevaLiga = "Plata"
                    break;

                case "Plata":
                    nuevaLiga = "Oro"
                    break;
            
                default:
                    nuevaLiga = "Oro"
                    break;
            }
            ligaNueva = await League.findOne({ league: nuevaLiga })
            nuevoPerfil.league_id = ligaNueva._id
        }

        await Profile.findOneAndUpdate({ _id : perfilAntiguo._id }, nuevoPerfil, { new: true } );

        const usuarioNuevo = {}
        usuarioNuevo.firstname = firstname
        usuarioNuevo.lastname = lastname
        usuarioNuevo.phone = phone
        usuarioNuevo.age = age
        usuarioNuevo.gender = gender
        
        // Guardar Usuario
        usuarioAntiguo = await Usuario.findOneAndUpdate(
                        { _id : req.params.id },
                        usuarioNuevo,
                        { new: true }
                        );

        // await usuarioAntiguo.save()

        res.json({ usuarioAntiguo })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar su perfil de usuario')
    }
}

exports.obtenerUsuarios = async (req, res, next) => {
    try {
        const usuarios = await Usuario.aggregate([
            { $replaceWith: {
                "_id": "$_id",
                "Nombre": "$firstname",
                "Género" : "$gender",
                "Edad" : "$age",
                "Correo" : "$email",
                "Admin" : "$isAdmin",
                "Bloqueado" : "$isBlocked",
            } },
          ])
        res.json({ usuarios })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener los usuarios del sitio')
    }
}

exports.cambiarAdminConBloqueo = async (req, res) => {
    try {
        // Revisar si hay errores
        const errores = validationResult(req)
        if ( !errores.isEmpty() ) {
            return res.status(400).json({ errores: errores.array() })
        }

        const {
            isAdmin,
            isBlocked,
        } = req.body;

        // Comprobar si existe el usuario
        let usuarioAntiguo = await Usuario.findById(req.params.id)
        let usuarioModificador = await Usuario.findById(req.usuario.id)

        if (!usuarioAntiguo) {
            return res.status(404).json({ msg: "El perfil que desea modificar no existe" })
        }

        if ( !usuarioModificador ) {
            return res.status(401).json({ msg: "El usuario que intenta modificar la información no se encuentra registrado" })
        }

        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "El usuario que intenta modificar la información no es un administrador" })
        }

        const usuarioNuevo = {}
        usuarioNuevo.isAdmin = isAdmin
        usuarioNuevo.isBlocked = isBlocked
        
        // Guardar Usuario
        usuarioAntiguo = await Usuario.findOneAndUpdate(
                        { _id : req.params.id },
                        usuarioNuevo,
                        { new: true }
                        );
        res.status(200).json({ msg: "El usuario ha sido modificado exitosamente" })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo cambiar la información del usuario')
    }
}

exports.obtenerImagenesSubidasPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.params.id);
        const imagenes = await Image.aggregate([
            { $match: { user_id: id } },
            { $replaceWith: {
                "_id": "$_id",
                "Imagen": "$imageUrl",
                "Nombre" : "$filename",
                "Dificultad" : "$difficulty",
                "Puntos" : "$points",
                "Habilitada" : "$isEnabled",
                "Creadoel" : "$createdAt",
                "Actualizadoel" : "$updatedAt",
            } },
        ])
        res.json({ imagenes })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las imágenes de este usuario')
    }
}

exports.obtenerPalabrasSubidasPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.params.id);
        const palabras = await Word.aggregate([
            { $match: { user_id: id } },
            { $replaceWith: {
                "_id": "$_id",
                "Palabra": "$name",
                "Dificultad" : "$difficulty",
                "Puntos" : "$points",
                "Habilitada" : "$isEnabled",
                "Creadoel" : "$createdAt",
                "Actualizadoel" : "$updatedAt",
            } },
        ])
        res.json({ palabras })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las palabras de este usuario')
    }
}

exports.obtenerAhorcadosSubidosPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.params.id);
        const ahorcados = await Hangman.aggregate([
            { $match: { user_id: id } },
            { $replaceWith: {
                "_id": "$_id",
                "Imagen1": "$imageUrl_1",
                "Imagen2": "$imageUrl_2",
                "Imagen3": "$imageUrl_3",
                "Imagen4": "$imageUrl_4",
                "Palabra" : "$associatedWord",
                "Dificultad" : "$difficulty",
                "Puntos" : "$points",
                "Habilitada" : "$isEnabled",
                "Creadoel" : "$createdAt",
                "Actualizadoel" : "$updatedAt",
            } },
        ])
        res.json({ ahorcados })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener los ahorcados de este usuario')
    }
}

exports.obtenerTipsSubidosPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.params.id);
        const tips = await Tip.aggregate([
            { $match: { user_id: id } },
            { $replaceWith: {
                "_id": "$_id",
                "Texto" : "$text",
                "Puntos" : "$points",
                "Habilitada" : "$isEnabled",
                "Creadoel" : "$createdAt",
                "Actualizadoel" : "$updatedAt",
            } },
        ])
        res.json({ tips })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener los Tips de este usuario')
    }
}