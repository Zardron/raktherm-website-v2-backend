const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
// const loginLimiter = require("../middleware/LoginLimiter");

router
  .route("/")
  .post(authController.login)
  .delete(authController.deleteUserByEmail);

router.route("/refresh").get(authController.refresh);

router.route("/logout").post(authController.logout);

module.exports = router;
