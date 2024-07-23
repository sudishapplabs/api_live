const ErrorClass = require("../utils/errorClass");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.isAuthenticatedUser = async (req, res, next) => {
  //const token = req.query.apiKey;
  const token = req.header('access-token');
  if (typeof apiKey !== 'undefined' || !token || process.env.API_KEY != token) {
    return next(new ErrorClass("API Key is not found in request headers or query params", 401));
  }
  next();
};

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHander(
          `Role: ${req.user.role} is not allowed to access this resouce `,
          403
        )
      );
    }
    next();
  };
};
