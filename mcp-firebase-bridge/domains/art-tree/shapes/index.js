const fs = require('fs');
const path = require('path');

const shapes = {};
const files = fs.readdirSync(__dirname);

for (const file of files) {
  if (file === 'index.js' || !file.endsWith('.js')) continue;
  try {
    const modulePath = path.join(__dirname, file);
    const shapeModule = require(modulePath);
    Object.assign(shapes, shapeModule);
  } catch (err) {
    console.error(`Failed to load shape module ${file}:`, err);
  }
}

module.exports = shapes;
