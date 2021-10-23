const axios = require("axios");
console.log("antes de la tarea"); // Helps in checking the proper working
console.log(new Date()); // Helps in checking the proper working

axios.get("https://ancient-meadow-24869.herokuapp.com/api/profiles")  // enter API here - make sure API is not on local host but is hosted on a domain
.then((response) => {
    console.log(response.data);
    console.log("despues de la tarea"); // Helps in checking the proper working
})
.catch((error) => {
      console.log("ERROR en la tarea"); // Helps in checking the proper working
    console.log(error);
  });