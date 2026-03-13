import { exec } from "child_process";
import fs from "fs";
import path from "path";
import "dotenv/config";
import cron from "node-cron";

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

export const importBackup = (filePath: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const dbUrlStr = process.env.DATABASE_URL;
        if (!dbUrlStr) {
            return reject(new Error("DATABASE_URL is not defined"));
        }

        try {
            const url = new URL(dbUrlStr);
            const host = url.hostname;
            const port = url.port || 3306;
            const user = url.username;
            const pass = url.password;
            const dbName = url.pathname.replace("/", "");

            let cmd = `mysql -h ${host} -P ${port} -u ${user} `;
            if (pass) {
                cmd += `-p${pass} `;
            }
            cmd += `${dbName} < "${filePath}"`;

            exec(cmd, (error) => {
                if (error) {
                    console.error("Restore error:", error);
                    reject(error);
                } else {
                    console.log(`Database restored from ${filePath}`);
                    resolve(true);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};

export const initAutoBackup = () => {
    // Backup 5 times a day:
    // 1. 00:00 (Midnight)
    // 2. 06:00 (Morning)
    // 3. 12:00 (Noon)
    // 4. 18:00 (Evening)
    // 5. 23:59 (End of day)

    const scheduleBackup = (cronTime: string, label: string) => {
        cron.schedule(cronTime, () => {
            console.log(`[AutoBackup - ${label}] Starting scheduled database backup...`);
            createBackup().catch(err => console.error(`[AutoBackup - ${label}] Failed:`, err));
        });
    };

    scheduleBackup('0 0 * * *', 'Midnight');
    scheduleBackup('0 6 * * *', 'Morning');
    scheduleBackup('0 12 * * *', 'Noon');
    scheduleBackup('0 18 * * *', 'Evening');
    scheduleBackup('59 23 * * *', 'End of Day');

    // Run one immediately on startup
    console.log("[AutoBackup] Starting initial database backup on startup...");
    createBackup().catch(err => console.error("[AutoBackup] Initial backup failed:", err));
};
