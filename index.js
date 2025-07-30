import "dotenv/config";
import mongoose from "mongoose";
import express from "express";
import UserRouter from "./router/UserRoute.js";
import cors from "cors"; 
import CommunityRouter from "./router/CommunityRoute.js";
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", UserRouter);
app.use("/community",CommunityRouter);

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("MongoDB connected!");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
app.listen(port, () => {
  console.log(`Running on port ${port}`);
});
