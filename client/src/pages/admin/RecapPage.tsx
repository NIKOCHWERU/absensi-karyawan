import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Attendance } from "@shared/schema";
import { format, subMonths, addMonths, isSameMonth, setDate, isAfter, isBefore, isEqual, startOfWeek, endOfWeek, startOfDay, endOfDay, subDays, addDays } from "date-fns";
import { id } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, FileDown, ArrowLeft, Search, ArrowUpDown, MessageSquare, Plus, Edit2, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { differenceInMinutes } from "date-fns";
import { calculateDailyTotal, formatDuration, calculateDurationSeconds, formatDurationFull } from "@/lib/attendance";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Image as ImageIcon } from "lucide-react";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function RecapPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State for selected period (e.g., Feb 2026 means Jan 26 - Feb 25)
    // We store the "target" month (Feb 2026)
    const [targetDate, setTargetDate] = useState(new Date());
    const [selectedPhotoRecord, setSelectedPhotoRecord] = useState<Attendance | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Manual Attendance Modal State
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [editingAttendance, setEditingAttendance] = useState<Partial<Attendance> | null>(null);
    const [manualEntry, setManualEntry] = useState({
        userId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        checkIn: "",
        checkOut: "",
        breakStart: "",
        breakEnd: "",
        status: "present",
        notes: "",
        shift: "Karyawan"
    });

    const { data: users } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
        refetchInterval: 5000,
    });

    const { data: allAttendance } = useQuery<Attendance[]>({
        queryKey: ["/api/attendance"],
        refetchInterval: 5000,
    });

    const { data: complaintsStats } = useQuery<{ pendingCount: number }>({
        queryKey: ["/api/admin/complaints/stats"],
        refetchInterval: 5000,
    });

    const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");

    // Calculate Period Range
    let startDate: Date;
    let endDate: Date;

    if (reportType === "daily") {
        startDate = startOfDay(targetDate);
        endDate = endOfDay(targetDate);
    } else if (reportType === "weekly") {
        startDate = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(targetDate, { weekStartsOn: 1 });
    } else {
        // Default: 26th of previous month to 25th of current month
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 26);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 25);
    }

    const handlePrev = () => {
        if (reportType === "daily") setTargetDate(d => subDays(d, 1));
        else if (reportType === "weekly") setTargetDate(d => subDays(d, 7));
        else setTargetDate(d => subMonths(d, 1));
    };

    const handleNext = () => {
        if (reportType === "daily") setTargetDate(d => addDays(d, 1));
        else if (reportType === "weekly") setTargetDate(d => addDays(d, 7));
        else setTargetDate(d => addMonths(d, 1));
    };

    const [searchName, setSearchName] = useState("");
    const [sortField, setSortField] = useState<'date' | 'name'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const getUserName = (userId: number) => {
        return users?.find(u => u.id === userId)?.fullName || null;
    };

    // Filter Data by Date Period — exclude records for deleted employees
    const filteredRecords = allAttendance?.filter(att => {
        // Skip records whose user no longer exists
        if (!getUserName(att.userId)) return false;

        const attDate = new Date(att.date);
        const d = new Date(attDate);
        d.setHours(0, 0, 0, 0);
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        return (isAfter(d, s) || isEqual(d, s)) && (isBefore(d, e) || isEqual(d, e));
    }) || [];

    // Filter by Name & Sort
    const processedData = filteredRecords
        .filter(att => {
            const name = (getUserName(att.userId) || '').toLowerCase();
            return name.includes(searchName.toLowerCase());
        })
        .sort((a, b) => {
            if (sortField === 'date') {
                const dateA = new Date(a.date).setHours(0, 0, 0, 0);
                const dateB = new Date(b.date).setHours(0, 0, 0, 0);

                if (dateA !== dateB) return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;

                // Secondary sort: Group by User
                const nameA = (getUserName(a.userId) || '').toLowerCase();
                const nameB = (getUserName(b.userId) || '').toLowerCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;

                // Tertiary sort: Latest session first (DESC) or Earliest (ASC)
                const checkInA = a.checkIn ? new Date(a.checkIn).getTime() : 0;
                const checkInB = b.checkIn ? new Date(b.checkIn).getTime() : 0;
                return sortOrder === 'desc' ? checkInB - checkInA : checkInA - checkInB;
            } else {
                const nameA = (getUserName(a.userId) || '').toLowerCase();
                const nameB = (getUserName(b.userId) || '').toLowerCase();
                if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
                if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;

                const timeA = new Date(a.date).getTime();
                const timeB = new Date(b.date).getTime();
                return timeB - timeA;
            }
        });

    const toggleSort = (field: 'date' | 'name') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Pre-calculate daily totals for fast lookup
    // Key: "YYYY-MM-DD-userId" -> { mins, hasAllCheckOuts }
    const dailyTotals = new Map<string, { mins: number; complete: boolean }>();
    processedData.forEach(row => {
        const key = `${format(new Date(row.date), "yyyy-MM-dd")}-${row.userId}`;
        if (!dailyTotals.has(key)) {
            // Find all records for this day/user
            const dayRecords = processedData.filter(r =>
                format(new Date(r.date), "yyyy-MM-dd") === format(new Date(row.date), "yyyy-MM-dd") &&
                r.userId === row.userId
            );
            const { netWorkMins, hasAllCheckOuts } = calculateDailyTotal(dayRecords);
            dailyTotals.set(key, { mins: netWorkMins, complete: hasAllCheckOuts });
        }
    });

    const calculateHours = (start?: Date | string | null, end?: Date | string | null) => {
        if (!start || !end) return 0;

        const startDate = new Date(start);
        startDate.setSeconds(0, 0);
        const endDate = new Date(end);
        endDate.setSeconds(0, 0);

        const diff = differenceInMinutes(endDate, startDate);
        return diff < 0 ? diff + 1440 : diff;
    };

    const manualMutation = useMutation({
        mutationFn: async (data: any) => {
            const isEdit = !!editingAttendance?.id;
            const url = isEdit ? `/api/admin/attendance/${editingAttendance!.id}` : api.admin.attendance.manual.path;
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(await res.text() || "Gagal menyimpan data");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
            setIsManualModalOpen(false);
            setEditingAttendance(null);
            toast({
                title: "Berhasil",
                description: "Data absensi telah diperbarui.",
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

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/admin/attendance/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Gagal menghapus data");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
            setDeleteConfirmId(null);
            toast({ title: "Dihapus", description: "Data absensi berhasil dihapus." });
        },
        onError: (err: any) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        }
    });

    const handleOpenManualModal = (existing?: Attendance) => {
        if (existing) {
            setEditingAttendance(existing);
            const toTime = (d: string | Date | null | undefined) => d ? format(new Date(d), "HH:mm") : "";
            setManualEntry({
                userId: String(existing.userId),
                date: format(new Date(existing.date), "yyyy-MM-dd"),
                checkIn: toTime(existing.checkIn),
                checkOut: toTime(existing.checkOut),
                breakStart: toTime(existing.breakStart),
                breakEnd: toTime(existing.breakEnd),
                status: existing.status || "present",
                notes: existing.notes || "",
                shift: existing.shift || "Karyawan"
            });
        } else {
            setEditingAttendance(null);
            setManualEntry({
                userId: "",
                date: format(new Date(), "yyyy-MM-dd"),
                checkIn: "",
                checkOut: "",
                breakStart: "",
                breakEnd: "",
                status: "present",
                notes: "",
                shift: "Karyawan"
            });
        }
        setIsManualModalOpen(true);
    };

    const formatDuration = (minutes: number) => {
        if (minutes <= 0) return "-";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}j ${m}m`;
    };

    const handleExport = async () => {
        let periodStr = '';
        if (reportType === 'daily') {
            periodStr = format(targetDate, "dd MMMM yyyy", { locale: id }).toUpperCase();
        } else if (reportType === 'weekly') {
            periodStr = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy", { locale: id })}`.toUpperCase();
        } else {
            periodStr = format(targetDate, "MMMM yyyy", { locale: id }).toUpperCase();
        }

        const fileName = `LAPORAN ABSENSI PT EJA - ${periodStr}.html`;
        // Embed logo as base64 so it works from blob URL pages
        let logoDataUrl = '';
        try {
            const logoRes = await fetch('/logo_elok_buah.jpg');
            const logoBlob = await logoRes.blob();
            logoDataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(logoBlob);
            });
        } catch (_) { /* skip logo if unavailable */ }

        const html = `<!DOCTYPE html>
<html>
<head>
  <title>${fileName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1e293b; background: white; padding: 28px 36px; }

    /* LETTERHEAD */
    .letterhead { display: flex; align-items: center; gap: 16px; padding-bottom: 10px; }
    .logo-img { width: 60px; height: 60px; object-fit: contain; }
    .company-block h1 { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; }
    .company-block .tagline { font-size: 10px; color: #64748b; margin-top: 2px; }
    .hr-thick { border: none; border-top: 2px solid #cbd5e1; margin: 6px 0 2px; }
    .hr-thin  { border: none; border-top: 1px solid #e2e8f0; margin-bottom: 18px; }

    /* TITLE */
    .report-meta { text-align: center; margin-bottom: 20px; }
    .report-meta h2 { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #1e293b; }
    .report-meta .sub { font-size: 10.5px; margin-top: 4px; color: #475569; }

    /* TABLE */
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    thead tr { background-color: #f8fafc; }
    th { color: #374151; font-weight: 700; text-align: left; padding: 8px 8px; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 2px solid #1e293b; border-right: 1px solid #e2e8f0; white-space: nowrap; }
    th.c { text-align: center; }
    td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; vertical-align: middle; white-space: nowrap; }
    tbody tr:nth-child(even) { background-color: #f8fafc; }

    .col-no   { text-align: center; color: #94a3b8; font-size: 10px; }
    .col-date { color: #374151; font-weight: 600; }
    .col-name { color: #1d4ed8; font-weight: 600; }
    .col-time { font-family: ui-monospace, Consolas, monospace; font-size: 11px; text-align: center; }
    .t-in   { color: #15803d; font-weight: 700; }
    .t-brk  { color: #b45309; font-weight: 700; }
    .t-out  { color: #b91c1c; font-weight: 700; }
    .t-dash { color: #94a3b8; }
    .col-work { font-size: 11px; font-weight: 700; color: #1e293b; }
    .col-brk  { text-align: center; font-size: 11px; font-weight: 700; color: #ea580c; }
    .col-stat { text-align: center; font-weight: 700; font-size: 11px; }
    .st-hadir { color: #16a34a; }
    .st-telat { color: #ea580c; }
    .st-sakit { color: #2563eb; }
    .st-izin  { color: #7c3aed; }
    .st-cuti  { color: #0d9488; }
    .st-alpha { color: #dc2626; }
    .col-note { font-size: 10.5px; color: #475569; white-space: normal; max-width: 200px; }
    .note-late { color: #dc2626; font-size: 10px; }
    .note-warn { color: #ca8a04; font-weight: 600; }

    /* SIGNATURE */
    .signature-section { margin-top: 48px; display: flex; justify-content: space-between; padding: 0 24px; }
    .sig-box { text-align: center; width: 160px; }
    .sig-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #374151; margin-bottom: 64px; }
    .sig-name { font-size: 11px; font-weight: 800; border-top: 1.5px solid #374151; padding-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; }

    .footer { margin-top: 18px; font-size: 8.5px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 8px; }

    /* DOWNLOAD BUTTON */
    .btn-wrap { text-align: center; margin-top: 20px; }
    .download-btn { display: inline-flex; align-items: center; gap: 8px; background: #1d4ed8; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; text-decoration: none; }
    .download-btn:hover { background: #1e40af; }

    @media print {
      body { padding: 12px 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead tr, tbody tr:nth-child(even) { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
  <hr class="hr-thick" />
  <hr class="hr-thin" />

  <div class="report-meta">
    <h2>Laporan Rekapitulasi Absensi</h2>
    <p class="sub">Tipe: ${reportType === 'daily' ? 'Harian' : reportType === 'weekly' ? 'Mingguan' : 'Bulanan'}</p>
    <p class="sub">Periode: ${format(startDate, "EEEE, d MMM yyyy", { locale: id })} - ${format(endDate, "EEEE, d MMM yyyy", { locale: id })}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th class="c" style="width:28px;">No</th>
        <th style="width:76px;">Tanggal</th>
        <th style="width:130px;">Nama Karyawan</th>
        <th class="c" style="width:52px;">Masuk</th>
        <th class="c" style="width:52px;">Istirahat</th>
        <th class="c" style="width:52px;">Selesai</th>
        <th class="c" style="width:52px;">Pulang</th>
        <th style="width:80px;">Jam Kerja</th>
        <th class="c" style="width:80px;">Total Istirahat</th>
        <th class="c" style="width:62px;">Status</th>
        <th>Keterangan</th>
      </tr>
    </thead>
    <tbody>
      ${processedData.map((row, index) => {
            const breakMins = calculateHours(row.breakStart, row.breakEnd);
            const { netWorkMins: sessionNetMins } = calculateDailyTotal([row]);
            const dateStr = format(new Date(row.date), "yyyy-MM-dd");
            const key = `${dateStr}-${row.userId}`;
            const dailyEntry = dailyTotals.get(key);
            const dailyTotalMins = dailyEntry?.mins ?? 0;
            const dailyIsComplete = dailyEntry?.complete ?? false;
            const prevRow = index > 0 ? processedData[index - 1] : null;
            const isSameDayAndUser = !!(prevRow &&
                format(new Date(prevRow.date), "yyyy-MM-dd") === dateStr &&
                prevRow.userId === row.userId);

            const statusLabel = row.status === 'present' ? 'Hadir' :
                row.status === 'late' ? 'Telat' :
                    row.status === 'sick' ? 'Sakit' :
                        row.status === 'permission' ? 'Izin' :
                            row.status === 'off' ? 'Libur' :
                                row.status === 'cuti' ? 'Cuti' :
                                    row.status === 'absent' ? 'Alpha' : (row.status || '-');
            const statusClass = row.status === 'present' ? 'st-hadir' :
                row.status === 'late' ? 'st-telat' :
                    row.status === 'sick' ? 'st-sakit' :
                        row.status === 'permission' ? 'st-izin' :
                            row.status === 'cuti' ? 'st-cuti' :
                                row.status === 'absent' ? 'st-alpha' : '';

            const inTime = row.checkIn ? format(new Date(row.checkIn), 'HH:mm') : '-';
            const brkTime = row.breakStart ? format(new Date(row.breakStart), 'HH:mm') : '-';
            const brkEnd = row.breakEnd ? format(new Date(row.breakEnd), 'HH:mm') : '-';
            const outTime = row.checkOut ? format(new Date(row.checkOut), 'HH:mm') : '-';

            // Validation for incomplete sequences (e.g. checkIn and checkOut exist but no breakStart/End)
            // Also if not checked out at all
            const isSequenceIncomplete = (row.checkIn && !row.checkOut) ||
                (inTime !== '-' && outTime !== '-' && ((brkTime !== '-' && brkEnd === '-') || (brkTime === '-' && brkEnd !== '-') || (brkTime === '-' && brkEnd === '-')));

            const jamKerja = !isSameDayAndUser
                ? (isSequenceIncomplete
                    ? '<span class="note-warn" style="font-size:10px;">Data Absensi<br>Tidak Lengkap</span>'
                    : (dailyIsComplete && dailyTotalMins > 0 ? formatDuration(dailyTotalMins) : '-'))
                : '';

            let keterangan = row.notes ? row.notes : '-';
            if (!row.checkOut) {
                keterangan = row.notes ? row.notes + ' <span class="note-warn">(Belum Pulang)</span>' : '<span class="note-warn">Belum Pulang</span>';
            } else if (isSequenceIncomplete) {
                keterangan = row.notes ? row.notes + ' <span class="note-warn">(Data Absensi Tidak Lengkap)</span>' : '<span class="note-warn">Data Absensi Tidak Lengkap</span>';
            }
            const lateNote = row.status === 'late' && (row as any).lateReason
                ? `<br><span class="note-late">[Telat: ${(row as any).lateReason}]</span>`
                : '';

            return `<tr>
          <td class="col-no">${isSameDayAndUser ? '<span style="color:#cbd5e1;">↳</span>' : (index + 1)}</td>
          <td class="col-date">${isSameDayAndUser ? '' : format(new Date(row.date), 'dd/MM/yyyy')}</td>
          <td class="col-name">${isSameDayAndUser ? '' : (getUserName(row.userId) || '-')}</td>
          <td class="col-time ${inTime === '-' ? 't-dash' : 't-in'}">${inTime}</td>
          <td class="col-time ${brkTime === '-' ? 't-dash' : 't-brk'}">${brkTime}</td>
          <td class="col-time ${brkEnd === '-' ? 't-dash' : 't-brk'}">${brkEnd}</td>
          <td class="col-time ${outTime === '-' ? 't-dash' : 't-out'}">${outTime}</td>
          <td class="col-work">${jamKerja}</td>
          <td class="col-brk">${breakMins > 0 ? formatDuration(breakMins) : '-'}</td>
          <td class="col-stat"><span class="${statusClass} ${row.status === 'off' ? 'st-off' : ''}">${statusLabel}</span></td>
          <td class="col-note">${keterangan}${lateNote}</td>
        </tr>`;
        }).join('')}
    </tbody>
  </table>

  <div class="signature-section">
    <div class="sig-box">
      <p class="sig-label">Checked By</p>
      <div class="sig-name">NIKO</div>
    </div>
    <div class="sig-box">
      <p class="sig-label">Approved By</p>
      <div class="sig-name">CLAVERINA</div>
    </div>
  </div>

  <div class="footer">
    Dokumen ini dicetak secara otomatis oleh Sistem Absensi PT Elok Jaya Abadhi &mdash; ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: id })} WIB &mdash; Harap simpan sebagai arsip resmi perusahaan.
  </div>

  <div class="btn-wrap">
    <a id="dl-btn" class="download-btn" href="#">&#11015;&nbsp; Download File</a>
  </div>

  <script>
    var _fn = "${fileName}";
    document.title = _fn;
    window.onload = function() {
      var btn = document.getElementById('dl-btn');
      if (btn) {
        btn.href = window.location.href;
        btn.download = _fn;
      }
      window.onafterprint = function() { window.close(); };
      setTimeout(function() { window.print(); }, 600);
    };
  </script>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-100 p-4 sm:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 z-20 gap-4 backdrop-blur-md bg-white/90">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} className="shrink-0 hover:bg-gray-100 rounded-full transition-all">
                        <ArrowLeft className="h-6 w-6 text-gray-700" />
                    </Button>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">Rekap Absensi</h1>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1.5 w-full sm:w-auto shadow-sm">
                    <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                        <SelectTrigger className="w-[90px] sm:w-[110px] h-9 border-none bg-transparent text-xs sm:text-sm font-bold text-slate-700 focus:ring-0">
                            <SelectValue placeholder="Tipe" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                            <SelectItem value="daily">Harian</SelectItem>
                            <SelectItem value="weekly">Mingguan</SelectItem>
                            <SelectItem value="monthly">Bulanan</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>
                    <div className="flex items-center gap-0.5 flex-1 sm:flex-none justify-center">
                        <Button variant="ghost" size="icon" onClick={handlePrev} className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <span className="text-[11px] sm:text-[13px] font-black text-slate-800 min-w-[100px] text-center whitespace-nowrap px-2">
                            {reportType === 'daily' ? format(targetDate, "d MMM yyyy", { locale: id }) :
                                reportType === 'weekly' ? `${format(startDate, "d MMM")} - ${format(endDate, "d MMM yyyy", { locale: id })}` :
                                    format(targetDate, "MMMM yyyy", { locale: id })}
                        </span>
                        <Button variant="ghost" size="icon" onClick={handleNext} className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600">
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="p-8 flex-1 overflow-auto">
                <Card className="border-none shadow-sm">
                    <CardHeader className="p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Laporan Absensi</p>
                            <CardTitle className="text-2xl font-black text-slate-800">
                                {reportType === 'daily' ? 'Presensi Harian' : reportType === 'weekly' ? 'Rekap Mingguan' : 'Rekap Bulanan'}
                            </CardTitle>
                            <p className="text-[13px] text-slate-500 font-medium">
                                Periode: <span className="text-slate-800 font-bold">{format(startDate, "d MMMM yyyy", { locale: id })} - {format(endDate, "d MMMM yyyy", { locale: id })}</span>
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-72">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                                <Input
                                    placeholder="Cari nama karyawan..."
                                    className="pl-11 h-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all text-sm font-medium"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                />
                            </div>
                            <Button 
                                variant="outline" 
                                className="h-11 px-6 gap-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 rounded-xl font-bold transition-all shadow-sm shadow-emerald-100" 
                                onClick={() => handleOpenManualModal()}
                            >
                                <Plus className="h-5 w-5" /> Input Manual
                            </Button>
                            <Button 
                                variant="outline" 
                                className="h-11 px-6 gap-2 bg-slate-800 text-white border-slate-800 hover:bg-slate-900 rounded-xl font-bold transition-all shadow-sm"
                                onClick={handleExport}
                            >
                                <FileDown className="h-5 w-5" /> Export
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-2 sm:px-6 pb-8">
                        <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-xl shadow-slate-200/50">
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                                <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-50/80 backdrop-blur-sm text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors uppercase text-[10px] font-black tracking-widest text-slate-400" onClick={() => toggleSort('date')}>
                                            <div className="flex items-center gap-1.5 ">Tgl <ArrowUpDown className="h-3 w-3" /></div>
                                        </th>
                                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors uppercase text-[10px] font-black tracking-widest text-slate-400" onClick={() => toggleSort('name')}>
                                            <div className="flex items-center gap-1.5 ">Karyawan <ArrowUpDown className="h-3 w-3" /></div>
                                        </th>
                                        <th className="px-6 py-4 uppercase text-[10px] font-black tracking-widest text-slate-400 text-center">Masuk</th>
                                        <th className="px-6 py-4 uppercase text-[10px] font-black tracking-widest text-slate-400 text-center">Break</th>
                                        <th className="px-6 py-4 uppercase text-[10px] font-black tracking-widest text-slate-400 text-center">Selesai</th>
                                        <th className="px-6 py-4 uppercase text-[10px] font-black tracking-widest text-slate-400 text-center">Pulang</th>
                                        <th className="px-6 py-4 uppercase text-[10px] font-black tracking-widest text-slate-400 text-center">Durasi Kerja</th>
                                        <th className="px-6 py-4 uppercase text-[10px] font-black tracking-widest text-slate-400 text-center">Istirahat</th>
                                        <th className="px-6 py-4 uppercase text-[10px] font-black tracking-widest text-slate-400 text-center">Status</th>
                                        <th className="px-6 py-4 uppercase text-[10px] font-black tracking-widest text-slate-400 min-w-[200px]">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {processedData.map((row, index) => {
                                        // Calculate per-session stats
                                        const { netWorkMins: sessionNetMins, totalBreakMins: sessionBreakMins } = calculateDailyTotal([row]);

                                        // Grouping Logic: Check if same as previous row
                                        const dateStr = format(new Date(row.date), "yyyy-MM-dd");
                                        const key = `${dateStr}-${row.userId}`;

                                        const prevRow = index > 0 ? processedData[index - 1] : null;
                                        const isSameDayAndUser = prevRow &&
                                            format(new Date(prevRow.date), "yyyy-MM-dd") === dateStr &&
                                            prevRow.userId === row.userId;

                                        return (
                                            <tr key={row.id} className="hover:bg-slate-50/80 transition-all group">
                                                <td className="px-6 py-4 text-slate-500 font-bold whitespace-nowrap relative">
                                                    {isSameDayAndUser ? (
                                                        <div className="absolute left-10 top-0 h-full w-px bg-slate-100"></div> /* Connector */
                                                    ) : (
                                                        format(new Date(row.date), "dd/MM/yyyy")
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isSameDayAndUser ? "" : (
                                                        <span className="text-slate-800 font-black tracking-tight">{getUserName(row.userId)}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-emerald-600 font-black font-mono text-center bg-emerald-50/30">
                                                    {row.checkIn ? format(new Date(row.checkIn), "HH:mm") : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-amber-600 font-black font-mono text-center">
                                                    {row.breakStart ? format(new Date(row.breakStart), "HH:mm") : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-amber-600 font-black font-mono text-center">
                                                    {row.breakEnd ? format(new Date(row.breakEnd), "HH:mm") : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-rose-600 font-black font-mono text-center bg-rose-50/30">
                                                    {row.checkOut ? format(new Date(row.checkOut), "HH:mm") : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {!isSameDayAndUser && (() => {
                                                        const daily = dailyTotals.get(key);
                                                        const inTime = row.checkIn ? 'yes' : '-';
                                                        const outTime = row.checkOut ? 'yes' : '-';
                                                        const brkStart = row.breakStart ? 'yes' : '-';
                                                        const brkEnd = row.breakEnd ? 'yes' : '-';
                                                        const isSequenceIncomplete = (inTime !== '-' && !row.checkOut) ||
                                                            (inTime !== '-' && outTime !== '-' && ((brkStart !== '-' && brkEnd === '-') || (brkStart === '-' && brkEnd !== '-') || (brkStart === '-' && brkEnd === '-')));

                                                        const showTotal = daily?.complete && (daily?.mins ?? 0) > 0 && !isSequenceIncomplete;

                                                        return (
                                                            <div className="flex flex-col items-center">
                                                                {isSequenceIncomplete ? (
                                                                    <span className="text-rose-600 font-black text-[10px] leading-tight uppercase px-2 py-1 bg-rose-50 rounded-lg">Data Tidak Lengkap</span>
                                                                ) : (
                                                                    <div className="bg-slate-800 text-white px-3 py-1 rounded-lg">
                                                                        <span className="text-[11px] font-black">{showTotal ? formatDuration(daily!.mins) : "-"}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                    <div className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter">
                                                        {(() => {
                                                            const brkS = row.breakStart ? 'yes' : '-';
                                                            const brkE = row.breakEnd ? 'yes' : '-';
                                                            const isSeqIncomplete = (!row.checkOut) || (row.checkIn && row.checkOut && ((brkS !== '-' && brkE === '-') || (brkS === '-' && brkE !== '-') || (brkS === '-' && brkE === '-')));
                                                            if (!row.checkOut) return <span className="text-amber-600">Belum Pulang</span>;
                                                            if (isSeqIncomplete) return <span className="text-rose-500">Iregular</span>;
                                                            return <span className="text-slate-400">Sesi: {formatDuration(sessionNetMins)}</span>;
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-[11px] font-black text-amber-600">
                                                    {(() => {
                                                        const secs = calculateDurationSeconds(row.breakStart, row.breakEnd);
                                                        return secs > 0 ? formatDurationFull(secs) : "-";
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm
                                                ${row.status === 'present' ? 'bg-emerald-500 text-white' :
                                                             row.status === 'late' ? 'bg-rose-500 text-white' :
                                                                 row.status === 'sick' ? 'bg-blue-500 text-white' :
                                                                     row.status === 'permission' ? 'bg-purple-500 text-white' :
                                                                         row.status === 'off' ? 'bg-slate-400 text-white' :
                                                                             row.status === 'cuti' ? 'bg-teal-500 text-white' :
                                                                                 'bg-slate-200 text-slate-600'}`}>
                                                        {row.status === 'present' ? 'Hadir' :
                                                            row.status === 'late' ? 'Telat' :
                                                                row.status === 'sick' ? 'Sakit' :
                                                                    row.status === 'permission' ? 'Izin' :
                                                                        row.status === 'off' ? 'Libur' :
                                                                            row.status === 'cuti' ? 'Cuti' :
                                                                                row.status === 'absent' ? 'Alpha' : row.status}
                                                    </span>
                                                    {(row as any).sessionNumber > 1 && (
                                                        <div className="text-[9px] font-black text-slate-400 mt-1 uppercase">Sesi {(row as any).sessionNumber}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 max-w-xs">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2 group/actions">
                                                            <span className={`text-[13px] leading-relaxed font-medium ${!row.checkOut ? "text-amber-600 italic font-bold" : "text-slate-600"}`}>
                                                                {row.notes ? row.notes : (!row.checkOut ? "Belum Absen Pulang" : "-")}
                                                            </span>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover/actions:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                                    onClick={() => handleOpenManualModal(row)}
                                                                >
                                                                    <Edit2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                                    onClick={() => setDeleteConfirmId(row.id)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        {((row as any).lateReason || (row as any).checkInPhoto || (row as any).checkOutPhoto || (row as any).lateReasonPhoto) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 px-3 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 justify-start font-black uppercase tracking-wider flex items-center gap-2 rounded-lg border border-blue-100 bg-white"
                                                                onClick={() => setSelectedPhotoRecord(row)}
                                                            >
                                                                <Camera className="h-3.5 w-3.5" />
                                                                Detail Foto
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {processedData.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                                                Tidak ada data absensi untuk periode ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>

            <Dialog open={!!selectedPhotoRecord} onOpenChange={(open) => !open && setSelectedPhotoRecord(null)}>
                <DialogContent className="sm:max-w-md bg-white border-zinc-200 text-zinc-900 rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-blue-600 uppercase">Detail Bukti & Keterangan</DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            Detail alasan dan bukti foto yang dikirimkan karyawan.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPhotoRecord && (
                        <div className="space-y-4 mt-2">
                            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Karyawan</p>
                                <p className="font-bold text-zinc-800">{getUserName(selectedPhotoRecord.userId)}</p>
                                <p className="text-xs text-zinc-500 font-medium">
                                    Tanggal Absen: {format(new Date(selectedPhotoRecord.date), "dd MMMM yyyy", { locale: id })}
                                </p>
                            </div>

                            {/* Alasan Terlambat & Foto Alasan */}
                            {(selectedPhotoRecord as any).lateReason && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Alasan Keterlambatan</p>
                                    <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100/50 min-h-[60px]">
                                        <p className="text-sm text-zinc-700 leading-relaxed">{(selectedPhotoRecord as any).lateReason}</p>
                                    </div>
                                </div>
                            )}
                            {(selectedPhotoRecord as any).lateReasonPhoto && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Bukti Terlambar (Foto)</p>
                                    <div className="aspect-video bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200">
                                        <img
                                            src={(() => {
                                                const p = (selectedPhotoRecord as any).lateReasonPhoto;
                                                if (!p) return '';
                                                if (p.startsWith('data:')) return p;
                                                if (!p.includes('/') && !p.includes('.') && p.length > 20)
                                                    return `/api/images/${p}`;
                                                return `/uploads/${p}`;
                                            })()}
                                            alt="Bukti Telat"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Foto Masuk */}
                            {(selectedPhotoRecord as any).checkInPhoto && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Bukti Check-In (Masuk)</p>
                                    <div className="aspect-video bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200">
                                        <img
                                            src={(() => {
                                                const p = (selectedPhotoRecord as any).checkInPhoto;
                                                if (!p) return '';
                                                if (p.startsWith('data:')) return p;
                                                if (!p.includes('/') && !p.includes('.') && p.length > 20)
                                                    return `/api/images/${p}`;
                                                return `/uploads/${p}`;
                                            })()}
                                            alt="Bukti Check-In"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Foto Pulang */}
                            {(selectedPhotoRecord as any).checkOutPhoto && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Bukti Check-Out (Pulang)</p>
                                    <div className="aspect-video bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200">
                                        <img
                                            src={(() => {
                                                const p = (selectedPhotoRecord as any).checkOutPhoto;
                                                if (!p) return '';
                                                if (p.startsWith('data:')) return p;
                                                if (!p.includes('/') && !p.includes('.') && p.length > 20)
                                                    return `/api/images/${p}`;
                                                return `/uploads/${p}`;
                                            })()}
                                            alt="Bukti Check-Out"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="pt-4">
                        <Button
                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl h-12"
                            onClick={() => setSelectedPhotoRecord(null)}
                        >
                            Tutup
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">
                            {editingAttendance ? "Edit Data Absensi" : "Input Absensi Manual"}
                        </DialogTitle>
                        <DialogDescription>
                            Gunakan ini untuk koreksi data atau input jika karyawan cuti/tidak absen.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Pilih Karyawan</Label>
                            <Select
                                value={manualEntry.userId}
                                onValueChange={(v) => setManualEntry(prev => ({ ...prev, userId: v }))}
                                disabled={!!editingAttendance}
                            >
                                <SelectTrigger className="rounded-xl border-gray-200 h-10">
                                    <SelectValue placeholder="Pilih karyawan..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {users?.filter(u => u.role === 'employee').map(u => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.fullName} ({u.nik || "Tidak ada NIK"})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tanggal</Label>
                                <Input
                                    type="date"
                                    value={manualEntry.date}
                                    onChange={(e) => setManualEntry(prev => ({ ...prev, date: e.target.value }))}
                                    className="rounded-xl border-gray-200"
                                    disabled={!!editingAttendance}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Shift</Label>
                                <Select
                                    value={manualEntry.shift}
                                    onValueChange={(v) => setManualEntry(prev => ({ ...prev, shift: v }))}
                                >
                                    <SelectTrigger className="rounded-xl border-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Karyawan">Karyawan</SelectItem>
                                        <SelectItem value="Office">Office</SelectItem>
                                        <SelectItem value="Security">Security</SelectItem>
                                        <SelectItem value="Warehouse">Warehouse</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Time fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Jam Masuk</Label>
                                <Input
                                    type="time"
                                    value={manualEntry.checkIn}
                                    onChange={(e) => setManualEntry(prev => ({ ...prev, checkIn: e.target.value }))}
                                    className="rounded-xl border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Jam Pulang</Label>
                                <Input
                                    type="time"
                                    value={manualEntry.checkOut}
                                    onChange={(e) => setManualEntry(prev => ({ ...prev, checkOut: e.target.value }))}
                                    className="rounded-xl border-gray-200"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Mulai Istirahat</Label>
                                <Input
                                    type="time"
                                    value={manualEntry.breakStart}
                                    onChange={(e) => setManualEntry(prev => ({ ...prev, breakStart: e.target.value }))}
                                    className="rounded-xl border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Selesai Istirahat</Label>
                                <Input
                                    type="time"
                                    value={manualEntry.breakEnd}
                                    onChange={(e) => setManualEntry(prev => ({ ...prev, breakEnd: e.target.value }))}
                                    className="rounded-xl border-gray-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Status Kehadiran</Label>
                            <Select
                                value={manualEntry.status}
                                onValueChange={(v) => setManualEntry(prev => ({ ...prev, status: v }))}
                            >
                                <SelectTrigger className="rounded-xl border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="present">Hadir</SelectItem>
                                    <SelectItem value="late">Telat</SelectItem>
                                    <SelectItem value="sick">Sakit</SelectItem>
                                    <SelectItem value="permission">Izin</SelectItem>
                                    <SelectItem value="cuti">Cuti</SelectItem>
                                    <SelectItem value="absent">Alpha</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Keterangan (Notes)</Label>
                            <Textarea
                                placeholder="Masukkan alasan atau catatan..."
                                value={manualEntry.notes}
                                onChange={(e) => setManualEntry(prev => ({ ...prev, notes: e.target.value }))}
                                className="rounded-xl border-gray-200 resize-none h-20"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setIsManualModalOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 font-bold"
                            onClick={() => {
                                if (!manualEntry.userId) return toast({ title: "Error", description: "Pilih karyawan terlebih dahulu", variant: "destructive" });
                                manualMutation.mutate({
                                    ...manualEntry,
                                    userId: parseInt(manualEntry.userId),
                                    date: manualEntry.date,
                                });
                            }}
                            disabled={manualMutation.isPending}
                        >
                            {manualMutation.isPending ? "Menyimpan..." : "Simpan Data"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent className="sm:max-w-xs bg-white rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-red-600">Hapus Data Absensi?</DialogTitle>
                        <DialogDescription>
                            Data absensi ini akan dihapus permanen dan tidak bisa dikembalikan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setDeleteConfirmId(null)}>
                            Batal
                        </Button>
                        <Button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 font-bold"
                            onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
