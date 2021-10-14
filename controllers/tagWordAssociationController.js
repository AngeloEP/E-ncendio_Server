const TagWordAssociation = require('../models/TagWordAssociation')
const Usuario = require('../models/Usuario')
const Profile = require('../models/Profile')
const DailyTask = require('../models/DailyTask')
const Category = require('../models/Category')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

exports.crearAsociacionDePalabra = async (req, res) => {
    
    // Extraer información de la asociación
    const {  } = req.body

    try {
        palabraAsociada = new TagWordAssociation()
        palabraAsociada.user_id = req.usuario.id
        palabraAsociada.word_id = req.params.word
        palabraAsociada.category_id = req.params.category

        let palabraRepetida = {}
        palabraRepetida.category_id = req.params.category

        let perfil = await Profile.findOne({user_id: req.usuario.id})
        let nuevoPerfil = {};
        nuevoPerfil.wordTagCount = perfil.wordTagCount + 1;
        await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )

        let tags = nuevoPerfil.wordTagCount;
        let recompensa = null
        if ([10,25,50,100,200].includes(tags)) {
            recompensa = {
                msg: "Por etiquetar ".concat(tags).concat(" palabras, obtuviste "),
                count: tags,
                firePoints: tags
            }

            nuevoPerfil = {};
            nuevoPerfil.firePoints = perfil.firePoints + tags
            await Profile.findOneAndUpdate({ _id : perfil._id }, nuevoPerfil, { new: true } )
        }

        let recompensaTareas = null
        let nuevaTarea = {}
        let tareas = await DailyTask.find({ user_id: req.usuario.id, isActivated: true, isClaimed: false, type: "Word", mode: "counts" })
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

        etiquetaExistente = await TagWordAssociation.findOne({ user_id: req.usuario.id, word_id: req.params.word })

        let responseDist = await TagWordAssociation.aggregate([
            {$match: { "word_id": mongoose.Types.ObjectId(req.params.word) } },
            {
                $group: {
                    _id:  "$category_id",
                    category:  {$first: "$category_id"},
                    countWords: {$sum: 1},
                },
            },
        ])
        let total = 0;
        let porcentaje = null;
        let porcentajeEtiqueta = 0;
        if (responseDist.length != 0) {
            total = responseDist.map(item => item.countWords).reduce((prev, next) => prev + next);
            porcentaje = responseDist.find( tag => {return tag.category == req.params.category} );
        }
        if (total != 0 && porcentaje) {
            porcentajeEtiqueta = Math.round((porcentaje.countWords/total)*100);
        }

        if (etiquetaExistente) {
            await TagWordAssociation.findOneAndUpdate({ _id : etiquetaExistente._id }, palabraRepetida, { new: true } );
            res.json({palabraRepetida, reward: recompensa, rewardTasks: recompensaTareas, tagDistribution: porcentajeEtiqueta })
        } else {
            await palabraAsociada.save()
    
            res.json({palabraAsociada, reward: recompensa, rewardTasks: recompensaTareas, tagDistribution: porcentajeEtiqueta })
        }

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de asociar la Palabra a la categoría'})
    }
}

exports.obtenerAsociacionesPorUsuario = async (req, res) => {
    try {
        let id = mongoose.Types.ObjectId(req.params.id);
        const asociacionesPalabras = await TagWordAssociation.aggregate([
            { $match: { user_id: id } },
            { $lookup: {from: 'categories', localField: 'category_id', foreignField: '_id', as: 'category_id'} },
            { $lookup: {from: 'words', localField: 'word_id', foreignField: '_id', as: 'word_id'} },
            { $replaceWith: {
                $mergeObjects: [
                    { _id: "$_id" },
                    { $arrayToObject: { $map: {
                            input: "$category_id", in: [ "categoria", "$$this.name" ] 
                        } } },
                    { $arrayToObject: { $map: {
                            input: "$word_id", in: [ "palabra", "$$this.name" ] 
                        } } }
                ]
            } },
        ])
        res.json({ asociacionesPalabras })
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de palabras de este usuario')
    }
}

exports.eliminarAsociacionesPorUsuario = async (req, res) => {
    try {
        const etiquetasReseteadas = await TagWordAssociation.deleteMany(
            {
                user_id: req.params.id
            }
        )
        res.status(200).send( "Se han reseteado las etiquetas de palabras " )
    } catch (error) {
        console.log(error)
        res.status(400).send('No se pudo obtener las asociaciones de palabras de este usuario')
    }
}

exports.obtenerDistribucionPalabrasEtiquetadas = async (req, res) => {
    try {
        const { cityWords, isFireRelatedWords } = req.body
        let porcentajeEtiquetas = []
        porcentajeEtiquetas.push(
            await TagWordAssociation.aggregate([
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
                            { $eq: [ cityWords, "" ] },
                            { $ne: [ "$user_id.city", null ] }
                        ]},
                        { $and: [
                            { $ne: [ cityWords, "" ] },
                            { $eq: [ "$user_id.city", cityWords ] }
                        ]},
                    ],
                }}},
                { $match: { $expr: {
                    $or: [
                        { $and: [
                            { $eq: [ isFireRelatedWords, "" ] },
                            { $ne: [ "$user_id.isFireRelated", null ] }
                        ]},
                        { $and: [
                            { $ne: [ isFireRelatedWords, "" ] },
                            { $eq: [ "$user_id.isFireRelated", isFireRelatedWords ] }
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
        res.status(400).send('No se pudo obtener la distribución de etiquetas en palabras')
    }
}

exports.palabrasEtiquetadasPorCategoria = async (req, res) => {
    try {
        const { cityWords, isFireRelatedWords } = req.body
        let palabrasEtiquetadas = await TagWordAssociation.aggregate([
            {
                $lookup: {
                    from: "words",
                    localField: "word_id",
                    foreignField: "_id",
                    as: "word"
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
                        { $eq: [ cityWords, "" ] },
                        { $ne: [ "$user_id.city", null ] }
                    ]},
                    { $and: [
                        { $ne: [ cityWords, "" ] },
                        { $eq: [ "$user_id.city", cityWords ] }
                    ]},
                ],
            }}},
            { $match: { $expr: {
                $or: [
                    { $and: [
                        { $eq: [ isFireRelatedWords, "" ] },
                        { $ne: [ "$user_id.isFireRelated", null ] }
                    ]},
                    { $and: [
                        { $ne: [ isFireRelatedWords, "" ] },
                        { $eq: [ "$user_id.isFireRelated", isFireRelatedWords ] }
                    ]},
                ],
            }}},
            { $unset: "user_id" },
            { $unset: "category_id" },
            { $unset: "word_id" },
            {$unwind: "$word"},
            { 
                $set: {
                    "word": { "_id": "$word._id"},
                    "category": "$category.name",
                }
            },
            {$unwind: "$category"},
            { $unset: "word.points"},
            { $unset: "word.createdAt"},
            { $unset: "word.updatedAt"},
            { $unset: "word.isEnabled" },
            { $unset: "word.user_id" },
            { $unset: "word.difficulty" },
            { $unset: "word.level_id" },
            {
                $group: {
                    _id:  "$word._id",
                    word: {$first : "$word"},
                    category: {$first : "$category"},
                },
            },
        ])
        
       var distribucionPorPalabra = []
        palabrasEtiquetadas.forEach( async (word, index) => {
            let distribucion = await TagWordAssociation.aggregate([
                {$match: { "word_id": word.word._id } },
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
                            { $eq: [ cityWords, "" ] },
                            { $ne: [ "$user_id.city", null ] }
                        ]},
                        { $and: [
                            { $ne: [ cityWords, "" ] },
                            { $eq: [ "$user_id.city", cityWords ] }
                        ]},
                    ],
                }}},
                { $match: { $expr: {
                    $or: [
                        { $and: [
                            { $eq: [ isFireRelatedWords, "" ] },
                            { $ne: [ "$user_id.isFireRelated", null ] }
                        ]},
                        { $and: [
                            { $ne: [ isFireRelatedWords, "" ] },
                            { $eq: [ "$user_id.isFireRelated", isFireRelatedWords ] }
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
                { $unset: "word_id" },
                { "$sort": { "count": -1 } },
            ])
                let impacto = distribucion.filter(element => { return element.category[0] === "Impacto" })
                let riesgo = distribucion.filter(element => { return element.category[0] === "Riesgo" })
                let recuperacion = distribucion.filter(element => { return element.category[0] === "Recuperación" })
                let mitigacion = distribucion.filter(element => { return element.category[0] === "Mitigación" })
                let combate = distribucion.filter(element => { return element.category[0] === "Combate" })
                let amenaza = distribucion.filter(element => { return element.category[0] === "Amenaza" })
                let prevencion = distribucion.filter(element => { return element.category[0] === "Prevención" })
                if (impacto.length > 0) { word.impacto = impacto[0].count } else { word.impacto = 0 }
                if (riesgo.length > 0) { word.riesgo = riesgo[0].count } else { word.riesgo = 0}
                if (recuperacion.length > 0) { word.recuperacion = recuperacion[0].count } else { word.recuperacion = 0}
                if (mitigacion.length > 0) { word.mitigacion = mitigacion[0].count } else { word.mitigacion = 0}
                if (combate.length > 0) { word.combate = combate[0].count } else { word.combate = 0}
                if (amenaza.length > 0) { word.amenaza = amenaza[0].count } else { word.amenaza = 0}
                if (prevencion.length > 0) { word.prevencion = prevencion[0].count } else { word.prevencion = 0}
                await distribucionPorPalabra.push(word)
                const todas = await Promise.all(distribucionPorPalabra)
                if (todas.length === palabrasEtiquetadas.length){
                    res.json(distribucionPorPalabra)
                }
            })
    } catch (error) {
        console.log(error)
        res.status(400).send('Ocurrió un error, no se pudo obtener las palabras de esta categoría')
    }
}