const mysql = require('mysql2/promise');

async function main() {
  try {
    const connection = await mysql.createConnection('mysql://niko:niko@localhost:3306/absensi_karyawan_pt_eja');
    const [rows] = await connection.execute("SELECT id, username, fullName, role FROM users WHERE role IN ('admin', 'superadmin')");
    
    console.log('--- ADMIN USERS ---');
    console.log(rows);
    await connection.end();
  } catch (err) {
    console.error('Error connecting to DB:', err);
  }
}

main();
