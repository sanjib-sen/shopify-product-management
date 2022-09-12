// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import cookieParser from "cookie-parser";
import { Shopify, LATEST_API_VERSION, ApiVersion } from "@shopify/shopify-api";
import bodyParser from "body-parser";
import applyAuthMiddleware from "./middleware/auth.js";
import verifyRequest from "./middleware/verify-request.js";
import { setupGDPRWebHooks } from "./gdpr.js";
import productCreator from "./helpers/product-creator.js";
import redirectToAuth from "./helpers/redirect-to-auth.js";
import {
  productsGetter,
  productGetter,
  productGetterNode,
} from "./helpers/products-getter.js";
import {
  metafieldCreator,
  metafieldCreatorLogger,
} from "./helpers/metafield-creater.js";
import { BillingInterval } from "./helpers/ensure-billing.js";
import { AppInstallations } from "./app_installations.js";
import { convertIdToProduct } from "./helpers/convertIds.js";
import { compareProductJSON } from "./helpers/compareProduct.js";
import { metafieldGetter } from "./helpers/metafield-getter.js";

const USE_ONLINE_TOKENS = false;

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

// TODO: There should be provided by env vars
const DEV_INDEX_PATH = `${process.cwd()}/frontend/`;
const PROD_INDEX_PATH = `${process.cwd()}/frontend/dist/`;

const DB_PATH = `${process.cwd()}/database.sqlite`;

let LOGS = {};

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https?:\/\//, ""),
  HOST_SCHEME: process.env.HOST.split("://")[0],
  API_VERSION: LATEST_API_VERSION,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.SQLiteSessionStorage(DB_PATH),
});

Shopify.Webhooks.Registry.addHandler("PRODUCTS_UPDATE", {
  path: "/api/webhooks/products/update",
  webhookHandler: async (_topic, shop, _body) => {
    await AppInstallations.print(shop);
  },
});

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const BILLING_SETTINGS = {
  required: false,
  // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
  // chargeName: "My Shopify One-Time Charge",
  // amount: 5.0,
  // currencyCode: "USD",
  // interval: BillingInterval.OneTime,
};

// This sets up the mandatory GDPR webhooks. You’ll need to fill in the endpoint
// in the “GDPR mandatory webhooks” section in the “App setup” tab, and customize
// the code when you store customer data.
//
// More details can be found on shopify.dev:
// https://shopify.dev/apps/webhooks/configuration/mandatory-webhooks
setupGDPRWebHooks("/api/webhooks");

// export for test use only
export async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === "production",
  billingSettings = BILLING_SETTINGS
) {
  const app = express();

  app.set("use-online-tokens", USE_ONLINE_TOKENS);
  app.use(cookieParser(Shopify.Context.API_SECRET_KEY));

  applyAuthMiddleware(app, {
    billing: billingSettings,
  });

  // Do not call app.use(express.json()) before processing webhooks with
  // Shopify.Webhooks.Registry.process().
  // See https://github.com/Shopify/shopify-api-node/blob/main/docs/usage/webhooks.md#note-regarding-use-of-body-parsers
  // for more details.

  app.use(bodyParser.raw({ type: "application/json" }));

  // Webhooks
  app.post("/api/webhooks/products/update", async (req, res) => {
    console.log("Webhook heard!");
    // Verify
    const hmac = req.header("X-Shopify-Hmac-Sha256");
    const topic = req.header("X-Shopify-Topic");
    const shop = req.header("X-Shopify-Shop-Domain");

    const verified = verifyWebhook(req.body, hmac);

    if (!verified) {
      console.log("Failed to verify the incoming request.");
      res.status(401).send("Could not verify request.");
      return;
    }

    const data = req.body.toString();
    const payload = JSON.parse(data);
    const session = await Shopify.Utils.loadOfflineSession(shop);
    const productId = convertIdToProduct(payload.id);
    res.status(200).send("OK");
    const metafields = await productGetter(session, productId);
    let oldProduct;
    for (let m in metafields) {
      if (metafields[m].node.namespace == "product_json") {
        oldProduct = JSON.parse(metafields[m].node.value);
      }
    }
    const diff = compareProductJSON(payload, oldProduct);
    const jsonForLogger = {
      updatedAt: payload.updated_at,
      name: payload.title,
      atr: diff,
    };
    const prevLogs = JSON.parse(await metafieldGetter(session));
    prevLogs.push(jsonForLogger);

    // await metafieldCreator(
    //   session,
    //   productId,
    //   "product_json",
    //   payload.id,
    //   payload,
    //   "json_string"
    // );

    const clean = [{}];
    await metafieldCreatorLogger(session, prevLogs);

    LOGS = prevLogs;
    // console.log(
    //   `Verified webhook request. Shop: ${shop} Topic: ${topic} \n Payload: \n ${data}`
    // );
  });

  // Verify incoming webhook.
  function verifyWebhook(payload, hmac) {
    return true;
  }

  app.post("/api/webhooks/products/create", async (req, res) => {
    console.log("Webhook heard!");
    // Verify
    const hmac = req.header("X-Shopify-Hmac-Sha256");
    const topic = req.header("X-Shopify-Topic");
    const shop = req.header("X-Shopify-Shop-Domain");

    const verified = verifyWebhook(req.body, hmac);

    if (!verified) {
      console.log("Failed to verify the incoming request.");
      res.status(401).send("Could not verify request.");
      return;
    }

    const data = req.body.toString();
    const payload = JSON.parse(data);
    const session = await Shopify.Utils.loadOfflineSession(shop);
    const productId = convertIdToProduct(payload.id);
    res.status(200).send("OK");
    await metafieldCreator(
      session,
      productId,
      "product_json",
      payload.id,
      payload,
      "json_string"
    );
  });

  // All endpoints after this point will require an active session
  app.use(
    "/api/*",
    verifyRequest(app, {
      billing: billingSettings,
    })
  );

  app.get("/api/products/count", async (req, res) => {
    const session = await Shopify.Utils.loadCurrentSession(
      req,
      res,
      app.get("use-online-tokens")
    );
    const { Product } = await import(
      `@shopify/shopify-api/dist/rest-resources/${Shopify.Context.API_VERSION}/index.js`
    );

    const countData = await Product.count({ session });
    res.status(200).send(countData);
  });

  app.get("/api/products/create", async (req, res) => {
    const session = await Shopify.Utils.loadCurrentSession(
      req,
      res,
      app.get("use-online-tokens")
    );
    let status = 200;
    let error = null;

    try {
      await productCreator(session);
    } catch (e) {
      console.log(`Failed to process products/create: ${e.message}`);
      status = 500;
      error = e.message;
    }
    res.status(status).send({ success: status === 200, error });
  });

  app.get("/api/products/:count/:after/:cursor", async (req, res) => {
    const session = await Shopify.Utils.loadCurrentSession(
      req,
      res,
      app.get("use-online-tokens")
    );
    let status = 200;
    const products = await productsGetter(
      session,
      req.params.count,
      req.params.after,
      req.params.cursor
    );

    res.status(status).send(products.body.data.products);
  });

  app.get("/api/product/:ids", async (req, res) => {
    const session = await Shopify.Utils.loadCurrentSession(
      req,
      res,
      app.get("use-online-tokens")
    );
    let status = 200;

    const ids = convertIdToProduct(req.params.ids, true);

    const products = await productGetterNode(session, ids);
    res.status(status).send(products);
  });

  app.get("/api/logger", async (req, res) => {
    let status = 200;
    console.log("Logs: ", LOGS);
    res.status(status).send(LOGS);
  });

  app.get(
    "/api/metafields/create/:productId/:namespace/:key/:value",
    async (req, res) => {
      const session = await Shopify.Utils.loadCurrentSession(
        req,
        res,
        app.get("use-online-tokens")
      );
      let status = 200;

      const id = convertIdToProduct(req.params.productId);
      await metafieldCreator(
        session,
        id,
        req.params.namespace,
        req.params.key,
        req.params.value
      );
      res.status(status);
    }
  );

  app.get(
    "/api/metafields/create/:productId/:namespace/:key/:value/:type",
    async (req, res) => {
      const session = await Shopify.Utils.loadCurrentSession(
        req,
        res,
        app.get("use-online-tokens")
      );
      let status = 200;

      const id = convertIdToProduct(req.params.productId);
      await metafieldCreator(
        session,
        id,
        req.params.namespace,
        req.params.key,
        req.params.value,
        req.params.type
      );
      res.status(status);
    }
  );

  // All endpoints after this point will have access to a request.body
  // attribute, as a result of the express.json() middleware
  app.use(express.json());

  app.use((req, res, next) => {
    const shop = Shopify.Utils.sanitizeShop(req.query.shop);
    if (Shopify.Context.IS_EMBEDDED_APP && shop) {
      res.setHeader(
        "Content-Security-Policy",
        `frame-ancestors https://${encodeURIComponent(
          shop
        )} https://admin.shopify.com;`
      );
    } else {
      res.setHeader("Content-Security-Policy", `frame-ancestors 'none';`);
    }
    next();
  });

  if (isProd) {
    const compression = await import("compression").then(
      ({ default: fn }) => fn
    );
    const serveStatic = await import("serve-static").then(
      ({ default: fn }) => fn
    );
    app.use(compression());
    app.use(serveStatic(PROD_INDEX_PATH, { index: false }));
  }

  app.use("/*", async (req, res, next) => {
    if (typeof req.query.shop !== "string") {
      res.status(500);
      return res.send("No shop provided");
    }

    const shop = Shopify.Utils.sanitizeShop(req.query.shop);
    const appInstalled = await AppInstallations.includes(shop);

    if (!appInstalled) {
      return redirectToAuth(req, res, app);
    }

    if (Shopify.Context.IS_EMBEDDED_APP && req.query.embedded !== "1") {
      const embeddedUrl = Shopify.Utils.getEmbeddedAppUrl(req);

      return res.redirect(embeddedUrl + req.path);
    }

    const htmlFile = join(
      isProd ? PROD_INDEX_PATH : DEV_INDEX_PATH,
      "index.html"
    );

    return res
      .status(200)
      .set("Content-Type", "text/html")
      .send(readFileSync(htmlFile));
  });

  return { app };
}

createServer().then(({ app }) => app.listen(PORT));
