const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler(async (req, res) => {
  const { loginEmail, loginPassword } = req.body;

  if (!loginEmail || !loginPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const email = loginEmail;
  const password = loginPassword;

  const foundUser = await User.findOne({ email }).exec();

  if (!foundUser)
    return res.status(401).json({ message: "Invalid email or password!" });

  if (password !== foundUser.password)
    return res.status(401).json({ message: "Invalid email or password!" });

  const accessToken = jwt.sign(
    {
      UserInfo: {
        picture: foundUser.picture,
        email: foundUser.email,
        firstname: foundUser.firstname,
        lastname: foundUser.lastname,
        position: foundUser.position,
        companyName: foundUser.companyName,
        country: foundUser.country,
        phoneNumber: foundUser.phoneNumber,
        active: foundUser.active,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    {
      picture: foundUser.picture,
      email: foundUser.email,
      firstname: foundUser.firstname,
      lastname: foundUser.lastname,
      position: foundUser.position,
      companyName: foundUser.companyName,
      country: foundUser.country,
      phoneNumber: foundUser.phoneNumber,
      active: foundUser.active,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Create secure cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  });

  // Send accessToken containing email and roles
  res.json({ accessToken });
});

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({
        picture: decoded.picture,
        email: decoded.email,
        firstname: decoded.firstname,
        lastname: decoded.lastname,
        position: decoded.position,
        companyName: decoded.companyName,
        country: decoded.country,
        phoneNumber: decoded.phoneNumber,
        active: decoded.active,
      }).exec();

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = jwt.sign(
        {
          UserInfo: {
            picture: foundUser.picture,
            email: foundUser.email,
            firstname: foundUser.firstname,
            lastname: foundUser.lastname,
            position: foundUser.position,
            companyName: foundUser.companyName,
            country: foundUser.country,
            phoneNumber: foundUser.phoneNumber,
            active: foundUser.active,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15min" }
      );

      res.json({ accessToken });
    })
  );
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Cookie cleared" });
};

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUserByEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Confirm data
  if (!email) {
    return res.status(400).json({ message: "Email is Required" });
  }

  // Does the user exist to delete?
  const result = await User.findOneAndDelete({ email }).lean().exec();

  console.log(result);

  if (!result) {
    return res.status(400).json({ message: "User not found" });
  }

  const reply = `Username ${result.username} with ID ${result._id} deleted`;

  res.json(reply);
});

module.exports = {
  login,
  refresh,
  logout,
  deleteUserByEmail,
};
