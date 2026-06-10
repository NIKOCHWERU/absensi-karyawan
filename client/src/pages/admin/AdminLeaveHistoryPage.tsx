import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LeaveRequest, User } from "@shared/schema";
import { CompanyHeader } from "@/components/CompanyHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Loader2, ArrowLeft, Calendar, User as UserIcon, Search, Filter, Image as ImageIcon, Printer, Trash2 } from "lucide-react";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toTitleCase } from "@/lib/utils";

export default function AdminLeaveHistoryPage() {
    const [, setLocation] = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/admin/leave-requests/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error("Gagal menghapus permohonan cuti");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.admin.attendance.leave.list.path] });
            queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
            toast({
                title: "Berhasil",
                description: "Permohonan cuti telah dihapus.",
            });
        },
        onError: (err: any) => {
            toast({
                title: "Gagal",
                description: err.message,
                variant: "destructive",
            });
        }
    });

    const handleDeleteLeave = (id: number) => {
        if (confirm("Apakah Anda yakin ingin menghapus permohonan cuti ini?")) {
            deleteMutation.mutate(id);
        }
    };

    const handlePrintLeave = async (req: LeaveRequest) => {
        const userObj = users?.find(u => u.id === req.userId);
        const name = userObj?.fullName || `User #${req.userId}`;
        const nik = userObj?.nik || userObj?.username || '-';
        const position = userObj?.position || '-';
        const branch = userObj?.branch || '-';
        
        let periodStr = '';
        let totalDays = 0;
        if (req.selectedDates) {
            const dates = req.selectedDates.split(',');
            totalDays = dates.length;
            periodStr = dates.map(d => format(new Date(d), "d MMMM yyyy", { locale: id })).join(', ');
        } else {
            const start = new Date(req.startDate);
            const end = new Date(req.endDate);
            totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            periodStr = `${format(start, "d MMMM yyyy", { locale: id })} - ${format(end, "d MMMM yyyy", { locale: id })}`;
        }

        const fileName = `SURAT PERMOHONAN CUTI - ${name.toUpperCase()} - ${format(new Date(req.createdAt!), "yyyy-MM-dd")}.html`;
        
        let logoDataUrl = '';
        try {
            const logoRes = await fetch('/logo_elok_buah.jpg');
            const logoBlob = await logoRes.blob();
            logoDataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => resolve('');
                reader.readAsDataURL(logoBlob);
            });
        } catch (_) {}

        const statusLabel = req.status === 'approved' ? 'DISETUJUI' : req.status === 'rejected' ? 'DITOLAK' : req.status === 'cancelled' ? 'DIBATALKAN' : 'PENDING';
        const statusColor = req.status === 'approved' ? '#16a34a' : req.status === 'rejected' ? '#dc2626' : req.status === 'cancelled' ? '#4b5563' : '#ea580c';

        const html = `<!DOCTYPE html>
<html>
<head>
  <title>${fileName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1e293b; background: white; padding: 40px 50px; }
    .letterhead { display: flex; align-items: center; gap: 16px; padding-bottom: 10px; border-bottom: 2px solid #cbd5e1; }
    .logo-img { width: 70px; height: 70px; object-fit: contain; }
    .company-block h1 { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; }
    .company-block .tagline { font-size: 11px; color: #64748b; margin-top: 2px; }
    
    .title-block { text-align: center; margin-top: 25px; margin-bottom: 25px; }
    .title-block h2 { font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #1e293b; text-decoration: underline; }
    .title-block .doc-no { font-size: 11px; color: #475569; margin-top: 4px; }
    
    .section-title { font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 10px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    .info-table td { padding: 8px 4px; vertical-align: top; }
    .info-table td.label { width: 180px; color: #475569; font-weight: bold; }
    .info-table td.colon { width: 15px; text-align: center; color: #475569; }
    .info-table td.value { color: #1e293b; }
    
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; color: white; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .date-list { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
    .date-tag { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 10.5px; color: #334155; }
    
    .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
    .sig-box { text-align: center; width: 160px; }
    .sig-label { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #475569; margin-bottom: 70px; }
    .sig-name { font-size: 12px; font-weight: bold; border-top: 1.5px solid #1e293b; padding-top: 6px; text-transform: uppercase; color: #1e293b; }
    .sig-desc { font-size: 9.5px; color: #64748b; margin-top: 2px; }
    
    .footer { margin-top: 50px; font-size: 9px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 10px; text-align: center; }
    
    .btn-wrap { text-align: center; margin-top: 30px; }
    .download-btn { display: inline-flex; align-items: center; gap: 8px; background: #2563eb; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; text-decoration: none; }
    
    @media print {
      body { padding: 20px 30px; }
      .btn-wrap { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="letterhead">
    <img src="${logoDataUrl}" class="logo-img" alt="Logo" />
    <div class="company-block">
      <h1>PT Elok Jaya Abadhi</h1>
      <p class="tagline">Sistem Manajemen Kehadiran Digital</p>
    </div>
  </div>

  <div class="title-block">
    <h2>FORMULIR PERMOHONAN CUTI KARYAWAN</h2>
    <p class="doc-no">No. Dokumen: EJA/HRD/CUTI/${req.id.toString().padStart(4, '0')}/${new Date(req.createdAt!).getFullYear()}</p>
  </div>

  <div class="section-title">Informasi Karyawan</div>
  <table class="info-table">
    <tr>
      <td class="label">Nama Karyawan</td>
      <td class="colon">:</td>
      <td class="value" style="font-weight: bold;">${name}</td>
    </tr>
    <tr>
      <td class="label">NIK</td>
      <td class="colon">:</td>
      <td class="value" style="font-family: monospace;">${nik}</td>
    </tr>
    <tr>
      <td class="label">Jabatan / Posisi</td>
      <td class="colon">:</td>
      <td class="value">${position}</td>
    </tr>
    <tr>
      <td class="label">Unit Kerja / Cabang</td>
      <td class="colon">:</td>
      <td class="value">${branch}</td>
    </tr>
  </table>

  <div class="section-title">Detail Permohonan Cuti</div>
  <table class="info-table">
    <tr>
      <td class="label">Tanggal Pengajuan</td>
      <td class="colon">:</td>
      <td class="value">${format(new Date(req.createdAt!), "EEEE, d MMMM yyyy HH:mm", { locale: id })}</td>
    </tr>
    <tr>
      <td class="label">Jumlah Hari Cuti</td>
      <td class="colon">:</td>
      <td class="value" style="font-weight: bold;">${totalDays} Hari</td>
    </tr>
    <tr>
      <td class="label">Periode Cuti</td>
      <td class="colon">:</td>
      <td class="value">
        ${periodStr}
        ${req.selectedDates ? `
          <div class="date-list">
            ${req.selectedDates.split(',').map(d => `<span class="date-tag">${format(new Date(d), "d MMMM yyyy", { locale: id })}</span>`).join('')}
          </div>
        ` : ''}
      </td>
    </tr>
    <tr>
      <td class="label">Alasan Cuti / Keterangan</td>
      <td class="colon">:</td>
      <td class="value" style="font-style: italic;">"${req.reason}"</td>
    </tr>
    <tr>
      <td class="label">Status Permohonan</td>
      <td class="colon">:</td>
      <td class="value">
        <span class="status-badge" style="background-color: ${statusColor};">${statusLabel}</span>
      </td>
    </tr>
  </table>

  <div class="signature-section">
    <div class="sig-box">
      <p class="sig-label">Pemohon,</p>
      <div class="sig-name">${name}</div>
      <p class="sig-desc">Karyawan</p>
    </div>
    <div class="sig-box">
      <p class="sig-label">Diperiksa Oleh,</p>
      <div class="sig-name">NIKO</div>
      <p class="sig-desc">HRD / Admin</p>
    </div>
    <div class="sig-box">
      <p class="sig-label">Disetujui Oleh,</p>
      <div class="sig-name">CLAVERINA</div>
      <p class="sig-desc">Direktur / Atasan</p>
    </div>
  </div>

  <div class="footer">
    Formulir ini dicetak secara otomatis melalui Sistem Absensi PT Elok Jaya Abadhi pada ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: id })} WIB
  </div>

  <div class="btn-wrap">
    <a id="dl-btn" class="download-btn" href="#">Cetak / Simpan PDF</a>
  </div>

  <script>
    window.onload = function() {
      var btn = document.getElementById('dl-btn');
      if (btn) {
        btn.onclick = function(e) {
          e.preventDefault();
          window.print();
        };
      }
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
    };

    const { data: users } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
        refetchInterval: 5000,
    });

    const { data: requests, isLoading } = useQuery<LeaveRequest[]>({
        queryKey: [api.admin.attendance.leave.list.path],
        refetchInterval: 5000,
    });

    const getUserName = (userId: number) => {
        const name = users?.find(u => u.id === userId)?.fullName || `User #${userId}`;
        return toTitleCase(name);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-50 border-green-100';
            case 'rejected': return 'text-red-600 bg-red-50 border-red-100';
            case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-100';
            default: return 'text-orange-600 bg-orange-50 border-orange-100';
        }
    };

    const filteredRequests = requests?.filter(req => {
        const userName = getUserName(req.userId).toLowerCase();
        return userName.includes(searchTerm.toLowerCase()) || req.reason.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-6">
            

            <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Riwayat Permohonan Cuti</h1>
                    <p className="text-sm text-gray-500">Daftar arsip dan riwayat persetujuan cuti seluruh karyawan.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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

            <div className="space-y-6">
                <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-50 flex flex-row items-center justify-between gap-4 p-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Cari nama karyawan atau alasan..."
                                className="pl-10 rounded-lg border-gray-100 bg-gray-50 focus:bg-white transition-all h-11"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="rounded-lg h-11 gap-2 text-gray-600 border-gray-200">
                            <Filter className="w-4 h-4" /> Filter
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4">Karyawan</th>
                                        <th className="px-6 py-4">Tanggal Pengajuan</th>
                                        <th className="px-6 py-4">Periode Cuti</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Alasan</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-200" />
                                            </td>
                                        </tr>
                                    ) : filteredRequests?.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                                Tidak ditemukan data permohonan.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRequests?.map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                                            {getUserName(req.userId).charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-gray-900">{getUserName(req.userId)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">
                                                    {format(new Date(req.createdAt!), "d MMM yyyy HH:mm")}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {req.selectedDates ? (
                                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                            {req.selectedDates.split(',').length} Hari Terpilih
                                                        </div>
                                                    ) : (
                                                        <div className="font-bold text-gray-700 whitespace-nowrap">
                                                            {format(new Date(req.startDate), "d MMM")} - {format(new Date(req.endDate), "d MMM yyyy")}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border ${getStatusColor(req.status!)}`}>
                                                        {req.status === 'approved' ? 'Disetujui' :
                                                            req.status === 'rejected' ? 'Ditolak' :
                                                                req.status === 'cancelled' ? 'Batal' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-gray-600 line-clamp-2 min-w-[200px] italic">"{req.reason}"</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="rounded-lg text-blue-600 border-blue-100 hover:bg-blue-50 h-8 w-8 p-0"
                                                            onClick={() => handlePrintLeave(req)}
                                                            title="Cetak Formulir Cuti"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="rounded-lg text-red-600 border-red-100 hover:bg-red-50 h-8 w-8 p-0"
                                                            onClick={() => handleDeleteLeave(req.id)}
                                                            disabled={deleteMutation.isPending}
                                                            title="Hapus Permohonan Cuti"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        </div>
    );
}
