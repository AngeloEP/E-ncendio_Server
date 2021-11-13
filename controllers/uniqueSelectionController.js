const UniqueSelection = require('../models/UniqueSelection')
const TagUniqueSelectionAssociation = require('../models/TagUniqueSelectionAssociation')
const Profile = require('../models/Profile')
const DailyTask = require('../models/DailyTask')
const League = require('../models/League')
const Usuario = require('../models/Usuario')
const Level = require('../models/Level')
const { validationResult } = require('express-validator')
const mongoose = require('mongoose')
const uploadS3MultipleUniqueSelection = require('../libs/storeagMultipleUniqueSelection')
const moment = require('moment-timezone');
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    signatureVersion: 'v4'
});
const S3 = new AWS.S3();

exports.cargarImagenes = async (req, res, next) => {
    uploadS3MultipleUniqueSelection(req, res, function (error) {
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
    uploadS3MultipleUniqueSelection(req, res, function (error) {
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

exports.guardarSeleccionUnica = async (req, res) => {
    try {
        let perfilAntiguo = await Profile.findOne({ user_id: req.usuario.id })
        let ligaAntigua = await League.findOne({ _id: perfilAntiguo.league_id })

        // Crear la nueva selección única
        let { keyWord } = req.body
        uniqueSelection = new UniqueSelection(req.body)

        let fieldname1 = req.files[0].originalname 
        let fieldname2 = req.files[1].originalname
        let fieldname3 = req.files[2].originalname
        uniqueSelection.setImagesUrls(fieldname1, fieldname2, fieldname3 )
        if( !req.files ) {
            return res.status(400).json({ msg: 'No ha adjuntado las imágenes' })
        }

        // Revisar que la selección única no exista
        let existeSeleccionUnica = await UniqueSelection.findOne({ keyWord })
        if ( existeSeleccionUnica ) {
            let existeSeleccionUnicaImage1 = existeSeleccionUnica.imageUrl_1.split("/").slice(-1)[0]
            let existeSeleccionUnicaImage2 = existeSeleccionUnica.imageUrl_2.split("/").slice(-1)[0]
            let existeSeleccionUnicaImage3 = existeSeleccionUnica.imageUrl_3.split("/").slice(-1)[0]
            if (existeSeleccionUnicaImage1 === fieldname1 && existeSeleccionUnicaImage2 === fieldname2 && existeSeleccionUnicaImage3 === fieldname3 ) {
                return res.status(400).json({ msg: 'Ese contenido, ya existe ' })
            }
        }
        
        // Encontrar nivel a asociar
        nivel = await Level.findOne({ level: 1 })

        // Guardar al Nivel al que pertenece la selección única
        uniqueSelection.level_id = nivel._id;
        uniqueSelection.user_id = req.usuario.id;

        uniqueSelection.createdAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
        uniqueSelection.updatedAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
        let usuario = await Usuario.findOne({ "_id": req.usuario.id })
        if (usuario.isAdmin) {
            uniqueSelection.isEnabled = true
        } else {
            uniqueSelection.isEnabled = false
        }

        let addPoints = 25;
        let nuevoPerfil = {}
        nuevoPerfil.score = perfilAntiguo.score + addPoints
        nuevoPerfil.uploadUniqueSelectionCount = perfilAntiguo.uploadUniqueSelectionCount + 1

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

        await uniqueSelection.save()

        perfilAntiguo = await Profile.findOne({user_id: req.usuario.id})
        let id = mongoose.Types.ObjectId(req.usuario.id);
        let uploads = perfilAntiguo.uploadUniqueSelectionCount;
        let recompensa = null
        if ([5,10,15,20,25].includes(uploads)) {
            recompensa = {
                msg: "Por haber aportado ".concat(uploads).concat(" veces contenido para las selecciones únicas al sitio, obtuviste "),
                count: uploads,
                firePoints: uploads
            }

            nuevoPerfil = {};
            nuevoPerfil.firePoints = perfilAntiguo.firePoints + uploads
            await Profile.findOneAndUpdate({ _id : perfilAntiguo._id }, nuevoPerfil, { new: true } )
        }

        let recompensaTareas = null
        let nuevaTarea = {}
        let perfil = await Profile.findOne({user_id: req.usuario.id})
        let tareas = await DailyTask.find({ user_id: req.usuario.id, isActivated: true, isClaimed: false, type: "UniqueSelection", mode: "uploads" })
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

        res.json({uniqueSelection, reward: recompensa, rewardTasks: recompensaTareas })

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar la selección única'})
    }
}

exports.obtenerSeleccionesUnicas = async (req, res) => {
    try {
        let seleccionesUnicas = await UniqueSelection.find({ isEnabled: true })
        seleccionesUnicas = seleccionesUnicas.sort(function() {return Math.random() - 0.5});
        res.json({ seleccionesUnicas })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener las selecciones únicas' })
    }
}

exports.obtenerSeleccionesUnicasPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.usuario.id);
        const seleccionesUnicas = await UniqueSelection.aggregate([
            { $match: { user_id: id } },
            { $replaceWith: {
                "_id": "$_id",
                "Imagen1": "$imageUrl_1",
                "Imagen2": "$imageUrl_2",
                "Imagen3": "$imageUrl_3",
                "Palabra" : "$keyWord",
                "Dificultad" : "$difficulty",
                "Puntos" : "$points",
                "Estado" : "$isEnabled",
                "Creado el" : "$createdAt",
                "Actualizado el" : "$updatedAt",
            } },
          ])
        res.json({ seleccionesUnicas })
    } catch (error) {
        console.log(error)
        res.status(400).json({ msg: 'Hubo un error al tratar de obtener las asociaciones únicas del usuario' })
    }
}

exports.eliminarSeleccionUnicaPorUsuario = async (req, res) => {
    try {
        let seleccionUnica = await UniqueSelection.findById(req.params.id);
        
        if (!seleccionUnica) {
            return res.status(404).json({ msg: "No existe ese contenido" });
        }

        if (req.usuario.id != seleccionUnica.user_id) {
            return res.status(404).json({ msg: "Este usuario no tiene permisos para eliminar este contenido" });
        }
        
        let filename1 = (seleccionUnica.imageUrl_1.split("/")).slice(-1)[0];
        let filename2 = (seleccionUnica.imageUrl_2.split("/")).slice(-1)[0];
        let filename3 = (seleccionUnica.imageUrl_3.split("/")).slice(-1)[0];

        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Delete: {
                Objects: [
                    {
                        Key: "unique_selection_images/" + filename1
                    },
                    {
                        Key: "unique_selection_images/" + filename2
                    },
                    {
                        Key: "unique_selection_images/" + filename3
                    },
                ],
                Quiet: false
            }
        }
        
        S3.deleteObjects(deleteParams, function(err, data) {
            if (err) {
                res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la selección única en AWS' })
            }
        });
        
        // Eliminar selección única de la BD
        await UniqueSelection.findOneAndRemove({ _id: req.params.id })


        res.json({ msg: "Selección única eliminada correctamente" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la selección única' })
    }
}

exports.modificarSeleccionUnicaPorUsuario = async (req, res) => {
    try {
        // Comprobar si existe la selección única
        let seleccionUnicaAntigua = await UniqueSelection.findById(req.params.id)

        if (!seleccionUnicaAntigua) {
            return res.status(404).json({ msg: "No existe ese contenido" })
        }
        if ( seleccionUnicaAntigua.user_id.toString() !== req.usuario.id ) {
            return res.status(401).json({ msg: "No Autorizado, no puede editar el contenido de este Usuario" })
        }
        let { keyWord } = req.body

        let seleccionUnicaNueva = {}
        seleccionUnicaNueva.keyWord = keyWord;
        
        if (req.files.length != 0) {
            // Revisar que el nombre de la selección única exista
            let existeSeleccionUnica = await UniqueSelection.findOne({ keyWord })
            let existeSeleccionUnicaImage1, existeSeleccionUnicaImage2, existeSeleccionUnicaImage3;
            let fieldname1 = req.files[0].originalname 
            let fieldname2 = req.files[1].originalname
            let fieldname3 = req.files[2].originalname
            if ( existeSeleccionUnica ) {
                existeSeleccionUnicaImage1 = existeSeleccionUnica.imageUrl_1.split("/").slice(-1)[0]
                existeSeleccionUnicaImage2 = existeSeleccionUnica.imageUrl_2.split("/").slice(-1)[0]
                existeSeleccionUnicaImage3 = existeSeleccionUnica.imageUrl_3.split("/").slice(-1)[0]
                if (existeSeleccionUnicaImage1 === fieldname1 && existeSeleccionUnicaImage2 === fieldname2 && existeSeleccionUnicaImage3 === fieldname3 ) {
                    return res.status(400).json({ msg: 'Ese contenido, ya existe ' })
                }
            }

            const deleteParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Delete: {
                    Objects: [
                        {
                            Key: "unique_selection_images/" + existeSeleccionUnicaImage1
                        },
                        {
                            Key: "unique_selection_images/" + existeSeleccionUnicaImage2
                        },
                        {
                            Key: "unique_selection_images/" + existeSeleccionUnicaImage3
                        },
                    ],
                    Quiet: false
                }
            }
            
            S3.deleteObjects(deleteParams, function(err, data) {
                if (err) {
                    res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la selección única en AWS' })
                }
            });

            seleccionUnicaAntigua.setImagesUrls(fieldname1, fieldname2, fieldname3)
            await seleccionUnicaAntigua.save()
        }

        let usuario = await Usuario.findOne({ "_id": req.usuario.id })
        if (usuario.isAdmin) {
            seleccionUnicaNueva.isEnabled = true
        } else {
            seleccionUnicaNueva.isEnabled = false
        }

        // Guardar selección única modificada
        seleccionUnicaAntigua = await UniqueSelection.findOneAndUpdate(
                                { _id : req.params.id },
                                seleccionUnicaNueva,
                                { new: true }
                            );

        
        await seleccionUnicaAntigua.save()

        res.json({ seleccionUnicaAntigua })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar el contenido seleccionado')
    }
}

exports.habilitarOinhabilitarSeleccionUnicaPorUsuario = async (req, res) => {
    try {
        // Comprobar si existe la selección única
        let seleccionUnicaAntigua = await UniqueSelection.findById(req.params.id)

        if (!seleccionUnicaAntigua) {
            return res.status(404).json({ msg: "No existe esta selección única" })
        }
        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }

        let seleccionUnicaNueva = {}
        seleccionUnicaNueva.isEnabled = !seleccionUnicaAntigua.isEnabled

        // Guardar selección única modificada
        seleccionUnicaAntigua = await UniqueSelection.findOneAndUpdate(
                        { _id : req.params.id },
                        seleccionUnicaNueva,
                        { new: true }
                        );

        
        await seleccionUnicaAntigua.save()

        seleccionUnicaAntigua = await UniqueSelection.aggregate([
            { $match: { _id: seleccionUnicaAntigua._id } },
            { $replaceWith: {
                "_id": "$_id",
                "Imagen1": "$imageUrl_1",
                "Imagen2": "$imageUrl_2",
                "Imagen3": "$imageUrl_3",
                "Palabra" : "$keyWord",
                "Dificultad" : "$difficulty",
                "Puntos" : "$points",
                "Habilitada" : "$isEnabled",
                "Creadoel" : "$createdAt",
                "Actualizadoel" : "$updatedAt",
            } },
        ])

        res.json({ seleccionUnicaAntigua })
        
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo habilitar/inhabilitar la selección única') 
    }
}

exports.eliminarSeleccionUnicaPorUsuarioDesdeAdmin = async (req, res) => {
    try {
        let seleccionUnica = await UniqueSelection.findById(req.params.id);        
        if (!seleccionUnica) {
            return res.status(404).json({ msg: "No existe la selección única" });
        }

        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }

        let filename1 = (seleccionUnica.imageUrl_1.split("/")).slice(-1)[0];
        let filename2 = (seleccionUnica.imageUrl_2.split("/")).slice(-1)[0];
        let filename3 = (seleccionUnica.imageUrl_3.split("/")).slice(-1)[0];

        const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Delete: {
                Objects: [
                    {
                        Key: "unique_selection_images/" + filename1
                    },
                    {
                        Key: "unique_selection_images/" + filename2
                    },
                    {
                        Key: "unique_selection_images/" + filename3
                    },
                ],
                Quiet: false
            }
        }
        
        S3.deleteObjects(deleteParams, function(err, data) {
            if (err) {
                res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la selección única en AWS' })
            }
        });

        await UniqueSelection.findOneAndRemove({ _id: req.params.id })
        await TagUniqueSelectionAssociation.deleteMany({ uniqueSelection_id: req.params.id })

        res.json({ msg: "Selección única eliminada correctamente" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de eliminar la Selección única' })
    }
}

exports.modificarSeleccionUnicaDesdeAdmin = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    try {
        const {
            keyWord,
            difficulty,
            points,
        } = req.body;
        // Comprobar si existe la selección única
        let seleccionUnicaAntigua = await UniqueSelection.findById(req.params.id)

        if (!seleccionUnicaAntigua) {
            return res.status(404).json({ msg: "No existe esa selección única" })
        }
        let usuarioModificador = await Usuario.findById(req.usuario.id)
        if ( !usuarioModificador.isAdmin ) {
            return res.status(401).json({ msg: "No Autorizado, debe ser un usuario administrador" })
        }
 
        let seleccionUnicaNueva = {}
        seleccionUnicaNueva.keyWord = keyWord
        seleccionUnicaNueva.difficulty = difficulty
        seleccionUnicaNueva.points = points

        // Guardar selección única modificada
        seleccionUnicaAntigua = await UniqueSelection.findOneAndUpdate(
                        { _id : req.params.id },
                        seleccionUnicaNueva,
                        { new: true }
                        );

        await seleccionUnicaAntigua.save()

        seleccionUnicaNueva = await UniqueSelection.aggregate([
            { $match: { _id: seleccionUnicaAntigua._id } },
            { $replaceWith: {
                "_id": "$_id",
                "Imagen1": "$imageUrl_1",
                "Imagen2": "$imageUrl_2",
                "Imagen3": "$imageUrl_3",
                "Palabra" : "$keyWord",
                "Dificultad" : "$difficulty",
                "Puntos" : "$points",
                "Habilitada" : "$isEnabled",
                "Creadoel" : "$createdAt",
                "Actualizadoel" : "$updatedAt",
            } },
        ])

        res.json({ seleccionUnicaNueva })

    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo modificar la selección única seleccionada')
    }
}