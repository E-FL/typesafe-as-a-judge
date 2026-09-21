import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

if (!process.env.TYPESAFE_API_KEY && process.platform !== "win32") {
  const configHome = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  const tokenPath = join(configHome, "typesafe-as-a-judge", "token");
  if (existsSync(tokenPath)) {
    const token = readFileSync(tokenPath, "utf8").trim();
    if (token) process.env.TYPESAFE_API_KEY = token;
  }
}

await import("../server/index.mjs");
