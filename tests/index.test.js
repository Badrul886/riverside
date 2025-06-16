// import axios2 from "axios";
const axios2 = require("axios");
// const dotenv = require("dotenv");
// const path = require("path");

// dotenv.config({ path: path.resolve(__dirname, "../riverside/packages/db/.env") });

const BACKEND_URL = "http://localhost:3000";
const WS_URL = "ws://localhost:3001";

const makeRequest =
  (method) =>
  async (...args) => {
    try {
      const res = await axios2[method](...args);
      return res;
    } catch (e) {
      return e.response;
    }
  };

const axios = {
  post: makeRequest("post"),
  get: makeRequest("get"),
  put: makeRequest("put"),
  delete: makeRequest("delete"),
};

describe("Authentication", () => {
  test("User is able to sign up only once", async () => {
    // const name = "badrul" + Math.random(); // badrul-0.12331313
    const name = `badrul-${Math.random()}`; // const name = "badrul-123123123"
    const email = `${name}@example.com`;
    const password = "123456";
    const confirmPassword = "123456";
    const response = await axios.post(`${BACKEND_URL}/api/v1/auth/register`, {
      name,
      email,
      password,
      confirmPassword,
      role: "admin",
    });

    expect(response.status).toBe(201);
    const updatedResponse = await axios.post(
      `${BACKEND_URL}/api/v1/auth/register`,
      {
        name,
        password,
        confirmPassword,
        email,
        role: "admin",
      }
    );

    expect(updatedResponse.status).toBe(409);
  });

  test("Signup request fails if the name is empty", async () => {
    const name = `badrul-${Math.random()}`; // badrul-0.12312313
    const password = "123456";
    const email = `${name}@example.com`;
    const confirmPassword = "123456";
    const response = await axios.post(`${BACKEND_URL}/api/v1/auth/register`, {
      email,
      password,
      confirmPassword,
      role: "admin",
    });

    expect(response.status).toBe(400);
  });

  test("Signup fails with missing email field", async () => {
    const password = "123456";
    const confirmPassword = "123456";
    const response = await axios.post(`${BACKEND_URL}/api/v1/auth/register`, {
      password,
      confirmPassword,
      role: "admin",
    });

    expect(response.status).toBe(400);
  });

  test("Signup fails if password and confirmPassword are not the same", async () => {
    const name = `badrul-${Math.random()}`; // badrul-0.12312313
    const email = `${name}@example.com`;
    const password = "123456";
    const confirmPassword = "1234567";
    const response = await axios.post(`${BACKEND_URL}/api/v1/auth/register`, {
      name,
      email,
      password,
      confirmPassword,
      role: "admin",
    });

    expect(response.status).toBe(400);
    expect(response.data.error).toBe(
      "Password and confirm password do not match"
    );
  });
});
