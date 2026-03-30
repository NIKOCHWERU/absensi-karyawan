import { storage } from "./server/storage";

async function run() {
  try {
      const shifts = await storage.getAllShifts();
      console.log(JSON.stringify(shifts, null, 2));
  } catch(e) { console.error(e) }
  process.exit(0);
}
run();
