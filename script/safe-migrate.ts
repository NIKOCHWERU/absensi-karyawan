import "dotenv/config";
import mysql from "mysql2/promise";

async function runSafeMigration() {
  console.log("Menjalankan migrasi database aman...");
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL tidak ditemukan di file .env");
    process.exit(1);
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // 1. Buat tabel shifts jika belum ada
    console.log("➜ Memeriksa tabel 'shifts'...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`shifts\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`check_in_time\` VARCHAR(255) NOT NULL,
        \`check_out_time\` VARCHAR(255) NOT NULL,
        \`description\` TEXT
      );
    `);
    console.log("  ✅ Tabel 'shifts' siap.\n");

    // 2. Tambah kolom ke tabel users
    console.log("➜ Memeriksa kolom baru di tabel 'users'...");
    const userColumns = [
      "birth_place VARCHAR(255)",
      "birth_date VARCHAR(255)",
      "gender VARCHAR(50)",
      "religion VARCHAR(50)",
      "address TEXT",
      "npwp VARCHAR(255)",
      "bpjs VARCHAR(255)",
      "bank_account VARCHAR(255)",
      "ktp_photo_url TEXT",
      "registration_status ENUM('unregistered', 'pending', 'approved', 'rejected') DEFAULT 'unregistered'",
      "join_date VARCHAR(255)",
      "employment_status VARCHAR(255)",
      "photo_url TEXT"
    ];

    for (const colDef of userColumns) {
      const colName = colDef.split(' ')[0];
      try {
        await connection.query(`ALTER TABLE \`users\` ADD COLUMN ${colDef}`);
        console.log(`  ✅ Kolom '${colName}' berhasil ditambahkan.`);
      } catch (err: any) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ℹ️ Kolom '${colName}' sudah ada, dilewati.`);
        } else {
          throw err;
        }
      }
    }
    console.log("\n");

    // 3. Tambah kolom ke tabel attendance
    console.log("➜ Memeriksa kolom baru di tabel 'attendance'...");
    const attendanceColumns = [
      "shift_id INT"
    ];

    for (const colDef of attendanceColumns) {
      const colName = colDef.split(' ')[0];
      try {
        await connection.query(`ALTER TABLE \`attendance\` ADD COLUMN ${colDef}`);
        console.log(`  ✅ Kolom '${colName}' berhasil ditambahkan.`);
      } catch (err: any) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ℹ️ Kolom '${colName}' sudah ada, dilewati.`);
        } else {
          throw err;
        }
      }
    }

    // 4. Update enum status di tabel attendance agar mendukung nilai 'off'
    console.log("➜ Memperbarui ENUM pada kolom 'status' di tabel 'attendance'...");
    try {
      await connection.query(`
        ALTER TABLE \`attendance\` 
        MODIFY COLUMN \`status\` ENUM('present', 'late', 'sick', 'permission', 'cuti', 'absent', 'off', 'libur') DEFAULT 'absent';
      `);
      console.log(`  ✅ Tipe data ENUM kolom 'status' berhasil diperbarui.`);
    } catch (err: any) {
      console.log(`  ❌ Gagal memperbarui ENUM status:`, err.message);
    }

    console.log("\n🎉 MIGRASI SELESAI DENGAN AMAN! (Data lama tidak terhapus)");
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat migrasi:", error);
  } finally {
    await connection.end();
  }
}

runSafeMigration();
