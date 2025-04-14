const mongoose = require("mongoose");

const dbconfig = async () => {
  await mongoose.connect(
    "mongodb+srv://itsmelovezero:unwSrJloO6mUwINz@cluster0.tyrijvr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  );
};
module.exports = dbconfig;
