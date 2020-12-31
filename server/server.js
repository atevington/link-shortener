const path = require("path");
const cors = require("cors");
const express = require("express");
const { Parser } = require("json2csv");
const app = express();
const db = require("./db");

app.use(cors());

// Create link
app.post("/link/:url", async ({ params: { url } }, res) => {
  url = url || "";

  // validate
  if (
    !url.length ||
    url.length > 2000 ||
    (!url.startsWith("http://") && !url.startsWith("https://"))
  ) {
    res.status(400).send({ error: "Bad request." });

    return;
  }

  const { shortId } = await db.models.link.create({ url });

  res.send({ shortId });
});

// Get link stats
app.get("/:shortId/stats", async ({ params: { shortId } }, res) => {
  // find the link, but don't require any views (default is true)
  const foundLink = await db.models.link.findOne({
    where: { shortId },
    include: [{ model: db.models.view, required: false }],
  });

  if (!foundLink) {
    res
      .status(404)
      .send({ error: `Link with id '${shortId}' does not exist.` });

    return;
  }

  const csvContent = foundLink.views.map(
    ({ createdAt, ipAddress, userAgent }) => ({
      date: createdAt,
      url: foundLink.url,
      shortId: foundLink.shortId,
      ipAddress,
      userAgent,
    })
  );

  res.attachment(`link-${shortId}-${new Date().getTime()}.csv`).send(
    new Parser({
      fields: ["date", "url", "shortId", "ipAddress", "userAgent"],
    }).parse(csvContent)
  );
});

// Do redirect
app.get(
  "/:shortId",
  async (
    {
      params: { shortId },
      connection: { remoteAddress },
      headers: {
        ["user-agent"]: userAgent, // browser / device info
        ["x-forwarded-for"]: xForwardedFor, // get address behind a load balancer
      },
    },
    res
  ) => {
    const foundLink = await db.models.link.findOne({
      where: { shortId },
    });

    if (!foundLink) {
      res
        .status(404)
        .send({ error: `Link with id '${shortId}' does not exist.` });

      return;
    }

    // get the ip reported by express, then check if there's an x-forward-for header (can be an array)
    let ipAddress = (remoteAddress || "127.0.0.1").trim();

    if (
      Array.isArray(xForwardedFor) &&
      typeof xForwardedFor[0] === "string" &&
      xForwardedFor[0].trim().length
    ) {
      ipAddress = xForwardedFor[0].trim();
    } else if (
      typeof xForwardedFor === "string" &&
      xForwardedFor.trim().length
    ) {
      ipAddress = xForwardedFor.trim();
    }

    ipAddress = ipAddress.split(",")[0].trim();

    // log a view
    await db.models.view.create({ ipAddress, userAgent, linkId: foundLink.id });

    // Making this a temp redirect so every hit is logged as a view and not cached by the browser
    res.redirect(302, foundLink.url);
  }
);

// serve the client files from the build folder
app.use(express.static(path.join(__dirname, "..", "client", "build")));

// Sync db and start server
db.sync().then(() => app.listen(process.argv[2] || 3001));
