import request from "supertest";
import app from "../server.js";
import { cleanName, validateEmail } from "../utilis/validation.js";

describe("API hardening", () => {
  test("health endpoint is public", async () => { const response = await request(app).get("/health"); expect(response.status).toBe(200); expect(response.body.status).toBe("ok"); });
  test("protected routes require bearer auth", async () => { const response = await request(app).get("/api/files"); expect(response.status).toBe(401); });
  test("names and email validation reject unsafe input", () => { expect(cleanName("../secret.txt")).toBe("./secret.txt"); expect(validateEmail("person@example.com")).toBe(true); expect(validateEmail("not-an-email")).toBe(false); });
});
