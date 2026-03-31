import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Attendance } from "@shared/schema";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { format, addDays, subDays } from "date-fns";
import { id } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronLeft, ChevronRight, History, FileText, Printer, X, Search, AlertTriangle, Info } from "lucide-react";
import { AttendanceReport } from "@/components/AttendanceReport";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// Helper: resolve photo URL — handles both local uploads and Google Drive File IDs
function getPhotoUrl(value: string | null): string {
    if (!value) return '';
    // Base64 data URI
    if (value.startsWith('data:')) return value;
    // Full URL
    if (value.startsWith('http')) return value;
    // Google Drive File ID: no dots, no slashes, length > 20 — use server proxy to avoid CORS/auth issues
    if (!value.includes('/') && !value.includes('.') && value.length > 20) {
        return `/api/images/${value}`;
    }
    // Local file
    return `/uploads/${value}`;
}

export default function AttendanceHistoryPage() {
    const [, setLocation] = useLocation();
    const { logout } = useAuth();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const { data: attendanceHistory, isLoading: isLoadingAttendance } = useQuery<Attendance[]>({
        queryKey: ["/api/attendance"],
        refetchInterval: 5000,
    });

    const { data: users = [] } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
        refetchInterval: 5000,
    });

    const [showReport, setShowReport] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter by selected date & search query
    const filteredRecords = attendanceHistory?.filter(a => {
        const isSameDate = format(new Date(a.date), 'yyyy-MM-dd') === selectedDate;
        if (!isSameDate) return false;
        
        if (!searchQuery.trim()) return true;
        
        const emp = users?.find(u => u.id === a.userId);
        const searchLower = searchQuery.toLowerCase();
        
        return (
            emp?.fullName?.toLowerCase().includes(searchLower) ||
            emp?.nik?.toLowerCase().includes(searchLower) ||
            emp?.username?.toLowerCase().includes(searchLower)
        );
    }) || [];

    // Helper to get Employee Data
    const getEmployee = (userId: number) => {
        return users?.find(user => user.id === userId);
    };

    // Helper to extract File ID from Google Drive URL and generate a View Link
    const getDriveViewLink = (url: string | null) => {
        if (!url) return null;
        if (url.includes('drive.google.com')) return url;
        if (!url.includes('/') && url.length > 15) {
            return `https://drive.google.com/file/d/${url}/view`;
        }
        return getPhotoUrl(url); // Fallback to photo URL to view in new tab
    };

    const handlePrev = () => {
        setSelectedDate(prev => format(subDays(new Date(prev), 1), 'yyyy-MM-dd'));
    };

    const handleNext = () => {
        setSelectedDate(prev => format(addDays(new Date(prev), 1), 'yyyy-MM-dd'));
    };


    const PhotoThumbnail = ({ url, label, location }: { url: string | null, label: string, location?: string | null }) => {
        if (!url) return null;

        const isDriveId = !url.includes('/') && url.length > 15;
        // In Drive V3, we can often view thumbnail with a special URL, but for reliability, we'll just show an icon
        // Or if it's a relative URL, we can show the image tag.

        const viewLink = getDriveViewLink(url);

        return (
            <div className="flex flex-col items-center gap-1 p-2 border border-gray-100 rounded-lg bg-gray-50/50">
                <p className="text-[10px] font-bold text-gray-500">{label}</p>
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 border border-gray-300 flex items-center justify-center relative group">
                    <img src={getPhotoUrl(url)} alt={label} className="w-full h-full object-cover" />
                    <a
                        href={viewLink || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold"
                    >
                        Lihat<br />File
                    </a>
                </div>
                {location && (
                    <div className="flex items-center gap-0.5 text-[9px] text-gray-400 max-w-[70px] mt-1" title={location}>
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{location}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full flex">
            {/* Main Content */}
            <main className="flex-1 w-full p-4 md:p-8 overflow-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-800">Riwayat Absensi & Foto</h2>
                        <p className="text-sm text-gray-500">Lihat detail waktu, status, foto bukti absensi, dan cetak laporan.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
                        <div className="flex items-center bg-white border rounded-md shadow-sm">
                            <span className="px-3 py-1.5 text-sm font-medium border-r bg-gray-50/50 text-gray-600">Harian</span>
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8 rounded-none">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-bold min-w-[110px] text-center text-gray-800">
                                    {format(new Date(selectedDate), "d MMM yyyy", { locale: id })}
                                </span>
                                <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8 rounded-none">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                    <div className="flex items-center gap-2">
                        <Dialog open={showReport} onOpenChange={setShowReport}>
                            <DialogTrigger asChild>
                                <Button 
                                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                    onClick={() => setShowReport(true)}
                                    disabled={filteredRecords.length === 0}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Export Laporan Foto
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 border-none bg-gray-100">
                                <div className="sticky top-0 z-50 bg-white border-b p-4 flex justify-between items-center shadow-sm no-print">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        <Printer className="h-5 w-5 text-green-600" />
                                        Pratinjau Laporan
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            onClick={() => window.print()} 
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Printer className="mr-2 h-4 w-4" />
                                            Cetak / Simpan PDF
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => setShowReport(false)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-4 md:p-8 flex justify-center bg-gray-100 min-h-screen">
                                    <div className="shadow-2xl w-full max-w-[210mm] bg-white rounded-lg overflow-hidden">
                                        <AttendanceReport 
                                            date={selectedDate} 
                                            records={filteredRecords} 
                                            users={users} 
                                        />
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    </div>
                </header>

                <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-white border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 px-6">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <CardTitle className="text-sm font-medium text-gray-600 mt-1.5 whitespace-nowrap">
                                Data Periode: {format(new Date(selectedDate), 'd MMM yyyy', { locale: id })} - {format(new Date(selectedDate), 'd MMM yyyy', { locale: id })}
                            </CardTitle>
                            <div className="relative flex-1 min-w-[200px] max-w-xs hidden md:block">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input 
                                    placeholder="Cari Nama Karyawan..." 
                                    className="pl-8 h-8 text-sm bg-gray-50 border-gray-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-2">
                             <div className="md:hidden relative flex-1 mr-2">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input 
                                    placeholder="Cari..." 
                                    className="pl-8 h-8 text-sm bg-gray-50 border-gray-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="text-[11px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 shrink-0">
                                {filteredRecords.length} Data Absensi
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoadingAttendance ? (
                            <div className="p-16 text-center text-gray-400">Memuat data absensi...</div>
                        ) : filteredRecords.length === 0 ? (
                            <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-200">
                                    <Search className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="font-medium text-gray-500">Tidak ada data ditemukan</p>
                                <p className="text-sm mt-1">Coba sesuaikan tanggal atau kata kunci pencarian.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white border-b-2 border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 w-32">Tanggal</th>
                                            <th className="px-6 py-4">Nama Karyawan</th>
                                            <th className="px-6 py-4 text-center">Waktu Absen</th>
                                            <th className="px-6 py-4 text-center">Foto Bukti</th>
                                            <th className="px-6 py-4">Status & Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {filteredRecords.map((record) => {
                                            const emp = getEmployee(record.userId);
                                            const isComplete = record.checkIn && record.checkOut && (!record.breakStart || (record.breakStart && record.breakEnd));
                                            
                                            // Handle fake GPS warning
                                            const showGpsWarning = record.isFakeGps;

                                            // Helper to toTitleCase (if not available globally)
                                            const toTitleCase = (str: string | undefined | null) => {
                                                if (!str) return '-';
                                                return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                            };

                                            return (
                                                <tr key={record.id} className="hover:bg-gray-50/30 transition-colors group">
                                                    <td className="px-6 py-6 align-top">
                                                        <span className="text-[11px] font-bold text-gray-500">
                                                            {format(new Date(record.date), 'dd/MM/yyyy')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 align-top">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs shrink-0 mt-0.5 border border-green-200 shadow-sm">
                                                                {emp?.fullName?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="font-bold text-gray-900">{toTitleCase(emp?.fullName) || 'Unknown'}</p>
                                                                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border font-semibold">
                                                                        Sesi {(record as any).sessionNumber || 1}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 font-mono tracking-wider">{emp?.nik || emp?.username}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 align-top">
                                                        <div className="flex flex-col gap-1 text-[10px] font-mono tracking-wide mx-auto w-32">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-400">Masuk:</span>
                                                                <span className="font-bold text-green-600">{record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-400">Istirahat:</span>
                                                                <span className="font-bold text-orange-400">{record.breakStart ? format(new Date(record.breakStart), 'HH:mm') : '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-400">Selesai:</span>
                                                                <span className="font-bold text-blue-500">{record.breakEnd ? format(new Date(record.breakEnd), 'HH:mm') : '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-400">Pulang:</span>
                                                                <span className="font-bold text-red-500">{record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '-'}</span>
                                                            </div>
                                                        </div>
                                                        {!isComplete && (
                                                            <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex flex-col items-center">
                                                                <span className="text-[10px] font-bold text-gray-800 mb-1 leading-none">Absensi Tidak Lengkap</span>
                                                                <div className="flex items-center gap-1 text-[9px] text-gray-400">
                                                                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                                                                    <span className="truncate max-w-[120px]" title={record.checkInLocation || ''}>
                                                                        {record.checkInLocation || 'Lokasi tidak tersedia'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-6 align-top">
                                                        <div className="flex justify-center gap-2 flex-wrap max-w-[200px] mx-auto">
                                                            <PhotoThumbnail url={record.checkInPhoto} label="Masuk" />
                                                            <PhotoThumbnail url={record.breakStartPhoto} label="Istirahat" />
                                                            <PhotoThumbnail url={record.breakEndPhoto} label="Selesai" />
                                                            <PhotoThumbnail url={record.checkOutPhoto} label="Pulang" />
                                                            
                                                            {!record.checkInPhoto && !record.checkOutPhoto && !record.breakStartPhoto && !record.breakEndPhoto && (
                                                                <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-200 rounded-lg bg-gray-50/50 w-full">
                                                                    <Info className="w-4 h-4 text-gray-300 mb-1" />
                                                                    <span className="text-[10px] text-gray-400 font-medium">Belum ada foto</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 align-top">
                                                        <div className="flex flex-col gap-3 items-start max-w-[220px]">
                                                            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest shadow-sm
                                                                ${record.status === 'present' ? 'bg-green-100 text-green-700' :
                                                                    record.status === 'late' ? 'bg-orange-100 text-orange-700' :
                                                                        record.status === 'sick' ? 'bg-blue-100 text-blue-700' :
                                                                            record.status === 'permission' ? 'bg-purple-100 text-purple-700' :
                                                                                record.status === 'cuti' ? 'bg-teal-100 text-teal-700' :
                                                                                    'bg-gray-100 text-gray-600'}`}>
                                                                {record.status === 'present' ? 'Hadir' :
                                                                    record.status === 'late' ? 'Telat' :
                                                                        record.status === 'sick' ? 'Sakit' :
                                                                            record.status === 'permission' ? 'Izin' :
                                                                                record.status === 'cuti' ? 'Cuti' :
                                                                                    record.status === 'absent' ? 'Alpha' : record.status}
                                                            </span>

                                                            {/* GPS Alert Box */}
                                                            {showGpsWarning && (
                                                                <div className="w-full bg-orange-50 border border-orange-200 rounded-md p-2 shadow-sm animate-in zoom-in-95 duration-300">
                                                                    <p className="flex items-center gap-1.5 font-bold text-orange-700 text-[10px] uppercase mb-1">
                                                                        <AlertTriangle className="w-3 h-3" />
                                                                        GPS Mencurigakan
                                                                    </p>
                                                                    <p className="text-[9px] text-orange-600/80 font-medium leading-tight">
                                                                        Akurasi buruk / Lokasi palsu terdeteksi.
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {(record.notes || (record as any).lateReason) && (
                                                                <div className="w-full text-[10px] text-gray-500 mt-1 space-y-1 bg-gray-50/80 p-2 rounded border border-gray-100">
                                                                    {record.notes && (
                                                                        <p className="leading-snug break-words">
                                                                            <span className="font-bold text-gray-700 mr-1.5">Catatan:</span>
                                                                            {record.notes}
                                                                        </p>
                                                                    )}
                                                                    {(record as any).lateReason && (
                                                                        <p className="leading-snug break-words">
                                                                            <span className="font-bold text-orange-700 mr-1.5">Telat:</span>
                                                                            <span className="text-gray-600">{(record as any).lateReason}</span>
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
