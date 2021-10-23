const Image = require('../models/Image')
const Tip = require('../models/Tip')
const Profile = require('../models/Profile')
const Category = require('../models/Category')
const League = require('../models/League')
const DailyTask = require('../models/DailyTask')
const Task = require('../models/Task')
const Usuario = require('../models/Usuario')
const Level = require('../models/Level')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const upload = require('../libs/storage')
const moment = require('moment-timezone');
const fs = require('fs')
const path = require('path')
const AWS = require('aws-sdk');
const TagImageAssociation = require('../models/TagImageAssociation')
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    signatureVersion: 'v4'
});
const S3 = new AWS.S3();

exports.cargarImagen = async (req, res, next) => {
    upload(req, res, function (error) {
        if (error) { // instanceof multer.MulterError
            console.log(error)
            if (error.code == 'LIMIT_FILE_SIZE') {
                return res.status(500).json({ msg: 'Tamaño del archivo demasiado grande, el límite es de 1 MB' })
            }
            return res.status(500).json({ msg: error.message});
        } else {
            if (!req.file) {
                // console.log("No a seleccionado una imagen....")
                return res.status(400).json({ msg: 'No ha adjuntado la imagen' })
            }
            next();
        }
    })
}

exports.cargarONoImagen = async (req, res, next) => {
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
                // return res.status(400).json({ msg: 'No ha adjuntado la imagen' })
            }
            next();
        }
    })
}

exports.guardarImagen = async (req, res) => {
    try {
        let perfilAntiguo = await Profile.findOne({ user_id: req.usuario.id })
        let ligaAntigua = await League.findOne({ _id: perfilAntiguo.league_id })

        // Crear la nueva imagen
        image = new Image(req.body)

        if( !req.file ) {
            return res.status(400).json({ msg: 'No ha adjuntado la imagen' })
        }
        // Revisar que el nombre de la imagen no exista
        let { filename } = req.file
        image.setImagegUrl(filename)
        filename = filename.split(".")[0]
        let existeImagen = await Image.findOne({ filename })
        if ( existeImagen ) {
            return res.status(400).json({ msg: 'La imagen ya existe' })
        }
        image.filename = filename;
        
        // Encontrar nivel a asociar
        nivel = await Level.findOne({ level: 1 })

        // Guardar al Nivel al que pertenece la imagen
        image.level_id = nivel._id;
        image.user_id = req.usuario.id;

        image.createdAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
        image.updatedAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
        let usuario = await Usuario.findOne({ "_id": req.usuario.id })
        if (usuario.isAdmin) {
            image.isEnabled = true
        } else {
            image.isEnabled = false
        }

        let addPoints = 0;
        let nuevoPerfil = {}
        if (ligaAntigua.league === "Plata") addPoints = 30; else if(ligaAntigua.league === "Oro") addPoints = 20; else addPoints = 35;
        nuevoPerfil.score = perfilAntiguo.score + addPoints
        nuevoPerfil.uploadImageCount = perfilAntiguo.uploadImageCount + 1

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

        await image.save()

        perfilAntiguo = await Profile.findOne({user_id: req.usuario.id})
        let id = mongoose.Types.ObjectId(req.usuario.id);
        let uploads = perfilAntiguo.uploadImageCount;
        let recompensa = null
        console.log(uploads)
        if ([5,10,15,20,25].includes(uploads)) {
            recompensa = {
                msg: "Por haber aportado con ".concat(uploads).concat(" imágenes al sitio, obtuviste "),
                count: uploads,
                firePoints: uploads
            }

            nuevoPerfil = {};
            nuevoPerfil.firePoints = perfilAntiguo.firePoints + uploads
            await Profile.findOneAndUpdate({ _id : perfilAntiguo._id }, nuevoPerfil, { new: true } )
        }

        let recompensaTareas = null
        let nuevaTarea = {}
        let tareas = await DailyTask.find({ user_id: req.usuario.id, isActivated: true, isClaimed: false, type: "Image", mode: "uploads" })
        if (tareas.length > 0) {
            tareas.forEach( async (tareita) => {
                nuevaTarea.newCount = tareita.newCount + 1;
                if ( nuevaTarea.newCount === tareita.total ) {
                    nuevaTarea.isClaimed = true;
                    recompensaTareas = {
                        msg: "Cumpliste tu tarea de: ".concat(tareita.message).concat(", obtuviste "),
                        count: tareita.total,
                        firePoints: 10
                    }
                    nuevoPerfil = {};
                    nuevoPerfil.firePoints = perfil.firePoints + 10
                    await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
                }
                await DailyTask.findOneAndUpdate({ _id : tareita._id }, nuevaTarea, { new: true } )
            })
        }

        res.json({image, reward: recompensa, rewardTasks: recompensaTareas })

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar la imagen'})
    }
}

exports.obtenerImagenes = async (req, res) => {
    try {
        let imagenes = await Image.find({ isEnabled: true })
        imagenes = imagenes.sort(function() {return Math.random() - 0.5});
        res.json({ imagenes })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener las imágenes' })
    }
}

exports.obtenerImagenesPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.usuario.id);
        const imagenes = await Image.aggregate([
            { $match: { user_id: id } },
            { $replaceWith: {
                "_id": "$_id",
                "Imagen": "$imageUrl",
                "Nombre" : "$filename",
                "Dificultad" : "$difficulty",
                "Puntos" : "$points",
                "Estado" : "$isEnabled",
                "Creado el" : "$createdAt",
                "Actualizado el" : "$updatedAt",
            } },
          ])
        res.json({ imagenes })
    } catch (error) {
        console.log(error)
        res.status(400).json({ msg: 'Hubo un error al tratar de obtener las imágenes del usuario' })
    }
}

exports.eliminarImagenPorUsuario = async (req, res) => {
    try {
        let imagen = await Image.findById(req.params.id);
        
        if (!imagen) {
            return res.status(404).json({ msg: "No existe la imagen" });
        }

        if (req.usuario.id != imagen.user_id) {
            return res.status(404).json({ msg: "Este usuario no tiene permisos para eliminar esta imagen" });
        }
        
        let arrayUrl = imagen.imageUrl.split("/");
        let filename = arrayUrl.slice(-1)[0];

        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: "images/" + filename
        }
        
        S3.deleteObject(deleteParams, function(err, data) {
            if (err) {
                res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la imagen en AWS' })
            }
            // console.log("Se eliminó la imagen en AWS!")
        });
        // try {
        //     fs.unlinkSync(path.join(__dirname, "../storage/imgs/") + filename)
        //     //file removed
        // } catch(err) {
        //     return res.status(404).json({ msg: "No se pudo eliminar del directorio" });
        // }

        // Eliminar imagen
        await Image.findOneAndRemove({ _id: req.params.id })


        res.json({ msg: "Imagen eliminada correctamente" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la imagen' })
    }
}

exports.modificarImagenPorUsuario = async (req, res) => {
    try {
        // Comprobar si existe la imagen
        let imagenAntigua = await Image.findById(req.params.id)

        if (!imagenAntigua) {
            return res.status(404).json({ msg: "No existe esa imagen" })
        }
        if ( imagenAntigua.user_id.toString() !== req.usuario.id ) {
            return res.status(401).json({ msg: "No Autorizado, no puede editar la imagen de este Usuario" })
        }

        let imagenNueva = {}

        let { filename } = req.file
        arrayNewFilename = filename.split(".")
        filename = arrayNewFilename[0]
        let existeImagen = await Image.findOne({ filename })
        if ( existeImagen ) {
            return res.status(400).json({ msg: 'La imagen ingresada ya existe' })
        }
        

        let arrayUrl = imagenAntigua.imageUrl.split("/");
        let filenameDelete = arrayUrl.slice(-1)[0];
        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: "images/" + filenameDelete
        }
        
        S3.deleteObject(deleteParams, function(err, data) {
            if (err) {
                res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la imagen en AWS' })
            }
        });
        imagenAntigua.setImagegUrl(filename+"."+arrayNewFilename.slice(-1)[0])
        await imagenAntigua.save()
        imagenNueva.filename = filename;

        let usuario = await Usuario.findOne({ "_id": req.usuario.id })
        if (usuario.isAdmin) {
            imagenNueva.isEnabled = true
        } else {
            imagenNueva.isEnabled = false
        }

        // Guardar Imagen modificada
        imagenAntigua = await Image.findOneAndUpdate(
                        { _id : req.params.id },
                        imagenNueva,
                        { new: true }
                        );

        
        await imagenAntigua.save()

        res.json({ imagenAntigua })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar la imagen seleccionada')
    }
}

exports.habilitarOinhabilitarImagenPorUsuario = async (req, res) => {
    try {
        // Comprobar si existe la imagen
        let imagenAntigua = await Image.findById(req.params.id)

        if (!imagenAntigua) {
            return res.status(404).json({ msg: "No existe esa imagen" })
        }
        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }

        let imagenNueva = {}
        imagenNueva.isEnabled = !imagenAntigua.isEnabled

        // Guardar Imagen modificada
        imagenAntigua = await Image.findOneAndUpdate(
                        { _id : req.params.id },
                        imagenNueva,
                        { new: true }
                        );

        
        await imagenAntigua.save()

        imagenAntigua = await Image.aggregate([
            { $match: { _id: imagenAntigua._id } },
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

        res.json({ imagenAntigua })
        
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo habilitar/inhabilitar la imagen') 
    }
}

exports.eliminarImagenPorUsuarioDesdeAdmin = async (req, res) => {
    try {
        let imagen = await Image.findById(req.params.id);        
        if (!imagen) {
            return res.status(404).json({ msg: "No existe la imagen" });
        }

        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }

        let usuarioImagen = await Image.findById(imagen.user_id);
        
        let arrayUrl = imagen.imageUrl.split("/");
        let filename = arrayUrl.slice(-1)[0];

        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: "images/" + filename
        }
        
        S3.deleteObject(deleteParams, function(err, data) {
            if (err) {
                res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la imagen en AWS' })
            }
        });
        await Image.findOneAndRemove({ _id: req.params.id })
        await TagImageAssociation.deleteMany({ image_id: req.params.id })

        res.json({ msg: "Imagen eliminada correctamente" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la imagen' })
    }
}

exports.modificarImagenDesdeAdmin = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        const {
            difficulty,
            points,
        } = req.body;
        // Comprobar si existe la imagen
        let imagenAntigua = await Image.findById(req.params.id)

        if (!imagenAntigua) {
            return res.status(404).json({ msg: "No existe esa imagen" })
        }
        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }
 
        let imagenNueva = {}
        imagenNueva.difficulty = difficulty
        imagenNueva.points = points

        // Guardar Imagen modificada
        imagenAntigua = await Image.findOneAndUpdate(
                        { _id : req.params.id },
                        imagenNueva,
                        { new: true }
                        );

        await imagenAntigua.save()

        imagenNueva = await Image.aggregate([
            { $match: { _id: imagenAntigua._id } },
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

        res.json({ imagenNueva })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar la imagen seleccionada')
    }
}

exports.cambiarDailyTasks = async (req, res) => {
    try {
        // Add field
        // let response = await Usuario.update({ _id: "60b3dcef8fe1f20015a49a91" }, [ {$set : { "city": "" } } ])
        // let response = await Profile.updateMany({ }, [ {$set : { "uploadUniqueSelectionCount": 0} } ])
        
        // response = response[0]
        // let totalAmount = 0;
        // response.forEach( data => totalAmount = totalAmount + data.count);
        // response.push({total: totalAmount})
        // console.log(response)

        // Remove field (debe estar en el schema y luego borrarlo)

        // let response = await Usuario.updateMany({  }, {
        //     $unset: {
        //      isExpert: 1
        //      }
        //     }, {
        //     multi: true
        //    }).exec(function(err, count) {
        //     console.log(err, count)
        //    });

        res.json({response})
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar la colección DailyTasks')
    }
}

exports.agregarDailyTasks = async (req, res) => {
    try {
        let usuarios = await Usuario.find({});
        let perfilUsuario;
        let elegidos = []
        let randomData = []
        let result;
        usuarios.forEach( async user => {
            perfilUsuario = await Profile.findOne({user_id: user._id})
            elegidos = []
            randomData = []
            randomData = await Task.find({ league_id: perfilUsuario.league_id });
            for (let index = 0; index < 3; index++) {
                var random = Math.floor(Math.random() * (randomData.length) )
                result = randomData[random];
                elegidos.push(result)
                randomData = randomData.filter(function(value, index, arr){ 
                    return (value.mode !== result.mode) | (value.type !== result.type);
                });
            }
            elegidos.forEach(async element => {
                // Add document to user
                let task = new DailyTask;
                task.user_id = user._id;
                task.league_id = element.league_id;
                task.type = element.type;
                task.mode = element.mode;
                task.total = element.total;
                task.newCount = 0;
                task.isClaimed = false;
                task.isActivated = true;
                task.createdAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
                task.updatedAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
                await task.save();
            });
            elegidos.splice(0, elegidos.length);
        });

        // res.json({task})
        res.json("ahhhhhh mi pichulitaaaa!!")
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo agregar una DailyTasks')
    }
}


exports.agregarTask = async (req, res) => {
    try {
        // Add document
        let task = new Task;
        task.league_id = mongoose.Types.ObjectId("60249105ad44372750035c1b");
        // 602490f8ad44372750035c19  Bronce
        // 602490ffad44372750035c1a  Plata
        // 60249105ad44372750035c1b  Oro
        task.message = "Jugar 7 veces Selección Única.";
        task.type = "UniqueSelection";
        task.mode = "counts";
        task.total = 7;
        await task.save();

        console.log("Tarea agregada")
        res.json({task})
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo agregar una DailyTasks')
    }
}