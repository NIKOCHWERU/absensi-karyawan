import "dotenv/config";
import { storage } from "../server/storage";
import { listFiles } from "../server/services/googleDrive";

async function sync() {
  const isCommit = process.argv.includes("--commit");
  console.log(`🚀 Starting Drive Sync (${isCommit ? "COMMIT MODE" : "DRY RUN MODE"})`);

  try {
    const driveFiles = await listFiles();
    console.log(`📁 Found ${driveFiles.length} files in Google Drive folder.`);
    driveFiles.forEach(f => console.log(`  - ${f.name} (${f.id})`));

    const users = await storage.getAllUsers();
    console.log(`👤 Found ${users.length} users in database.`);

    const updates = [];

    for (const file of driveFiles) {
      // Filename format: TYPE_SAFENAME_DATE.jpg
      const parts = file.name.split("_");
      if (parts.length < 2) continue;

      const type = parts[0].toUpperCase(); // KTP, BPJS, NPWP
      if (!["KTP", "BPJS", "NPWP"].includes(type)) continue;

      const safeNameFromFile = parts[1].toLowerCase();
      
      // Find matching user
      const user = users.find(u => {
        const safeUserName = u.fullName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        // Cek apakah nama file mengandung atau sama dengan nama yang disederhanakan
        return safeUserName === safeNameFromFile || safeNameFromFile.includes(safeUserName) || safeUserName.includes(safeNameFromFile);
      });

      if (user) {
        const fieldMap: any = {
          "KTP": "ktpPhotoUrl",
          "BPJS": "bpjsPhotoUrl",
          "NPWP": "npwpPhotoUrl"
        };
        const fieldName = fieldMap[type];
        
        // Only update if currently empty
        if (!(user as any)[fieldName]) {
           updates.push({
             userId: user.id,
             userName: user.fullName,
             type,
             field: fieldName,
             fileId: file.id,
             viewUrl: file.webViewLink
           });
        }
      }
    }

    if (updates.length === 0) {
      console.log("\n🙌 No new matches found or all data already synchronized.");
      return;
    }

    console.log(`\n🔍 Proposed Updates (${updates.length}):`);
    console.table(updates.map(u => ({
      User: u.userName,
      Doc: u.type,
      File: u.fileId.substring(0, 10) + "..."
    })));

    if (isCommit) {
      console.log("\n💾 Committing changes to database...");
      for (const update of updates) {
        // Use full URL if available, otherwise just ID
        const urlToSave = update.viewUrl || update.fileId;
        await storage.updateUser(update.userId, {
          [update.field]: urlToSave
        });
        console.log(`✅ Updated ${update.type} for ${update.userName}`);
      }
      console.log("\n✨ Sync complete!");
    } else {
      console.log("\n💡 Run with --commit to apply these changes.");
    }

  } catch (err: any) {
    console.error("❌ Sync failed:", err);
  } finally {
    process.exit(0);
  }
}

sync();
