const path = require("path");
const fs = require("fs");

const clearImage = (imagePath) => {
  const filePath = path.join(__dirname, "..", imagePath);
  fs.unlink(filePath, (error) => console.log(error));
};

module.exports = clearImage;
