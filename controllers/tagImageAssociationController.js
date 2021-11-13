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

        let responseDist = await TagImageAssociation.aggregate([
            {$match: { "image_id": mongoose.Types.ObjectId(req.params.image) } },
            {
                $group: {
                    _id:  "$category_id",
                    category:  {$first: "$category_id"},
                    countImages: {$sum: 1},
                },
            },
        ])
        let total = 0;
        let porcentaje = null;
        let porcentajeEtiqueta = 0;
        if (responseDist.length != 0) {
            total = responseDist.map(item => item.countImages).reduce((prev, next) => prev + next);
            porcentaje = responseDist.find( tag => {return tag.category == req.params.category} );
        }
        if (total != 0 && porcentaje) {
            porcentajeEtiqueta = Math.round((porcentaje.countImages/total)*100);
        }

        if (etiquetaExistente) {
            await TagImageAssociation.findOneAndUpdate({ _id : etiquetaExistente._id }, imagenRepetida, { new: true } );
            res.json({imagenRepetida, reward: recompensa, rewardTasks: recompensaTareas, tagDistribution: porcentajeEtiqueta })
        } else {
            await imagenAsociada.save()
            res.json({imagenAsociada, reward: recompensa, rewardTasks: recompensaTareas, tagDistribution: porcentajeEtiqueta })
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

exports.obtenerDistribucionImagenesEtiquetadas = async (req, res) => {
    try {
        const { cityImages, isFireRelatedImages } = req.body
        let porcentajeEtiquetas = []
        porcentajeEtiquetas.push(
            await TagImageAssociation.aggregate([
                {
                    $lookup: {
                        from: "categories",
                        localField: "category_id",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $lookup: {
                        from: "usuarios",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_id"
                    }
                },
                {$unwind: "$user_id"},
                { $match: { $expr: {
                    $or: [
                        { $and: [
                            { $eq: [ cityImages, "" ] },
                            { $ne: [ "$user_id.city", null ] }
                        ]},
                        { $and: [
                            { $ne: [ cityImages, "" ] },
                            { $eq: [ "$user_id.city", cityImages ] }
                        ]},
                    ],
                }}},
                { $match: { $expr: {
                    $or: [
                        { $and: [
                            { $eq: [ isFireRelatedImages, "" ] },
                            { $ne: [ "$user_id.isFireRelated", null ] }
                        ]},
                        { $and: [
                            { $ne: [ isFireRelatedImages, "" ] },
                            { $eq: [ "$user_id.isFireRelated", isFireRelatedImages ] }
                        ]},
                    ],
                }}},
                {
                    $group: {
                        _id:  "$category._id",
                        category: {$first : "$category.name"},
                        count: {$sum: 1},
                    },
                },
                {$unwind: "$category"},
                {$unwind: "$_id"},
                { "$sort": { "count": -1 } },
            ])
        );
        porcentajeEtiquetas = porcentajeEtiquetas[0]
        let totalAmount = 0;
        porcentajeEtiquetas.forEach( data => totalAmount = totalAmount + data.count);
        porcentajeEtiquetas.push({total: totalAmount})
        res.json(porcentajeEtiquetas)
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener la distribución de etiquetas en imágenes')
    }
}

exports.imagenesEtiquetadasPorCategoria = async (req, res) => {
    try {
        const { cityImages, isFireRelatedImages } = req.body
        let imagenesEtiquetadas = await TagImageAssociation.aggregate([
            {
                $lookup: {
                    from: "images",
                    localField: "image_id",
                    foreignField: "_id",
                    as: "image"
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "category_id",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {$match: { "category.name": req.params.category } },
            {
                $lookup: {
                    from: "usuarios",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_id"
                }
            },
            {$unwind: "$user_id"},
            { $match: { $expr: {
                $or: [
                    { $and: [
                        { $eq: [ cityImages, "" ] },
                        { $ne: [ "$user_id.city", null ] }
                    ]},
                    { $and: [
                        { $ne: [ cityImages, "" ] },
                        { $eq: [ "$user_id.city", cityImages ] }
                    ]},
                ],
            }}},
            { $match: { $expr: {
                $or: [
                    { $and: [
                        { $eq: [ isFireRelatedImages, "" ] },
                        { $ne: [ "$user_id.isFireRelated", null ] }
                    ]},
                    { $and: [
                        { $ne: [ isFireRelatedImages, "" ] },
                        { $eq: [ "$user_id.isFireRelated", isFireRelatedImages ] }
                    ]},
                ],
            }}},
            { $unset: "user_id" },
            { $unset: "category_id" },
            { $unset: "image_id" },
            {$unwind: "$image"},
            { 
                $set: {
                    "image": { "_id": "$image._id"},
                    "category": "$category.name",
                }
            },
            {$unwind: "$category"},
            { $unset: "image.points"},
            { $unset: "image.filename"},
            { $unset: "image.createdAt"},
            { $unset: "image.updatedAt"},
            { $unset: "image.isEnabled" },
            { $unset: "image.user_id" },
            { $unset: "image.difficulty" },
            { $unset: "image.level_id" },
            {
                $group: {
                    _id:  "$image._id",
                    image: {$first : "$image"},
                    category: {$first : "$category"},
                },
            },
        ])
        let categorias = await Category.find({})
       var distribucionPorImagen = []
        imagenesEtiquetadas.forEach( async (imagen, index) => {
            let distribucion = await TagImageAssociation.aggregate([
                {$match: { "image_id": imagen.image._id } },
                {
                    $lookup: {
                        from: "usuarios",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_id"
                    }
                },
                {$unwind: "$user_id"},
                { $match: { $expr: {
                    $or: [
                        { $and: [
                            { $eq: [ cityImages, "" ] },
                            { $ne: [ "$user_id.city", null ] }
                        ]},
                        { $and: [
                            { $ne: [ cityImages, "" ] },
                            { $eq: [ "$user_id.city", cityImages ] }
                        ]},
                    ],
                }}},
                { $match: { $expr: {
                    $or: [
                        { $and: [
                            { $eq: [ isFireRelatedImages, "" ] },
                            { $ne: [ "$user_id.isFireRelated", null ] }
                        ]},
                        { $and: [
                            { $ne: [ isFireRelatedImages, "" ] },
                            { $eq: [ "$user_id.isFireRelated", isFireRelatedImages ] }
                        ]},
                    ],
                }}},
                {
                    $lookup: {
                        from: "categories",
                        localField: "category_id",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $group: {
                        _id:  "$category._id",
                        category: {$first : "$category.name"},
                        count: {$sum: 1},
                    },
                },
                { $unset: "user_id" },
                { $unset: "image_id" },
                { "$sort": { "count": -1 } },
            ])
                imagen.categories = []
                categorias.forEach((category, index) => {
                    let cat = distribucion.filter(element => { return element.category[0] === category.name })
                    if (cat.length > 0) {
                        imagen.categories.push({ name: category.name, count: cat[0].count}) 
                    } else {
                        imagen.categories.push({ name: category.name, count: 0})
                    }
                })
                await distribucionPorImagen.push(imagen)
                const todas = await Promise.all(distribucionPorImagen)
                if (todas.length === imagenesEtiquetadas.length){
                    res.json(distribucionPorImagen)
                }
            })
    } catch (error) {
        console.log(error)
        res.status(400).send('Ocurrió un error, no se pudo obtener las imágenes de esta categoría')
    }
}