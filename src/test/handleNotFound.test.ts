import request from "supertest";
import express from "express";
import { handleNotFound } from "../controllers/notFound.controllers";

describe("handleNotFound middleware (Supertest)", () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(handleNotFound);
  });

  it("should return 404 with 'Route not found' message", async () => {
    const res = await request(app).get("/some-nonexistent-route");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Route not found" });
  });
});
