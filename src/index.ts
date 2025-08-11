import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { router } from "./routes/todo.routes";
import { notFoundRouter } from "./routes/notFound.routes";
import { loggerMiddleware } from "./middleware/logger.middleware";
import { rateLimiterMiddleware } from "./middleware/rateLimiter.middleware";
import { authRouter } from "./routes/auth.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(
  cors({
    origin: "*",
  })
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);

app.set("trust proxy", 1);
app.use(loggerMiddleware);
app.use(rateLimiterMiddleware);

app.use("/", router);

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.use(notFoundRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
