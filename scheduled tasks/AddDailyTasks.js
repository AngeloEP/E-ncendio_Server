const Profile = require('../models/Profile')
const DailyTask = require('../models/DailyTask')
const Task = require('../models/Task')
const Usuario = require('../models/Usuario')
const moment = require('moment-timezone');


module.exports = class DailyTasks {
    static async addTasks() {
        console.log("creando tareas")
        let options = { multi: true, upsert: true };
        await DailyTask.updateMany(
            {isActivated: true},
            {isActivated: false},
            options
        );
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
                task.message = element.message;
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
    }
}