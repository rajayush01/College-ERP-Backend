// src/config/rateLimiter.js
const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests, try later",
});
