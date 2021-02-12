const Category = require('../models/Category')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')

exports.crearCategoria = async (req, res) => {
    // Revisar si hay errores
    const errores = validationResult(req)
    if ( !errores.isEmpty() ) {
        return res.status(400).json({ errores: errores.array() })
    }

    // Extraer información de la imagen
    const { name } = req.body
    
    try {
        // Revisar si hay otra con ese nombre
        let categoria = await Category.findOne({ name })

        if (categoria) {
            return res.status(400).json({ msg: "La Categoría ingresada ya existe" })
        }
        
        // Crear la nueva categoría
        categoria = new Category(req.body)

        await categoria.save()

        res.json(categoria)

    } catch (error) {
        console.log(error)
        res.status(400).send({ msg: 'Hubo un error al tratar de crear la categoría'})
    }
}

exports.obtenerCategorias = async (req, res) => {
    try {
        const categorias = await Category.find({})
        res.json({ categorias })
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Hubo un error al tratar de obtener las categorías' })
    }
}