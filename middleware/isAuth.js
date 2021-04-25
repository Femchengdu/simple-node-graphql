const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("Not authenticated !!!");
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(" ")[1];

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.SERVER_SECRET);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    throw error;
  }
  if (!decodedToken) {
    const error = new Error("Not authenticated !!!");
    error.statusCode = 401;
    throw error;
  }
  const { userId } = decodedToken;
  req.userId = userId;
  next();
};
