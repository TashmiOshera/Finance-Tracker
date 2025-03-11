const request = require("supertest");
const app = require("../server"); // Import your Express app
const { connect, close } = require("./setup");
const User = require("../models/User"); // Import User model

beforeAll(async () => await connect());
afterAll(async () => await close());

describe("User Authentication", () => {
  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({
        email: "test@example.com",
        password: "Test1234",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("token");
  });

  it("should not register a user with an existing email", async () => {
    await request(app).post("/api/users/register").send({
      email: "test@example.com",
      password: "Test1234",
    });

    const res = await request(app).post("/api/users/register").send({
      email: "test@example.com",
      password: "Test1234",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("User already exists");
  });
});
