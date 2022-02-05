// models to use
const Usuario       =   require('./models/Usuario');
const Word          =   require('./models/Word');
const Task          =   require('./models/Task');
const League        =   require('./models/League');
const Level         =   require('./models/Level');
const Category      =   require('./models/Category');
const ContactForm   =   require('./models/ContactForm');
const DailyTask     =   require('./models/DailyTask');
const Store         =   require('./models/Store');
const UserBuyStore  =   require('./models/UserBuyStore');
const Log           =   require('./models/Log');

// dependencies to use
const moment        =   require('moment-timezone');
const mongoose      =   require('mongoose');

// data to test
const level_1       =   "60249074ad44372750035c16";
const angeloUser    =   "60b3dcef8fe1f20015a49a91";

jest.setTimeout(120000);

// Conectar a la BD
const conectarBD    =   require('./config/db')
conectarBD()

// C.R.U.D. Words
describe("\n Database => words => Create, Read, Update, Delete.", () => {
    it("Create word", async () => {
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

// C.R.U.D. Tasks and DailyTasks
describe("\n Database => tasks and dailyTasks => Create, Read, Update, Delete.", () => {
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

    // C.R.U.D DailyTasks
    it("Create dailyTask", async () => {
        await Task.findOne({ type:"UnitTest" })
            .then(async (task) => {
                let dailyTask           =   await new DailyTask;
                dailyTask.user_id       =   mongoose.Types.ObjectId(angeloUser);
                dailyTask.league_id     =   task.league_id;
                dailyTask.message       =   task.message;
                dailyTask.type          =   task.type;
                dailyTask.mode          =   task.mode;
                dailyTask.total         =   task.total;
                dailyTask.newCount      =   0;
                dailyTask.isClaimed     =   false;
                dailyTask.isActivated   =   true;
                dailyTask.createdAt     =   moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
                dailyTask.updatedAt     =   moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
                await dailyTask.save()
                    .then((dailyTask) => {
                        expect(dailyTask).toEqual(expect.anything())
                    })
                    .catch((error) => {
                        throw error;
                    });
            }).catch((error) => {
                throw error;
            });
    });

    it("Read dailyTask", async () => {
        await DailyTask.findOne({ type: "UnitTest" })
            .then((dailyTask) => {
                expect(dailyTask).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Update dailyTask", async () => {
        await DailyTask.findOneAndUpdate({type: "UnitTest"},{total: 9},{ new: true })
            .then((dailyTask) => {
                expect(dailyTask).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Delete dailyTask", async () => {
        await DailyTask.findOneAndRemove({ type: "UnitTest" })
            .then((dailyTask) => {
                expect(dailyTask).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    // Finish C.R.U.D DailyTasks //
    it("Delete task", async () => {
        await Task.findOneAndRemove({ type:"UnitTest" })
            .then((task) => {
                expect(task).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });
});

// C.R.U.D. Leagues
describe("\n Database => leagues => Create, Read, Update, Delete.", () => {
    it("Create league", async () => {
        let league = await new League;
        league.pointsNextLeague = 99999;
        league.pointsPreviousLeague = 9999;
        league.league = "Diamante";
        
        
        await league.save()
            .then((league) => {
                expect(league).toEqual(expect.anything())
            }).catch((error) => {
                throw error;
            });
    });

    it("Read league", async () => {
        await League.findOne({ league:"Diamante" })
            .then((league) => {
                expect(league).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Update league", async () => {
        await League.findOneAndUpdate({league:"Diamante"},{pointsNextLeague: 99998},{ new: true })
            .then((league) => {
                expect(league).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Delete league", async () => {
        await League.findOneAndRemove({ league:"Diamante" })
            .then((league) => {
                expect(league).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });
});

// C.R.U.D Levels
describe("\n Database => levels => Create, Read, Update, Delete.", () => {
    it("Create level", async () => {
        let level = await new Level;
        level.level = 9;

        await level.save()
            .then((level) => {
                expect(level).toEqual(expect.anything())
            }).catch((error) => {
                throw error;
            });
    });

    it("Read level", async () => {
        await Level.findOne({ level: 9 })
            .then((level) => {
                expect(level).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Update level", async () => {
        await Level.findOneAndUpdate({level: 9},{level: 10},{ new: true })
            .then((level) => {
                expect(level).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Delete level", async () => {
        await Level.findOneAndRemove({ level: 10 })
            .then((level) => {
                expect(level).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });
});

// C.R.U.D Categories
describe("\n Database => categories => Create, Read, Update, Delete.", () => {
    it("Create category", async () => {
        let category        =   await new Category;
        category.name       =   "testCategory";
        category.isVisible  =   false;
        category.createdAt  =   moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss")
        category.updatedAt  =   moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");

        await category.save()
            .then((category) => {
                expect(category).toEqual(expect.anything())
            }).catch((error) => {
                throw error;
            });
    });

    it("Read category", async () => {
        await Category.findOne({ name: "testCategory" })
            .then((category) => {
                expect(category).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Update category", async () => {
        await Category.findOneAndUpdate({name: "testCategory"},{isVisible: true},{ new: true })
            .then((category) => {
                expect(category).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Delete category", async () => {
        await Category.findOneAndRemove({ name: "testCategory" })
            .then((category) => {
                expect(category).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });
});

// C.R.U.D ContactForms
describe("\n Database => contactForms => Create, Read, Update, Delete.", () => {
    it("Create contactForm", async () => {
        let contactForm         =   await new ContactForm;
        contactForm.user_id     =   mongoose.Types.ObjectId(angeloUser);
        contactForm.email       =   "test@email.com";
        contactForm.subject     =   "Tema test";
        contactForm.message     =   "Mensaje test";

        await contactForm.save()
            .then((contactForm) => {
                expect(contactForm).toEqual(expect.anything())
            }).catch((error) => {
                throw error;
            });
    });

    it("Read contactForm", async () => {
        await ContactForm.findOne({ email: "test@email.com" })
            .then((contactForm) => {
                expect(contactForm).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Update contactForm", async () => {
        await ContactForm.findOneAndUpdate({email: "test@email.com"},{subject: "Tema de prueba"},{ new: true })
            .then((contactForm) => {
                expect(contactForm).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Delete contactForm", async () => {
        await ContactForm.findOneAndRemove({ email: "test@email.com" })
            .then((contactForm) => {
                expect(contactForm).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });
});

// C.R.U.D Stores and UserBuyStores
describe("\n Database => stores and userBuyStores => Create, Read, Update, Delete.", () => {
    it("Create itemStore", async () => {
        let itemStore           =   await new Store;
        itemStore.firePoints    =   999;
        itemStore.name          =   "itemTest";
        itemStore.nameCss       =   "nameCssTest";
        itemStore.type          =   "typeTest";

        await itemStore.save()
            .then((itemStore) => {
                expect(itemStore).toEqual(expect.anything())
            }).catch((error) => {
                throw error;
            });
    });

    it("Read itemStore", async () => {
        await Store.findOne({ name: "itemTest" })
            .then((itemStore) => {
                expect(itemStore).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Update itemStore", async () => {
        await Store.findOneAndUpdate({name: "itemTest"},{firePoints: 99999},{ new: true })
            .then((itemStore) => {
                expect(itemStore).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    // C.R.U.D UserBuyStores
    it("Create userBuyStore", async () => {
        await Store.findOne({ name: "itemTest" })
            .then(async (store) => {
                let userBuyStore           =   await new UserBuyStore;
                userBuyStore.user_id       =   mongoose.Types.ObjectId(angeloUser);
                userBuyStore.name          =   store.name;
                userBuyStore.nameCss       =   store.nameCss;
                userBuyStore.type          =   store.type;
                userBuyStore.firePoints    =   store.firePoints;
                
                await userBuyStore.save()
                    .then((userBuyStore) => {
                        expect(userBuyStore).toEqual(expect.anything())
                    })
                    .catch((error) => {
                        throw error;
                    });
            }).catch((error) => {
                throw error;
            });
    });

    it("Read userBuyStore", async () => {
        await UserBuyStore.findOne({ name: "itemTest" })
            .then((userBuyStore) => {
                expect(userBuyStore).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Update userBuyStore", async () => {
        await UserBuyStore.findOneAndUpdate({name: "itemTest"},{name: "itemPrueba"},{ new: true })
            .then((userBuyStore) => {
                expect(userBuyStore).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Delete userBuyStore", async () => {
        await UserBuyStore.findOneAndRemove({ name: "itemPrueba" })
            .then((userBuyStore) => {
                expect(userBuyStore).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    // Finish C.R.U.D UserBuyStores //
    it("Delete itemStore", async () => {
        await Store.findOneAndRemove({ name: "itemTest" })
            .then((itemStore) => {
                expect(itemStore).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });
});

// C.R.U.D Logs
describe("\n Database => logs => Create, Read, Update, Delete.", () => {
    it("Create log", async () => {
        let log         =   await new Log;
        log.user_id     =   mongoose.Types.ObjectId(angeloUser);
        log.loginAt     =   moment().tz("America/Santiago").format("DD-MM-YYYY HH:mm:ss");
        log.logoutAt    =   "logoutAt_Test";

        await log.save()
            .then((log) => {
                expect(log).toEqual(expect.anything())
            }).catch((error) => {
                throw error;
            });
    });

    it("Read log", async () => {
        await Log.findOne({ logoutAt: "logoutAt_Test" })
            .then((log) => {
                expect(log).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Update log", async () => {
        await Log.findOneAndUpdate({logoutAt: "logoutAt_Test"},{logoutAt: "logoutAt_Prueba"},{ new: true })
            .then((log) => {
                expect(log).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });

    it("Delete log", async () => {
        await Log.findOneAndRemove({ logoutAt: "logoutAt_Prueba" })
            .then((log) => {
                expect(log).toEqual(expect.anything());
            }).catch((error) => {
                throw error;
            });
    });
});