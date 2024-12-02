const express = require("express");
const routes = require("./routes"); // Importa el archivo de rutas
const { client } = require("./db"); // Importa la conexión a la base de datos
const cors = require("cors");

const app = express();
const corsOptions = {
  origin: "*",
  methods: "GET,POST,PUT,DELETE",
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(routes); // Usa las rutas importadas

app.listen(5000, () => {
  console.log("Servidor Express corriendo en http://localhost:5000");
});
