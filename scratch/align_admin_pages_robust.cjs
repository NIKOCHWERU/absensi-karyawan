const fs = require('fs');
const path = require('path');

const adminPagesDir = path.join(__dirname, '..', 'client', 'src', 'pages', 'admin');

const pageConfigs = {
    'AdminLeavePage.tsx': {
        title: 'Manajemen Permohonan Cuti',
        desc: 'Verifikasi dan kelola persetujuan cuti sakit, tahunan, dan cuti melahirkan karyawan.',
        buttons: `                    <Button
                        variant="outline"
                        className="rounded-lg gap-2 cursor-pointer bg-white"
                        onClick={() => setLocation("/admin/leave-history")}
                    >
                        <Calendar className="w-4 h-4" />
                        Lihat Riwayat Cuti
                    </Button>`
    },
    'AdminLeaveHistoryPage.tsx': {
        title: 'Riwayat Permohonan Cuti',
        desc: 'Daftar arsip dan riwayat persetujuan cuti seluruh karyawan.',
        buttons: `                    <Button
                        variant="outline"
                        className="rounded-lg gap-2 cursor-pointer bg-white"
                        onClick={() => setLocation("/admin/leave")}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </Button>`
    },
    'AttendanceHistoryPage.tsx': {
        title: 'Riwayat Absensi Karyawan',
        desc: 'Pantau waktu masuk, pulang, status keterlambatan, dan log GPS presensi karyawan.',
        buttons: `                    <Button
                        variant="outline"
                        className="rounded-lg gap-2 cursor-pointer bg-white"
                        onClick={() => setLocation("/admin/recap")}
                    >
                        Lihat Rekap Absen
                    </Button>`
    },
    'AttendanceSummaryPage.tsx': {
        title: 'Ringkasan Absensi',
        desc: 'Analisis statistik kehadiran, tingkat keterlambatan, dan keaktifan presensi karyawan.',
        buttons: ''
    },
    'ComplaintsPage.tsx': {
        title: 'Pengaduan & Kritik Karyawan',
        desc: 'Respon dan tindak lanjuti kritik, saran, serta keluhan dari karyawan secara cepat.',
        buttons: ''
    },
    'InfoBoardPage.tsx': {
        title: 'Papan Informasi',
        desc: 'Publikasikan pengumuman penting, memo perusahaan, dan kebijakan baru.',
        buttons: `                    <Button className="bg-green-600 hover:bg-green-700 text-white rounded-lg gap-2 shadow-sm" onClick={() => setOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Tambah Informasi
                    </Button>`
    },
    'RecapPage.tsx': {
        title: 'Rekap Kehadiran Karyawan',
        desc: 'Ekspor laporan rekap kehadiran bulanan secara lengkap untuk penggajian.',
        buttons: ''
    },
    'AdminShiftPage.tsx': {
        title: 'Kelola Jadwal Shift Kerja',
        desc: 'Atur jam kerja masuk, pulang, toleransi keterlambatan, dan alokasi shift karyawan.',
        buttons: ''
    },
    'AdminVerificationPage.tsx': {
        title: 'Verifikasi Wajah Karyawan',
        desc: 'Daftarkan dan validasi biometrik wajah karyawan untuk sistem presensi anti-fraud.',
        buttons: ''
    },
    'AdminManageAdminsPage.tsx': {
        title: 'Manajemen Admin',
        desc: 'Kelola hak akses administrator sistem, superadmin, dan otorisasi manajemen.',
        buttons: ''
    },
    'EmployeeListPage.tsx': {
        title: 'Daftar Karyawan',
        desc: 'Kelola informasi data diri, shift kerja, dan status verifikasi karyawan.',
        buttons: `                    <Button variant="outline" className="rounded-lg border-gray-200 hover:bg-gray-50 bg-white" onClick={() => setCsvOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload CSV
                    </Button>
                    <Button 
                        variant="outline" 
                        className="rounded-lg border-gray-200 hover:bg-gray-50 bg-white"
                        onClick={() => handleExportCSV(employees)}
                    >
                        <Upload className="mr-2 h-4 w-4 rotate-180" />
                        Export CSV
                    </Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg gap-2 shadow-sm"
                        onClick={() => {
                            setSelectedEmployee(null);
                            form.reset({
                                fullName: "",
                                password: "",
                                role: "employee",
                                nik: "",
                                branch: "Pusat",
                                position: "Staff",
                                email: "",
                                username: "",
                                phoneNumber: "",
                                religion: "",
                                npwp: "",
                                bpjs: "",
                                birthPlace: "",
                                birthDate: "",
                                gender: "Laki-laki",
                                address: "",
                                joinDate: "",
                                employmentStatus: "Kontrak",
                                registrationStatus: "approved",
                                shift: "-"
                            });
                            setSelectedBpjsPhoto(null);
                            setSelectedNpwpPhoto(null);
                            setSelectedKtpPhoto(null);
                            setSelectedPhoto(null);
                            setOpen(true);
                        }}
                    >
                        <UserPlus className="w-4 h-4" />
                        Tambah Karyawan
                    </Button>`
    }
};

// Let's restore the files to their original git state first so our regex runs on clean files
const execSync = require('child_process').execSync;
try {
    console.log("Restoring admin pages to clean git state first...");
    execSync('git restore client/src/pages/admin/*Page.tsx', { stdio: 'inherit' });
} catch (e) {
    console.log("Restoration failed or not needed.");
}

for (const [filename, config] of Object.entries(pageConfigs)) {
    const filePath = path.join(adminPagesDir, filename);
    if (!fs.existsSync(filePath)) {
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');

    // 1. Remove the sticky double header tag completely
    // We match <header ...> ... </header>
    content = content.replace(/<header[^>]*>([\s\S]*?)<\/header>/, '');

    // 2. Replace <main ...> with <div className="space-y-6">
    content = content.replace(/<main[^>]*>/, `<div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">${config.title}</h1>
                    <p className="text-sm text-gray-500">${config.desc}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    ${config.buttons}
                </div>
            </div>

            <div className="space-y-6">`);

    // 3. Replace </main> with </div></div>
    content = content.replace(/<\/main>/, '</div>\n        </div>');

    // 4. Remove min-h-screen/bg-gray-50 from the top outer div
    content = content.replace(/className="min-h-screen bg-gray-50 flex flex-col"/, 'className="space-y-6"');
    content = content.replace(/className="min-h-screen bg-gray-50 flex flex-col[^"]*"/, 'className="space-y-6"');
    content = content.replace(/className="min-h-screen bg-gray-50"/, 'className="space-y-6"');

    // 5. Replace overly round styles (rounded-3xl or rounded-2xl to rounded-xl)
    content = content.replace(/rounded-3xl/g, 'rounded-xl');
    content = content.replace(/rounded-2xl/g, 'rounded-xl');

    // For InfoBoardPage, let's clean up the duplicate Dialog trigger buttons since config has it
    if (filename === 'InfoBoardPage.tsx') {
        // Remove the original Dialog trigger that was inside header
        content = content.replace(/<DialogTrigger asChild>[\s\S]*?<\/DialogTrigger>/, '');
    }

    // For EmployeeListPage, let's clean up the duplicate buttons that were in header
    if (filename === 'EmployeeListPage.tsx') {
        // Remove the manual dialog and buttons from the main content since they're in config
        content = content.replace(/<Dialog open=\{csvOpen\}[\s\S]*?<\/Dialog>/, '');
        content = content.replace(/<Dialog open=\{open\}[\s\S]*?<\/Dialog>/, '');
        // Inject them at the bottom of the outer container so they render perfectly as modals!
        const insertPosition = content.lastIndexOf('</div>\n        </div>');
        if (insertPosition !== -1) {
            const csvModal = `
            {/* Upload CSV Modal */}
            <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Data Karyawan (CSV)</DialogTitle>
                        <DialogDescription>
                            Unggah file CSV dengan urutan kolom:
                            <br /><strong className="text-gray-900 mt-2 block">NIK, Nama Lengkap, Telepon, Cabang, Jabatan</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        />
                        <Button
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                            disabled={!csvFile || csvMutation.isPending}
                            onClick={() => csvFile && csvMutation.mutate(csvFile)}
                        >
                            {csvMutation.isPending ? "Mengunggah..." : "Upload File"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>`;

            const addModal = `
            {/* Add Employee Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
                    <DialogHeader>
                        <DialogTitle>{selectedEmployee ? "Edit Karyawan" : "Tambah Karyawan Baru"}</DialogTitle>
                        <DialogDescription>
                            Lengkapi informasi data diri dan pekerjaan karyawan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center mb-4">
                        <div className="relative group">
                            <div className="w-24 aspect-[2/3] bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden rounded-lg shadow-sm">
                                {selectedPhoto ? (
                                    <img src={URL.createObjectURL(selectedPhoto)} className="w-full h-full object-cover" />
                                ) : selectedEmployee?.photoUrl ? (
                                    <img src={selectedEmployee.photoUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-lg cursor-pointer transition-opacity">
                                <span className="text-[10px] font-bold">Ganti Foto</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setSelectedPhoto(e.target.files[0]);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit((d) => upsertMutation.mutate(d))} className="space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg space-y-4 border border-gray-100">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-primary border-b pb-1">Biodata Karyawan</h4>
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama Lengkap</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="birthPlace"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tempat Lahir</FormLabel>
                                                <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="birthDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tanggal Lahir</FormLabel>
                                                <FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="gender"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Jenis Kelamin</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || "Laki-laki"}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                                                        <SelectItem value="Perempuan">Perempuan</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField control={form.control} name="religion" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Agama</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Islam">Islam</SelectItem>
                                                    <SelectItem value="Kristen Protestan">Kristen Protestan</SelectItem>
                                                    <SelectItem value="Katolik">Katolik</SelectItem>
                                                    <SelectItem value="Hindu">Hindu</SelectItem>
                                                    <SelectItem value="Buddha">Buddha</SelectItem>
                                                    <SelectItem value="Khonghucu">Khonghucu</SelectItem>
                                                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Alamat Lengkap</FormLabel>
                                                <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg space-y-4 border border-gray-100">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-primary border-b pb-1">Pekerjaan</h4>
                                <FormField
                                    control={form.control}
                                    name="nik"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>NIK (Nomor Induk Karyawan)</FormLabel>
                                            <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="branch"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cabang</FormLabel>
                                                <FormControl>
                                                    <>
                                                        <Input {...field} list="branches-datalist" value={field.value || ''} />
                                                        <datalist id="branches-datalist">
                                                            {existingBranches.map(b => (
                                                                <option key={b} value={b} />
                                                            ))}
                                                        </datalist>
                                                    </>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="position"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Jabatan</FormLabel>
                                                <FormControl>
                                                    <>
                                                        <Input {...field} list="positions-datalist" value={field.value || ''} />
                                                        <datalist id="positions-datalist">
                                                            {existingPositions.map(p => (
                                                                <option key={p} value={p} />
                                                            ))}
                                                        </datalist>
                                                    </>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="joinDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tahun Bergabung</FormLabel>
                                                <FormControl><Input {...field} value={field.value || ''} placeholder="Contoh: 2024" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField control={form.control} name="employmentStatus" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status Kerja</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || "Kontrak"}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Kontrak">Kontrak</SelectItem>
                                                    <SelectItem value="Tetap">Tetap</SelectItem>
                                                    <SelectItem value="Resigned">Resigned</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="shift"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Shift Kerja</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || "-"}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih Shift" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="-">-</SelectItem>
                                                        {shifts.map((s) => (
                                                            <SelectItem key={s.id} value={s.name}>
                                                                {s.name} ({s.checkIn} - {s.checkOut})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="registrationStatus"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status Pendaftaran</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || "approved"}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="approved">Approved</SelectItem>
                                                        <SelectItem value="rejected">Rejected</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg space-y-4 border border-gray-100">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-primary border-b pb-1">Kontak & Dokumen</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nomor HP (WhatsApp)</FormLabel>
                                                <FormControl><Input {...field} value={field.value || ''} placeholder="08xxxxxxxxxx" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl><Input {...field} value={field.value || ''} placeholder="email@gmail.com" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField control={form.control} name="npwp" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>NPWP</FormLabel>
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="00.000.000.0-000.000" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <div className="space-y-2">
                                    <FormLabel className="text-sm font-medium leading-none">Foto NPWP</FormLabel>
                                    <div className="flex items-center gap-3">
                                        <Input type="file" accept="image/*" onChange={(e) => setSelectedNpwpPhoto(e.target.files?.[0] || null)} />
                                        {(selectedEmployee as any)?.npwpPhotoUrl && (
                                            <a href={(selectedEmployee as any).npwpPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline shrink-0">Lihat Foto</a>
                                        )}
                                    </div>
                                </div>
                                <FormField control={form.control} name="bpjs" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>BPJS</FormLabel>
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="Nomor BPJS" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <div className="space-y-2 pb-2">
                                    <FormLabel className="text-sm font-medium leading-none">Foto BPJS</FormLabel>
                                    <div className="flex items-center gap-3">
                                        <Input type="file" accept="image/*" onChange={(e) => setSelectedBpjsPhoto(e.target.files?.[0] || null)} />
                                        {(selectedEmployee as any)?.bpjsPhotoUrl && (
                                            <a href={(selectedEmployee as any).bpjsPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline shrink-0">Lihat Foto</a>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 pb-4">
                                    <FormLabel className="text-sm font-medium leading-none">Foto KTP</FormLabel>
                                    <div className="flex items-center gap-3">
                                        <Input type="file" accept="image/*" onChange={(e) => setSelectedKtpPhoto(e.target.files?.[0] || null)} />
                                        {(selectedEmployee as any)?.ktpPhotoUrl && (
                                            <a href={(selectedEmployee as any).ktpPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline shrink-0">Lihat Foto</a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg h-11" disabled={upsertMutation.isPending}>
                                {upsertMutation.isPending ? "Menyimpan..." : "Simpan Data"}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>`;

            content = content.slice(0, insertPosition) + csvModal + addModal + content.slice(insertPosition);
        }
    }

    // Save file
    fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
    console.log(`Successfully aligned ${filename}`);
}

console.log("ALIGNED ALL ADMIN DASHBOARD PAGES SUCCESSFULLY!");
