const path = require('path');

function loadEnv(relativePath) {
  try {
    require('dotenv').config({ path: path.resolve(__dirname, relativePath) });
  } catch (error) {
    // Vercel injects env vars directly at runtime, so dotenv is optional there.
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
  }
}

module.exports = { loadEnv };
