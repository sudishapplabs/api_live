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

app.use(express.json({ limit: '500mb' }));
//app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true, parameterLimit: 500000 }));
connectMongoDatabase();

const cors = require("cors");
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

app.use("/stage", advertiserRoute);
app.use("/stage", userRoute);
app.use("/stage", xiomiRoute);
app.use("/stage", vivoRoute);
app.use("/stage", oppoRoute);
app.use("/stage", offerRoute);
app.use("/stage", creativeRoute);
app.use("/stage", commonRoute);
app.use("/stage", staticsData);
app.use("/stage", fundRoute);
app.use("/stage", audienceRoute);


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
