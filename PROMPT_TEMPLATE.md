# TEMPLATE PROMPT UNTUK ANTIGRAVITY AGENT / AI CODER

Gunakan isi berkas ini sebagai prompt awal saat Anda ingin meminta AI Coding Assistant (seperti Antigravity) membangun aplikasi absensi ini dari awal untuk perusahaan baru. 

Cukup salin seluruh teks di bawah garis pembatas, lalu sesuaikan nilai parameter konfigurasi di bagian **[KONFIGURASI TEMPLATE]** sesuai kebutuhan Anda.

---

```markdown
Kamu adalah AI Coding Assistant ahli. Tugasmu adalah membangun Aplikasi Web Progresif (PWA) Sistem Manajemen Absensi Karyawan dari awal dengan spesifikasi teknis dan fungsional yang dijabarkan di bawah ini.

### [KONFIGURASI BERKAS .env]
Semua nama instansi, warna tema, dan deskripsi aplikasi wajib dimuat secara dinamis dari berkas konfigurasi lingkungan `.env` agar admin dapat mengubah identitas aplikasi tanpa menyentuh kode program. Contoh konfigurasi `.env` adalah sebagai berikut:

```env
# PENGATURAN IDENTITAS PERUSAHAAN (Wajib berawalan VITE_ agar dapat diakses oleh React + Vite)
VITE_NAMA_PT="PT ABCD"
VITE_SINGKATAN_PT="PT ABCD"
VITE_DESKRIPSI_PWA="Aplikasi Absensi Karyawan PT ABCD. Solusi absensi modern, cepat, dan akurat dengan fitur GPS dan pengenalan wajah."

# PENGATURAN TEMA WARNA UTAMA APLIKASI (Format koordinat HSL untuk CSS)
VITE_THEME_PRIMARY_HSL="122 39% 49%"       # Hijau Utama (#4CAF50)
VITE_THEME_SECONDARY_HSL="122 39% 65%"     # Hijau Muda
VITE_THEME_ACCENT_HSL="122 39% 49%"        # Warna Aksen
VITE_THEME_BACKGROUND_HSL="30 50% 98%"     # Krem Hangat (Latar Belakang)
VITE_THEME_SIDEBAR_ACCENT_HSL="122 39% 96%" # Hijau Highlight Sidebar/Card

# NOTIFIKASI WEB PUSH API
VAPID_PUBLIC_KEY="YOUR_PUBLIC_VAPID_KEY"
VAPID_PRIVATE_KEY="YOUR_PRIVATE_VAPID_KEY"

# PENYIMPANAN DATABASE (MYSQL) & GOOGLE DRIVE API
DATABASE_URL="mysql://user:password@localhost:3306/attendance_db"
GDRIVE_CLIENT_ID="YOUR_GDRIVE_CLIENT_ID"
GDRIVE_CLIENT_SECRET="YOUR_GDRIVE_CLIENT_SECRET"
GDRIVE_REFRESH_TOKEN="YOUR_GDRIVE_REFRESH_TOKEN"
GDRIVE_FOLDER_ID="YOUR_GDRIVE_FOLDER_ID"
```

---

## 1. STRUKTUR TEKNOLOGI (TECH STACK)
Aplikasi harus dibangun menggunakan teknologi berikut untuk menjamin performa cepat dan responsif:
- **Frontend**: React 18, Vite 7 (sebagai bundler), TypeScript, Tailwind CSS v3, Wouter (untuk routing klien ringan), TanStack React Query v5, Framer Motion (untuk animasi transisi modal/halaman), Radix UI/shadcn (sebagai basis komponen UI).
- **Backend**: Node.js dengan Express.js.
- **Otentikasi & Sesi**: Passport.js dengan strategi Local (username/password), express-session dengan MySQL Session Store (`express-mysql-session`) untuk penyimpanan status login di database.
- **Database**: MySQL menggunakan library `mysql2/promise` dengan pooling koneksi, dikelola menggunakan Drizzle ORM dan Drizzle Kit.
- **Media & Penyimpanan**: Integrasi Google Drive API (v3) dengan OAuth2 offline refresh token untuk menyimpan berkas KTP, profil, BPJS, NPWP, dan foto absensi.
- **Geolokasi**: Geocoding lokasi berbasis OpenStreetMap Nominatim API secara client-side.
- **Notifikasi**: Web Push API (`web-push`) di server dengan registrasi Service Worker di client-side.

## 2. SKEMA DATABASE (DRIZZLE ORM - MYSQL)
Definisikan tabel-tabel berikut di `shared/schema.ts` menggunakan Drizzle:

1. **users**: `id` (int, PK), `email` (varchar), `username` (varchar, unique - untuk NIK), `password` (varchar), `fullName` (varchar), `role` (mysqlEnum: admin, employee, superadmin), `nik` (varchar, unique), `branch` (varchar), `position` (varchar), `shift` (varchar), `photoUrl` (varchar), `isAdmin` (boolean), `phoneNumber` (varchar), `birthPlace` (varchar), `birthDate` (date), `gender` (mysqlEnum: Laki-laki, Perempuan), `religion` (varchar), `address` (text), `npwp` (varchar), `bpjs` (varchar), `npwpPhotoUrl` (varchar), `bpjsPhotoUrl` (varchar), `bankAccount` (varchar), `ktpPhotoUrl` (varchar), `registrationStatus` (mysqlEnum: unregistered, pending, approved, rejected), `joinDate` (varchar), `employmentStatus` (varchar).
2. **shifts**: `id` (int, PK), `name` (varchar), `checkInTime` (varchar, "HH:mm"), `checkOutTime` (varchar, "HH:mm"), `description` (text).
3. **attendance**: `id` (int, PK), `userId` (int), `date` (date), `checkIn` (timestamp), `checkInPhoto` (varchar), `checkInLocation` (text), `breakStart` (timestamp), `breakStartPhoto` (varchar), `breakStartLocation` (text), `breakEnd` (timestamp), `breakEndPhoto` (varchar), `breakEndLocation` (text), `checkOut` (timestamp), `checkOutPhoto` (varchar), `checkOutLocation` (text), `shiftId` (int), `shift` (varchar), `sessionNumber` (int, default 1), `status` (mysqlEnum: present, late, sick, permission, cuti, absent, off), `notes` (text), `lateReason` (text), `lateReasonPhoto` (varchar), `permitExitAt` (timestamp), `permitResumeAt` (timestamp), `isFakeGps` (boolean).
4. **leave_requests**: `id` (int, PK), `userId` (int), `startDate` (date), `endDate` (date), `selectedDates` (text - untuk tanggal cuti terpisah dipisahkan koma), `reason` (text), `status` (mysqlEnum: pending, approved, rejected, cancelled).
5. **complaints**: `id` (int, PK), `userId` (int), `title` (varchar), `description` (text), `status` (mysqlEnum: pending, reviewed, resolved).
6. **complaint_photos**: `id` (int, PK), `complaintId` (int), `photoUrl` (varchar), `caption` (text).
7. **resignations**: `id` (int, PK), `userId` (int), `resignDate` (date), `reason` (text), `documentUrl` (varchar).
8. **mutations**: `id` (int, PK), `userId` (int), `type` (mysqlEnum: mutasi, promosi, demosi), `oldBranch` (varchar), `newBranch` (varchar), `oldPosition` (varchar), `newPosition` (varchar), `documentUrl` (varchar), `notes` (text).
9. **warning_letters**: `id` (int, PK), `userId` (int), `type` (mysqlEnum: SP1, SP2, SP3), `startDate` (date), `endDate` (date), `documentUrl` (varchar), `notes` (text).

## 3. ATURAN BISNIS & LOGIKA PEMROGRAMAN
Aplikasi wajib menerapkan aturan bisnis berikut:
- **Batas Pergantian Hari (04:00 WIB)**: Pergantian hari administratif dihitung pada pukul **04.00 WIB**. Semua absensi masuk/pulang/istirahat sebelum jam 04.00 WIB pagi akan masuk dalam catatan hari kemarin.
- **Login Khusus Karyawan**: Karyawan login menggunakan NIK sebagai username. Otentikasi sandi karyawan di-bypass (login NIK-only). Sementara itu, `admin` dan `superadmin` wajib memverifikasi kata sandi secara aman.
- **Deteksi GPS Palsu**: Sebelum mengirim koordinat ke server, frontend harus memeriksa apakah nilai akurasi GPS tepat `0` atau `1` meter, atau properti `mocked === true`. Jika ya, set `isFakeGps = true` dan tampilkan peringatan mencolok di dasbor admin.
- **Evaluasi Keterlambatan**: Status "Telat" hanya dievaluasi pada sesi pertama absensi masuk hari itu berdasarkan jam batas shift karyawan. Jika terlambat, karyawan wajib memasukkan alasan dan foto bukti sebelum tombol snap absensi terbuka.
- **Sesi Kehadiran Kerja**: Mendukung pencatatan kehadiran hingga maksimal **5 sesi** per hari (untuk split shift atau kembali bekerja setelah izin keluar kantor). Sesi 2 hingga 5 selalu berstatus "present".
- **Pemberitahuan Dasbor Karyawan**: Menampilkan modal dialog pemberitahuan di dasbor karyawan secara otomatis jika terdapat dokumen baru (Mutasi/SP/Resign) yang terbit setelah cutoff `2026-06-10 11:00 WIB`. Dismiss status disimpan di `localStorage`.
- **PWA Setup**: Sediakan file `/manifest.json` dan `/sw.js` agar aplikasi dapat dipasang langsung di handphone karyawan dengan fungsi push notification. Pastikan deskripsi aplikasi dimuat dinamis dari `.env` (`import.meta.env.VITE_DESKRIPSI_PWA`).

## 4. FITUR EKSPOR PDF MASSAL HARIAN
- Sediakan fitur **Ekspor Harian Massal** pada halaman rekap admin saat filter rentang tanggal kustom dipilih.
- Ekspor massal mengunduh file `.pdf` satu-per-satu per hari menggunakan pustaka `html2pdf.js` klien.
- Nama file ekspor harus menggunakan format kapital penuh (*uppercase*) dengan nama bulan Indonesia kapital:
  - Rekap Teks: `REKAP ABSENSI NON MANAJEMEN [D] [MONTH] - [D+1] [MONTH] [YEAR] [VITE_SINGKATAN_PT].pdf`
  - Rekap Foto: `REKAP ABSENSI FOTO NON MANAJEMEN [D] [MONTH] - [D+1] [MONTH] [YEAR] [VITE_SINGKATAN_PT].pdf`
- **Penanganan CORS Foto**: Untuk menghindari error CORS saat memuat foto bukti di PDF klien, buat endpoint `/api/images/:id` di backend yang bertindak sebagai proxy pengunduhan gambar Google Drive, lengkap dengan sistem penulisan *local cache* pada disk server (`uploads/gdrive-cache/`) demi menghemat kuota request API Google Drive.
- Gunakan jeda waktu (*interval delay*) **600ms** antar file unduhan di klien agar browser tidak memblokir proses unduhan berturut-turut.

## 5. LAYANAN OTOMATIS & BACKUP
- **Auto-Migration**: Pada file `server/index.ts`, tambahkan skrip pengecekan dan migrasi otomatis untuk mengubah tipe kolom, memastikan kolom NPM, BPJS, alasan telat, GPS palsu, dan tabel `leave_requests` dibuat otomatis jika belum tersedia di database MySQL tujuan saat server dijalankan.
- **Auto-Backup**: Buat scheduler di server untuk menjalankan pencadangan database (`mysqldump`) setiap **30 menit** dan menyimpannya secara rapi di direktori `/backups` lokal server.

## 6. FILOSOFI DESAIN & DINAMISASI TEMA (CSS)
- **Injeksi Tema Dinamis**: Pada file inisialisasi frontend (`main.tsx` atau `App.tsx`), ambil nilai variabel tema warna dari `.env` (contoh: `import.meta.env.VITE_THEME_PRIMARY_HSL`) dan suntikkan ke elemen `:root` DOM secara dinamis menggunakan `document.documentElement.style.setProperty('--primary', value)` saat aplikasi dimuat pertama kali.
- Gunakan variabel CSS tersebut (`var(--primary)`) pada file `client/src/index.css` agar seluruh styling Tailwind CSS dan vanilla CSS mengikuti warna yang diatur di `.env`.
- Pastikan font Outfit dan DM Sans dimuat melalui Google Fonts.
- Terapkan efek *glassmorphism* (`glass-panel`), bayangan melayang, transisi penekanan tombol halus, navigasi bawah khusus layar seluler karyawan, serta antarmuka dasbor admin hijau premium yang rapi.
## 7. RINCIAN ALUR & DETAIL FITUR LENGKAP

Aplikasi ini wajib memiliki alur fitur lengkap berikut dari pendaftaran karyawan baru hingga sistem ekspor admin:

### A. Alur Pendaftaran Karyawan Baru (Registrasi)
1. **Formulir Registrasi Karyawan**: Menyediakan halaman registrasi publik yang dapat diakses oleh calon karyawan baru. Formulir ini meminta data wajib berikut:
   - **Data Pribadi**: Nama Lengkap, NIK (Nomor Induk Kependudukan - unik), Alamat Email, Nomor Telepon, Tempat & Tanggal Lahir, Jenis Kelamin (Laki-laki / Perempuan), Agama, Alamat Tinggal Lengkap.
   - **Dokumen Identitas**: Unggah Foto KTP, Unggah Foto NPWP, Unggah Foto BPJS (Disimpan langsung ke Google Drive melalui API).
   - **Informasi Pekerjaan**: Cabang penempatan, Jabatan, Shift Kerja yang diinginkan, Nomor Rekening Bank, Tanggal Mulai Bekerja (Join Date), Status Kepegawaian (Kontrak / Tetap).
2. **Status Awal (Pending)**: Setelah formulir diserahkan, status registrasi pengguna diatur ke `pending` dan mereka belum dapat masuk ke aplikasi sampai disetujui oleh Admin.

### B. Otentikasi & Bypass Login Karyawan
1. **Otentikasi Karyawan (NIK-Only)**: Untuk kemudahan operasional di lapangan, karyawan masuk hanya menggunakan NIK (tanpa password/password bypass).
2. **Otentikasi Admin & Superadmin**: Wajib menggunakan username (email) dan kata sandi yang diverifikasi dengan hashing aman (bcrypt) oleh Passport.js.
3. **Penyimpanan Sesi**: Menggunakan `express-session` dengan MySQL Store agar sesi login karyawan tidak hilang saat server di-restart.

### C. Menu Verifikasi Karyawan oleh Admin
1. **Review Berkas**: Admin memiliki halaman khusus untuk melihat seluruh daftar calon karyawan berstatus `pending`.
2. **Pratinjau Dokumen**: Admin dapat mengeklik untuk mempratinjau KTP, NPWP, dan BPJS calon karyawan.
3. **Persetujuan/Penolakan**: Admin dapat menyetujui (`approved`) agar akun aktif dan bisa login absensi, atau menolak (`rejected`) pendaftaran.
4. **CRUD Hapus**: Admin dapat menghapus data registrasi yang ditolak secara permanen untuk membersihkan database.

### D. Dasbor Karyawan & Pencatatan Kehadiran (5 Sesi)
1. **Dasbor Utama**: Karyawan dapat melihat status hari ini, informasi jam shift saat ini, dan tombol aksi kehadiran.
2. **Siklus Kehadiran 5 Sesi**: Mendukung pencatatan kehadiran hingga maksimal 5 sesi per hari:
   - **Absen Masuk (Check-In)**: Sesi pertama hari itu. Dievaluasi apakah terlambat berdasarkan jam mulai shift. Jika terlambat, wajib mengunggah foto alasan keterlambatan dan mengetik deskripsi alasan keterlambatan sebelum tombol rekam absensi aktif.
   - **Mulai Istirahat (Break Start)**: Mengambil foto wajah dan lokasi.
   - **Selesai Istirahat (Break End)**: Mengambil foto wajah dan lokasi.
   - **Absen Keluar (Check-Out)**: Selesai jam kerja hari itu.
   - **Sesi Tambahan (Sesi 2 s.d. 5)**: Digunakan jika karyawan diizinkan keluar kantor untuk keperluan dinas dan ingin mencatatkan kehadiran kembali.
3. **Perekaman Geolokasi & Foto Wajah**: Setiap aksi absensi wajib menyertakan koordinat GPS yang divalidasi ke alamat fisik menggunakan OpenStreetMap Nominatim API, serta mengambil foto wajah menggunakan webcam/kamera handphone.
4. **Deteksi Fake GPS**: Deteksi otomatis client-side jika akurasi GPS bernilai 0 atau 1 meter (ciri Fake GPS emulator) atau variabel `mocked` bernilai true. Jika terdeteksi, tandai absensi tersebut dengan `isFakeGps = true`.

### E. Popup Pemberitahuan Berkas Baru Karyawan
1. **Notifikasi Otomatis**: Jika admin menerbitkan dokumen administrasi baru (Mutasi, Resign, atau SP) dengan tanggal pembuatan setelah `2026-06-10 11:00 WIB`, dasbor karyawan akan otomatis memunculkan modal dialog popup.
2. **Pratinjau & Unduh**: Di dalam modal popup, karyawan dapat membaca detail dokumen, keterangan admin, dan tombol unduh berkas SK tersebut secara langsung.
3. **Simpan Status Dismiss**: Karyawan dapat menutup popup modal, dan status "sudah dibaca" disimpan di `localStorage` agar modal tidak mengganggu aktivitas absensi berikutnya.

### F. Kelola Administrasi Karyawan oleh Admin (Mutasi, SP, Resign, Cuti)
1. **Manajemen Resign**: Formulir input resign karyawan dengan tanggal resign, alasan, dan unggah dokumen SK Resign.
2. **Manajemen Mutasi & Promosi**: Formulir input jenis mutasi (mutasi, promosi, demosi), cabang lama/baru, jabatan lama/baru, keterangan, dan berkas SK.
3. **Surat Peringatan (SP)**: Penerbitan SP1, SP2, SP3 beserta rentang masa berlaku surat dan berkas SK SP.
4. **Kelola Cuti**:
   - Pengajuan cuti terintegrasi dengan rentang tanggal atau tanggal terpisah.
   - Tombol **Print Cuti** di admin yang membuka tab baru berisi template formulir bisnis HTML formal pengajuan cuti yang siap dicetak rapi ke printer fisik atau PDF browser.
5. **Riwayat Administrasi & CRUD Hapus**: Setiap menu administrasi memiliki tab **Riwayat** yang menampilkan seluruh arsip masa lalu dalam bentuk kartu linimasa (*timeline*), lengkap dengan tombol **Hapus (Trash)** untuk menghapus data administrasi jika sudah terlalu lama.

### G. Rekap Kehadiran & Ekspor Massal Harian Admin
1. **Rekap Absensi**: Menampilkan status kehadiran seluruh karyawan dalam bentuk tabel interaktif.
2. **Rekap Foto Absensi**: Menampilkan grid kolase foto-foto absensi masuk, istirahat, dan pulang karyawan untuk mempermudah audit visual kecocokan wajah.
3. **Ekspor PDF Harian Massal**:
   - Jika admin memilih rentang tanggal (misalnya: 4 Mei s.d. 1 Juni), sistem akan otomatis mengunduh file PDF harian satu per satu secara berurutan.
   - Penamaan file PDF otomatis berformat huruf kapital penuh:
     - `REKAP ABSENSI NON MANAJEMEN 4 MEI - 5 MEI 2026 [SINGKATAN_PT].pdf`
     - `REKAP ABSENSI FOTO NON MANAJEMEN 4 MEI - 5 MEI 2026 [SINGKATAN_PT].pdf`
     - Dan seterusnya per hari sampai tanggal akhir dengan jeda unduhan *600ms* per berkas agar tidak diblokir browser.
4. **Proxy Gambar Google Drive Klien**: Endpoint `/api/images/:id` di backend bertindak sebagai bypass CORS gambar dan memelihara *local cache* gambar di disk server (`uploads/gdrive-cache/`) agar ekspor foto di klien tidak terhambat CORS dan menghemat kuota Google Drive API.

### H. Layanan Otomatis Server & Backup
1. **Auto-Migration Database**: Saat server Express dijalankan, ia akan otomatis memeriksa tabel MySQL dan melakukan penyesuaian kolom (seperti NPWP, BPJS, alasan telat, dsb.) secara otomatis sehingga tidak membutuhkan migrasi manual saat rilis.
2. **Auto-Backup Database**: Scheduler internal server akan melakukan ekspor database menggunakan `mysqldump` secara berkala setiap **30 menit** dan menyimpannya di folder `/backups` untuk proteksi kehilangan data.

```

Silakan bangun aplikasi dengan mengikuti setiap butir instruksi di atas secara konsisten dan lengkap!
---
