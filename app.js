import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import fileUpload from "express-fileupload";
import { mongoConnect } from "./util/database.js";
import { initializeSocketIO } from "./socket.js";
import user from "./routes/userRoute.js";
import post from "./routes/postRoute.js";
import home from "./routes/homeRoute.js";
import admin from "./routes/adminRoute.js";
import auth from "./routes/authRoute.js";
import cron from "./cronJob.js";

dotenv.config();
const port = process.env.PORT || 8000;

const app = express();
const httpServer = createServer(app);
app.get("/health", (req, res) => {
  const port = req.connection.remotePort;
  const url = req.protocol + "://" + req.get("host") + req.originalUrl;
  console.log("Request received on port:", port);
  console.log("Request URL:", url);
  res.send("Working");
});
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(compression());
// app.use(helmet());
app.use(fileUpload());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/user", user);
app.use("/auth", auth);
app.use("/post", post);
app.use("/home", home);
app.use("/admin", admin);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.set("port", port);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});
app.set("io", io);
initializeSocketIO(io);
mongoConnect()
  .then(() => {
    console.log("Successfully connected to db");
    httpServer.listen(port, () => {
      console.log(`App is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
