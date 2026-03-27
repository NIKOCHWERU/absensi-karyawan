import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Attendance } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CalendarDays, UserPlus, LogOut, FileText, MessageSquare, History, Info, AlertCircle, Image as ImageIcon, DatabaseBackup, Loader2, Upload } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    LabelList,
    ResponsiveContainer as RC
} from 'recharts';
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { format, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { api } from "@shared/routes";
import { LeaveRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
    const [, setLocation] = useLocation();
    const { logout } = useAuth();
    const { toast } = useToast();
    const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);

    const backupMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/admin/backup");
            return await res.json();
        },
        onSuccess: (data: any) => {
            if (data.success) {
                toast({ title: "Backup Selesai", description: data.message });
                window.location.href = `/api/admin/backups/download/${data.fileName}`;
            } else {
                toast({ title: "Gagal Backend", description: data.message, variant: "destructive" });
            }
        },
        onError: (err: any) => {
            toast({ title: "Gagal Backup", description: err.message, variant: "destructive" });
        }
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const importMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/admin/backups/import", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Gagal meng-import database");
            }
            return await res.json();
        },
        onSuccess: (data: any) => {
            toast({ title: "Import Berhasil", description: data.message });
            setTimeout(() => window.location.reload(), 1500);
        },
        onError: (err: any) => {
            toast({ title: "Gagal Import", description: err.message, variant: "destructive" });
        }
    });

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.sql')) {
                toast({ title: "Format Tidak Valid", description: "Pastikan file berformat .sql", variant: "destructive" });
                return;
            }
            if (confirm("Apakah Anda yakin ingin meng-import database ini? Data saat ini mungkin akan tertimpa.")) {
                importMutation.mutate(file);
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const { data: stats } = useQuery<{ totalEmployees: number; presentToday: number }>({
        queryKey: ["/api/admin/stats"],
        refetchInterval: 5000, // Poll every 5 seconds
    });

    const [prevPendingCount, setPrevPendingCount] = useState<number>(0);

    const { data: complaintsStats } = useQuery<{ pendingCount: number }>({
        queryKey: ["/api/admin/complaints/stats"],
        refetchInterval: 5000, // Poll every 5 seconds
    });

    const [prevLeavePendingCount, setPrevLeavePendingCount] = useState<number>(0);

    const { data: leaveRequests } = useQuery<LeaveRequest[]>({
        queryKey: [api.admin.attendance.leave.list.path],
        refetchInterval: 5000,
    });

    // Browser Notification Logic
    useEffect(() => {
        if (complaintsStats && complaintsStats.pendingCount > prevPendingCount) {
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Pengaduan Baru", {
                    body: `Ada ${complaintsStats.pendingCount} pengaduan yang menunggu tanggapan.`,
                    icon: "/logo_elok_buah.jpg"
                });
            }
        }
        setPrevPendingCount(complaintsStats?.pendingCount || 0);
    }, [complaintsStats?.pendingCount]);

    useEffect(() => {
        const pendingLeave = leaveRequests?.filter(r => r.status === 'pending') || [];
        if (pendingLeave.length > prevLeavePendingCount) {
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Pengajuan Cuti Baru", {
                    body: `Ada ${pendingLeave.length} pengajuan cuti yang menunggu persetujuan.`,
                    icon: "/logo_elok_buah.jpg"
                });
            }
        }
        setPrevLeavePendingCount(pendingLeave.length);
    }, [leaveRequests]);

    // Request Permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    const requestNotificationPermission = async () => {
        if ("Notification" in window) {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                toast({
                    title: "Notifikasi Aktif",
                    description: "Anda akan menerima pemberitahuan saat ada pengaduan baru.",
                });
            }
        }
    };

    const { data: attendanceHistory } = useQuery<Attendance[]>({
        queryKey: ["/api/attendance"], // Fetches all history
        refetchInterval: 5000, // Poll every 5 seconds
    });

    const { data: users } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
        refetchInterval: 5000,
    });

    // Recent activities (Live Feed) - Filter today's records and sort by latest action
    const recentActivities = attendanceHistory?.filter(a => {
        const now = new Date();
        return new Date(a.date).toDateString() === now.toDateString();
    }).sort((a, b) => {
        // Find the most recent timestamp among all available fields for record A
        const timesA = [a.checkOut, a.breakEnd, a.breakStart, a.checkIn, a.date]
            .filter(Boolean)
            .map(t => new Date(t!).getTime());
        const lastActionA = Math.max(...timesA);

        // Find the most recent timestamp among all available fields for record B
        const timesB = [b.checkOut, b.breakEnd, b.breakStart, b.checkIn, b.date]
            .filter(Boolean)
            .map(t => new Date(t!).getTime());
        const lastActionB = Math.max(...timesB);

        return lastActionB - lastActionA;
    }).slice(0, 8) || [];

    // Helper to get NIK
    const getUserNik = (userId: number) => {
        const u = users?.find(user => user.id === userId);
        return u?.nik || u?.username || userId;
    }

    const currentDate = new Date("2026-02-08T17:00:00"); // Using the source of truth time approximately for display if needed, but for "Hari ini" use System Date.
    // Actually, standard Date() is fine as long as system time is correct.

    return (
        <div className="w-full flex">
            {/* Sidebar (Simple version for now) */}
            {/* Sidebar replaced */}

            {/* Main Content */}
            <main className="flex-1 md:p-8 p-4 overflow-auto bg-slate-50/50">
                <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-wider">Ringkasan Sistem & Performa</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".sql"
                                onChange={handleFileChange}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 hover:bg-orange-50 rounded-xl font-bold text-xs h-9 px-4"
                                onClick={handleImportClick}
                                disabled={importMutation.isPending}
                            >
                                {importMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-2" />}
                                Import
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:bg-blue-50 rounded-xl font-bold text-xs h-9 px-4"
                                onClick={() => backupMutation.mutate()}
                                disabled={backupMutation.isPending}
                            >
                                {backupMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <DatabaseBackup className="w-3.5 h-3.5 mr-2" />}
                                Backup
                            </Button>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-11 px-5 rounded-2xl border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 shadow-sm font-bold text-sm">
                                    <Info className="w-4 h-4 mr-2" />
                                    Panduan
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] border-none shadow-2xl p-8">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black text-emerald-700 flex items-center gap-3 uppercase tracking-tight">
                                        <div className="p-2 bg-emerald-100 rounded-xl">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        Tata Cara Absensi
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-500 text-lg font-medium">
                                        Panduan langkah-langkah absensi harian karyawan.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4 text-sm text-gray-700">

                                    {/* Tutorial Illustration: App UI Mockup */}
                                    <div className="bg-green-50/50 border border-green-100 rounded-xl p-6 flex flex-col items-center justify-center space-y-4 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                                        <p className="text-sm font-bold text-gray-600 uppercase mb-2">Urutan Tombol Yang Ditekan</p>
                                        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                                            {/* Simulate Check In */}
                                            <div className="bg-white border-2 border-green-500 text-green-700 rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-sm relative">
                                                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">#1</div>
                                                <Clock className="w-6 h-6" />
                                                <span className="font-bold text-xs text-center">Absen Masuk<br /><span className="text-[10px] font-normal text-gray-500">Saat tiba</span></span>
                                            </div>
                                            {/* Simulate Break Start */}
                                            <div className="bg-white border-2 border-orange-400 text-orange-600 rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-sm relative">
                                                <div className="absolute -top-2 -right-2 bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">#2</div>
                                                <CalendarDays className="w-6 h-6" />
                                                <span className="font-bold text-xs text-center">Mulai Istirahat<br /><span className="text-[10px] font-normal text-gray-500">Jam jeda</span></span>
                                            </div>
                                            {/* Simulate Break End */}
                                            <div className="bg-white border-2 border-blue-400 text-blue-600 rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-sm relative">
                                                <div className="absolute -top-2 -right-2 bg-blue-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">#3</div>
                                                <CalendarDays className="w-6 h-6" />
                                                <span className="font-bold text-xs text-center">Selesai Istirahat<br /><span className="text-[10px] font-normal text-gray-500">Kembali kerja</span></span>
                                            </div>
                                            {/* Simulate Check Out */}
                                            <div className="bg-white border-2 border-red-500 text-red-600 rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-sm relative">
                                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">#4</div>
                                                <LogOut className="w-6 h-6" />
                                                <span className="font-bold text-xs text-center">Absen Pulang<br /><span className="text-[10px] font-normal text-gray-500">Selesai kerja</span></span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                                        <h4 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                                            <Clock className="w-5 h-5 text-green-600" />
                                            1. Cara Absen Datang & Pulang
                                        </h4>
                                        <ul className="list-disc list-inside space-y-2 ml-2 text-gray-700 leading-relaxed">
                                            <li><strong className="text-green-700">Saat Datang:</strong> Jangan lupa langsung tekan tombol <strong className="text-green-700 border border-green-200 bg-green-50 px-1 rounded">Absen Masuk (1)</strong> supaya sistem mulai menghitung jam kerja.</li>
                                            <li><strong className="text-red-600">Saat Selesai Kerja:</strong> Wajib menekan tombol <strong className="text-red-600 border border-red-200 bg-red-50 px-1 rounded">Absen Pulang (4)</strong> sebelum meninggalkan tempat kerja.</li>
                                            <li><strong className="text-blue-600">Bisa Absen Masuk Berkali-kali!</strong> Jika hari ini Bapak/Ibu harus keluar dari tempat kerja lalu kembali lagi, silakan <strong className="text-red-500 underline">Absen Pulang</strong> dulu saat pergi, dan <strong className="text-green-600 underline">Absen Masuk</strong> lagi saat sudah kembali. Jam kerja otomatis akan digabungkan.</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-3 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                                        <h4 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                                            <CalendarDays className="w-5 h-5 text-orange-500" />
                                            2. Jika Ada Waktu Istirahat
                                        </h4>
                                        <ul className="list-disc list-inside space-y-2 ml-2 text-gray-700 leading-relaxed">
                                            <li>Jika waktunya istirahat, tekan tombol <strong className="text-orange-600 border border-orange-200 bg-orange-50 px-1 rounded">Mulai Istirahat (2)</strong>. <span className="text-gray-500 italic">(Tidak perlu absen pulang)</span>.</li>
                                            <li><strong className="text-red-600">PENTING:</strong> Setelah selesai istirahat, <strong className="text-red-600 underline">WAJIB</strong> menekan tombol <strong className="text-blue-600 border border-blue-200 bg-blue-50 px-1 rounded">Selesai Istirahat (3)</strong> agar jam kerja Bapak/Ibu kembali dihitung.</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-3 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                                        <h4 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                                            <FileText className="w-5 h-5 text-blue-500" />
                                            3. Jika Sakit, Izin, atau Cuti
                                        </h4>
                                        <ul className="list-disc list-inside space-y-2 ml-2 text-gray-700 leading-relaxed">
                                            <li><strong className="text-blue-700">Sakit:</strong> Harap lapor ke admin atau atasan, dan kirimkan Surat Dokter (jika ada) agar absen Bapak/Ibu ditulis "Sakit" atau "Izin", bukan "Alpha" (Tanpa Keterangan).</li>
                                            <li><strong className="text-purple-700">Pengajuan Cuti:</strong> Silakan ajukan jauh-jauh hari lewat menu "Manajemen Cuti" atau lapor ke Atasan. Jika disetujui, kehadiran hari itu sudah otomatis dihitung Cuti.</li>
                                            <li><strong className="text-orange-700">Izin Keluar Sebentar (Pemat):</strong> Khusus untuk Bapak/Ibu yang harus keluar kantor sebentar di jam kerja, harap hubungi Admin agar dibuatkan Surat Izin Keluar sementara. Waktu Bapak/Ibu keluar akan otomatis dipotong tanpa menghapus absensi harian.</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-3 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                                        <h4 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                            4. Catatan Penting
                                        </h4>
                                        <ul className="list-disc list-inside space-y-2 ml-2 text-gray-700 leading-relaxed">
                                            <li>Pastikan lokasi HP/Komputer (*GPS*) Bapak/Ibu sudah <strong>menyala</strong> saat memencet tombol absensi.</li>
                                            <li>Apabila Bapak/Ibu lupa absen atau ada masalah teknis (misal sinyal jelek), harap <strong>SEGERA LAPOR</strong> ke Admin agar dibantu absensinya hari itu. Jangan sampai statusnya Alpha.</li>
                                            <li>Selalu cek <strong>"Riwayat Absensi"</strong> untuk memastikan absen hari itu sukses tersimpan.</li>
                                        </ul>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 text-orange-800 text-sm flex items-start gap-3 mt-6 shadow-sm">
                                        <Info className="w-5 h-5 shrink-0 mt-0.5 text-orange-500 font-bold" />
                                        <p className="leading-relaxed">
                                            <strong>Catatan untuk Admin:</strong> Ini adalah contoh pop-up panduan tata cara absensi. Nantinya, panduan ini akan dapat dimunculkan pula di aplikasi untuk <strong>Karyawan (User)</strong> agar mereka bisa memahami tata cara absensi sistem yang tepat.
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter className="pt-2">
                                    <DialogClose asChild>
                                        <Button className="bg-green-600 hover:bg-green-700 text-white font-bold px-8">Mengerti</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <div className="text-sm text-gray-500 font-medium capitalize hidden md:block">
                            {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <Card
                        className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-[2rem] overflow-hidden group cursor-pointer hover:translate-y-[-4px]"
                        onClick={() => setLocation("/admin/employees")}
                    >
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Karyawan</p>
                                    <h3 className="text-5xl font-black text-slate-800 tracking-tighter">{stats?.totalEmployees || 0}</h3>
                                    <p className="text-xs text-emerald-600 font-bold mt-2">Aktif di Sistem</p>
                                </div>
                                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                    <Users className="h-7 w-7" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-[2rem] overflow-hidden group cursor-pointer hover:translate-y-[-4px]"
                        onClick={() => setLocation("/admin/recap")}
                    >
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hadir Hari Ini</p>
                                    <h3 className="text-5xl font-black text-slate-800 tracking-tighter">{stats?.presentToday || 0}</h3>
                                    <p className="text-xs text-blue-600 font-bold mt-2">Update Terkini</p>
                                </div>
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <Clock className="h-7 w-7" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-[2rem] overflow-hidden group cursor-pointer hover:translate-y-[-4px]"
                        onClick={() => setLocation("/admin/attendance-summary")}
                    >
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Izin / Sakit</p>
                                    <h3 className="text-5xl font-black text-slate-800 tracking-tighter">
                                        {(() => {
                                            const now = new Date();
                                            const isToday = (date: any) => new Date(date).toDateString() === now.toDateString();
                                            return attendanceHistory?.filter(a => isToday(a.date) && ['sick', 'permission'].includes(a.status || '')).length || 0;
                                        })()}
                                    </h3>
                                    <p className="text-xs text-amber-600 font-bold mt-2">Butuh Lampiran</p>
                                </div>
                                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                                    <CalendarDays className="h-7 w-7" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-[2rem] overflow-hidden group cursor-pointer hover:translate-y-[-4px]"
                        onClick={() => setLocation("/admin/leave")}
                    >
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cuti Menunggu</p>
                                    <h3 className="text-5xl font-black text-rose-600 tracking-tighter">
                                        {leaveRequests?.filter(r => r.status === 'pending').length || 0}
                                    </h3>
                                    <p className="text-xs text-rose-500 font-bold mt-2">Perlu Persetujuan</p>
                                </div>
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                                    <CalendarDays className="h-7 w-7" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Weekly Trend Chart */}
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-gray-800">Tren Kehadiran (7 Hari Terakhir)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={(() => {
                                            // Generate last 7 days including today
                                            const days = Array.from({ length: 7 }, (_, i) => {
                                                const d = new Date();
                                                d.setDate(d.getDate() - (6 - i));
                                                return d;
                                            });

                                            return days.map(day => {
                                                const dateStr = day.toISOString().split('T')[0];
                                                // Filter history for this day
                                                const dailyRecs = attendanceHistory?.filter(a => String(a.date).startsWith(dateStr)) || [];

                                                return {
                                                    name: format(day, "d MMM", { locale: id }),
                                                    Hadir: dailyRecs.filter(a => a.status === 'present').length,
                                                    Telat: dailyRecs.filter(a => a.status === 'late').length,
                                                    Izin: dailyRecs.filter(a => a.status && ['sick', 'permission'].includes(a.status)).length
                                                };
                                            });
                                        })()}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#F3F4F6' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            align="right"
                                            iconType="circle"
                                            wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600 }}
                                        />
                                        <Bar dataKey="Hadir" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} activeBar={{ fill: '#059669' }}>
                                            <LabelList dataKey="Hadir" position="top" style={{ fill: '#10b981', fontSize: '10px', fontWeight: 'bold' }} />
                                        </Bar>
                                        <Bar dataKey="Telat" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} activeBar={{ fill: '#d97706' }}>
                                            <LabelList dataKey="Telat" position="top" style={{ fill: '#f59e0b', fontSize: '10px', fontWeight: 'bold' }} />
                                        </Bar>
                                        <Bar dataKey="Izin" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} activeBar={{ fill: '#2563eb' }}>
                                            <LabelList dataKey="Izin" position="top" style={{ fill: '#3b82f6', fontSize: '10px', fontWeight: 'bold' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Daily Composition Chart */}
                    <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl overflow-hidden">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-bold text-gray-800">Komposisi Kehadiran Hari Ini</CardTitle>
                                <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
                                    {(() => {
                                        const now = new Date();
                                        const isToday = (date: any) => new Date(date).toDateString() === now.toDateString();
                                        const todayRecs = attendanceHistory?.filter(a => isToday(a.date)) || [];
                                        const totalEmps = stats?.totalEmployees || 0;
                                        return Math.max(0, totalEmps - todayRecs.length);
                                    })()} Belum Absen
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={(() => {
                                                const now = new Date();
                                                const isToday = (date: any) => new Date(date).toDateString() === now.toDateString();
                                                const todayRecs = attendanceHistory?.filter(a => isToday(a.date)) || [];
                                                const totalEmps = stats?.totalEmployees || 0;

                                                const present = todayRecs.filter(a => a.status === 'present').length;
                                                const late = todayRecs.filter(a => a.status === 'late').length;
                                                const permission = todayRecs.filter(a => a.status && ['sick', 'permission'].includes(a.status)).length;
                                                const recordedCount = todayRecs.length;
                                                const absent = Math.max(0, totalEmps - recordedCount);

                                                return [
                                                    { name: 'Hadir', value: present, color: '#10b981' },
                                                    { name: 'Telat', value: late, color: '#f59e0b' },
                                                    { name: 'Izin', value: permission, color: '#3b82f6' },
                                                    { name: 'Belum', value: absent, color: '#e5e7eb' },
                                                ].filter(d => d.value > 0);
                                            })()}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {(() => {
                                                const now = new Date();
                                                const isToday = (date: any) => new Date(date).toDateString() === now.toDateString();
                                                const todayRecs = attendanceHistory?.filter(a => isToday(a.date)) || [];
                                                const totalEmps = stats?.totalEmployees || 0;

                                                const present = todayRecs.filter(a => a.status === 'present').length;
                                                const late = todayRecs.filter(a => a.status === 'late').length;
                                                const permission = todayRecs.filter(a => a.status && ['sick', 'permission'].includes(a.status)).length;
                                                const recordedCount = todayRecs.length;
                                                const absent = Math.max(0, totalEmps - recordedCount);

                                                return [
                                                    { name: 'Hadir', value: present, color: '#10b981' },
                                                    { name: 'Telat', value: late, color: '#f59e0b' },
                                                    { name: 'Izin', value: permission, color: '#3b82f6' },
                                                    { name: 'Belum', value: absent, color: '#e5e7eb' },
                                                ].filter(d => d.value > 0);
                                            })().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                                                            <p className="font-bold text-gray-800 mb-1">{data.name}</p>
                                                            <p className="text-sm">
                                                                <span className="font-semibold" style={{ color: data.color }}>
                                                                    {data.value}
                                                                </span> Karyawan
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Live Feed and Absence List */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="border-none shadow-sm bg-white rounded-[2rem] lg:col-span-2 overflow-hidden shadow-slate-200/50">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Live Absensi Terbaru</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-slate-800 text-white">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-700/50">Waktu</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-slate-700/50">Karyawan</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center border-r border-slate-700/50">Masuk</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center border-r border-slate-700/50">Pulang</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {recentActivities.map((record) => (
                                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-5 border-r border-slate-50">
                                                    <div className="text-[11px] font-black text-slate-900 uppercase">
                                                        {format(new Date(record.date), 'EEEE', { locale: id })}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold">{format(new Date(record.date), 'd MMM yyyy')}</div>
                                                </td>
                                                <td className="px-6 py-5 border-r border-slate-50">
                                                    <div className="font-bold text-slate-800 text-sm leading-none">{users?.find(u => u.id === record.userId)?.fullName || '-'}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter">NIK: {getUserNik(record.userId)}</div>
                                                </td>
                                                <td className="px-6 py-5 text-center border-r border-slate-50">
                                                    <div className="text-[13px] font-black text-emerald-600 font-mono">
                                                        {record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center border-r border-slate-50">
                                                    <div className="text-[13px] font-black text-rose-600 font-mono">
                                                        {record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider
                                                ${record.status === 'present' ? 'bg-emerald-500 text-white' :
                                                             record.status === 'late' ? 'bg-rose-500 text-white' :
                                                                 record.status === 'sick' ? 'bg-blue-500 text-white' :
                                                                     record.status === 'permission' ? 'bg-purple-500 text-white' :
                                                                         'bg-slate-200 text-slate-600'}`}>
                                                        {record.status === 'present' ? 'Hadir' :
                                                            record.status === 'late' ? 'Telat' :
                                                                record.status === 'sick' ? 'Sakit' :
                                                                    record.status === 'permission' ? 'Izin' :
                                                                        record.status === 'absent' ? 'Alpha' : record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {recentActivities.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold text-sm bg-white">
                                                    Belum ada aktivitas absensi hari ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Who Didn't Clock In */}
                    <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden shadow-slate-200/50">
                        <CardHeader className="p-8 pb-4 flex flex-col space-y-4">
                            <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Belum Absen</CardTitle>
                            <Input
                                type="date"
                                value={absenceDate}
                                onChange={(e) => setAbsenceDate(e.target.value)}
                                className="h-10 text-xs rounded-xl bg-slate-50 border-none font-bold text-slate-600 focus:ring-2 focus:ring-blue-500"
                            />
                        </CardHeader>
                        <CardContent className="p-8 pt-2">
                            <div className="space-y-3 max-h-[380px] overflow-auto pr-2 custom-scrollbar">
                                {(() => {
                                    const employees = users?.filter(u => u.role === 'employee') || [];
                                    const dateRecords = attendanceHistory?.filter(a => format(new Date(a.date), 'yyyy-MM-dd') === absenceDate) || [];
                                    const absentEmployees = employees.filter(emp => !dateRecords.some(att => att.userId === emp.id));

                                    if (absentEmployees.length === 0) {
                                        return (
                                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-3 text-2xl font-black">✓</div>
                                                <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Semua sudah absen</p>
                                            </div>
                                        );
                                    }

                                    return absentEmployees.map(emp => (
                                        <div key={emp.id} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-rose-50 hover:border-rose-100 transition-all duration-300">
                                            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-rose-500 group-hover:text-white transition-all">
                                                {emp.fullName.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-slate-800 text-sm truncate">{emp.fullName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight group-hover:text-rose-400">NIK: {emp.nik || emp.username}</p>
                                            </div>
                                            <div className="text-[8px] font-black text-rose-500 bg-rose-100 px-2 py-1 rounded-lg uppercase tracking-widest hidden group-hover:block">Alpha</div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Leave Requests Card */}
                <div className="mt-8">
                    <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden shadow-slate-200/50">
                        <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Pengajuan Cuti Terbaru</CardTitle>
                            <Button variant="ghost" size="sm" className="text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-50 rounded-xl px-4" onClick={() => setLocation("/admin/leave")}>
                                Lihat Semua
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {leaveRequests?.slice(0, 3).map((req) => (
                                    <div key={req.id} className="p-5 rounded-[2rem] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 transition-all duration-300 cursor-pointer group" onClick={() => setLocation("/admin/leave")}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {getUserNik(req.userId).toString().charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 truncate max-w-[120px]">{users?.find(u => u.id === req.userId)?.fullName || 'User'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">NIK: {getUserNik(req.userId)}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border 
                                                ${req.status === 'approved' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                                    req.status === 'rejected' ? 'text-rose-600 bg-rose-50 border-rose-100' :
                                                        req.status === 'cancelled' ? 'text-slate-500 bg-slate-50 border-slate-100' :
                                                            'text-amber-600 bg-amber-50 border-amber-100'}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                                <CalendarDays className="w-3.5 h-3.5 text-slate-300" />
                                                {req.selectedDates ? "Beberapa Tanggal" : "Rentang Waktu"}
                                            </div>
                                            <p className="text-sm font-black text-slate-700">
                                                {format(new Date(req.startDate), "d MMM")} - {format(new Date(req.endDate), "d MMM yyyy")}
                                            </p>
                                        </div>
                                        <div className="mt-4 p-3 bg-white rounded-2xl border border-slate-100/50 text-xs text-slate-500 italic line-clamp-2 leading-relaxed">
                                            "{req.reason}"
                                        </div>
                                    </div>
                                ))}
                                {(!leaveRequests || leaveRequests.length === 0) && (
                                    <div className="col-span-full py-16 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                                            <FileText className="w-8 h-8" />
                                        </div>
                                        <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">Belum ada pengajuan cuti</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </main>
        </div>
    );
}
