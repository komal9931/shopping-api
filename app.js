require("dotenv").config();
const express = require("express");
const router = require("./router/router");
const userrouter = require("./router/userrouter");
const db = require("./dbconfig/config");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middleware/errorMiddleware");
const app = express();
const port = 5555;
const hostname = "127.0.0.1";

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", router);
app.use("/api/v1", userrouter);
app.use(errorMiddleware);
db().then(() => {
  console.log("db connect successfull");
  app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
});
