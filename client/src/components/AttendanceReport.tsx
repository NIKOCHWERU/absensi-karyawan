import { format } from "date-fns";
import { id } from "date-fns/locale";
import { User, Attendance } from "@shared/schema";
import { toTitleCase } from "@/lib/utils";

interface AttendanceReportProps {
    date: string;
    records: Attendance[];
    users: User[];
}

export function AttendanceReport({ date, records, users }: AttendanceReportProps) {
    const getEmployee = (userId: number) => {
        return users.find(user => user.id === userId);
    };

    const getPhotoUrl = (value: string | null): string => {
        if (!value) return '';
        if (value.startsWith('data:')) return value;
        if (value.startsWith('http')) return value;
        if (!value.includes('/') && !value.includes('.') && value.length > 20) {
            return `/api/images/${value}`;
        }
        return `/uploads/${value}`;
    };

    const calculateDuration = (checkIn: string | null, checkOut: string | null) => {
        if (!checkIn || !checkOut) return "-";
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffMs = end.getTime() - start.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffHrs}j ${diffMins}m`;
    };

    return (
        <div className="bg-white p-8 font-sans text-gray-900 printable-area">
            {/* Report Header */}
            <div className="flex justify-between items-start border-b-2 border-green-600 pb-4 mb-6">
                <div className="flex items-center gap-4">
                    <img src="/logo_elok_buah.jpg" alt="Logo" className="w-16 h-16 object-contain" />
                    <div>
                        <h1 className="text-2xl font-black text-green-700 tracking-tight">PT ELOK JAYA ABADHI</h1>
                        <p className="text-sm text-gray-500 font-medium">Sistem Manajemen Kehadiran Digital</p>
                    </div>
                </div>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-xl font-bold uppercase tracking-widest text-gray-800">Laporan Riwayat & Foto Absensi</h2>
                <p className="text-sm text-gray-600 mt-1">Tipe: Kustom</p>
                <p className="text-sm text-gray-600 font-bold">
                    Periode: {
                        date.includes('|') 
                            ? `${format(new Date(date.split('|')[0]), "EEEE, d MMM yyyy", { locale: id })} - ${format(new Date(date.split('|')[1]), "EEEE, d MMM yyyy", { locale: id })}`
                            : format(new Date(date), "EEEE, d MMM yyyy", { locale: id })
                    }
                </p>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-gray-300 text-xs">
                <thead>
                    <tr className="bg-gray-50 text-gray-600 uppercase font-black tracking-wider border-b-2 border-gray-800">
                        <th className="border border-gray-300 px-2 py-3 w-10">No</th>
                        <th className="border border-gray-300 px-2 py-3 w-24">Tanggal</th>
                        <th className="border border-gray-300 px-2 py-3 w-40">Nama Karyawan</th>
                        <th className="border border-gray-300 px-2 py-3">Waktu Absen</th>
                        <th className="border border-gray-300 px-2 py-3 w-32">Status & Keterangan</th>
                        <th className="border border-gray-300 px-2 py-3 w-32">Bukti Foto (Visual)</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record, index) => {
                        const emp = getEmployee(record.userId);
                        const duration = calculateDuration(record.checkIn as unknown as string ?? null, record.checkOut as unknown as string ?? null);
                        const isComplete = record.checkIn && record.checkOut && record.breakStart && record.breakEnd;

                        return (
                            <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                                <td className="border border-gray-300 px-2 py-4 text-center font-bold">{index + 1}</td>
                                <td className="border border-gray-300 px-2 py-4 text-center font-medium">
                                    {format(new Date(record.date), "dd/MM/yyyy")}
                                </td>
                                <td className="border border-gray-300 px-3 py-4">
                                    <p className="font-black text-blue-700 mb-0.5">{toTitleCase(emp?.fullName || 'Unknown')}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Sesi {(record as any).sessionNumber || 1}</p>
                                </td>
                                <td className="border border-gray-300 px-3 py-4">
                                    <div className="grid grid-cols-1 gap-1 font-mono">
                                        <p><span className="text-gray-400">IN :</span> <span className="font-bold text-green-600">{record.checkIn ? format(new Date(record.checkIn), "HH:mm") : "- - : - -"}</span></p>
                                        <p><span className="text-gray-400">BRK:</span> <span className="font-bold text-orange-400">{record.breakStart ? format(new Date(record.breakStart), "HH:mm") : "- - : - -"}</span></p>
                                        <p><span className="text-gray-400">OUT:</span> <span className="font-bold text-red-500">{record.checkOut ? format(new Date(record.checkOut), "HH:mm") : "- - : - -"}</span></p>
                                        
                                        <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                                            <p className={`text-[9px] font-black uppercase mb-1 ${isComplete ? 'text-green-600' : 'text-red-500'}`}>
                                                {isComplete ? 'Lengkap' : 'Tidak Lengkap'}
                                            </p>
                                            {record.checkOut && (
                                                <p className="text-[10px] font-black text-gray-800">TOTAL: {duration}</p>
                                            )}
                                        </div>

                                        {record.checkInLocation && (
                                            <div className="mt-2 text-[9px] text-gray-500 leading-tight">
                                                <p className="font-black flex items-center gap-0.5 mb-0.5">
                                                    📍 LOKASI MASUK:
                                                </p>
                                                <p className="italic text-gray-400">{record.checkInLocation}</p>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="border border-gray-300 px-2 py-4 text-center align-top">
                                    <span className={`inline-block px-3 py-1 rounded text-[10px] font-black uppercase mb-2 ${
                                        record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {record.status === 'present' ? 'Hadir' : toTitleCase(record.status)}
                                    </span>
                                    {record.notes && (
                                        <p className="text-[10px] text-gray-500 text-left leading-snug font-medium italic">
                                            Cat: {record.notes}
                                        </p>
                                    )}
                                </td>
                                <td className="border border-gray-300 px-2 py-4">
                                    <div className="flex gap-2 justify-center flex-wrap">
                                        {record.checkInPhoto && (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-16 h-16 border border-gray-200 rounded overflow-hidden shadow-sm">
                                                    <img src={getPhotoUrl(record.checkInPhoto)} alt="Masuk" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Masuk</span>
                                            </div>
                                        )}
                                        {record.breakStartPhoto && (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-16 h-16 border border-gray-200 rounded overflow-hidden shadow-sm">
                                                    <img src={getPhotoUrl(record.breakStartPhoto)} alt="Istirahat" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Istirahat</span>
                                            </div>
                                        )}
                                        {record.breakEndPhoto && (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-16 h-16 border border-gray-200 rounded overflow-hidden shadow-sm">
                                                    <img src={getPhotoUrl(record.breakEndPhoto)} alt="Selesai" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Selesai</span>
                                            </div>
                                        )}
                                        {record.checkOutPhoto && (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-16 h-16 border border-gray-200 rounded overflow-hidden shadow-sm">
                                                    <img src={getPhotoUrl(record.checkOutPhoto)} alt="Pulang" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Pulang</span>
                                            </div>
                                        )}
                                        {!record.checkInPhoto && !record.checkOutPhoto && !record.breakStartPhoto && !record.breakEndPhoto && (
                                            <div className="w-full h-16 flex items-center justify-center text-[9px] text-gray-300 font-bold uppercase tracking-tighter">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="mt-8 flex justify-end">
                <div className="text-center w-48">
                    <p className="text-[10px] text-gray-500 mb-12">Dicetak pada: {format(new Date(), "d/MM/yyyy HH:mm")}</p>
                    <div className="border-t border-gray-300 pt-1">
                        <p className="text-xs font-bold text-gray-800 uppercase">Admin Absensi</p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: A4; margin: 1cm; }
                    body * { visibility: hidden; }
                    .printable-area, .printable-area * { visibility: visible; }
                    .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}} />
        </div>
    );
}
