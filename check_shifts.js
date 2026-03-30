import { storage } from "./server/storage.js";

async function run() {
  const shifts = await storage.getAllShifts();
  console.log(JSON.stringify(shifts, null, 2));
  process.exit(0);
}
run();
