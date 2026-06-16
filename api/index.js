let app;
try {
  app = require('../server/index.js');
} catch (err) {
  // If server module fails to load, return the actual error for diagnosis
  const express = require('express');
  app = express();
  app.all('*', (req, res) => {
    res.status(500).json({
      error: 'Server module failed to load',
      message: err.message,
      stack: err.stack
    });
  });
}
module.exports = app;
