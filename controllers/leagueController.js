const League = require('../models/League')
const Profile = require('../models/Profile')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')

exports.crearLiga = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    const { league, pointsNextLeague } = req.body
    try {
        let liga = await League.findOne({ league })

        if (liga) {
            return res.status(400).json({ msg: 'La liga ya existe' })
        }
        liga = await League.findOne({ pointsNextLeague })
        if (liga) {
            return res.status(400).json({ msg: 'Esta puntuación de Liga ya existe' })
        }

        liga = new League(req.body)
        await liga.save()

        res.json(liga)

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de guardar la liga'})
    }

}

exports.sumarLigas = async (req, res) => {
    try {
        let ligas = await Profile.aggregate([
            {
                $lookup: {
                    "from": "leagues",
                    "localField": "league_id",
                    "foreignField": "_id",
                    "as": "league_id"
                }
            },
            { "$unwind": "$league_id" },
            {
                $group: {
                    _id: "$league_id.league",
                    Total: {$sum: 1}
                }
            }
        ])
        res.json(ligas)
    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de agrupar y sumar las ligas'})
    }
}