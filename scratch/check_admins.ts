import { storage } from "../server/storage";
import { users } from "../shared/schema";
import { db } from "../server/db";

async function checkAdmins() {
  const allUsers = await storage.getAllUsers();
  const superadmins = allUsers.filter(u => u.role === 'superadmin');
  console.log("Superadmins:", JSON.stringify(superadmins, null, 2));
  process.exit(0);
}

checkAdmins().catch(err => {
  console.error(err);
  process.exit(1);
});
