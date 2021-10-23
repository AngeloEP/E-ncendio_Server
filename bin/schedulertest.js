const axios = require("axios");
console.log("antes de las tareas"); // Helps in checking the proper working
console.log(new Date()); // Helps in checking the proper working

axios.get("https://ancient-meadow-24869.herokuapp.com/api/dailyTasks/newTasks")  // enter API here - make sure API is not on local host but is hosted on a domain
.then((response) => {
    console.log(response.data);
})
.catch((error) => {
      console.log("ERROR en la tarea 1"); // Helps in checking the proper working
    console.log(error);
  });


// axios.get("https://ancient-meadow-24869.herokuapp.com/api/dailyTasks/rewards")  // enter API here - make sure API is not on local host but is hosted on a domain
// .then((response) => {
//     console.log(response.data);
//     console.log("despues de la tarea"); // Helps in checking the proper working
// })
// .catch((error) => {
//     console.log("ERROR en la tarea 2"); // Helps in checking the proper working
//     console.log(error);
// });