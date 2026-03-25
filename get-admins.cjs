const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  try {
    const connection = await mysql.createConnection('mysql://niko:niko@localhost:3306/absensi_karyawan_pt_eja');
    const [rows] = await connection.execute("SELECT id, username, fullName, role FROM users WHERE role IN ('admin', 'superadmin')");
    
    console.log('--- ADMIN USERS ---');
    if (rows.length === 0) {
      console.log('Tidak ada admin yang ditemukan.');
    } else {
      console.log(rows);
    }
    
    // Also try to find default seeded admin logic
    console.log('\\n--- Jika Anda tidak tahu passwordnya ---');
    console.log('Anda bisa mereset password melalui script ini jika diberitahu ID-nya.');
    
    await connection.end();
  } catch (err) {
    console.error('Error connecting to DB:', err);
  }
}

main();
