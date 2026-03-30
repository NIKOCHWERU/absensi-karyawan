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
import { MapPin, ChevronLeft, ChevronRight, History, FileText, Printer, X } from "lucide-react";
import { AttendanceReport } from "@/components/AttendanceReport";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

    // Filter by selected date
    const filteredRecords = attendanceHistory?.filter(
        a => format(new Date(a.date), 'yyyy-MM-dd') === selectedDate
    ) || [];

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
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Riwayat Absensi</h2>
                        <p className="text-sm text-gray-500">Lihat detail waktu, status, dan foto absensi karyawan</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white border rounded-md p-1 shadow-sm w-full md:w-auto">
                        <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[120px] text-center">
                            {format(new Date(selectedDate), "d MMM yyyy", { locale: id })}
                        </span>
                        <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
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
                </header>

                <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg text-gray-800">
                            Data Tanggal: {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: id })}
                        </CardTitle>
                        <div className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                            {filteredRecords.length} Data Absensi
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoadingAttendance ? (
                            <div className="p-12 text-center text-gray-400">Memuat data...</div>
                        ) : filteredRecords.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p>Tidak ada data absensi untuk tanggal ini.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Karyawan</th>
                                            <th className="px-6 py-4 font-bold text-center">Waktu Absen</th>
                                            <th className="px-6 py-4 font-bold">Foto Bukti</th>
                                            <th className="px-6 py-4 font-bold">Status & Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {filteredRecords.map((record) => {
                                            const emp = getEmployee(record.userId);
                                            return (
                                                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm shrink-0">
                                                                {emp?.fullName?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{emp?.fullName || 'Unknown'}</p>
                                                                <p className="text-[11px] text-gray-500">{emp?.nik || emp?.username}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1 text-[11px] font-mono">
                                                            <div className="flex justify-between w-32">
                                                                <span className="text-gray-500">Masuk:</span>
                                                                <span className="font-bold text-green-600">{record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between w-32">
                                                                <span className="text-gray-500">Istirahat:</span>
                                                                <span className="font-bold text-orange-600">{record.breakStart ? format(new Date(record.breakStart), 'HH:mm') : '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between w-32">
                                                                <span className="text-gray-500">Selesai:</span>
                                                                <span className="font-bold text-blue-600">{record.breakEnd ? format(new Date(record.breakEnd), 'HH:mm') : '-'}</span>
                                                            </div>
                                                            <div className="flex justify-between w-32">
                                                                <span className="text-gray-500">Pulang:</span>
                                                                <span className="font-bold text-red-600">{record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '-'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <PhotoThumbnail url={record.checkInPhoto} label="Masuk" location={record.checkInLocation} />
                                                            <PhotoThumbnail url={record.breakStartPhoto} label="Mulai Ist" location={record.breakStartLocation} />
                                                            <PhotoThumbnail url={record.breakEndPhoto} label="Slsai Ist" location={record.breakEndLocation} />
                                                            <PhotoThumbnail url={record.checkOutPhoto} label="Pulang" location={record.checkOutLocation} />
                                                            <PhotoThumbnail url={record.lateReasonPhoto} label="Bukti Telat" />

                                                            {!record.checkInPhoto && !record.checkOutPhoto && !record.breakStartPhoto && !record.breakEndPhoto && !record.lateReasonPhoto && (
                                                                <div className="flex items-center justify-center p-4 border border-dashed border-gray-200 rounded-lg bg-gray-50 w-full min-w-[120px]">
                                                                    <span className="text-xs text-gray-400 italic">Tidak ada foto</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-2 items-start max-w-[200px]">
                                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase
                                                                ${record.status === 'present' ? 'bg-green-100 text-green-700' :
                                                                    record.status === 'late' ? 'bg-orange-100 text-orange-700' :
                                                                        record.status === 'sick' ? 'bg-blue-100 text-blue-700' :
                                                                            record.status === 'permission' ? 'bg-purple-100 text-purple-700' :
                                                                                record.status === 'cuti' ? 'bg-teal-100 text-teal-700' :
                                                                                    'bg-gray-100 text-gray-700'}`}>
                                                                {record.status === 'present' ? 'Hadir' :
                                                                    record.status === 'late' ? 'Telat' :
                                                                        record.status === 'sick' ? 'Sakit' :
                                                                            record.status === 'permission' ? 'Izin' :
                                                                                record.status === 'cuti' ? 'Cuti' :
                                                                                    record.status === 'absent' ? 'Alpha' : record.status}
                                                            </span>

                                                            {record.notes && (
                                                                <p className="text-xs text-gray-600 whitespace-normal bg-gray-50 p-2 rounded border border-gray-100 w-full" style={{ wordBreak: 'break-word' }}>
                                                                    <span className="font-semibold block mb-0.5">Catatan:</span>
                                                                    {record.notes}
                                                                </p>
                                                            )}
                                                            {(record as any).lateReason && (
                                                                <p className="text-xs text-orange-700 whitespace-normal bg-orange-50 p-2 rounded border border-orange-100 w-full" style={{ wordBreak: 'break-word' }}>
                                                                    <span className="font-semibold block mb-0.5">Alasan Telat:</span>
                                                                    {(record as any).lateReason}
                                                                </p>
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
