import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes('localhost')) {
    dbUrl = dbUrl.replace('localhost', '127.0.0.1');
}

async function fixDb() {
    const connection = await mysql.createConnection(dbUrl);
    console.log("Connected to DB.");

    try {
        await connection.query("ALTER TABLE attendance MODIFY COLUMN status ENUM('present', 'late', 'sick', 'permission', 'cuti', 'absent', 'off') DEFAULT 'absent'");
        console.log("Successfully altered table attendance, added 'off' to status ENUM.");
    } catch (err) {
        console.error("Error altering table", err);
    } finally {
        await connection.end();
    }
}

fixDb();
