const express = require("express")
const conectarDB = require('./config/db')
const cors = require('cors')
const path = require('path')
process.env.PWD = process.cwd()

// Crear el Server
const app = express()

// Conectar a la DB
conectarDB()

// Habilitar cors
app.use(cors())

// Habilitar express.json
app.use(express.json({ extended: true }))
// app.use('/public', express.static(`${process.env.PWD}/storage/imgs`))
app.use('/public', express.static(path.join(process.env.PWD, '/storage/imgs')));
// app.use('/public', express.static(path.join(__dirname, './storage/imgs/')))
app.use('/public/profile_image', express.static(`${process.env.PWD}/storage/profiles_images`))

// Puerto de la app
const port = process.env.PORT || 4000

// Importar rutas para los usuarios
app.use('/api/usuarios', require('./routes/usuarios'))

// Importar rutas para las imágenes
app.use('/api/images', require('./routes/images'))

// Importar rutas para autentificaciones
app.use('/api/auth', require('./routes/auth'))

// Importar rutas para los niveles
app.use('/api/levels', require('./routes/levels'))

// Importar rutas para las ligas
app.use('/api/leagues', require('./routes/leagues'))

// Importar rutas para las categorías
app.use('/api/categories', require('./routes/categories'))

// Importar rutas para perfiles de usuario
app.use('/api/profiles', require('./routes/profiles'))

// Importar rutas para agregar las palabras a etiquetar
app.use('/api/words', require('./routes/words'))

// Importar rutas para las asociaciones de imágenes
app.use('/api/tag-images', require('./routes/tagImageAssociations'))

// Importar rutas para las asociaciones de Palabras
app.use('/api/tag-words', require('./routes/tagWordAssociations'))

// Importar rutas para los formularios de contacto
app.use('/api/contact-form', require('./routes/contactForms'))


// Arrancar el server
app.listen(port, '0.0.0.0', () => {
    console.log(`Es servidor esta funcionando en el puerto ${port}`)
})