const Word          =   require('./models/Word')
const Task          =   require('./models/Task')
const Usuario       =   require('./models/Usuario')
const Level         =   require('./models/Level')
const moment        =   require('moment-timezone');
const level_1       =   "60249074ad44372750035c16";
const angeloUser    =   "60b3dcef8fe1f20015a49a91";
const mongoose      =   require('mongoose');

jest.setTimeout(120000);

const conectarDB = require('./config/db')
// Conectar a la DB
conectarDB()

describe("\n Database => words => Create, Read, Update, Delete.", () => {
    it("Create word", async () => {
        let data = {
            name: "testWord"
        }

        // Crear la nueva Palabra
        let word = await new Word({name: "testWord"})

        // Guardar al Nivel al que pertenece la Palabra
        word.level_id   = mongoose.Types.ObjectId(level_1);
        word.user_id    = mongoose.Types.ObjectId(angeloUser);

        // Fechas de creacion
        word.createdAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
        word.updatedAt = moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
        word.isEnabled = false;
        await word.save()
            .then((result) => {
                expect(result).toEqual(expect.anything())
            }).catch((error) => {
                throw error;
            });
    });

    it("Read word", async () => {
        await Word.findOne({ name: "testWord" })
            .then((word) => {
                expect(word).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Update word", async () => {
        await Word.findOneAndUpdate({name: "testWord"},{points: 2},{ new: true })
            .then((word) => {
                expect(word).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Delete word", async () => {
        await Word.findOneAndRemove({ name: "testWord" })
            .then((word) => {
                expect(word).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });
});

describe("\n Database => tasks => Create, Read, Update, Delete.", () => {
    it("Create task", async () => {
        let task = await new Task;
        task.league_id = mongoose.Types.ObjectId("60249105ad44372750035c1b");
        task.message = "Esta es una tarea unitaria";
        task.type = "UnitTest";
        task.mode = "counts";
        task.total = 5;
        await task.save()
            .then((task) => {
                expect(task).toEqual(expect.anything())
            }).catch((error) => {
                throw error;
            });
    });

    it("Read task", async () => {
        await Task.findOne({ type:"UnitTest" })
            .then((task) => {
                expect(task).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Update task", async () => {
        await Task.findOneAndUpdate({type:"UnitTest"},{total: 7},{ new: true })
            .then((task) => {
                expect(task).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Delete task", async () => {
        await Task.findOneAndRemove({ type:"UnitTest" })
            .then((task) => {
                expect(task).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });
});

