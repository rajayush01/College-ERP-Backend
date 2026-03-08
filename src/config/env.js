import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env
dotenv.config({
  path: path.join(__dirname, "../../.env"),
});

console.log("🧪 ENV LOADED:", {
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
});
