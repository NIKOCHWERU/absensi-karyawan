import { exec } from "child_process";
import fs from "fs";
import path from "path";
import "dotenv/config";

const backupsDir = path.join(process.cwd(), "backups");

if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
}

export const createBackup = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        const dbUrlStr = process.env.DATABASE_URL;
        if (!dbUrlStr) {
            return reject(new Error("DATABASE_URL is not defined"));
        }

        try {
            // Parse mysql://user:pass@host:port/dbname
            const url = new URL(dbUrlStr);
            const host = url.hostname;
            const port = url.port || 3306;
            const user = url.username;
            const pass = url.password;
            const dbName = url.pathname.replace("/", "");

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const fileName = `backup-${dbName}-${timestamp}.sql`;
            const filePath = path.join(backupsDir, fileName);

            let cmd = `mysqldump -h ${host} -P ${port} -u ${user} `;
            if (pass) {
                cmd += `-p${pass} `;
            }
            cmd += `${dbName} > "${filePath}"`;

            exec(cmd, (error) => {
                if (error) {
                    console.error("Backup error:", error);
                    reject(error);
                } else {
                    console.log(`Database backup created at ${filePath}`);
                    resolve(fileName);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

export const initAutoBackup = () => {
    // Backup every 30 minutes
    const INTERVAL = 30 * 60 * 1000;

    setInterval(() => {
        console.log("[AutoBackup] Starting scheduled database backup...");
        createBackup().catch(err => console.error("[AutoBackup] Failed:", err));
    }, INTERVAL);

    // Run one immediately on startup
    console.log("[AutoBackup] Starting initial database backup...");
    createBackup().catch(err => console.error("[AutoBackup] Initial backup failed:", err));
};
