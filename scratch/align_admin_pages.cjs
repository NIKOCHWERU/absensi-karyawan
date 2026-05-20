const fs = require('fs');
const path = require('path');

const adminPagesDir = path.join(__dirname, '..', 'client', 'src', 'pages', 'admin');

const pageConfigs = {
    'AdminLeavePage.tsx': {
        title: 'Manajemen Permohonan Cuti',
        desc: 'Verifikasi dan kelola persetujuan cuti sakit, tahunan, dan cuti melahirkan karyawan.'
    },
    'AdminLeaveHistoryPage.tsx': {
        title: 'Riwayat Permohonan Cuti',
        desc: 'Daftar arsip dan riwayat persetujuan cuti seluruh karyawan.'
    },
    'AttendanceHistoryPage.tsx': {
        title: 'Riwayat Absensi Karyawan',
        desc: 'Pantau waktu masuk, pulang, status keterlambatan, dan log GPS presensi karyawan.'
    },
    'AttendanceSummaryPage.tsx': {
        title: 'Ringkasan Absensi',
        desc: 'Analisis statistik kehadiran, tingkat keterlambatan, dan keaktifan presensi karyawan.'
    },
    'ComplaintsPage.tsx': {
        title: 'Pengaduan & Kritik Karyawan',
        desc: 'Respon dan tindak lanjuti kritik, saran, serta keluhan dari karyawan secara cepat.'
    },
    'InfoBoardPage.tsx': {
        title: 'Papan Informasi',
        desc: 'Publikasikan pengumuman penting, memo perusahaan, dan kebijakan baru bagi seluruh karyawan.'
    },
    'RecapPage.tsx': {
        title: 'Rekap Kehadiran Karyawan',
        desc: 'Ekspor laporan rekap kehadiran bulanan dan mingguan secara lengkap untuk penggajian.'
    },
    'AdminShiftPage.tsx': {
        title: 'Kelola Jadwal Shift Kerja',
        desc: 'Atur jam kerja masuk, pulang, toleransi keterlambatan, dan alokasi shift karyawan.'
    },
    'AdminVerificationPage.tsx': {
        title: 'Verifikasi Wajah Karyawan',
        desc: 'Daftarkan dan validasi biometrik wajah karyawan untuk sistem presensi anti-fraud.'
    },
    'AdminManageAdminsPage.tsx': {
        title: 'Manajemen Admin',
        desc: 'Kelola hak akses administrator sistem, superadmin, dan otorisasi manajemen.'
    },
    'EmployeeListPage.tsx': {
        title: 'Daftar Karyawan',
        desc: 'Kelola informasi data diri, shift kerja, dan status verifikasi karyawan.'
    }
};

for (const [filename, config] of Object.entries(pageConfigs)) {
    const filePath = path.join(adminPagesDir, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filename}`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');

    // Replace the opening div with min-h-screen/flex-col & header
    // We want to transform the return statement:
    // From:
    // return (
    //     <div className="min-h-screen bg-gray-50...">
    //         <header ...>
    //             ...
    //         </header>
    //         <main className="p-8...">
    //
    // To:
    // return (
    //     <div className="space-y-6">
    //         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    //             <div>
    //                 <h1 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h1>
    //                 <p className="text-sm text-gray-500">{desc}</p>
    //             </div>
    //             {additionalButtons}
    //         </div>
    
    // Let's do a simple parsing based on the page patterns
    const returnIndex = content.indexOf('return (');
    if (returnIndex === -1) {
        console.log(`Could not find return statement in ${filename}`);
        continue;
    }

    // Identify header block and replacement strategy
    // Let's do it cleanly for each page since their headers might contain different buttons/controls
    if (filename === 'AdminLeavePage.tsx') {
        const targetSearch = `    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 p-4 px-8 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">Manajemen Cuti</h1>
                </div>
            </header>

            <main className="p-8">`;
        
        const targetReplace = `    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">${config.title}</h1>
                    <p className="text-sm text-gray-500">${config.desc}</p>
                </div>
                <div>
                    <Button
                        variant="outline"
                        className="rounded-lg gap-2 cursor-pointer bg-white"
                        onClick={() => setLocation("/admin/leave-history")}
                    >
                        <Calendar className="w-4 h-4" />
                        Lihat Riwayat Cuti
                    </Button>
                </div>
            </div>

            <div className="space-y-6">`;
        
        // Find closing div/main at the end of the file
        content = content.replace(targetSearch, targetReplace);
        // Replace closing tag at the end of file:
        // </main>
        // </div>
        content = content.replace('            </main>\n        </div>', '            </div>\n        </div>');
    }

    else if (filename === 'AdminLeaveHistoryPage.tsx') {
        const targetSearch = `    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 p-4 px-8 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/leave")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">Riwayat Cuti Karyawan</h1>
                </div>
            </header>

            <main className="p-8">`;

        const targetReplace = `    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">${config.title}</h1>
                    <p className="text-sm text-gray-500">${config.desc}</p>
                </div>
                <div>
                    <Button
                        variant="outline"
                        className="rounded-lg gap-2 cursor-pointer bg-white"
                        onClick={() => setLocation("/admin/leave")}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </Button>
                </div>
            </div>

            <div className="space-y-6">`;

        content = content.replace(targetSearch, targetReplace);
        content = content.replace('            </main>\n        </div>', '            </div>\n        </div>');
    }

    else if (filename === 'AttendanceHistoryPage.tsx') {
        const targetSearch = `    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 p-4 px-8 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">Riwayat Absensi</h1>
                </div>
            </header>

            <main className="p-8 flex-1">`;

        const targetReplace = `    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">${config.title}</h1>
                    <p className="text-sm text-gray-500">${config.desc}</p>
                </div>
                <div>
                    <Button
                        variant="outline"
                        className="rounded-lg gap-2 cursor-pointer bg-white"
                        onClick={() => setLocation("/admin/recap")}
                    >
                        Lihat Rekap Absen
                    </Button>
                </div>
            </div>

            <div className="space-y-6">`;

        content = content.replace(targetSearch, targetReplace);
        content = content.replace('            </main>\n        </div>', '            </div>\n        </div>');
    }

    else if (filename === 'AttendanceSummaryPage.tsx') {
        const targetSearch = `    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 p-4 px-8 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">Ringkasan Absensi</h1>
                </div>
            </header>

            <main className="p-8 flex-1 max-w-7xl mx-auto w-full">`;

        const targetReplace = `    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">${config.title}</h1>
                    <p className="text-sm text-gray-500">${config.desc}</p>
                </div>
            </div>

            <div className="space-y-6">`;

        content = content.replace(targetSearch, targetReplace);
        content = content.replace('            </main>\n        </div>', '            </div>\n        </div>');
    }

    else if (filename === 'ComplaintsPage.tsx') {
        const targetSearch = `    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 p-4 px-8 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/users")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">Pengaduan Karyawan</h1>
                </div>
            </header>

            <main className="p-8 flex-1 max-w-5xl mx-auto w-full">`;

        const targetReplace = `    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">${config.title}</h1>
                    <p className="text-sm text-gray-500">${config.desc}</p>
                </div>
            </div>

            <div className="space-y-6">`;

        content = content.replace(targetSearch, targetReplace);
        content = content.replace('            </main>\n        </div>', '            </div>\n        </div>');
    }

    else if (filename === 'InfoBoardPage.tsx') {
        const targetSearch = `    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Dialog open={!!fullscreenImage} onOpenChange={(open) => !open && setFullscreenImage(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-1 bg-transparent border-none shadow-none flex items-center justify-center">
                    <DialogTitle className="sr-only">Lihat Gambar</DialogTitle>
                    <DialogDescription className="sr-only">Tampilan penuh gambar pengumuman</DialogDescription>
                    {fullscreenImage && (
                        <img
                            src={fullscreenImage}
                            alt="Full Size"
                            className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                    )}
                </DialogContent>
            </Dialog>
            <header className="bg-white border-b border-gray-200 p-4 px-8 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">Papan Informasi</h1>
                </div>
                <Dialog open={open} onOpenChange={handleCloseModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Informasi
                        </Button>
                    </DialogTrigger>
...
            </header>

            <main className="p-8 flex-1 max-w-5xl mx-auto w-full">`;

        // Let's do a simple manual replace of the header tag for InfoBoardPage since it has Dialog embedded
        const oldHeaderSection = `            <header className="bg-white border-b border-gray-200 p-4 px-8 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">Papan Informasi</h1>
                </div>
                <Dialog open={open} onOpenChange={handleCloseModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Informasi
                        </Button>
                    </DialogTrigger>`;

        const newHeaderSection = `            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Papan Informasi</h1>
                    <p className="text-sm text-gray-500">Publikasikan pengumuman penting, memo perusahaan, dan kebijakan baru.</p>
                </div>
                <Dialog open={open} onOpenChange={handleCloseModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700 text-white rounded-lg gap-2 shadow-sm">
                            <Plus className="w-4 h-4" />
                            Tambah Informasi
                        </Button>
                    </DialogTrigger>`;

        content = content.replace(oldHeaderSection, newHeaderSection);
        content = content.replace(`            </header>\n\n            <main className="p-8 flex-1 max-w-5xl mx-auto w-full">`, `            </Dialog>\n            </div>\n\n            <div className="space-y-6">`);
        content = content.replace('            </main>\n        </div>', '            </div>\n        </div>');
    }

    else if (filename === 'RecapPage.tsx') {
        const targetSearch = `    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 p-4 px-8 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">Rekap Absensi</h1>
                </div>
            </header>

            <main className="p-8 flex-1">`;

        const targetReplace = `    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">${config.title}</h1>
                    <p className="text-sm text-gray-500">${config.desc}</p>
                </div>
            </div>

            <div className="space-y-6">`;

        content = content.replace(targetSearch, targetReplace);
        content = content.replace('            </main>\n        </div>', '            </div>\n        </div>');
    }

    else if (filename === 'AdminShiftPage.tsx') {
        const targetSearch = `    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 p-4 px-8 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">Kelola Shift Kerja</h1>
                </div>
            </header>

            <main className="p-8 flex-1 max-w-4xl mx-auto w-full">`;

        const targetReplace = `    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">${config.title}</h1>
                    <p className="text-sm text-gray-500">${config.desc}</p>
                </div>
            </div>

            <div className="space-y-6">`;

        content = content.replace(targetSearch, targetReplace);
        content = content.replace('            </main>\n        </div>', '            </div>\n        </div>');
    }

    else if (filename === 'AdminVerificationPage.tsx') {
        const targetSearch = `    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 p-4 px-8 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">Verifikasi Pendaftaran</h1>
                </div>
            </header>

            <main className="p-8 flex-1 max-w-5xl mx-auto w-full">`;

        const targetReplace = `    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">${config.title}</h1>
                    <p className="text-sm text-gray-500">${config.desc}</p>
                </div>
            </div>

            <div className="space-y-6">`;

        content = content.replace(targetSearch, targetReplace);
        content = content.replace('            </main>\n        </div>', '            </div>\n        </div>');
    }

    else if (filename === 'AdminManageAdminsPage.tsx') {
        const targetSearch = `    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 p-4 px-8 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">Manajemen Admin</h1>
                </div>
            </header>

            <main className="p-8 flex-1 max-w-4xl mx-auto w-full">`;

        const targetReplace = `    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">${config.title}</h1>
                    <p className="text-sm text-gray-500">${config.desc}</p>
                </div>
            </div>

            <div className="space-y-6">`;

        content = content.replace(targetSearch, targetReplace);
        content = content.replace('            </main>\n        </div>', '            </div>\n        </div>');
    }

    else if (filename === 'EmployeeListPage.tsx') {
        const targetSearch = `    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 p-4 px-8 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold text-gray-800">Daftar Karyawan</h1>
                    <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-green-600 hover:bg-green-50" onClick={() => setLocation("/admin/complaints")}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Pengaduan Karyawan
                        {complaintsStats && complaintsStats.pendingCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {complaintsStats.pendingCount}
                            </span>
                        )}
                    </Button>
                </div>
                <div className="flex items-center gap-2">`;

        const targetReplace = `    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">${config.title}</h1>
                    <p className="text-sm text-gray-500">${config.desc}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">`;

        content = content.replace(targetSearch, targetReplace);
        // Replace header closing and main start
        content = content.replace(`                </div>
            </header>

            <main className="p-8 flex-1">`, `                </div>\n            </div>\n\n            <div className="space-y-6">`);
        content = content.replace('            </main>\n        </div>', '            </div>\n        </div>');
    }

    // Now, replace any instances of 'rounded-2xl' or 'rounded-3xl' on pages to corporate 'rounded-xl' or 'rounded-lg'
    content = content.replace(/rounded-3xl/g, 'rounded-xl');
    content = content.replace(/rounded-2xl/g, 'rounded-xl');
    
    // Save file
    fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
    console.log(`Successfully aligned ${filename}`);
}

console.log("ALIGNED ALL ADMIN DASHBOARD PAGES SUCCESSFULLY!");
