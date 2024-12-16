process.env.NODE_ENV = 'test';

const request = require("supertest");
const app = require("../app");
const db = require("../db");


beforeEach(async () => {
    await db.query("DELETE FROM companies");
    await db.query(`INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple Inc.', 'Technology company'), ('ibm', 'IBM', 'Consulting company')`);
});

afterEach(async () => {
    await db.query("DELETE FROM companies");
});

afterAll(async () => {
    await db.end();
});

describe("GET /companies", () => {
    test("It should respond with an array of companies", async() => {
        const res = await request(app).get("/companies");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            companies: [
                { code: "apple", name: "Apple Inc.", description: "Technology company" },
                { code: "ibm", name: "IBM", description: "Consulting company" }
            ]
        });
    });
});

describe("GET /companies/:code", () => {
    test("It should respond with a single company", async() => {
        const res = await request(app).get("/companies/apple");
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company:
                { code: "apple", name: "Apple Inc.", industries: [], description: "Technology company" }
        });
    });

    test("It should return 404 if company is not found", async() => {
        const res = await request(app).get("/companies/nonexistent");
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({
            error: "No company with code nonexistent could be found."
        });
    });
});

describe("POST /companies", () => {
    test("It should create a new company", async () => {
      const newCompany = {
        code: "tesla-inc",
        name: "Tesla Inc.",
        description: "Electric vehicles"
      };
  
      const res = await request(app).post("/companies").send(newCompany);
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({
        company: newCompany
      });
  
      // Verify the company is in the database
      const dbRes = await db.query("SELECT * FROM companies WHERE code = 'tesla-inc'");
      expect(dbRes.rows.length).toBe(1);
    });
  });
  
  describe("PATCH /companies/:code", () => {
    test("It should update an existing company", async () => {
      const updates = { name: "Apple", description: "Tech giant" };
  
      const res = await request(app)
        .patch("/companies/apple")
        .send(updates);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        company: { code: "apple", ...updates }
      });
  
      // Verify the update in the database
      const dbRes = await db.query("SELECT * FROM companies WHERE code = 'apple'");
      expect(dbRes.rows[0]).toEqual({ code: "apple", ...updates });
    });
  
    test("It should return 404 if company is not found", async () => {
      const res = await request(app)
        .patch("/companies/nonexistent")
        .send({ name: "Nonexistent" });
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toEqual({"message": "Can't update company with code of nonexistent", "status": 404});
    });
  });
  
  describe("DELETE /companies/:code", () => {
    test("It should delete a company", async () => {
      const res = await request(app).delete("/companies/apple");
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ status: "deleted" });
  
      // Verify the company is no longer in the database
      const dbRes = await db.query("SELECT * FROM companies WHERE code = 'apple'");
      expect(dbRes.rows.length).toBe(0);
    });
  
    test("It should return 404 if company is not found", async () => {
      const res = await request(app).delete("/companies/nonexistent");
      expect(res.statusCode).toBe(404);
    });
  });
