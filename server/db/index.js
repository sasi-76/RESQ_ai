const fs = require('fs');
const path = require('path');

const DB_DIR = __dirname;

function readDB(filename) {
  const filePath = path.join(DB_DIR, filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    console.error(`[DB] Error reading ${filename}:`, err.message);
    return [];
  }
}

function writeDB(filename, data) {
  const filePath = path.join(DB_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`[DB] Error writing ${filename}:`, err.message);
    return false;
  }
}

module.exports = { readDB, writeDB };
