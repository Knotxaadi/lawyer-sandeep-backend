import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import manager_pannel from "../api/manager/manager";
import client_pannel from "../api/client/client";
import auth from "../api/auth/auth";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
app.use(express());
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "https://lawyer-sandeep-front.vercel.app",
    ],
    credentials: true,
  }),
);

app.use("/route/manager", manager_pannel);
app.use("/route/client", client_pannel);
app.use("/route/auth/manager", auth);

app.get("/", (req, res) => {
  res.send("Hello world lawyer");
});

// app.listen(process.env.PORT, () => {
//   console.log("running!");
// });

export default app;
