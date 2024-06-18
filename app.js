const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const express = require('express');
const axios = require('axios');
const connectMongoDatabase = require("./config/database");
const bodyParser = require("body-parser");
const app = express();
const errorMiddleware = require("./middleware/error");
const advertiserRoute = require("./routes/advertiserRoute");
const userRoute = require("./routes/userRoute");
const xiomiRoute = require("./routes/xiaomiRoute");
const vivoRoute = require("./routes/vivoRoute");
const oppoRoute = require("./routes/oppoRoute");
const offerRoute = require("./routes/offerRoute");
const commonRoute = require("./routes/commonRoute");
const creativeRoute = require("./routes/creativeRoute");
const staticsData = require("./routes/staticsRoute");
const fundRoute = require("./routes/fundRoute");
const audienceRoute = require("./routes/audienceRoute");



app.use("/images", express.static('uploads'));




// Handling Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Uncaught Exception`);
  process.exit(1);
});

app.use(express.json({ limit: '50mb'}));
//app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
connectMongoDatabase();

const cors = require("cors");
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

app.use("/v2", advertiserRoute);
app.use("/v2", userRoute);
app.use("/v2", xiomiRoute);
app.use("/v2", vivoRoute);
app.use("/v2", oppoRoute);
app.use("/v2", offerRoute);
app.use("/v2", creativeRoute);
app.use("/v2", commonRoute);
app.use("/v2", staticsData);
app.use("/v2", fundRoute);
app.use("/v2", audienceRoute);


// Middleware for Errors
app.use(errorMiddleware);

// Handling Unhandle Exception
process.on("unhandleRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Unhandle Exception`);
  server.close(() => {
    process.exit(1);
  })
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})
