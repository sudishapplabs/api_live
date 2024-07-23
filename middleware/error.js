const ErrorClass = require("../utils/errorClass");
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message;

  // Error occur when we try to duplicate entry for unique key 
  if (err.code === 11000) {
    const message = `Duplicate value entered for ${Object.keys(err.keyValue)} `;
    err = new ErrorClass(message, 400);
  }

  //When we pass wrong mongodb error
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
