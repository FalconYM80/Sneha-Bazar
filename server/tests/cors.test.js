import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import cors from "cors";

// Build Express app with exact CORS configuration from server.js
function createTestApp() {
  const app = express();

  const defaultAllowedOrigins = [
    "https://www.snehabazar.in",
    "https://snehabazar.in",
    "https://sneha-bazar.vercel.app",
    "https://sneha-bazar-admin.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ];

  const parseOrigins = (raw) => {
    if (!raw || typeof raw !== "string") return [];
    return raw
      .split(/[,;\s]+/)
      .map((item) => item.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, ""))
      .filter(Boolean);
  };

  const normalizeOrigin = (url) => {
    if (!url || typeof url !== "string") return "";
    return url.trim().replace(/\/+$/, "").toLowerCase();
  };

  const envOrigins = [
    ...parseOrigins(process.env.CLIENT_URL),
    ...parseOrigins(process.env.ADMIN_URL),
    ...parseOrigins(process.env.ALLOWED_ORIGINS),
  ];

  const normalizedAllowedOrigins = new Set([
    ...defaultAllowedOrigins.map(normalizeOrigin),
    ...envOrigins.map(normalizeOrigin),
  ]);

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const normalized = normalizeOrigin(origin);
      if (normalizedAllowedOrigins.has(normalized)) {
        return callback(null, origin);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    optionsSuccessStatus: 200,
    maxAge: 86400,
  };

  app.use(cors(corsOptions));
  app.use(express.json());

  app.post("/api/customers/register", (req, res) => {
    res.status(201).json({ success: true, message: "Registered" });
  });

  app.get("/api/categories/with-thumbnails", (req, res) => {
    res.status(200).json({ success: true, data: [] });
  });

  return app;
}

function makeRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const reqOptions = {
      host: "127.0.0.1",
      port: address.port,
      path: options.path,
      method: options.method,
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let rawData = "";
      res.on("data", (chunk) => {
        rawData += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: rawData,
        });
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

describe("Backend CORS Configuration", () => {
  let server;

  before(async () => {
    const app = createTestApp();
    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", resolve);
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("handles OPTIONS preflight for https://www.snehabazar.in on customer registration", async () => {
    const res = await makeRequest(server, {
      method: "OPTIONS",
      path: "/api/customers/register",
      headers: {
        Origin: "https://www.snehabazar.in",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["access-control-allow-origin"], "https://www.snehabazar.in");
    assert.equal(res.headers["access-control-allow-credentials"], "true");
    assert.match(res.headers["access-control-allow-methods"], /POST/);
    assert.match(res.headers["access-control-allow-headers"], /Content-Type/i);
  });

  it("handles OPTIONS preflight for apex domain https://snehabazar.in", async () => {
    const res = await makeRequest(server, {
      method: "OPTIONS",
      path: "/api/customers/register",
      headers: {
        Origin: "https://snehabazar.in",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["access-control-allow-origin"], "https://snehabazar.in");
    assert.equal(res.headers["access-control-allow-credentials"], "true");
  });

  it("allows GET /api/categories/with-thumbnails with Origin: https://www.snehabazar.in", async () => {
    const res = await makeRequest(server, {
      method: "GET",
      path: "/api/categories/with-thumbnails",
      headers: {
        Origin: "https://www.snehabazar.in",
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["access-control-allow-origin"], "https://www.snehabazar.in");
    assert.equal(res.headers["access-control-allow-credentials"], "true");
  });

  it("handles localhost development origin http://localhost:5173", async () => {
    const res = await makeRequest(server, {
      method: "OPTIONS",
      path: "/api/customers/register",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["access-control-allow-origin"], "http://localhost:5173");
  });

  it("handles origin with trailing slash cleanly", async () => {
    const res = await makeRequest(server, {
      method: "OPTIONS",
      path: "/api/customers/register",
      headers: {
        Origin: "https://www.snehabazar.in/",
        "Access-Control-Request-Method": "POST",
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["access-control-allow-origin"], "https://www.snehabazar.in/");
  });

  it("rejects unauthorized origin without crashing with 500", async () => {
    const res = await makeRequest(server, {
      method: "OPTIONS",
      path: "/api/customers/register",
      headers: {
        Origin: "https://malicious-website.com",
        "Access-Control-Request-Method": "POST",
      },
    });

    assert.equal(res.headers["access-control-allow-origin"], undefined);
    assert.notEqual(res.statusCode, 500);
  });
});
