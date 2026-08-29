import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import { logger } from "./lib/logger";
import { PostgresSessionStore } from "./lib/sessionStore";

const app: Express = express();

// Disable ETags globally — prevents browsers from caching API responses
// and serving stale data via 304 Not Modified
app.set("etag", false);

// Force no-cache on every /api response so mobile browsers and CDNs
// never serve stale JSON data
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Trust the reverse proxy so secure cookies work behind HTTPS termination
app.set("trust proxy", 1);

const configuredOrigins = new Set(
  [
    process.env.REPLIT_DEV_DOMAIN,
    ...(process.env.REPLIT_DOMAINS ?? "").split(","),
  ]
    .filter(Boolean)
    .flatMap((domain) => domain!.startsWith("http") ? [domain!] : [`https://${domain}`]),
);

function isAllowedOrigin(origin: string): boolean {
  if (/^https?:\/\/localhost(?::\d+)?$/.test(origin)) return true;
  return configuredOrigins.has(origin);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, origin ?? false);
      return;
    }
    callback(null, false);
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

app.use(
  session({
    secret: sessionSecret,
    store: new PostgresSessionStore(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax",
    },
  }),
);

// Cookies alone are not enough for authenticated state-changing requests:
// reject browser requests that explicitly identify a different site.
app.use("/api", (req, res, next) => {
  const stateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  const authenticated = req.session?.adminAuthenticated === true;
  const fetchSite = req.get("Sec-Fetch-Site");
  const origin = req.get("Origin");
  const requestOrigin = `${req.protocol}://${req.get("Host")}`;

  if (
    stateChanging &&
    authenticated &&
    (fetchSite === "cross-site" ||
      (origin && origin !== requestOrigin && !isAllowedOrigin(origin)))
  ) {
    res.status(403).json({ error: "Richiesta non autorizzata." });
    return;
  }
  next();
});

app.use("/api", router);

export default app;
