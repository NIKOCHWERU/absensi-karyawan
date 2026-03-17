import { poolConnection } from "./server/db";

async function apply() {
    console.log("Starting DB Schema Update...");
    try {
        const connection = await poolConnection.getConnection();
        console.log("Connected to DB.");

        console.log("Creating shifts table...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS shifts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                check_in_time VARCHAR(10) NOT NULL,
                check_out_time VARCHAR(10) NOT NULL,
                description TEXT
            )
        `);

        console.log("Updating users table...");
        const userCols = [
            "birth_place VARCHAR(100)",
            "birth_date DATE",
            "gender ENUM('Laki-laki', 'Perempuan')",
            "religion VARCHAR(50)",
            "address TEXT",
            "npwp VARCHAR(50)",
            "bpjs VARCHAR(50)",
            "bank_account VARCHAR(100)",
            "ktp_photo_url VARCHAR(512)",
            "registration_status ENUM('unregistered', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'unregistered'",
            "join_date DATE",
            "employment_status VARCHAR(50)"
        ];

        // Check columns first because IF NOT EXISTS for ADD COLUMN is not always supported in MySQL 8.0 < 8.0.29
        const [rows]: any = await connection.query("SHOW COLUMNS FROM users");
        const existingCols = rows.map((r: any) => r.Field);

        for (const colDef of userCols) {
            const colName = colDef.split(' ')[0];
            if (!existingCols.includes(colName)) {
                console.log(`Adding column ${colName}...`);
                await connection.query(`ALTER TABLE users ADD COLUMN ${colDef}`);
            }
        }

        console.log("Updating attendance table...");
        const [attRows]: any = await connection.query("SHOW COLUMNS FROM attendance");
        const attExistingCols = attRows.map((r: any) => r.Field);
        if (!attExistingCols.includes('shift_id')) {
            await connection.query("ALTER TABLE attendance ADD COLUMN shift_id INT");
        }

        console.log("DB Schema updated successfully!");
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error("Error updating DB:", err);
        process.exit(1);
    }
}

apply();
