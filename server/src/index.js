import { createServer } from "node:http";
import { config } from "./config.js";
import { createApp } from "./app.js";

const server = createServer(createApp());
server.listen(config.port, () => {
  console.log(`Study plan API listening on port ${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received; closing server`);
  server.close((error) => {
    if (error) {
      console.error("Server shutdown failed", error);
      process.exitCode = 1;
    }
  });
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
