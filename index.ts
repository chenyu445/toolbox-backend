import app from "./src/index.js";
import { handle } from "hono/vercel";

export default handle(app);
