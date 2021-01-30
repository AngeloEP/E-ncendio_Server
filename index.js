const express = require("express")
const conectarDB = require('./config/db')

// Crear el Server
const app = express()

// Conectar a la DB
conectarDB()

// Habilitar express.json
app.use(express.json({ extended: true }))

// Puerto de la app
const PORT = process.env.PORT || 4000

// Importar rutas para los usuarios
app.use('/api/usuarios', require('./routes/usuarios'))

// Importar rutas para las imágenes
app.use('/api/images', require('./routes/images'))

// Importar rutas para autentificaciones
app.use('/api/auth', require('./routes/auth'))

// Arrancar el server
app.listen(PORT, () => {
    console.log(`Es servidor esta funcionando en el puerto ${PORT}`)
})