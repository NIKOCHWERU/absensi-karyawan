import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Attendance } from "@shared/schema";
import { format, subMonths, addMonths, isSameMonth, setDate, isAfter, isBefore, isEqual, startOfWeek, endOfWeek, startOfDay, endOfDay, subDays, addDays } from "date-fns";
import { id } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, FileDown, ArrowLeft, Search, ArrowUpDown, MessageSquare, Plus, Edit2, Trash2, Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { differenceInMinutes } from "date-fns";
import { calculateDailyTotal, calculateDuration, formatDuration, calculateDurationSeconds, formatDurationFull } from "@/lib/attendance";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const loadHtml2Pdf = () => {
    return new Promise<any>((resolve, reject) => {
        if ((window as any).html2pdf) {
            resolve((window as any).html2pdf);
            return;
        }
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        script.onload = () => resolve((window as any).html2pdf);
        script.onerror = () => reject(new Error("Gagal memuat script html2pdf"));
        document.head.appendChild(script);
    });
};

const loadJsZip = () => {
    return new Promise<any>((resolve, reject) => {
        if ((window as any).JSZip) {
            resolve((window as any).JSZip);
            return;
        }
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.onload = () => resolve((window as any).JSZip);
        script.onerror = () => reject(new Error("Gagal memuat script JSZip"));
        document.head.appendChild(script);
    });
};

const resolveFileUrl = (url: string | null): string => {
    if (!url) return "";
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return url.length > 20 && !url.includes('/') ? `/api/images/${url}` : `/uploads/${url}`;
};

export default function RecapPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState("");
    const [pageSplitMode, setPageSplitMode] = useState<"split" | "combine">("split");

    const [targetDate, setTargetDate] = useState(new Date());
    const [selectedPhotoRecord, setSelectedPhotoRecord] = useState<Attendance | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

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
        shift: "-"
    });

    const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly" | "custom">("monthly");
    const [customStartDate, setCustomStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

    let startDate: Date;
    let endDate: Date;

    if (reportType === "daily") {
        startDate = startOfDay(targetDate);
        endDate = endOfDay(targetDate);
    } else if (reportType === "weekly") {
        startDate = startOfWeek(targetDate, { weekStartsOn: 1 });
        endDate = endOfWeek(targetDate, { weekStartsOn: 1 });
    } else if (reportType === "custom") {
        startDate = startOfDay(new Date(customStartDate));
        endDate = endOfDay(new Date(customEndDate));
    } else {
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 26);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 25);
    }

    const { data: users } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
    });

    const { data: allAttendance } = useQuery<Attendance[]>({
        queryKey: [`/api/attendance?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`],
    });

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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchName, reportType, targetDate, customStartDate, customEndDate]);

    const getUserName = (userId: number) => {
        return users?.find(u => u.id === userId)?.fullName || null;
    };

    const filteredRecords = allAttendance?.filter(att => {
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
                const nameA = (getUserName(a.userId) || '').toLowerCase();
                const nameB = (getUserName(b.userId) || '').toLowerCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
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

    const totalPages = Math.ceil(processedData.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = processedData.slice(startIndex, startIndex + itemsPerPage);

    const toggleSort = (field: 'date' | 'name') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const safeFormatDate = (dateVal: any, formatStr: string, options?: any) => {
        try {
            if (!dateVal) return "";
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return "";
            return format(d, formatStr, options);
        } catch (e) {
            return "";
        }
    };

    const dailyTotals = new Map<string, { mins: number; complete: boolean }>();
    processedData.forEach(row => {
        const dateKey = safeFormatDate(row.date, "yyyy-MM-dd");
        const key = `${dateKey}-${row.userId}`;
        if (dateKey && !dailyTotals.has(key)) {
            const dayRecords = processedData.filter(r =>
                safeFormatDate(r.date, "yyyy-MM-dd") === dateKey &&
                r.userId === row.userId
            );
            const { netWorkMins, hasAllCheckOuts } = calculateDailyTotal(dayRecords);
            dailyTotals.set(key, { mins: netWorkMins, complete: hasAllCheckOuts });
        }
    });


    const manualMutation = useMutation({
        mutationFn: async (data: any) => {
            const isEdit = !!editingAttendance?.id;
            const url = isEdit ? `/api/admin/attendance/${editingAttendance!.id}` : "/api/admin/attendance/manual";
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
            toast({ title: "Berhasil", description: "Data absensi telah diperbarui." });
        },
        onError: (err: any) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
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
                shift: existing.shift || "-"
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
                shift: "-"
            });
        }
        setIsManualModalOpen(true);
    };

    const buildRecapReportHtml = ({
        docTitle,
        periodStr,
        namaPt,
        singkatanPt,
        alamatPt,
        logoDataUrl,
        usersList,
        processedData,
        startDate,
        endDate,
        imageCache = {},
        isPdf = false,
        pageSplitMode = "split"
    }: {
        docTitle: string;
        periodStr: string;
        namaPt: string;
        singkatanPt: string;
        alamatPt: string;
        logoDataUrl: string;
        usersList: any[];
        processedData: any[];
        startDate: Date;
        endDate: Date;
        imageCache?: Record<string, string>;
        isPdf?: boolean;
        pageSplitMode?: "split" | "combine";
    }) => {
        const escapeHTML = (value: any): string => {
            if (value === null || value === undefined) return "";
            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };

        const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const NAMA_BULAN = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];

        const formatTanggalIndo = (date: Date): string => {
            return `${NAMA_HARI[date.getDay()]}, ${date.getDate()} ${NAMA_BULAN[date.getMonth()]} ${date.getFullYear()}`;
        };

        const formatISO = (date: Date): string => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const d = String(date.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
        };

        const formatTimeDot = (dateVal: any): string => {
            if (!dateVal) return "-";
            try {
                return format(new Date(dateVal), "HH.mm");
            } catch (_) {
                return "-";
            }
        };

        const formatJamKerjaIndo = (minutes: number): string => {
            if (minutes <= 0) return "-";
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            if (h > 0 && m > 0) return `${h} jam ${m} menit`;
            if (h > 0) return `${h} jam 0 menit`;
            return `${m} menit`;
        };

        const normalisasiStatus = (status: string | null | undefined): string => {
            if (!status) return "HADIR";
            const s = String(status).trim().toUpperCase();
            if (s === "PRESENT") return "HADIR";
            if (s === "LATE") return "TELAT";
            if (s === "SICK") return "SAKIT";
            if (s === "PERMISSION") return "IZIN";
            if (s === "CUTI") return "CUTI";
            if (s === "ABSENT") return "ALPHA";
            return s;
        };

        const classStatus = (status: string): string => {
            switch (status) {
                case "HADIR": return "status-hadir";
                case "TELAT": return "status-telat";
                case "SAKIT": return "status-sakit";
                case "IZIN": return "status-izin";
                case "CUTI": return "status-cuti";
                case "ALPHA": return "status-alpha";
                default: return "status-lain";
            }
        };

        const allDates: Date[] = [];
        let curr = new Date(startDate);
        const end = new Date(endDate);
        curr.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        while (curr <= end) {
            allDates.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }

        const uniqueUserIds = Array.from(new Set(processedData.map(r => r.userId)));
        const employeeList = uniqueUserIds
            .map(uid => usersList?.find(u => u.id === uid))
            .filter(Boolean)
            .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'id'));

        let reportsHtml = "";

        if (employeeList.length === 0) {
            reportsHtml = `
                <div style="max-width:700px; margin:50px auto; padding:30px; background:white; border:1px solid #ddd; text-align:center;">
                    <h2>Belum ada data absensi</h2>
                    <p>Silakan masukkan data absensi untuk periode ini.</p>
                </div>
            `;
        } else {
            employeeList.forEach((emp, empIdx) => {
                const empName = (emp.fullName || '').toUpperCase();
                const empNik = emp.nik || emp.username || '';
                let jumlahHadir = 0;
                let jumlahTelat = 0;
                let jumlahTidakAbsen = 0;
                let jumlahSakit = 0;
                let jumlahIzin = 0;
                let totalMinsEmp = 0;

                let isiBaris = "";

                allDates.forEach((dateObj) => {
                    const dateIso = formatISO(dateObj);
                    const dayRecords = processedData.filter(
                        r => r.userId === emp.id && format(new Date(r.date), "yyyy-MM-dd") === dateIso
                    );

                    const photoList: { url: string; label: string }[] = [];
                    
                    if (dayRecords.length > 0) {
                        const rec = dayRecords[0];
                        if (rec.checkInPhoto) photoList.push({ url: rec.checkInPhoto, label: "Absen Masuk" });
                        if (rec.breakStartPhoto) photoList.push({ url: rec.breakStartPhoto, label: "Istirahat" });
                        if (rec.breakEndPhoto) photoList.push({ url: rec.breakEndPhoto, label: "Selesai Ist" });
                        if (rec.checkOutPhoto) photoList.push({ url: rec.checkOutPhoto, label: "Absen Pulang" });
                        if ((rec as any).lateReasonPhoto) photoList.push({ url: (rec as any).lateReasonPhoto, label: "Bukti Telat" });
                    }

                    let photoCellHtml = "";
                    if (photoList.length > 0) {
                        photoCellHtml = `<div class="photo-grid">` +
                            photoList.map(p => {
                                const rawUrl = p.url;
                                const resolved = resolveFileUrl(rawUrl);
                                const fullUrl = resolved.startsWith('http')
                                    ? resolved
                                    : `${window.location.origin}${resolved.startsWith('/') ? '' : '/'}${resolved}`;
                                const src = imageCache[rawUrl] || imageCache[resolved] || imageCache[fullUrl] || fullUrl;
                                return `
                                    <div class="photo-item">
                                        <img src="${escapeHTML(src)}" class="photo-img" alt="${escapeHTML(p.label)}" loading="eager" />
                                        <span class="photo-label">${escapeHTML(p.label)}</span>
                                    </div>
                                `;
                            }).join("") +
                            `</div>`;
                    } else {
                        photoCellHtml = `<span class="no-photo">-</span>`;
                    }

                    if (dayRecords.length === 0) {
                        jumlahTidakAbsen++;
                        isiBaris += `
                            <tr>
                                <td class="date-column">${formatTanggalIndo(dateObj)}</td>
                                <td>
                                    <div class="tidak-absen">TIDAK ABSEN</div>
                                </td>
                                <td>${photoCellHtml}</td>
                            </tr>
                        `;
                    } else {
                        const rec = dayRecords[0];
                        const statusNorm = normalisasiStatus(rec.status);
                        const kelas = classStatus(statusNorm);

                        if (statusNorm === "HADIR" || statusNorm === "TELAT") jumlahHadir++;
                        if (statusNorm === "TELAT") jumlahTelat++;
                        if (statusNorm === "SAKIT") jumlahSakit++;
                        if (statusNorm === "IZIN") jumlahIzin++;

                        const masuk = formatTimeDot(rec.checkIn);
                        const pulang = formatTimeDot(rec.checkOut);

                        const istirahatStart = formatTimeDot(rec.breakStart);
                        const istirahatEnd = formatTimeDot(rec.breakEnd);
                        let istirahatText = "";
                        if (istirahatStart !== "-" && istirahatEnd !== "-") {
                            istirahatText = `<strong>${istirahatStart} sampai ${istirahatEnd}</strong>`;
                        } else if (istirahatStart !== "-") {
                            istirahatText = `<strong>${istirahatStart} sampai -</strong>`;
                        }

                        const { netWorkMins } = calculateDailyTotal(dayRecords);
                        if (netWorkMins > 0) {
                            totalMinsEmp += netWorkMins;
                        }
                        const jamKerjaStr = netWorkMins > 0 ? formatJamKerjaIndo(netWorkMins) : "";

                        const lateReasonStr = rec.lateReason || (rec as any).late_reason || "";
                        const notesStr = rec.notes || "";

                        let cellHtml = `
                            <td>
                                <div class="${kelas}">${escapeHTML(statusNorm)}</div>
                        `;

                        if (masuk !== "-" || pulang !== "-") {
                            cellHtml += `
                                <div class="jam">Jam: <strong>${escapeHTML(masuk)} sampai ${escapeHTML(pulang)}</strong></div>
                            `;
                        }

                        if (istirahatText) {
                            cellHtml += `
                                <div class="jam-istirahat">Istirahat: ${istirahatText}</div>
                            `;
                        }

                        if (jamKerjaStr) {
                            cellHtml += `
                                <div class="jam-kerja">Jam kerja: <strong>${escapeHTML(jamKerjaStr)}</strong></div>
                            `;
                        }

                        if (lateReasonStr) {
                            cellHtml += `
                                <div class="alasan-telat"><strong>Alasan Telat:</strong> ${escapeHTML(lateReasonStr)}</div>
                            `;
                        }

                        if (notesStr) {
                            cellHtml += `
                                <div class="keterangan">${escapeHTML(notesStr)}</div>
                            `;
                        }

                        cellHtml += `</td>`;

                        isiBaris += `
                            <tr>
                                <td class="date-column">${formatTanggalIndo(dateObj)}</td>
                                ${cellHtml}
                                <td>${photoCellHtml}</td>
                            </tr>
                        `;
                    }
                });

                const totalHours = Math.floor(totalMinsEmp / 60);
                const totalMinsRem = totalMinsEmp % 60;
                const totalJamKerjaStr = totalMinsEmp > 0 ? `${totalHours} jam ${totalMinsRem} menit` : "-";

                reportsHtml += `
                    <section class="report">
                        <div class="letterhead">
                            ${logoDataUrl ? `<img src="${logoDataUrl}" class="logo-img" alt="Logo" />` : ''}
                            <div class="company-block">
                                <h1>${escapeHTML(namaPt)}</h1>
                                ${alamatPt ? `<p class="alamat">${escapeHTML(alamatPt)}</p>` : `<p class="alamat">Sistem Manajemen Kehadiran Digital</p>`}
                            </div>
                        </div>
                        <hr class="hr-thick" />
                        <hr class="hr-thin" />

                        <header class="header">
                            <div class="header-left">
                                <div class="company">${escapeHTML(singkatanPt)}</div>
                                <h1 class="title">LAPORAN KEHADIRAN TENAGA KERJA</h1>
                                <p class="period">Periode ${escapeHTML(periodStr)}</p>
                            </div>
                            <div class="header-right">
                                <h2 class="employee-name">${escapeHTML(empName)}</h2>
                                ${empNik ? `<div class="employee-nik">NIK: ${escapeHTML(empNik)}</div>` : ''}
                                <div class="report-number">No. ${empIdx + 1}</div>
                            </div>
                        </header>

                        <div class="summary">
                            <div class="summary-item">
                                <span class="summary-label">Hadir</span>
                                <span class="summary-value">${jumlahHadir} hari</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">Telat</span>
                                <span class="summary-value">${jumlahTelat} hari</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">Tidak Absen</span>
                                <span class="summary-value">${jumlahTidakAbsen} hari</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">Sakit</span>
                                <span class="summary-value">${jumlahSakit} hari</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">Izin</span>
                                <span class="summary-value">${jumlahIzin} hari</span>
                            </div>
                            <div class="summary-item summary-item-highlight">
                                <span class="summary-label">Total Jam Kerja</span>
                                <span class="summary-value summary-value-work">${totalJamKerjaStr}</span>
                            </div>
                        </div>

                        <table class="attendance-table">
                            <thead>
                                <tr>
                                    <th style="width: 20%;">TANGGAL</th>
                                    <th style="width: 45%;">KEHADIRAN</th>
                                    <th style="width: 35%;">BUKTI FOTO ( ABSEN )</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${isiBaris}
                            </tbody>
                        </table>
                    </section>
                `;
            });
        }

        return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(docTitle)}</title>
    <style>
        @page { size: A4 landscape; margin: 8mm 12mm 8mm 12mm; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body { background: #eeeeee; color: #0f172a; font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; }
        .report { 
            width: 100%; 
            max-width: 1050px; 
            margin: 10px auto 30px auto; 
            padding: 10px 14px; 
            background: #ffffff; 
            page-break-after: ${pageSplitMode === "split" ? "always" : "auto"}; 
            page-break-inside: avoid; 
            break-inside: avoid; 
            border-bottom: ${pageSplitMode === "combine" ? "3px double #94a3b8" : "none"};
            padding-bottom: ${pageSplitMode === "combine" ? "35px" : "10px"};
        }
        .report:last-child { 
            page-break-after: auto; 
            border-bottom: none;
            padding-bottom: 10px;
        }
        .letterhead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; min-height: 36px; }
        .logo-img { height: 36px; max-width: 110px; object-fit: contain; flex-shrink: 0; }
        .company-block { text-align: right; flex-grow: 1; margin-left: 12px; }
        .company-block h1 { font-size: 15px; font-weight: bold; text-transform: uppercase; margin-bottom: 1px; letter-spacing: 0.5px; }
        .company-block .alamat { font-size: 8.5px; font-weight: normal; color: #334155; line-height: 1.2; margin-top: 1px; }
        .hr-thick { border: none; border-top: 2px solid #0f172a; margin: 3px 0 1px; }
        .hr-thin { border: none; border-top: 1px solid #cbd5e1; margin-bottom: 6px; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.5px solid #0f172a; padding-bottom: 3px; margin-bottom: 6px; page-break-inside: avoid; }
        .header-left { text-align: left; }
        .header-right { text-align: right; }
        .company { margin-bottom: 1px; font-size: 7pt; font-weight: bold; letter-spacing: 1px; color: #475569; }
        .title { margin: 0; font-size: 9.5pt; font-weight: 800; color: #0f172a; }
        .period { margin: 1px 0 0; color: #475569; font-size: 7pt; }
        .employee-name { margin: 0 0 1px; font-size: 10.5pt; font-weight: 800; text-transform: uppercase; color: #0f172a; }
        .employee-nik { font-size: 7pt; color: #475569; margin-bottom: 1px; }
        .report-number { color: #64748b; font-size: 6.5pt; }
        .summary { display: flex; width: 100%; margin-bottom: 6px; border: 1px solid #cbd5e1; background: #f8fafc; page-break-inside: avoid; }
        .summary-item { flex: 1; padding: 2.5px 4px; border-right: 1px solid #cbd5e1; text-align: center; }
        .summary-item:last-child { border-right: none; }
        .summary-item-highlight { background: #f1f5f9; }
        .summary-label { display: block; margin-bottom: 1px; color: #64748b; font-size: 6pt; text-transform: uppercase; }
        .summary-value { font-size: 8pt; font-weight: bold; color: #0f172a; }
        .summary-value-work { color: #0f172a; font-weight: 800; }
        .attendance-table { width: 100%; border-collapse: collapse; table-layout: fixed; page-break-inside: auto; break-inside: auto; }
        .attendance-table thead { display: table-header-group; }
        .attendance-table tbody tr { page-break-inside: avoid !important; break-inside: avoid !important; break-inside: avoid-page !important; }
        .attendance-table th { background: #f1f5f9; border: 1px solid #94a3b8; padding: 3px 4px; text-align: left; font-size: 6.8pt; font-weight: 800; text-transform: uppercase; page-break-inside: avoid; }
        .attendance-table td { border: 1px solid #cbd5e1; padding: 2px 4px; vertical-align: middle; font-size: 6.5pt; line-height: 1.2; page-break-inside: avoid !important; break-inside: avoid !important; }
        .attendance-table tbody tr:nth-child(even) { background: #f8fafc; }
        .date-column { font-weight: bold; }
        .status-hadir { color: #0f172a; font-weight: bold; }
        .status-telat { color: #334155; font-weight: bold; }
        .status-sakit { color: #334155; font-weight: bold; }
        .status-izin { color: #334155; font-weight: bold; }
        .status-cuti { color: #334155; font-weight: bold; }
        .status-alpha { color: #0f172a; font-weight: bold; }
        .status-lain { color: #475569; font-weight: bold; }
        .tidak-absen { color: #0f172a; font-weight: bold; letter-spacing: .4px; margin-bottom: 2px; }
        .jam { color: #334155; margin-top: 1px; }
        .jam-istirahat { color: #475569; margin-top: 1px; font-weight: 500; }
        .jam-kerja { color: #475569; margin-top: 1px; }
        .alasan-telat { color: #475569; margin-top: 1px; font-size: 6pt; }
        .keterangan { color: #64748b; margin-top: 1px; font-size: 6pt; }
        .photo-grid { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; page-break-inside: avoid !important; break-inside: avoid !important; }
        .photo-item { display: flex; flex-direction: column; align-items: center; border: 1px solid #cbd5e1; border-radius: 3px; padding: 2px; background: #ffffff; width: 54px; page-break-inside: avoid !important; break-inside: avoid !important; }
        .photo-img { width: 48px; height: 44px; object-fit: cover; border-radius: 2px; }
        .photo-label { font-size: 5.2pt; font-weight: bold; color: #334155; margin-top: 1.5px; text-transform: uppercase; text-align: center; line-height: 1; white-space: nowrap; }
        .no-photo { color: #94a3b8; font-size: 6.5pt; text-align: center; display: block; }
        .print-container { position: fixed; top: 15px; right: 15px; z-index: 9999; }
        .print-button { border: none; padding: 10px 18px; background: #111827; color: white; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .print-button:hover { background: #374151; }
        .footer { margin-top: 8px; font-size: 7pt; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 3px; text-align: center; }
        @media screen { body { padding: 12px; } .report { box-shadow: 0 2px 10px rgba(0, 0, 0, .12); } }
        @media print {
            @page { size: A4 landscape; margin: 6mm 10mm 6mm 10mm; }
            body { background: white; padding: 0; margin: 0; font-size: 6.5pt; }
            .print-container, .footer { display: none !important; }
            .report { 
                width: 100% !important; 
                max-width: none !important; 
                min-height: auto !important; 
                margin: 0 0 10mm 0 !important; 
                padding: 2mm 4mm 6mm 4mm !important; 
                box-shadow: none !important; 
                page-break-after: ${pageSplitMode === "split" ? "always !important" : "auto !important"}; 
                page-break-inside: avoid !important; 
                break-inside: avoid !important; 
                border-bottom: ${pageSplitMode === "combine" ? "2px dashed #0f172a !important" : "none !important"}; 
            }
            .report:last-child { 
                border-bottom: none !important; 
                padding-bottom: 2mm !important; 
                margin-bottom: 0 !important; 
            }
            .attendance-table { page-break-inside: auto !important; break-inside: auto !important; }
            .attendance-table thead { display: table-header-group !important; }
            .attendance-table tbody tr { page-break-inside: avoid !important; break-inside: avoid !important; break-inside: avoid-page !important; }
            .attendance-table th { padding: 2px 4px !important; font-size: 6.5pt !important; }
            .attendance-table td { padding: 1.5px 4px !important; font-size: 6pt !important; line-height: 1.15 !important; page-break-inside: avoid !important; break-inside: avoid !important; }
            .photo-grid { page-break-inside: avoid !important; break-inside: avoid !important; }
            .photo-item { width: 48px !important; padding: 1.5px !important; page-break-inside: avoid !important; break-inside: avoid !important; }
            .photo-img { width: 43px !important; height: 40px !important; }
            .photo-label { font-size: 4.8pt !important; }
        }
    </style>
</head>
<body>
    ${!isPdf ? `<div class="print-container"><button class="print-button" onclick="window.print()">Cetak / Simpan PDF</button></div>` : ''}
    <div id="laporan">${reportsHtml}</div>
    <div class="footer">Dokumen ini dicetak secara otomatis oleh Sistem Absensi ${escapeHTML(namaPt.toUpperCase())} &mdash; ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: id })} WIB</div>
    ${!isPdf ? `<script>window.onload = function() { setTimeout(function() { window.print(); }, 600); };</script>` : ''}
</body>
</html>`;
    };

    const handleExportHtmlRekap = async () => {
        let periodStr = '';
        if (reportType === 'daily') {
            periodStr = format(targetDate, "dd MMMM yyyy", { locale: id }).toUpperCase();
        } else if (reportType === 'weekly') {
            periodStr = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy", { locale: id })}`.toUpperCase();
        } else if (reportType === 'custom') {
            periodStr = `${format(startDate, "dd MMM yyyy", { locale: id })} - ${format(endDate, "dd MMM yyyy", { locale: id })}`.toUpperCase();
        } else {
            periodStr = format(targetDate, "MMMM yyyy", { locale: id }).toUpperCase();
        }

        const fileName = `LAPORAN REKAP ABSENSI TENAGA KERJA PT EJA - ${periodStr}.html`;
        setIsExporting(true);
        setExportProgress("Memuat logo & gambar absensi untuk HTML...");
        try {
            let logoDataUrl = '';
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const logoRes = await fetch('/logo_elok_buah.jpg', { signal: controller.signal });
                clearTimeout(timeoutId);
                const logoBlob = await logoRes.blob();
                logoDataUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => resolve('');
                    reader.readAsDataURL(logoBlob);
                });
            } catch (_) {}

            const imageCache: Record<string, string> = {};
            const uniquePhotoUrls = new Set<string>();
            processedData.forEach(r => {
                if (r.checkInPhoto) uniquePhotoUrls.add(r.checkInPhoto);
                if (r.breakStartPhoto) uniquePhotoUrls.add(r.breakStartPhoto);
                if (r.breakEndPhoto) uniquePhotoUrls.add(r.breakEndPhoto);
                if (r.checkOutPhoto) uniquePhotoUrls.add(r.checkOutPhoto);
                if ((r as any).lateReasonPhoto) uniquePhotoUrls.add((r as any).lateReasonPhoto);
            });

            const compressBlobToThumbnailBase64 = (blob: Blob, maxW = 160, maxH = 140, quality = 0.75): Promise<string> => {
                return new Promise((resolve) => {
                    const img = new Image();
                    const url = URL.createObjectURL(blob);
                    img.onload = () => {
                        URL.revokeObjectURL(url);
                        let width = img.width;
                        let height = img.height;
                        if (width > height) {
                            if (width > maxW) {
                                height = Math.round((height * maxW) / width);
                                width = maxW;
                            }
                        } else {
                            if (height > maxH) {
                                width = Math.round((width * maxH) / height);
                                height = maxH;
                            }
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = Math.max(1, width);
                        canvas.height = Math.max(1, height);
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = () => resolve('');
                            reader.readAsDataURL(blob);
                            return;
                        }

                        ctx.drawImage(img, 0, 0, width, height);
                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(dataUrl);
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(url);
                        resolve('');
                    };
                    img.src = url;
                });
            };

            const urlArray = Array.from(uniquePhotoUrls);
            
            const fetchSingleImageBase64 = async (rawUrl: string, retries = 2) => {
                if (!rawUrl) return;
                if (rawUrl.startsWith('data:')) {
                    imageCache[rawUrl] = rawUrl;
                    return;
                }

                const resolved = resolveFileUrl(rawUrl);
                if (!resolved) return;

                const fullUrl = resolved.startsWith('http')
                    ? resolved
                    : `${window.location.origin}${resolved.startsWith('/') ? '' : '/'}${resolved}`;

                if (imageCache[rawUrl]) return;

                for (let i = 0; i <= retries; i++) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 6000);
                        const res = await fetch(fullUrl, { signal: controller.signal });
                        clearTimeout(timeoutId);

                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        const blob = await res.blob();
                        const b64 = await compressBlobToThumbnailBase64(blob, 160, 140, 0.75);
                        if (b64 && b64.startsWith('data:image')) {
                            imageCache[rawUrl] = b64;
                            imageCache[resolved] = b64;
                            imageCache[fullUrl] = b64;
                            return;
                        }
                    } catch (e) {
                        console.warn(`Preload image attempt ${i + 1} failed for ${fullUrl}:`, e);
                        if (i === retries) {
                            imageCache[rawUrl] = fullUrl;
                            imageCache[resolved] = fullUrl;
                        } else {
                            await new Promise(r => setTimeout(r, 400));
                        }
                    }
                }
            };

            const chunkSize = 8;
            for (let i = 0; i < urlArray.length; i += chunkSize) {
                const chunk = urlArray.slice(i, i + chunkSize);
                setExportProgress(`Memuat gambar absensi (${Math.min(i + chunkSize, urlArray.length)}/${urlArray.length})...`);
                await Promise.all(chunk.map(url => fetchSingleImageBase64(url)));
            }

            setExportProgress("Menyusun dokumen HTML...");
            const html = buildRecapReportHtml({
                docTitle: fileName,
                periodStr,
                namaPt: "PT Elok Jaya Abadhi",
                singkatanPt: "PT EJA",
                alamatPt: "Sistem Manajemen Kehadiran Digital",
                logoDataUrl,
                usersList: users || [],
                processedData,
                startDate,
                endDate,
                imageCache,
                isPdf: false,
                pageSplitMode
            });

            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            }, 5000);

            toast({ title: "✅ HTML Rekap Berhasil Diunduh", description: fileName });
        } catch (e: any) {
            toast({ title: "Gagal Export HTML Rekap", description: e.message, variant: "destructive" });
        } finally {
            setIsExporting(false);
            setExportProgress("");
        }
    };

    const handleExportPdf = async () => {
        let periodStr = '';
        if (reportType === 'daily') {
            periodStr = format(targetDate, "dd MMMM yyyy", { locale: id }).toUpperCase();
        } else if (reportType === 'weekly') {
            periodStr = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy", { locale: id })}`.toUpperCase();
        } else if (reportType === 'custom') {
            periodStr = `${format(startDate, "dd MMM yyyy", { locale: id })} - ${format(endDate, "dd MMM yyyy", { locale: id })}`.toUpperCase();
        } else {
            periodStr = format(targetDate, "MMMM yyyy", { locale: id }).toUpperCase();
        }

        const todayStamp = format(new Date(), "dd-MM-yyyy");
        const pdfFileName = `LAPORAN REKAP ABSENSI TENAGA KERJA PT EJA - ${periodStr} (${todayStamp}).pdf`;
        setIsExporting(true);
        setExportProgress("Memuat logo & gambar absensi untuk PDF...");
        try {
            let logoDataUrl = '';
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const logoRes = await fetch('/logo_elok_buah.jpg', { signal: controller.signal });
                clearTimeout(timeoutId);
                const logoBlob = await logoRes.blob();
                logoDataUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => resolve('');
                    reader.readAsDataURL(logoBlob);
                });
            } catch (_) {}

            const imageCache: Record<string, string> = {};
            const uniquePhotoUrls = new Set<string>();
            processedData.forEach(r => {
                if (r.checkInPhoto) uniquePhotoUrls.add(r.checkInPhoto);
                if (r.breakStartPhoto) uniquePhotoUrls.add(r.breakStartPhoto);
                if (r.breakEndPhoto) uniquePhotoUrls.add(r.breakEndPhoto);
                if (r.checkOutPhoto) uniquePhotoUrls.add(r.checkOutPhoto);
                if ((r as any).lateReasonPhoto) uniquePhotoUrls.add((r as any).lateReasonPhoto);
            });

            const compressBlobToThumbnailBase64 = (blob: Blob, maxW = 160, maxH = 140, quality = 0.75): Promise<string> => {
                return new Promise((resolve) => {
                    const img = new Image();
                    const url = URL.createObjectURL(blob);
                    img.onload = () => {
                        URL.revokeObjectURL(url);
                        let width = img.width;
                        let height = img.height;
                        if (width > height) {
                            if (width > maxW) {
                                height = Math.round((height * maxW) / width);
                                width = maxW;
                            }
                        } else {
                            if (height > maxH) {
                                width = Math.round((width * maxH) / height);
                                height = maxH;
                            }
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = Math.max(1, width);
                        canvas.height = Math.max(1, height);
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = () => resolve('');
                            reader.readAsDataURL(blob);
                            return;
                        }

                        ctx.drawImage(img, 0, 0, width, height);
                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(dataUrl);
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(url);
                        resolve('');
                    };
                    img.src = url;
                });
            };

            const urlArray = Array.from(uniquePhotoUrls);
            
            const fetchSingleImageBase64 = async (rawUrl: string, retries = 2) => {
                if (!rawUrl) return;
                if (rawUrl.startsWith('data:')) {
                    imageCache[rawUrl] = rawUrl;
                    return;
                }

                const resolved = resolveFileUrl(rawUrl);
                if (!resolved) return;

                const fullUrl = resolved.startsWith('http')
                    ? resolved
                    : `${window.location.origin}${resolved.startsWith('/') ? '' : '/'}${resolved}`;

                if (imageCache[rawUrl]) return;

                for (let i = 0; i <= retries; i++) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 6000);
                        const res = await fetch(fullUrl, { signal: controller.signal });
                        clearTimeout(timeoutId);

                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        const blob = await res.blob();
                        const b64 = await compressBlobToThumbnailBase64(blob, 160, 140, 0.75);
                        if (b64 && b64.startsWith('data:image')) {
                            imageCache[rawUrl] = b64;
                            imageCache[resolved] = b64;
                            imageCache[fullUrl] = b64;
                            return;
                        }
                    } catch (e) {
                        console.warn(`Preload image attempt ${i + 1} failed for ${fullUrl}:`, e);
                        if (i === retries) {
                            imageCache[rawUrl] = fullUrl;
                            imageCache[resolved] = fullUrl;
                        } else {
                            await new Promise(r => setTimeout(r, 400));
                        }
                    }
                }
            };

            const chunkSize = 8;
            for (let i = 0; i < urlArray.length; i += chunkSize) {
                const chunk = urlArray.slice(i, i + chunkSize);
                setExportProgress(`Memuat gambar absensi (${Math.min(i + chunkSize, urlArray.length)}/${urlArray.length})...`);
                await Promise.all(chunk.map(url => fetchSingleImageBase64(url)));
            }

            setExportProgress("Menyusun dokumen PDF...");
            const html = buildRecapReportHtml({
                docTitle: pdfFileName,
                periodStr,
                namaPt: "PT Elok Jaya Abadhi",
                singkatanPt: "PT EJA",
                alamatPt: "Sistem Manajemen Kehadiran Digital",
                logoDataUrl,
                usersList: users || [],
                processedData,
                startDate,
                endDate,
                imageCache,
                isPdf: true,
                pageSplitMode
            });

            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '1050px';
            container.style.backgroundColor = '#ffffff';
            container.innerHTML = html;
            document.body.appendChild(container);

            const imgs = Array.from(container.querySelectorAll('img'));
            await Promise.all(imgs.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(res => { img.onload = res; img.onerror = res; });
            }));

            const html2pdfLib = await loadHtml2Pdf();
            const opt = {
                margin: [5, 5, 5, 5],
                filename: pdfFileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 1050, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true },
                pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.attendance-table tbody tr', '.summary', '.header', '.photo-item'] }
            };
            await html2pdfLib().set(opt).from(container).save();
            document.body.removeChild(container);

            toast({ title: "✅ PDF Berhasil Diunduh", description: pdfFileName });
        } catch (e: any) {
            toast({ title: "Gagal Export PDF", description: e.message, variant: "destructive" });
        } finally {
            setIsExporting(false);
            setExportProgress("");
        }
    };

    const handleExport = async () => {
        let periodStr = '';
        if (reportType === 'daily') {
            periodStr = format(targetDate, "dd MMMM yyyy", { locale: id }).toUpperCase();
        } else if (reportType === 'weekly') {
            periodStr = `${format(startDate, "dd MMM")} - ${format(endDate, "dd MMM yyyy", { locale: id })}`.toUpperCase();
        } else if (reportType === 'custom') {
            periodStr = `${format(startDate, "dd MMM yyyy", { locale: id })} - ${format(endDate, "dd MMM yyyy", { locale: id })}`.toUpperCase();
        } else {
            periodStr = format(targetDate, "MMMM yyyy", { locale: id }).toUpperCase();
        }

        const fileName = `LAPORAN ABSENSI TENAGA KERJA PT EJA - ${periodStr}.html`;
        let logoDataUrl = '';
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const logoRes = await fetch('/logo_elok_buah.jpg', { signal: controller.signal });
            clearTimeout(timeoutId);
            
            const logoBlob = await logoRes.blob();
            logoDataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => resolve('');
                reader.readAsDataURL(logoBlob);
            });
        } catch (_) { }

        const html = `<!DOCTYPE html>
<html>
<head>
  <title>${fileName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1e293b; background: white; padding: 28px 36px; }
    .letterhead { display: flex; align-items: center; gap: 16px; padding-bottom: 10px; }
    .logo-img { width: 60px; height: 60px; object-fit: contain; }
    .company-block h1 { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; }
    .company-block .tagline { font-size: 10px; color: #64748b; margin-top: 2px; }
    .hr-thick { border: none; border-top: 2px solid #cbd5e1; margin: 6px 0 2px; }
    .hr-thin  { border: none; border-top: 1px solid #e2e8f0; margin-bottom: 18px; }
    .report-meta { text-align: center; margin-bottom: 20px; }
    .report-meta h2 { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #1e293b; }
    .report-meta .sub { font-size: 10.5px; margin-top: 4px; color: #475569; }
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
    .signature-section { margin-top: 48px; display: flex; justify-content: space-between; padding: 0 24px; }
    .sig-box { text-align: center; width: 160px; }
    .sig-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #374151; margin-bottom: 64px; }
    .sig-name { font-size: 11px; font-weight: 800; border-top: 1.5px solid #374151; padding-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; }
    .footer { margin-top: 18px; font-size: 8.5px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
    .btn-wrap { text-align: center; margin-top: 20px; }
    .download-btn { display: inline-flex; align-items: center; gap: 8px; background: #1d4ed8; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; text-decoration: none; }
    @media print {
      body { padding: 12px 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .btn-wrap { display: none !important; }
      tr { page-break-inside: avoid; }
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
    <p class="sub">Tipe: ${reportType === 'daily' ? 'Harian' : reportType === 'weekly' ? 'Mingguan' : reportType === 'custom' ? 'Kustom' : 'Bulanan'}</p>
    <p class="sub">Periode: ${format(startDate, "EEEE, d MMMM yyyy", { locale: id })} - ${format(endDate, "EEEE, d MMMM yyyy", { locale: id })}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th class="c" style="width:28px;">No</th>
        <th style="width:130px;">Hari & Tanggal</th>
        <th style="width:130px;">Nama Karyawan</th>
        <th class="c" style="width:62px;">Masuk</th>
        <th class="c" style="width:62px;">Istirahat</th>
        <th class="c" style="width:62px;">Selesai</th>
        <th class="c" style="width:62px;">Pulang</th>
        <th style="width:80px;">Jam Kerja</th>
        <th class="c" style="width:80px;">Total Istirahat</th>
        <th class="c" style="width:62px;">Status</th>
        <th>Keterangan</th>
      </tr>
    </thead>
    <tbody>
      ${processedData.map((row, index) => {
            const dateStr = format(new Date(row.date), "yyyy-MM-dd");
            const breakMins = calculateDuration(row.breakStart, row.breakEnd);
            const key = `${dateStr}-${row.userId}`;
            const dailyEntry = dailyTotals.get(key);
            const dailyTotalMins = dailyEntry?.mins ?? 0;
            const prevRow = index > 0 ? processedData[index - 1] : null;
            const isSameDayAndUser = !!(prevRow && format(new Date(prevRow.date), "yyyy-MM-dd") === dateStr && prevRow.userId === row.userId);
            const statusLabel = row.status === 'present' ? 'Hadir' : row.status === 'late' ? 'Telat' : row.status === 'sick' ? 'Sakit' : row.status === 'permission' ? 'Izin' : row.status === 'cuti' ? 'Cuti' : row.status === 'absent' ? 'Alpha' : (row.status || '-');
            const statusClass = row.status === 'present' ? 'st-hadir' : row.status === 'late' ? 'st-telat' : row.status === 'sick' ? 'st-sakit' : row.status === 'permission' ? 'st-izin' : row.status === 'cuti' ? 'st-cuti' : row.status === 'absent' ? 'st-alpha' : '';
            const inTime = row.checkIn ? format(new Date(row.checkIn), 'HH:mm') : '-';
            const brkTime = row.breakStart ? format(new Date(row.breakStart), 'HH:mm') : '-';
            const brkEnd = row.breakEnd ? format(new Date(row.breakEnd), 'HH:mm') : '-';
            const outTime = row.checkOut ? format(new Date(row.checkOut), 'HH:mm') : '-';
            const isNoBreak = (inTime !== '-' && outTime !== '-' && brkTime === '-' && brkEnd === '-');
            const jamKerja = !isSameDayAndUser ? (dailyTotalMins > 0 ? formatDuration(dailyTotalMins) : '-') : '';
            let keterangan = row.notes ? row.notes : '-';
            if (!row.checkOut) keterangan = row.notes ? row.notes + ' <br><span class="note-warn">(Belum Pulang)</span>' : '<span class="note-warn">Belum Pulang</span>';
            else if (isNoBreak) keterangan = row.notes ? row.notes + ' <br><span class="note-warn">(Tanpa Istirahat)</span>' : '<span class="note-warn">Tanpa Istirahat</span>';
            const lateNote = row.status === 'late' && (row as any).lateReason ? `<br><span class="note-late">[Telat: ${(row as any).lateReason}]</span>` : '';
            return `<tr>
          <td class="col-no">${isSameDayAndUser ? '<span style="color:#cbd5e1;">↳</span>' : (index + 1)}</td>
          <td class="col-date" style="font-size:9.5px;">${isSameDayAndUser ? '' : format(new Date(row.date), 'EEEE, d MMMM yyyy', { locale: id })}</td>
          <td class="col-name">
              ${isSameDayAndUser ? '' : `
                   <div style="line-height:1.2;">
                      <b style="color:#1d4ed8;font-size:11.5px;">${getUserName(row.userId) || '-'}</b><br/>
                      ${(row.shift && row.shift.toLowerCase().trim() !== '-' && row.shift.toLowerCase().trim() !== 'management') 
                          ? `<span style="color:#16a34a;font-size:9px;font-weight:bold;text-transform:uppercase;">${row.shift}</span><br/>` 
                          : '<span style="color:#94a3b8;font-size:9px;font-style:italic;">Belum Tercatat</span><br/>'}
                      <span style="color:#64748b;font-size:9px;">NIK: ${users?.find(u => u.id === row.userId)?.nik || users?.find(u => u.id === row.userId)?.username || '-'}</span>
                  </div>
              `}
          </td>
          <td class="col-time ${inTime === '-' ? 't-dash' : 't-in'}">${inTime}</td>
          <td class="col-time ${brkTime === '-' ? 't-dash' : 't-brk'}">${brkTime}</td>
          <td class="col-time ${brkEnd === '-' ? 't-dash' : 't-brk'}">${brkEnd}</td>
          <td class="col-time ${outTime === '-' ? 't-dash' : 't-out'}">${outTime}</td>
          <td class="col-work">${jamKerja}</td>
          <td class="col-brk">${breakMins > 0 ? formatDuration(breakMins) : '-'}</td>
          <td class="col-stat"><span class="${statusClass}">${statusLabel}</span></td>
          <td class="col-note">${keterangan}${lateNote}</td>
        </tr>`;
        }).join('')}
    </tbody>
  </table>
  ${(() => {
                const usersSummary = new Map<number, { name: string, totalMins: number, breakdown: string[] }>();
                const recordsByUser = new Map<number, typeof processedData>();
                processedData.forEach(r => {
                    if (!recordsByUser.has(r.userId)) recordsByUser.set(r.userId, []);
                    recordsByUser.get(r.userId)!.push(r);
                });
                recordsByUser.forEach((records, userId) => {
                    const name = getUserName(userId) || '-';
                    const userSummary = { name, totalMins: 0, breakdown: [] as string[] };
                    const recordsByDay = new Map<string, typeof processedData>();
                    records.forEach(r => {
                        const d = format(new Date(r.date), "yyyy-MM-dd");
                        if (!recordsByDay.has(d)) recordsByDay.set(d, []);
                        recordsByDay.get(d)!.push(r);
                    });
                    const days = Array.from(recordsByDay.keys()).sort();
                    days.forEach(day => {
                        const dayRecords = recordsByDay.get(day)!;
                        const hasIn = dayRecords.some(r => r.checkIn);
                        const hasOut = dayRecords.some(r => r.checkOut);
                        const dateStr = format(new Date(day), "EEEE, d MMMM yyyy", { locale: id });
                        if (hasIn && hasOut) {
                            const { netWorkMins } = calculateDailyTotal(dayRecords);
                            userSummary.totalMins += netWorkMins;
                            const firstIn = dayRecords.map(r => r.checkIn).filter(Boolean).sort()[0];
                            const lastOut = dayRecords.map(r => r.checkOut).filter(Boolean).sort().reverse()[0];
                            const totalBreakMins = dayRecords.reduce((sum, r) => sum + (r.breakStart && r.breakEnd ? calculateDuration(r.breakStart, r.breakEnd) : 0), 0);
                            const brkStr = totalBreakMins > 0 ? formatDuration(totalBreakMins) : `0 jam (Tanpa Istirahat)`;
                            userSummary.breakdown.push(`<span style="color:#1e293b;font-weight:600;">${dateStr}</span> : Kerja jam ${format(new Date(firstIn!), "HH.mm")} - ${format(new Date(lastOut!), "HH.mm")} istirahat ${brkStr} (Total: ${formatDuration(netWorkMins)})`);
                        } else {
                            userSummary.breakdown.push(`<span style="color:#dc2626;font-weight:600;">${dateStr}</span> : <span style="color:#b91c1c;">Absensi tidak lengkap</span>`);
                        }
                    });
                    usersSummary.set(userId, userSummary);
                });
                let sumHtml = `<div style="page-break-before: always; padding-top: 20px;">
              <div class="report-meta">
                <h2>Rekapitulasi Total Jam Kerja</h2>
                <p class="sub">Periode: ${periodStr}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th class="c" style="width:40px;">No</th>
                    <th style="width:180px;">Nama Karyawan</th>
                    <th class="c" style="width:100px;">Total Jam Kerja</th>
                    <th>Rincian Harian</th>
                  </tr>
                </thead>
                <tbody>`;
                let sumIdx = 1;
                usersSummary.forEach((summary) => {
                    sumHtml += `<tr>
                    <td class="col-no">${sumIdx++}</td>
                    <td class="col-name">${summary.name}</td>
                    <td class="c" style="font-weight:bold;font-size:12px;">${summary.totalMins > 0 ? formatDuration(summary.totalMins) : "-"}</td>
                    <td style="font-size:10.5px;line-height:1.6;padding-bottom:12px;padding-top:12px;white-space:normal;">${summary.breakdown.join('<br>')}</td>
                  </tr>`;
                });
                sumHtml += `</tbody></table></div>`;
                return sumHtml;
            })()}
  <div class="signature-section">
    <div class="sig-box"><p class="sig-label">Checked By</p><div class="sig-name">NIKO</div></div>
    <div class="sig-box"><p class="sig-label">Approved By</p><div class="sig-name">CLAVERINA</div></div>
  </div>
  <div class="footer">Dokumen ini dicetak secara otomatis oleh Sistem Absensi PT ELOK JAYA ABADHI &mdash; ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: id })} WIB</div>
  <div class="btn-wrap"><a id="dl-btn" class="download-btn" href="#">&#11015;&nbsp; Download File</a></div>
  <script>
    var _fn = "${fileName}";
    document.title = _fn;
    window.onload = function() {
      var btn = document.getElementById('dl-btn');
      if (btn) { btn.href = window.location.href; btn.download = _fn; }
      setTimeout(function() { window.print(); }, 600);
    };
  </script>
</body>
</html>`;
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        }, 5000);
    };

    const handleBulkExport = async () => {
        const dates: Date[] = [];
        let curr = new Date(startDate);
        const end = new Date(endDate);
        while (curr <= end) {
            dates.push(new Date(curr));
            curr = addDays(curr, 1);
        }

        if (dates.length === 0) {
            toast({
                title: "Info",
                description: "Tidak ada data untuk rentang tanggal yang dipilih.",
            });
            return;
        }

        setIsExporting(true);
        
        let html2pdf: any;
        let JSZip: any;
        try {
            html2pdf = await loadHtml2Pdf();
            JSZip = await loadJsZip();
        } catch (err) {
            toast({
                title: "Error",
                description: "Gagal memuat engine pembuat PDF atau ZIP.",
                variant: "destructive"
            });
            setIsExporting(false);
            return;
        }

        toast({
            title: "Export Massal Dimulai",
            description: `Mengekspor ${dates.length} laporan harian dalam format PDF ke dalam file ZIP. Mohon tunggu...`,
        });

        const zip = new JSZip();

        let logoDataUrl = '';
        try {
            const logoRes = await fetch('/logo_elok_buah.jpg');
            const logoBlob = await logoRes.blob();
            logoDataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(logoBlob);
            });
        } catch (_) { }

        for (let i = 0; i < dates.length; i++) {
            const d1 = dates[i];
            const d2 = addDays(d1, 1);
            
            const dayStr1 = format(d1, "d");
            const monthStr1 = format(d1, "MMMM", { locale: id }).toUpperCase();
            const dayStr2 = format(d2, "d");
            const monthStr2 = format(d2, "MMMM", { locale: id }).toUpperCase();
            const yearStr = format(d1, "yyyy");
            
            const docTitle = `REKAP ABSENSI NON MANAJEMEN ${dayStr1} ${monthStr1} - ${dayStr2} ${monthStr2} ${yearStr} PT EJA`;

            const dayRecords = allAttendance?.filter(row => {
                if (!getUserName(row.userId)) return false;
                const rowDate = new Date(row.date);
                return format(rowDate, "yyyy-MM-dd") === format(d1, "yyyy-MM-dd");
            }) || [];

            const filteredDayRecords = dayRecords
                .filter(row => {
                    const name = (getUserName(row.userId) || '').toLowerCase();
                    return name.includes(searchName.toLowerCase());
                })
                .sort((a, b) => {
                    const nameA = (getUserName(a.userId) || '').toLowerCase();
                    const nameB = (getUserName(b.userId) || '').toLowerCase();
                    if (nameA < nameB) return -1;
                    if (nameA > nameB) return 1;
                    return 0;
                });

            const localDailyTotals = new Map<string, { mins: number; complete: boolean }>();
            filteredDayRecords.forEach(row => {
                const dateKey = format(new Date(row.date), "yyyy-MM-dd");
                const key = `${dateKey}-${row.userId}`;
                if (!localDailyTotals.has(key)) {
                    const userDayRecords = filteredDayRecords.filter(r => r.userId === row.userId);
                    const { netWorkMins, hasAllCheckOuts } = calculateDailyTotal(userDayRecords);
                    localDailyTotals.set(key, { mins: netWorkMins, complete: hasAllCheckOuts });
                }
            });

            const html = `<!DOCTYPE html>
<html>
<head>
  <title>${docTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { display: none !important; }
    .pdf-content { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1e293b; background: white; padding: 15px; width: 794px; box-sizing: border-box; }
    .letterhead { display: flex; align-items: center; gap: 16px; padding-bottom: 10px; }
    .logo-img { width: 60px; height: 60px; object-fit: contain; }
    .company-block h1 { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; }
    .company-block .tagline { font-size: 10px; color: #64748b; margin-top: 2px; }
    .hr-thick { border: none; border-top: 2px solid #cbd5e1; margin: 6px 0 2px; }
    .hr-thin  { border: none; border-top: 1px solid #e2e8f0; margin-bottom: 18px; }
    .report-meta { text-align: center; margin-bottom: 20px; }
    .report-meta h2 { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #1e293b; }
    .report-meta .sub { font-size: 10.5px; margin-top: 4px; color: #475569; }
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
    .signature-section { margin-top: 48px; display: flex; justify-content: space-between; padding: 0 24px; }
    .sig-box { text-align: center; width: 160px; }
    .sig-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #374151; margin-bottom: 64px; }
    .sig-name { font-size: 11px; font-weight: 800; border-top: 1.5px solid #374151; padding-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; }
    .footer { margin-top: 18px; font-size: 8.5px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
    .btn-wrap { text-align: center; margin-top: 20px; }
    .download-btn { display: inline-flex; align-items: center; gap: 8px; background: #1d4ed8; color: #fff; border: none; padding: 10px 28px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; text-decoration: none; }
    @media print {
      body { padding: 12px 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .btn-wrap { display: none !important; }
      tr { page-break-inside: avoid; }
    }
  </style>
  <div class="pdf-content">
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
      <h2>Laporan Rekapitulasi Absensi Harian</h2>
      <p class="sub">Periode: ${format(d1, "EEEE, d MMMM yyyy", { locale: id })}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th class="c" style="width:28px;">No</th>
          <th style="width:130px;">Hari & Tanggal</th>
          <th style="width:130px;">Nama Karyawan</th>
          <th class="c" style="width:62px;">Masuk</th>
          <th class="c" style="width:62px;">Istirahat</th>
          <th class="c" style="width:62px;">Selesai</th>
          <th class="c" style="width:62px;">Pulang</th>
          <th style="width:80px;">Jam Kerja</th>
          <th class="c" style="width:80px;">Total Istirahat</th>
          <th class="c" style="width:62px;">Status</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody>
        ${filteredDayRecords.length === 0 ? `
          <tr>
            <td colSpan="11" style="text-align:center;padding:20px;color:#94a3b8;">Tidak ada data absensi untuk hari ini.</td>
          </tr>
        ` : filteredDayRecords.map((row, index) => {
              const dateStr = format(new Date(row.date), "yyyy-MM-dd");
              const breakMins = calculateDuration(row.breakStart, row.breakEnd);
              const key = `${dateStr}-${row.userId}`;
              const dailyEntry = localDailyTotals.get(key);
              const dailyTotalMins = dailyEntry?.mins ?? 0;
              const prevRow = index > 0 ? filteredDayRecords[index - 1] : null;
              const isSameDayAndUser = !!(prevRow && format(new Date(prevRow.date), "yyyy-MM-dd") === dateStr && prevRow.userId === row.userId);
              const statusLabel = row.status === 'present' ? 'Hadir' : row.status === 'late' ? 'Telat' : row.status === 'sick' ? 'Sakit' : row.status === 'permission' ? 'Izin' : row.status === 'cuti' ? 'Cuti' : row.status === 'absent' ? 'Alpha' : (row.status || '-');
              const statusClass = row.status === 'present' ? 'st-hadir' : row.status === 'late' ? 'st-telat' : row.status === 'sick' ? 'st-sakit' : row.status === 'permission' ? 'st-izin' : row.status === 'cuti' ? 'st-cuti' : row.status === 'absent' ? 'st-alpha' : '';
              const inTime = row.checkIn ? format(new Date(row.checkIn), 'HH:mm') : '-';
              const brkTime = row.breakStart ? format(new Date(row.breakStart), 'HH:mm') : '-';
              const brkEnd = row.breakEnd ? format(new Date(row.breakEnd), 'HH:mm') : '-';
              const outTime = row.checkOut ? format(new Date(row.checkOut), 'HH:mm') : '-';
              const isNoBreak = (inTime !== '-' && outTime !== '-' && brkTime === '-' && brkEnd === '-');
              const jamKerja = !isSameDayAndUser ? (dailyTotalMins > 0 ? formatDuration(dailyTotalMins) : '-') : '';
              let keterangan = row.notes ? row.notes : '-';
              if (!row.checkOut) keterangan = row.notes ? row.notes + ' <br><span class="note-warn">(Belum Pulang)</span>' : '<span class="note-warn">Belum Pulang</span>';
              else if (isNoBreak) keterangan = row.notes ? row.notes + ' <br><span class="note-warn">(Tanpa Istirahat)</span>' : '<span class="note-warn">Tanpa Istirahat</span>';
              const lateNote = row.status === 'late' && (row as any).lateReason ? `<br><span class="note-late">[Telat: ${(row as any).lateReason}]</span>` : '';
              return `<tr>
            <td class="col-no">${isSameDayAndUser ? '<span style="color:#cbd5e1;">↳</span>' : (index + 1)}</td>
            <td class="col-date" style="font-size:9.5px;">${isSameDayAndUser ? '' : format(new Date(row.date), 'EEEE, d MMMM yyyy', { locale: id })}</td>
            <td class="col-name">
                ${isSameDayAndUser ? '' : `
                     <div style="line-height:1.2;">
                         <b style="color:#1d4ed8;font-size:11.5px;">${getUserName(row.userId) || '-'}</b><br/>
                         ${(row.shift && row.shift.toLowerCase().trim() !== '-' && row.shift.toLowerCase().trim() !== 'management') 
                             ? `<span style="color:#16a34a;font-size:9px;font-weight:bold;text-transform:uppercase;">${row.shift}</span><br/>` 
                             : '<span style="color:#94a3b8;font-size:9px;font-style:italic;">Belum Tercatat</span><br/>'}
                         <span style="color:#64748b;font-size:9px;">NIK: ${users?.find(u => u.id === row.userId)?.nik || users?.find(u => u.id === row.userId)?.username || '-'}</span>
                     </div>
                `}
            </td>
            <td class="col-time ${inTime === '-' ? 't-dash' : 't-in'}">${inTime}</td>
            <td class="col-time ${brkTime === '-' ? 't-dash' : 't-brk'}">${brkTime}</td>
            <td class="col-time ${brkEnd === '-' ? 't-dash' : 't-brk'}">${brkEnd}</td>
            <td class="col-time ${outTime === '-' ? 't-dash' : 't-out'}">${outTime}</td>
            <td class="col-work">${jamKerja}</td>
            <td class="col-brk">${breakMins > 0 ? formatDuration(breakMins) : '-'}</td>
            <td class="col-stat"><span class="${statusClass}">${statusLabel}</span></td>
            <td class="col-note">${keterangan}${lateNote}</td>
          </tr>`;
          }).join('')}
      </tbody>
    </table>
    <div class="signature-section">
      <div class="sig-box"><p class="sig-label">Checked By</p><div class="sig-name">NIKO</div></div>
      <div class="sig-box"><p class="sig-label">Approved By</p><div class="sig-name">CLAVERINA</div></div>
    </div>
    <div class="footer">Dokumen ini dicetak secara otomatis oleh Sistem Absensi PT ELOK JAYA ABADHI &mdash; ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: id })} WIB</div>
  </div>
`;

            const opt = {
                margin:       [4, 8, 4, 8],
                filename:     `${docTitle}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0, windowWidth: 794 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['css', 'legacy'] }
            };

            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '0';
            container.style.top = '0';
            container.style.zIndex = '9999';
            container.style.width = '794px';
            container.style.backgroundColor = '#ffffff';
            container.style.pointerEvents = 'none';
            container.style.opacity = '1';
            container.innerHTML = html;

            document.body.appendChild(container);
            await new Promise(r => setTimeout(r, 150));

            try {
                const blob = await html2pdf().set(opt).from(container).output('blob');
                zip.file(`${docTitle}.pdf`, blob);
            } catch (e) {
                console.error("Gagal membuat PDF untuk tanggal", d1, e);
            }

            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }

            await new Promise(resolve => setTimeout(resolve, 600));
        }

        try {
            toast({
                title: "Mengompresi File",
                description: "Menyatukan semua laporan PDF ke dalam satu file ZIP...",
            });
            const zipContent = await zip.generateAsync({ type: "blob" });
            const zipUrl = URL.createObjectURL(zipContent);
            const a = document.createElement("a");
            a.href = zipUrl;
            const startStr = format(dates[0], "yyyyMMdd");
            const endStr = format(dates[dates.length - 1], "yyyyMMdd");
            a.download = `REKAP_ABSENSI_MASSAL_${startStr}_to_${endStr}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(zipUrl);
            toast({
                title: "Ekspor Selesai",
                description: "File ZIP berhasil diunduh.",
            });
        } catch (zipErr: any) {
            console.error("Gagal membuat file ZIP", zipErr);
            toast({
                title: "Error",
                description: "Gagal membuat file ZIP: " + zipErr.message,
                variant: "destructive"
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full">
            
            <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Rekap Kehadiran Karyawan</h1>
                    <p className="text-sm text-gray-500">Ekspor laporan rekap kehadiran bulanan secara lengkap untuk penggajian.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={reportType} onValueChange={(val: any) => setReportType(val)}>
                        <SelectTrigger className="w-[140px] bg-white h-10 font-medium">
                            <SelectValue placeholder="Pilih Periode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Harian</SelectItem>
                            <SelectItem value="weekly">Mingguan</SelectItem>
                            <SelectItem value="monthly">Bulanan</SelectItem>
                            <SelectItem value="custom">Rentang Khusus</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    {reportType === "custom" ? (
                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 h-10">
                            <Input 
                                type="date" 
                                className="h-8 text-xs border-none w-36 focus-visible:ring-0 shadow-none" 
                                value={customStartDate} 
                                onChange={(e) => setCustomStartDate(e.target.value)} 
                                                    />
                            <span className="text-gray-400 font-bold">-</span>
                            <Input 
                                type="date" 
                                className="h-8 text-xs border-none w-36 focus-visible:ring-0 shadow-none" 
                                value={customEndDate} 
                                onChange={(e) => setCustomEndDate(e.target.value)} 
                                                    />
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 h-10">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" onClick={handlePrev}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-bold px-2 min-w-[180px] text-center text-gray-700">
                                {reportType === 'daily' 
                                    ? format(targetDate, "dd MMM yyyy", { locale: id })
                                    : reportType === 'weekly'
                                    ? `${format(startOfWeek(targetDate, { weekStartsOn: 1 }), "dd MMM")} - ${format(endOfWeek(targetDate, { weekStartsOn: 1 }), "dd MMM")}`
                                    : format(targetDate, "MMM yyyy", { locale: id })
                                }
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" onClick={handleNext}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded-xl overflow-hidden mb-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 bg-white py-4 px-6">
                        <div className="space-y-1">
                            <div className="text-lg font-bold">Laporan Kehadiran</div>
                            <p className="text-sm text-gray-500">
                                Periode: {format(startDate, "EEEE, d MMMM yyyy", { locale: id })} - {format(endDate, "EEEE, d MMMM yyyy", { locale: id })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input placeholder="Cari nama..." className="pl-9 h-10" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
                            </div>
                            <Select value={pageSplitMode} onValueChange={(val: any) => setPageSplitMode(val)}>
                                <SelectTrigger className="w-[170px] bg-white h-10 font-medium">
                                    <SelectValue placeholder="Tata Letak Halaman" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="split">Pisah Per Karyawan</SelectItem>
                                    <SelectItem value="combine">Gabung Halaman</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" className="gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 h-10 font-bold" onClick={() => handleOpenManualModal()}>
                                <Plus className="h-4 w-4" /> Input Manual
                            </Button>
                            {reportType === "custom" && (
                                <Button 
                                    variant="outline" 
                                    className="gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 h-10 font-bold shadow-sm" 
                                    onClick={handleBulkExport}
                                    disabled={isExporting}
                                >
                                    <FileDown className="h-4 w-4" /> {isExporting ? "Mengekspor..." : "Export Harian Massal"}
                                </Button>
                            )}
                            <Button variant="outline" className="gap-2 h-10 font-bold shadow-sm" onClick={handleExport}>
                                <FileDown className="h-4 w-4" /> Export HTML
                            </Button>
                            <Button 
                                variant="outline" 
                                className="gap-2 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 h-10 font-bold shadow-sm" 
                                onClick={handleExportHtmlRekap}
                                disabled={isExporting}
                            >
                                <FileDown className="h-4 w-4" /> {isExporting ? "Mengekspor..." : "Export HTML Rekap"}
                            </Button>
                            <Button 
                                variant="outline" 
                                className="gap-2 bg-red-50 text-red-700 border-red-200 hover:bg-red-100 h-10 font-bold shadow-sm" 
                                onClick={handleExportPdf}
                                disabled={isExporting}
                            >
                                <FileDown className="h-4 w-4" /> {isExporting ? "Mengekspor..." : "Export PDF Rekap"}
                            </Button>
                        </div>
                    </div>
                    <div className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-gray-50/50 text-gray-500 font-bold uppercase text-[10px] tracking-widest border-b">
                                    <tr>
                                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('date')}>TANGGAL <ArrowUpDown className="h-3 w-3 inline ml-1" /></th>
                                        <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => toggleSort('name')}>NAMA KARYAWAN <ArrowUpDown className="h-3 w-3 inline ml-1" /></th>
                                        <th className="px-6 py-4 text-center">MASUK</th>
                                        <th className="px-6 py-4 text-center">ISTIRAHAT</th>
                                        <th className="px-6 py-4 text-center">SELESAI</th>
                                        <th className="px-6 py-4 text-center">PULANG</th>
                                        <th className="px-6 py-4">JAM KERJA</th>
                                        <th className="px-6 py-4 text-center">DURASI ISTIRAHAT</th>
                                        <th className="px-6 py-4 text-center">STATUS</th>
                                        <th className="px-6 py-4">AKSI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedData.map((row, relativeIndex) => {
                                        const index = startIndex + relativeIndex;
                                        const { netWorkMins: sessionNetMins } = calculateDailyTotal([row]);
                                        const dateStr = safeFormatDate(row.date, "yyyy-MM-dd");
                                        const key = `${dateStr}-${row.userId}`;
                                        const prevRow = index > 0 ? processedData[index - 1] : null;
                                        const isSameDayAndUser = prevRow && safeFormatDate(prevRow.date, "yyyy-MM-dd") === dateStr && prevRow.userId === row.userId;

                                        return (
                                            <tr key={row.id} className="hover:bg-gray-50/30 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-gray-500 text-[10px]">
                                                    {isSameDayAndUser ? <span className="ml-4 text-gray-300">↳</span> : safeFormatDate(row.date, "EEEE, d MMMM yyyy", { locale: id })}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900 capitalize">
                                                    {isSameDayAndUser ? "" : (
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900">{getUserName(row.userId)}</span>
                                                            {row.shift && row.shift.toLowerCase().trim() !== '-' && row.shift.toLowerCase().trim() !== 'management' ? (
                                                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-tight">{row.shift}</span>
                                                            ) : (
                                                                <span className="text-[10px] italic text-gray-400 font-medium uppercase tracking-tight">Belum Tercatat</span>
                                                            )}
                                                            <span className="text-[10px] text-gray-400 font-medium">NIK: {users?.find(u => u.id === row.userId)?.nik || users?.find(u => u.id === row.userId)?.username}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono font-bold text-emerald-600">
                                                    {row.checkIn ? safeFormatDate(row.checkIn, "HH:mm") : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono font-bold text-amber-600">
                                                    {row.breakStart ? safeFormatDate(row.breakStart, "HH:mm") : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono font-bold text-blue-600">
                                                    {row.breakEnd ? safeFormatDate(row.breakEnd, "HH:mm") : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono font-bold text-rose-600">
                                                    {row.checkOut ? safeFormatDate(row.checkOut, "HH:mm") : "-"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {!isSameDayAndUser && (
                                                        <div className="font-black text-gray-800">
                                                            {(dailyTotals.get(key)?.mins ?? 0) > 0 ? formatDuration(dailyTotals.get(key)?.mins ?? 0) : "-"}
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                                        Sesi: {formatDuration(sessionNetMins)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs font-medium text-gray-500">
                                                    {row.breakStart && row.breakEnd ? formatDurationFull(calculateDurationSeconds(row.breakStart, row.breakEnd)) : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider
                                                        ${row.status === 'present' ? 'text-emerald-700' :
                                                            row.status === 'late' ? 'text-amber-700' :
                                                                row.status === 'sick' ? 'text-blue-700' :
                                                                    row.status === 'permission' ? 'text-purple-700' :
                                                                        row.status === 'cuti' ? 'text-teal-700' :
                                                                            'text-gray-600'}`}>
                                                        {row.status === 'present' ? 'Hadir' : row.status === 'late' ? 'Telat' : row.status === 'sick' ? 'Sakit' : row.status === 'permission' ? 'Izin' : row.status === 'cuti' ? 'Cuti' : row.status === 'absent' ? 'Alpha' : row.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => handleOpenManualModal(row)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => setDeleteConfirmId(row.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                        {((row as any).checkInPhoto || (row as any).checkOutPhoto || (row as any).lateReasonPhoto) && (
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => setSelectedPhotoRecord(row)}><Camera className="h-3.5 w-3.5" /></Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-white px-6 py-4">
                                <div className="text-sm text-gray-500 font-medium">
                                    Menampilkan <span className="font-bold text-gray-800">{startIndex + 1}</span> - <span className="font-bold text-gray-800">{Math.min(startIndex + itemsPerPage, processedData.length)}</span> dari <span className="font-bold text-gray-800">{processedData.length}</span> baris
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 rounded-lg font-bold"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Sebelumnya
                                    </Button>
                                    <div className="text-sm font-bold px-3 text-gray-700 min-w-[120px] text-center">
                                        Halaman {currentPage} dari {totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 rounded-lg font-bold"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Selanjutnya
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

            <Dialog open={!!selectedPhotoRecord} onOpenChange={(open) => !open && setSelectedPhotoRecord(null)}>
                <DialogContent className="sm:max-w-md bg-white rounded-xl p-6 overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-blue-600 uppercase">Bukti Foto Absensi</DialogTitle>
                    </DialogHeader>
                    {selectedPhotoRecord && (
                        <div className="space-y-4 mt-2">
                            {[
                                { photo: 'checkInPhoto', label: 'Check-In Masuk' },
                                { photo: 'breakStartPhoto', label: 'Istirahat' },
                                { photo: 'breakEndPhoto', label: 'Selesai Istirahat' },
                                { photo: 'checkOutPhoto', label: 'Check-Out Pulang' },
                                { photo: 'lateReasonPhoto', label: 'Bukti Keterlambatan' }
                            ].map(({ photo, label }) => {
                                const url = (selectedPhotoRecord as any)[photo];
                                if (!url) return null;
                                return (
                                    <div key={photo} className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-gray-400">{label}</p>
                                        <div className="aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden border">
                                            <img src={(url.startsWith('data:') || url.startsWith('http')) ? url : (url.length > 20 && !url.includes('/') ? `/api/images/${url}` : `/uploads/${url}`)} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                <DialogContent className="sm:max-w-lg bg-white rounded-xl p-6 overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>{editingAttendance ? "Edit Data" : "Input Manual"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Select value={manualEntry.userId} onValueChange={(v) => setManualEntry(prev => ({ ...prev, userId: v }))} disabled={!!editingAttendance}>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih karyawan..." /></SelectTrigger>
                            <SelectContent>{users?.filter(u => u.role === 'employee').map(u => (<SelectItem key={u.id} value={String(u.id)}>{u.fullName}</SelectItem>))}</SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Tanggal</Label><Input type="date" value={manualEntry.date} onChange={(e) => setManualEntry(prev => ({ ...prev, date: e.target.value }))} disabled={!!editingAttendance} /></div>
                            <div className="space-y-2"><Label>Shift</Label>
                                <Select value={manualEntry.shift} onValueChange={(v) => setManualEntry(prev => ({ ...prev, shift: v }))}>
                                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="-">Belum Tercatat (Default)</SelectItem>
                                        <SelectItem value="Shift 1">Shift 1 (07:00 - 17:00)</SelectItem>
                                        <SelectItem value="Shift 2 (Middle)">Shift 2 (Middle) (11:00 - 21:00)</SelectItem>
                                        <SelectItem value="Shift 3">Shift 3 (13:00 - 23:00)</SelectItem>
                                        <SelectItem value="Long Shift">Long Shift (07:00 - 23:00)</SelectItem>
                                        <SelectItem value="Kasir Long Shift">Kasir Long Shift (11:00 - 23:00)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="time" value={manualEntry.checkIn} onChange={(e) => setManualEntry(prev => ({ ...prev, checkIn: e.target.value }))} placeholder="Masuk" />
                            <Input type="time" value={manualEntry.checkOut} onChange={(e) => setManualEntry(prev => ({ ...prev, checkOut: e.target.value }))} placeholder="Pulang" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="time" value={manualEntry.breakStart} onChange={(e) => setManualEntry(prev => ({ ...prev, breakStart: e.target.value }))} placeholder="Istirahat" />
                            <Input type="time" value={manualEntry.breakEnd} onChange={(e) => setManualEntry(prev => ({ ...prev, breakEnd: e.target.value }))} placeholder="Selesai" />
                        </div>
                        <Select value={manualEntry.status} onValueChange={(v) => setManualEntry(prev => ({ ...prev, status: v }))}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="present">Hadir</SelectItem><SelectItem value="late">Telat</SelectItem><SelectItem value="sick">Sakit</SelectItem><SelectItem value="permission">Izin</SelectItem><SelectItem value="cuti">Cuti</SelectItem><SelectItem value="absent">Alpha</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea placeholder="Catatan..." value={manualEntry.notes} onChange={(e) => setManualEntry(prev => ({ ...prev, notes: e.target.value }))} />
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 font-bold" onClick={() => manualMutation.mutate({ ...manualEntry, userId: parseInt(manualEntry.userId) })} disabled={manualMutation.isPending || !manualEntry.userId}>Simpan</Button>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent className="sm:max-w-xs bg-white rounded-xl p-6">
                    <DialogHeader><DialogTitle className="text-red-600">Hapus Data?</DialogTitle></DialogHeader>
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmId(null)}>Batal</Button>
                        <Button className="flex-1 bg-red-600 text-white" onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}>Hapus</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {isExporting && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-[99999] transition-all">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-4 max-w-sm text-center border border-gray-100">
                        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                        <div>
                            <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">Mengekspor Laporan</h3>
                            <p className="text-sm text-gray-500 mt-2">{exportProgress || "Sedang memproses dokumen laporan..."}</p>
                            <p className="text-xs text-emerald-600 font-bold mt-3 bg-emerald-50 px-3 py-1 rounded-full inline-block">Mohon jangan menutup halaman ini</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
