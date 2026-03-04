import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Creating push_subscriptions table...");

        // Create the table safely
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS \`push_subscriptions\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`user_id\` int NOT NULL,
        \`endpoint\` text NOT NULL,
        \`p256dh\` varchar(255) NOT NULL,
        \`auth\` varchar(255) NOT NULL,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`push_subscriptions_id\` PRIMARY KEY(\`id\`)
      );
    `);

        try {
            // Trying to add the index. If it already exists, MySQL throws an error which we catch.
            await db.execute(sql`
        CREATE INDEX \`idx_push_sub_user_id\` ON \`push_subscriptions\` (\`user_id\`);
      `);
            console.log("Index added!");
        } catch (indexErr: any) {
            if (indexErr.code === 'ER_DUP_KEYNAME') {
                // Index is already there, ignore
            } else {
                throw indexErr;
            }
        }

        console.log("Tabel push_subscriptions berhasil dibuat!");
    } catch (err) {
        console.error("Error:", err);
    }
    process.exit(0);
}

main();
