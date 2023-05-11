const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const corsOptions = require("./config/corsOptions");
const authRoutes = require("./router/authRouter");
const userRoutes = require("./router/userRouter");

dotenv.config();
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Database Connected"))
  .catch((err) => {
    console.log(err);
  });

app.use("/auth", authRoutes);
app.use("/users", userRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log("BACKEND SERVER IS RUNNING");
});
