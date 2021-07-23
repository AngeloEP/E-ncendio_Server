const TagImageAssociation = require('../models/TagImageAssociation')
const Usuario = require('../models/Usuario')
const Profile = require('../models/Profile')
const DailyTask = require('../models/DailyTask')
const Image = require('../models/Image')
const Category = require('../models/Category')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

exports.crearAsociacionDeImagen = async (req, res) => {
    
    // Extraer información de la asociación
    const {  } = req.body

    try {
        imagenAsociada = new TagImageAssociation()
        imagenAsociada.user_id = req.usuario.id
        imagenAsociada.image_id = req.params.image
        imagenAsociada.category_id = req.params.category

        let imagenRepetida = {}
        imagenRepetida.category_id = req.params.category

        let perfil = await Profile.findOne({user_id: req.usuario.id})
        let nuevoPerfil = {};
        nuevoPerfil.imageTagCount = perfil.imageTagCount + 1;
        await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )

        let tags = nuevoPerfil.imageTagCount;
        let recompensa = null
        if ([10,25,50,100,200].includes(tags)) {
            recompensa = {
                msg: "Por etiquetar ".concat(tags).concat(" imágenes, obtuviste "),
                count: tags,
                firePoints: tags
            }

            nuevoPerfil = {};
            nuevoPerfil.firePoints = perfil.firePoints + tags
            await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
        }

        let recompensaTareas = null
        let nuevaTarea = {}
        let tareas = await DailyTask.find({ user_id: req.usuario.id, isActivated: true, isClaimed: false, type: "Image", mode: "counts" })
        if (tareas.length > 0) {
            tareas.forEach( async (tareita) => {
                nuevaTarea.newCount = tareita.newCount + 1;
                if ( nuevaTarea.newCount === tareita.total ) {
                    nuevaTarea.isClaimed = true;
                    recompensaTareas = {
                        msg: "Cumpliste tu tarea de: ".concat(tareita.message).concat(", obtuviste "),
                        count: tareita.total,
                        firePoints: 25
                    }
                    nuevoPerfil = {};
                    nuevoPerfil.firePoints = perfil.firePoints + 25
                    await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
                }
                await DailyTask.findOneAndUpdate({ _id : tareita._id }, nuevaTarea, { new: true } )
            })
        }

        etiquetaExistente = await TagImageAssociation.findOne({ user_id: req.usuario.id, image_id: req.params.image })
        if (etiquetaExistente) {
            await TagImageAssociation.findOneAndUpdate({ _id : etiquetaExistente._id }, imagenRepetida, { new: true } );
            res.json({imagenRepetida, reward: recompensa, rewardTasks: recompensaTareas })
        } else {
            await imagenAsociada.save()
            res.json({imagenAsociada, reward: recompensa, rewardTasks: recompensaTareas })
        }

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de asociar la imagen a la categoría'})
    }
}

exports.obtenerAsociacionesPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.params.id);
        const asociacionesImagenes = await TagImageAssociation.aggregate([
            { $match: { user_id: id } },
            { $lookup: {from: 'categories', localField: 'category_id', foreignField: '_id', as: 'category_id'} },
            { $lookup: {from: 'images', localField: 'image_id', foreignField: '_id', as: 'image_id'} },
            { $replaceWith: {
                $mergeObjects: [
                    { _id: "$_id" },
                    { $arrayToObject: { $map: {
                            input: "$category_id", in: [ "categoria", "$$this.name" ] 
                        } } },
                    { $arrayToObject: { $map: {
                            input: "$image_id", in: [ "urlImagen", "$$this.imageUrl" ] 
                        } } }
                ]
            } },
        ])
        res.json({ asociacionesImagenes })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de imágenes de este usuario')
    }
}

exports.eliminarAsociacionesPorUsuario = async (req, res) => {
    try {
        const etiquetasReseteadas = await TagImageAssociation.deleteMany(
            {
                user_id: req.params.id
            }
        )
        res.status(200).send( "Se han reseteado las etiquetas de imágenes " )
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de imágenes de este usuario')
    }
}