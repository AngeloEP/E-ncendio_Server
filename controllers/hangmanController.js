const Hangman = require('../models/Hangman')
const TagHangmanAssociation = require('../models/TagHangmanAssociation')
const Profile = require('../models/Profile')
const DailyTask = require('../models/DailyTask')
const League = require('../models/League')
const Usuario = require('../models/Usuario')
const Level = require('../models/Level')
const { validationResult } = require('express-validator')
const mongoose = require('mongoose')
const uploadS3Multiple = require('../libs/storageMultiple')
const moment = require('moment-timezone');
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    signatureVersion: 'v4'
});
const S3 = new AWS.S3();

exports.cargarImagenes = async (req, res, next) => {
    uploadS3Multiple(req, res, function (error) {
        if (error) { //instanceof multer.MulterError
            console.log(error)
            if (error.code == 'LIMIT_FILE_SIZE') {
                return res.status(500).json({ msg: 'Tamaño del archivo demasiado grande, el límite es de 1 MB' })
            }
            return res.status(500).json({ msg: error.message});
        } else {
            if (req.files === undefined) {
                console.log('uploadProductsImages Error: No File Selected!');
                return res.status(500).json({
                    status: 'Fallido',
                    message: 'Error: no hay archivos seleccionados'
            })};
            if (!req.files) {
                // console.log("No a seleccionado una imagen....")
                return res.status(400).json({ msg: 'No ha adjuntado las imágenes' })
            } else {
                let fileArray = req.files,fileLocation;
                const images = [];
                for (let i = 0; i < fileArray.length; i++) {
                    fileLocation = fileArray[i].location;
                    // console.log('filenm', fileLocation);
                    images.push(fileLocation)
                }
                next();
            }
        }
    })
}

exports.cargarONoImagenes = async (req, res, next) => {
    uploadS3Multiple(req, res, function (error) {
        if (error) { //instanceof multer.MulterError
            console.log(error)
            if (error.code == 'LIMIT_FILE_SIZE') {
                return res.status(500).json({ msg: 'Tamaño del archivo demasiado grande, el límite es de 1 MB' })
            }
            return res.status(500).json({ msg: error.message});
        } else {
            if (req.files === undefined) {
                return res.status(500).json({
                    status: 'Fallido',
                    message: 'Error: no hay archivos seleccionados'
            })};
            if (!req.files) {
                console.log("No a seleccionado imágenes....")
            } else {
                let fileArray = req.files,fileLocation;
                const images = [];
                for (let i = 0; i < fileArray.length; i++) {
                    fileLocation = fileArray[i].location;
                    // console.log('filenm', fileLocation);
                    images.push(fileLocation)
                }
                next();
            }
        }
    })
}

exports.guardarImagenesPalabra = async (req, res) => {
    try {
        let perfilAntiguo = await Profile.findOne({ user_id: req.usuario.id })
        let ligaAntigua = await League.findOne({ _id: perfilAntiguo.league_id })

        // Crear la nueva imagen
        let { associatedWord } = req.body
        hangman = new Hangman(req.body)

        let fieldname1 = req.files[0].originalname 
        let fieldname2 = req.files[1].originalname
        let fieldname3 = req.files[2].originalname
        let fieldname4 = req.files[3].originalname
        hangman.setImagesUrls(fieldname1, fieldname2, fieldname3, fieldname4 )
        if( !req.files ) {
            return res.status(400).json({ msg: 'No ha adjuntado las imágenes' })
        }

        // Revisar que el ahorcado no exista
        let existeAhorcado = await Hangman.findOne({ associatedWord })
        if ( existeAhorcado ) {
            let existeAhorcadoImage1 = existeAhorcado.imageUrl_1.split("/").slice(-1)[0]
            let existeAhorcadoImage2 = existeAhorcado.imageUrl_2.split("/").slice(-1)[0]
            let existeAhorcadoImage3 = existeAhorcado.imageUrl_3.split("/").slice(-1)[0]
            let existeAhorcadoImage4 = existeAhorcado.imageUrl_4.split("/").slice(-1)[0]
            if (existeAhorcadoImage1 === fieldname1 && existeAhorcadoImage2 === fieldname2 && existeAhorcadoImage3 === fieldname3 && existeAhorcadoImage4 === fieldname4 ) {
                return res.status(400).json({ msg: 'Ese contenido(ahorcado), ya existe ' })
            }
        }
        
        // Encontrar nivel a asociar
        nivel = await Level.findOne({ level: 1 })

        // Guardar al Nivel al que pertenece el ahorcado
        hangman.level_id = nivel._id;
        hangman.user_id = req.usuario.id;

        hangman.createdAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
        hangman.updatedAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
        let usuario = await Usuario.findOne({ "_id": req.usuario.id })
        if (usuario.isAdmin) {
            hangman.isEnabled = true
        } else {
            hangman.isEnabled = false
        }

        let addPoints = 25;
        let nuevoPerfil = {}
        nuevoPerfil.score = perfilAntiguo.score + addPoints
        nuevoPerfil.uploadHangmanCount = perfilAntiguo.uploadHangmanCount + 1

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

        await hangman.save()

        perfilAntiguo = await Profile.findOne({user_id: req.usuario.id})
        let id = mongoose.Types.ObjectId(req.usuario.id);
        let uploads = await Hangman.countDocuments({ user_id: id });
        let recompensa = null
        if ([5,10,15,20,25].includes(uploads)) {
            recompensa = {
                msg: "Por haber aportado ".concat(uploads).concat(" veces contenido para los ahorcados al sitio, obtuviste "),
                count: uploads,
                firePoints: uploads
            }

            nuevoPerfil = {};
            nuevoPerfil.firePoints = perfilAntiguo.firePoints + uploads
            await Profile.findOneAndUpdate({ _id : perfilAntiguo._id }, nuevoPerfil, { new: true } )
        }

        let recompensaTareas = null
        let nuevaTarea = {}
        let tareas = await DailyTask.find({ user_id: req.usuario.id, isActivated: true, isClaimed: false, type: "Hangman", mode: "uploads" })
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

        res.json({hangman, reward: recompensa, rewardTasks: recompensaTareas })

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar las imágenes y su palabra'})
    }
}

exports.obtenerImagenesPalabra = async (req, res) => {
    try {
        let ahorcados = await Hangman.find({ isEnabled: true })
        ahorcados = ahorcados.sort(function() {return Math.random() - 0.5});
        res.json({ ahorcados })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener los ahorcados' })
    }
}

exports.obtenerAhorcadosPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.usuario.id);
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
                "Estado" : "$isEnabled",
                "Creado el" : "$createdAt",
                "Actualizado el" : "$updatedAt",
            } },
          ])
        res.json({ ahorcados })
    } catch (error) {
        console.log(error)
        res.status(400).json({ msg: 'Hubo un error al tratar de obtener los ahorcados del usuario' })
    }
}

exports.eliminarImagenesPalabraPorUsuario = async (req, res) => {
    try {
        let ahorcado = await Hangman.findById(req.params.id);
        
        if (!ahorcado) {
            return res.status(404).json({ msg: "No existe ese contenido" });
        }

        if (req.usuario.id != ahorcado.user_id) {
            return res.status(404).json({ msg: "Este usuario no tiene permisos para eliminar este contenido" });
        }
        
        let filename1 = (ahorcado.imageUrl_1.split("/")).slice(-1)[0];
        let filename2 = (ahorcado.imageUrl_2.split("/")).slice(-1)[0];
        let filename3 = (ahorcado.imageUrl_3.split("/")).slice(-1)[0];
        let filename4 = (ahorcado.imageUrl_4.split("/")).slice(-1)[0];

        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Delete: {
                Objects: [
                    {
                        Key: "hangmans/" + filename1
                    },
                    {
                        Key: "hangmans/" + filename2
                    },
                    {
                        Key: "hangmans/" + filename3
                    },
                    {
                        Key: "hangmans/" + filename4
                    }
                ],
                Quiet: false
            }
        }
        
        S3.deleteObjects(deleteParams, function(err, data) {
            if (err) {
                res.status(500).json({ msg: 'Hubo un error al tratar de eliminar el ahorcado en AWS' })
            }
            // console.log("Se eliminaron las imágenes en AWS!")
        });
        
        // Eliminar ahorcado de la BD
        await Hangman.findOneAndRemove({ _id: req.params.id })


        res.json({ msg: "Ahorcado eliminada correctamente" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar el ahorcado' })
    }
}

exports.modificarAhorcadoPorUsuario = async (req, res) => {
    try {
        // Comprobar si existe el ahorcado
        let ahorcadoAntiguo = await Hangman.findById(req.params.id)

        if (!ahorcadoAntiguo) {
            return res.status(404).json({ msg: "No existe ese contenido" })
        }
        if ( ahorcadoAntiguo.user_id.toString() !== req.usuario.id ) {
            return res.status(401).json({ msg: "No Autorizado, no puede editar el contenido de este Usuario" })
        }
        let { associatedWord } = req.body

        let ahorcadoNuevo = {}
        ahorcadoNuevo.associatedWord = associatedWord;
        
        if (req.files.length != 0) {
            // Revisar que el nombre del ahorcado no exista
            let existeAhorcado = await Hangman.findOne({ associatedWord })
            let existeAhorcadoImage1, existeAhorcadoImage2, existeAhorcadoImage3, existeAhorcadoImage4;
            let fieldname1 = req.files[0].originalname 
            let fieldname2 = req.files[1].originalname
            let fieldname3 = req.files[2].originalname
            let fieldname4 = req.files[3].originalname
            if ( existeAhorcado ) {
                existeAhorcadoImage1 = existeAhorcado.imageUrl_1.split("/").slice(-1)[0]
                existeAhorcadoImage2 = existeAhorcado.imageUrl_2.split("/").slice(-1)[0]
                existeAhorcadoImage3 = existeAhorcado.imageUrl_3.split("/").slice(-1)[0]
                existeAhorcadoImage4 = existeAhorcado.imageUrl_4.split("/").slice(-1)[0]
                if (existeAhorcadoImage1 === fieldname1 && existeAhorcadoImage2 === fieldname2 && existeAhorcadoImage3 === fieldname3 && existeAhorcadoImage4 === fieldname4 ) {
                    return res.status(400).json({ msg: 'Ese contenido(ahorcado), ya existe ' })
                }
            }

            const deleteParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Delete: {
                    Objects: [
                        {
                            Key: "hangmans/" + existeAhorcadoImage1
                        },
                        {
                            Key: "hangmans/" + existeAhorcadoImage2
                        },
                        {
                            Key: "hangmans/" + existeAhorcadoImage3
                        },
                        {
                            Key: "hangmans/" + existeAhorcadoImage4
                        }
                    ],
                    Quiet: false
                }
            }
            
            S3.deleteObjects(deleteParams, function(err, data) {
                if (err) {
                    res.status(500).json({ msg: 'Hubo un error al tratar de eliminar el ahorcado en AWS' })
                }
                // console.log("Se eliminaron las imágenes en AWS!")
            });

            ahorcadoAntiguo.setImagesUrls(fieldname1, fieldname2, fieldname3, fieldname4 )
            await ahorcadoAntiguo.save()
        }

        let usuario = await Usuario.findOne({ "_id": req.usuario.id })
        if (usuario.isAdmin) {
            ahorcadoNuevo.isEnabled = true
        } else {
            ahorcadoNuevo.isEnabled = false
        }

        // Guardar ahorcado modificado
        ahorcadoAntiguo = await Hangman.findOneAndUpdate(
                                { _id : req.params.id },
                                ahorcadoNuevo,
                                { new: true }
                            );

        
        await ahorcadoAntiguo.save()

        res.json({ ahorcadoAntiguo })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar el contenido seleccionado')
    }
}

exports.habilitarOinhabilitarAhorcadoPorUsuario = async (req, res) => {
    try {
        // Comprobar si existe el ahorcado
        let ahorcadoAntiguo = await Hangman.findById(req.params.id)

        if (!ahorcadoAntiguo) {
            return res.status(404).json({ msg: "No existe este ahorcado" })
        }
        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }

        let ahorcadoNuevo = {}
        ahorcadoNuevo.isEnabled = !ahorcadoAntiguo.isEnabled

        // Guardar ahorcado modificada
        ahorcadoAntiguo = await Hangman.findOneAndUpdate(
                        { _id : req.params.id },
                        ahorcadoNuevo,
                        { new: true }
                        );

        
        await ahorcadoAntiguo.save()

        ahorcadoAntiguo = await Hangman.aggregate([
            { $match: { _id: ahorcadoAntiguo._id } },
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

        res.json({ ahorcadoAntiguo })
        
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo habilitar/inhabilitar el ahorcado') 
    }
}

exports.eliminarAhorcadoPorUsuarioDesdeAdmin = async (req, res) => {
    try {
        let ahorcado = await Hangman.findById(req.params.id);        
        if (!ahorcado) {
            return res.status(404).json({ msg: "No existe el Ahorcado" });
        }

        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }

        let filename1 = (ahorcado.imageUrl_1.split("/")).slice(-1)[0];
        let filename2 = (ahorcado.imageUrl_2.split("/")).slice(-1)[0];
        let filename3 = (ahorcado.imageUrl_3.split("/")).slice(-1)[0];
        let filename4 = (ahorcado.imageUrl_4.split("/")).slice(-1)[0];

        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Delete: {
                Objects: [
                    {
                        Key: "hangmans/" + filename1
                    },
                    {
                        Key: "hangmans/" + filename2
                    },
                    {
                        Key: "hangmans/" + filename3
                    },
                    {
                        Key: "hangmans/" + filename4
                    }
                ],
                Quiet: false
            }
        }
        
        S3.deleteObjects(deleteParams, function(err, data) {
            if (err) {
                res.status(500).json({ msg: 'Hubo un error al tratar de eliminar el ahorcado en AWS' })
            }
        });

        await Hangman.findOneAndRemove({ _id: req.params.id })
        await TagHangmanAssociation.deleteMany({ hangman_id: req.params.id })

        res.json({ msg: "Ahorcado eliminada correctamente" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar el Ahorcado' })
    }
}

exports.modificarAhorcadoDesdeAdmin = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        const {
            associatedWord,
            difficulty,
            points,
        } = req.body;
        // Comprobar si existe el Ahorcado
        let ahorcadoAntiguo = await Hangman.findById(req.params.id)

        if (!ahorcadoAntiguo) {
            return res.status(404).json({ msg: "No existe ese Ahorcado" })
        }
        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }
 
        let ahorcadoNuevo = {}
        ahorcadoNuevo.associatedWord = associatedWord
        ahorcadoNuevo.difficulty = difficulty
        ahorcadoNuevo.points = points

        // Guardar Ahorcado modificada
        ahorcadoAntiguo = await Hangman.findOneAndUpdate(
                        { _id : req.params.id },
                        ahorcadoNuevo,
                        { new: true }
                        );

        await ahorcadoAntiguo.save()

        ahorcadoNuevo = await Hangman.aggregate([
            { $match: { _id: ahorcadoAntiguo._id } },
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

        res.json({ ahorcadoNuevo })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar el Ahorcado seleccionada')
    }
}