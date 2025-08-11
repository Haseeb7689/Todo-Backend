import request from "supertest";
import express from "express";
import { login } from "../controllers/auth.controllers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("@prisma/client", () => {
  const mPrismaClient = {
    user: { findUnique: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

const prisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe("POST /login", () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post("/login", login);
  });

  it("should login successfully with correct credentials", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@example.com",
      password: "hashed_password",
    } as any);

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    (jwt.sign as jest.Mock).mockReturnValue("mock_token");

    const res = await request(app)
      .post("/login")
      .send({ email: "test@example.com", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBe("mock_token");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith("123456", "hashed_password");
    expect(jwt.sign).toHaveBeenCalled();
  });

  it("should return 404 if user not found", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/login")
      .send({ email: "notfound@example.com", password: "123456" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("User not found");
  });

  it("should return 401 if password is invalid", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@example.com",
      password: "hashed_password",
    } as any);

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post("/login")
      .send({ email: "test@example.com", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid password");
  });
});
