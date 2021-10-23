const Tip = require('../models/Tip')
const Profile = require('../models/Profile')
const League = require('../models/League')
const ViewedTipAssociation = require('../models/ViewedTipAssociation')
const Usuario = require('../models/Usuario')
const DailyTask = require('../models/DailyTask')
const Level = require('../models/Level')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const moment = require('moment-timezone');
const mongoose = require('mongoose')
const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const multer = require('multer')
const multerS3 = require('multer-s3')
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

const obj = multer({
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
          const s3_inner_directory = 'tip_images';
          const finalPath = `${s3_inner_directory}/${fileName}`;
          
          file.filename = fileName;
          
          cb(null, finalPath );
        }
      }),
});
const upload = multer(obj).single('image');

exports.cargarImagenTip = async (req, res, next) => {
    upload(req, res, function (error) {
        if (error) {
            console.log(error)
            if (error.code == 'LIMIT_FILE_SIZE') {
                return res.status(500).json({ msg: 'Tamaño del archivo demasiado grande, el límite es de 1 MB' })
            }
            return res.status(500).json({ msg: error.message});
        } else {
            if (!req.file) {
                console.log("No a seleccionado una imagen para tip....")
                // return res.status(400).json({ msg: 'No ha adjuntado la imagen del tip' })
            }
            next();
        }
    })
}

exports.guardarTip = async (req, res) => {
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    const { text } = req.body

    try {
        let perfilAntiguo = await Profile.findOne({ user_id: req.usuario.id })
        let ligaAntigua = await League.findOne({ _id: perfilAntiguo.league_id })
        // Revisar que el Tip no exista
        let tip = await Tip.findOne({ text })

        if (tip) {
            return res.status(400).json({ msg: 'Este Tip ya existe' })
        }

        // Crear el nuevo Tip
        tip = new Tip(req.body)

        if ( req.file ) {
            const { filename } = req.file
            tip.setImagegUrl(filename)
        }

        // Encontrar nivel a asociar
        nivel = await Level.findOne({ level: 1 })

        // Guardar al Nivel al que pertenece el Tip
        tip.level_id = nivel._id;
        tip.user_id = req.usuario.id;

        // Fechas de creacion
        tip.createdAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
        tip.updatedAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
        let usuario = await Usuario.findOne({ "_id": req.usuario.id })
        if (usuario.isAdmin) {
            tip.isEnabled = true
        } else {
            tip.isEnabled = false
        }

        let addPoints = 0;
        let nuevoPerfil = {}
        if (ligaAntigua.league === "Bronce") addPoints = 10; else if (ligaAntigua.league === "Plata") addPoints = 7; else addPoints = 5;
        nuevoPerfil.score = perfilAntiguo.score + addPoints;
        nuevoPerfil.uploadTipCount = perfilAntiguo.uploadTipCount + 1

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

        await tip.save()

        perfilAntiguo = await Profile.findOne({user_id: req.usuario.id})
        let id = mongoose.Types.ObjectId(req.usuario.id);
        let uploads = perfilAntiguo.uploadTipCount;
        let recompensa = null
        if ([5,10,15,20,25].includes(uploads)) {
            recompensa = {
                msg: "Por haber aportado con ".concat(uploads).concat(" tips al sitio, obtuviste "),
                count: uploads,
                firePoints: uploads
            }

            nuevoPerfil = {};
            nuevoPerfil.firePoints = perfilAntiguo.firePoints + uploads
            await Profile.findOneAndUpdate({ _id : perfilAntiguo._id }, nuevoPerfil, { new: true } )
        }

        let recompensaTareas = null
        let nuevaTarea = {}
        let tareas = await DailyTask.find({ user_id: req.usuario.id, isActivated: true, isClaimed: false, type: "Tip", mode: "uploads" })
        if (tareas.length > 0) {
            tareas.forEach( async (tareita) => {
                nuevaTarea.newCount = tareita.newCount + 1;
                if ( nuevaTarea.newCount === tareita.total ) {
                    nuevaTarea.isClaimed = true;
                    recompensaTareas = {
                        msg: "Cumpliste tu tarea de: ".concat(tareita.message).concat(", obtuviste "),
                        count: tareita.total,
                        firePoints: 15
                    }
                    nuevoPerfil = {};
                    nuevoPerfil.firePoints = perfil.firePoints + 15
                    await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
                }
                await DailyTask.findOneAndUpdate({ _id : tareita._id }, nuevaTarea, { new: true } )
            })
        }

        res.json({tip, reward: recompensa, rewardTasks: recompensaTareas })
        
    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar el Tip'})
    }
}

exports.obtenerTips = async (req, res) => {
    try {
        const tips = await Tip.find({ isEnabled: true })
        res.json({ tips })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener los Tips' })
    }
}

exports.obtenerTipsPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.usuario.id);
        const tips = await Tip.aggregate([
            { $match: { user_id: id } },
            { $replaceWith: {
                "_id": "$_id",
                "Texto": "$text",
                "Imagen": "$urlFile",
                "Puntos" : "$points",
                "Estado" : "$isEnabled",
                "Creado el" : "$createdAt",
                "Actualizado el" : "$updatedAt",
            } },
          ])
        res.json({ tips })
    } catch (error) {
        console.log(error)
        res.status(400).json({ msg: 'Hubo un error al tratar de obtener los Tips del usuario' })
    }
}

exports.eliminarTipPorUsuario = async (req, res) => {
    try {
        let tip = await Tip.findById(req.params.id);
        
        if (!tip) {
            return res.status(404).json({ msg: "No existe el Tip" });
        }

        if (req.usuario.id != tip.user_id) {
            return res.status(404).json({ msg: "Este usuario no tiene permisos para eliminar este Tip" });
        }

        let arrayUrl = tip.urlFile.split("/");
        let filename = arrayUrl.slice(-1)[0];

        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: "tip_images/" + filename
        }
        
        S3.deleteObject(deleteParams, function(err, data) {
            if (err) {
                res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la imagen del tip en AWS' })
            }
        });

        // Eliminar tip
        await Tip.findOneAndRemove({ _id: req.params.id })

        res.json({ msg: "Tip eliminado correctamente" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar el Tip' })
    }
}

exports.modificarTipPorUsuario = async (req, res) => {

    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        const {
            text,
        } = req.body;
        // Comprobar si existe el Tip
        let tipAntiguo = await Tip.findById(req.params.id)

        if (!tipAntiguo) {
            return res.status(404).json({ msg: "No existe ese Tip" })
        }
        if ( tipAntiguo.user_id.toString() !== req.usuario.id ) {
            return res.status(401).json({ msg: "No Autorizado, no puede editar el Tip de este Usuario" })
        }

        let tipNuevo = {}
        tipNuevo.text = text
        let usuario = await Usuario.findOne({ "_id": req.usuario.id })
        if (usuario.isAdmin) {
            tipNuevo.isEnabled = true
        } else {
            tipNuevo.isEnabled = false
        }

        if ( req.file ) {
            let { filename } = req.file

            arrayNewFilename = filename.split(".")
            filename = arrayNewFilename[0]
            
            if (tipAntiguo.urlFile) {
                let arrayUrl = tipAntiguo.urlFile.split("/");
                let filenameDelete = arrayUrl.slice(-1)[0];
                const deleteParams = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: "tip_images/" + filenameDelete
                }
                
                S3.deleteObject(deleteParams, function(err, data) {
                    if (err) {
                        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la imagen del tip en AWS' })
                    }
                });
            }
            tipAntiguo.setImagegUrl(filename+"."+arrayNewFilename.slice(-1)[0])
            await tipAntiguo.save()
        }

        // Guardar Tip modificada
        tipAntiguo = await Tip.findOneAndUpdate(
                        { _id : req.params.id },
                        tipNuevo,
                        { new: true }
                        );

        
        await tipAntiguo.save()

        res.json({ tipAntiguo })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar el Tip seleccionada')
    }
}

exports.habilitarOinhabilitarTipPorUsuario = async (req, res) => {
    try {
        // Comprobar si existe el Tip
        let tipAntiguo = await Tip.findById(req.params.id)

        if (!tipAntiguo) {
            return res.status(404).json({ msg: "No existe ese Tip" })
        }
        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }

        let tipNuevo = {}
        tipNuevo.isEnabled = !tipAntiguo.isEnabled

        // Guardar Tip modificado
        tipAntiguo = await Tip.findOneAndUpdate(
                        { _id : req.params.id },
                        tipNuevo,
                        { new: true }
                        );

        
        await tipAntiguo.save()

        tipAntiguo = await Tip.aggregate([
            { $match: { _id: tipAntiguo._id } },
            { $replaceWith: {
                "_id": "$_id",
                "Texto": "$text",
                "Imagen": "$urlFile",
                "Puntos" : "$points",
                "Habilitada" : "$isEnabled",
                "Creadoel" : "$createdAt",
                "Actualizadoel" : "$updatedAt",
            } },
        ])

        res.json({ tipAntiguo })
        
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo habilitar/inhabilitar el Tip') 
    }
}

exports.eliminarTipPorUsuarioDesdeAdmin = async (req, res) => {
    try {
        let tip = await Tip.findById(req.params.id);        
        if (!tip) {
            return res.status(404).json({ msg: "No existe el Tip" });
        }

        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }

        let arrayUrl = tip.urlFile.split("/");
        let filename = arrayUrl.slice(-1)[0];

        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: "tip_images/" + filename
        }
        
        S3.deleteObject(deleteParams, function(err, data) {
            if (err) {
                res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la imagen del tip en AWS' })
            }
        });

        await Tip.findOneAndRemove({ _id: req.params.id })
        await ViewedTipAssociation.deleteMany({ tip_id: req.params.id })

        res.json({ msg: "Tip eliminada correctamente" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar el Tip' })
    }
}

exports.modificarTipDesdeAdmin = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        const {
            points,
        } = req.body;
        // Comprobar si existe el Tip
        let tipAntiguo = await Tip.findById(req.params.id)

        if (!tipAntiguo) {
            return res.status(404).json({ msg: "No existe ese Tip" })
        }
        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }
 
        let tipNuevo = {}
        tipNuevo.points = points

        // Guardar tip modificado
        tipAntiguo = await Tip.findOneAndUpdate(
                        { _id : req.params.id },
                        tipNuevo,
                        { new: true }
                        );

        await tipAntiguo.save()

        tipNuevo = await Tip.aggregate([
            { $match: { _id: tipAntiguo._id } },
            { $replaceWith: {
                "_id": "$_id",
                "Texto": "$text",
                "Imagen": "$urlFile",
                "Puntos" : "$points",
                "Habilitada" : "$isEnabled",
                "Creadoel" : "$createdAt",
                "Actualizadoel" : "$updatedAt",
            } },
        ])

        res.json({ tipNuevo })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar el Tip seleccionada')
    }
}