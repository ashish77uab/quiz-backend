import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/users.js";
import transactionRoutes from "./routes/transactions.js";
import dashboardRoutes from "./routes/dashboard.js";
import stockRoutes from "./routes/stock.js";
import quizRoutes from "./routes/quiz.js";
import questionRoutes from "./routes/question.js";
import holdingRoutes from "./routes/holding.js";
import upload from "./middleware/upload.js";
import dotenv from "dotenv";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";

dotenv.config();
const app = express();
app.use(express.json());
app.use(morgan("tiny"));
app.use(express.static("./public/uploads"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.set("view engine", "ejs");
app.set("views", "./views");
const PORT = process.env.PORT || 5000;
mongoose.set("strictQuery", false);
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// routes
app.use("/auth", userRoutes);
app.use("/quiz", quizRoutes);
app.use("/question", questionRoutes);
app.use("/stock", stockRoutes);
app.use("/holding", holdingRoutes);
app.use("/transactions", transactionRoutes);
app.use("/dashboard", dashboardRoutes);
app.post("/upload", upload.single("file"), (req, res) => {
  res.status(200).json(req.file.filename);
});
let db;
mongoose
  .connect(process.env.CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    db = mongoose.connection.db; // Get the database instance

    // const transactionsCollection = db.collection("transactions");

    // // Drop the existing index if it exists
    // try {
    //   await transactionsCollection.dropIndex("screenShot_1");
    //   console.log("Index 'screenShot_1' dropped successfully");
    // } catch (err) {
    //   if (err.code === 27) {
    //     // Error code 27 means the index doesn't exist
    //     console.log("Index 'screenShot_1' does not exist, skipping drop");
    //   } else {
    //     throw err;
    //   }
    // }

    // // Create the new partial index
    // await transactionsCollection.createIndex(
    //   { screenShot: 1 },
    //   { unique: true, partialFilterExpression: { screenShot: { $exists: true } } }
    // );

    // console.log("Partial index created successfully");


  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });

// Start the server
server.listen(PORT, () =>
  console.log(`Server Running on Port: http://localhost:${PORT}`)
);

