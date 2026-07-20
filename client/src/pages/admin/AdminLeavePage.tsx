import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LeaveRequest, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Loader2, Check, X, Calendar, Printer, Trash2, Edit3, RotateCcw, Search, Clock } from "lucide-react";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import { toTitleCase } from "@/lib/utils";

export default function AdminLeavePage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<'requests' | 'quotas'>('requests');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [manualQuotaInput, setManualQuotaInput] = useState<string>('12');

    const { data: users } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
        refetchInterval: 5000,
    });

    const { data: requests, isLoading } = useQuery<LeaveRequest[]>({
        queryKey: [api.admin.attendance.leave.list.path],
        refetchInterval: 5000,
    });

    const [sortField, setSortField] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const toggleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedRequests = [...(requests || [])].sort((a, b) => {
        let valA: any, valB: any;
        if (sortField === 'name') {
            valA = getUserName(a.userId).toLowerCase();
            valB = getUserName(b.userId).toLowerCase();
        } else if (sortField === 'createdAt') {
            valA = new Date(a.createdAt!).getTime();
            valB = new Date(b.createdAt!).getTime();
        } else if (sortField === 'status') {
            valA = a.status || '';
            valB = b.status || '';
        } else {
            valA = (a as any)[sortField] || '';
            valB = (b as any)[sortField] || '';
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const mutation = useMutation({
        mutationFn: async ({ id, status }: { id: number, status: string }) => {
            const res = await fetch(api.admin.attendance.leave.update.path.replace(':id', id.toString()), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Gagal memperbarui status");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.admin.attendance.leave.list.path] });
            queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
            toast({ title: "Berhasil", description: "Status permohonan telah diperbarui." });
        },
        onError: (err: any) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/admin/leave-requests/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Gagal menghapus permohonan cuti");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.admin.attendance.leave.list.path] });
            queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
            toast({ title: "Berhasil", description: "Permohonan cuti telah dihapus." });
        },
        onError: (err: any) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        }
    });

    const updateQuotaMutation = useMutation({
        mutationFn: async ({ userId, remainingLeave }: { userId: number; remainingLeave: number }) => {
            const res = await fetch(`/api/admin/users/${userId}/leave-quota`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ remainingLeave }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Gagal memperbarui kuota cuti");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            setEditingUser(null);
            toast({ title: "Berhasil", description: "Sisa cuti karyawan berhasil diperbarui." });
        },
        onError: (err: any) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        }
    });

    const resetQuotaMutation = useMutation({
        mutationFn: async (userId: number) => {
            const res = await fetch(`/api/admin/users/${userId}/reset-leave-quota`, { method: 'POST' });
            if (!res.ok) throw new Error("Gagal me-reset kuota cuti");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "Berhasil", description: "Sisa cuti karyawan telah di-reset ke 12 hari." });
        },
        onError: (err: any) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        }
    });

    const handleDeleteLeave = (id: number) => {
        if (confirm("Apakah Anda yakin ingin menghapus permohonan cuti ini?")) {
            deleteMutation.mutate(id);
        }
    };

    const getUserName = (userId: number) => {
        const name = users?.find(u => u.id === userId)?.fullName || `User #${userId}`;
        return toTitleCase(name);
    };

    const getUserObj = (userId: number) => {
        return users?.find(u => u.id === userId);
    };

    const handleOpenEditQuota = (user: User) => {
        setEditingUser(user);
        setManualQuotaInput(String(user.remainingLeave ?? 12));
    };

    const handleSaveQuota = () => {
        if (!editingUser) return;
        const val = parseInt(manualQuotaInput);
        if (isNaN(val) || val < 0 || val > 12) {
            toast({ title: "Input Tidak Valid", description: "Sisa cuti harus berupa angka antara 0 hingga 12 hari.", variant: "destructive" });
            return;
        }
        updateQuotaMutation.mutate({ userId: editingUser.id, remainingLeave: val });
    };

    const handleResetQuota = (user: User) => {
        if (confirm(`Apakah Anda yakin ingin me-reset sisa cuti ${toTitleCase(user.fullName)} kembali ke 12 hari?`)) {
            resetQuotaMutation.mutate(user.id);
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
        const statusLabel = req.status === 'approved' ? 'DISETUJUI' : req.status === 'rejected' ? 'DITOLAK' : req.status === 'cancelled' ? 'DIBATALKAN' : 'PENDING';
        const statusColor = req.status === 'approved' ? '#16a34a' : req.status === 'rejected' ? '#dc2626' : req.status === 'cancelled' ? '#4b5563' : '#ea580c';
        const html = `<!DOCTYPE html><html><body><div class="title-block"><h2>FORMULIR PERMOHONAN CUTI KARYAWAN</h2></div><table class="info-table"><tr><td class="label">Nama Karyawan</td><td>:</td><td class="value"><strong>${name}</strong></td></tr><tr><td class="label">NIK</td><td>:</td><td class="value">${nik}</td></tr><tr><td class="label">Jabatan</td><td>:</td><td class="value">${position}</td></tr><tr><td class="label">Cabang</td><td>:</td><td class="value">${branch}</td></tr><tr><td class="label">Durasi</td><td>:</td><td class="value"><strong>${totalDays} Hari</strong></td></tr></table></body></html>`;
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        window.open(URL.createObjectURL(blob), '_blank');
    };

    const filteredEmployees = (users || []).filter(u => {
        if (u.role === 'admin' || u.role === 'superadmin') return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (u.fullName || '').toLowerCase().includes(q) || (u.nik || u.username || '').toLowerCase().includes(q) || (u.branch || '').toLowerCase().includes(q) || (u.position || '').toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Cuti Karyawan</h1>
                    <p className="text-sm text-gray-500">Kelola persetujuan permohonan cuti dan kuota sisa cuti tahunan karyawan.</p>
                </div>
                <Button variant="outline" className="rounded-lg gap-2" onClick={() => setLocation("/admin/leave-history")}>
                    <Calendar className="w-4 h-4" /> Lihat Riwayat Cuti
                </Button>
            </div>

            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${activeTab === 'requests' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                    <Clock className="w-4 h-4" /> Permohonan Cuti ({requests?.filter(r => r.status === 'pending').length || 0})
                </button>
                <button onClick={() => setActiveTab('quotas')} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${activeTab === 'quotas' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                    <Calendar className="w-4 h-4" /> Kelola Kuota Cuti
                </button>
            </div>

            {activeTab === 'requests' ? (
                <Card className="border-gray-100 shadow-sm rounded-xl overflow-hidden">
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4">Karyawan</th>
                                    <th className="px-6 py-4">Sisa Cuti</th>
                                    <th className="px-6 py-4">Periode</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRequests?.map((req) => {
                                    const userObj = getUserObj(req.userId);
                                    const remaining = userObj?.remainingLeave ?? 12;
                                    return (
                                        <tr key={req.id} className="border-t border-gray-50">
                                            <td className="px-6 py-4 font-bold">{getUserName(req.userId)}</td>
                                            <td className="px-6 py-4">{remaining} / 12 Hari</td>
                                            <td className="px-6 py-4">{format(new Date(req.startDate), "d MMM")} - {format(new Date(req.endDate), "d MMM")}</td>
                                            <td className="px-6 py-4">{req.status}</td>
                                            <td className="px-6 py-4 text-center">
                                                <Button size="sm" variant="outline" onClick={() => mutation.mutate({ id: req.id, status: 'approved' })}>Setujui</Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-gray-100 shadow-sm rounded-xl overflow-hidden">
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4">Karyawan</th>
                                    <th className="px-6 py-4">Sisa Cuti</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="border-t border-gray-50">
                                        <td className="px-6 py-4 font-bold">{toTitleCase(emp.fullName)}</td>
                                        <td className="px-6 py-4">{emp.remainingLeave ?? 12} Hari</td>
                                        <td className="px-6 py-4 flex justify-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleOpenEditQuota(emp)}><Edit3 className="w-4 h-4" /></Button>
                                            <Button size="sm" variant="outline" onClick={() => handleResetQuota(emp)}><RotateCcw className="w-4 h-4" /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Sisa Cuti</DialogTitle></DialogHeader>
                    <Input type="number" value={manualQuotaInput} onChange={(e) => setManualQuotaInput(e.target.value)} />
                    <DialogFooter>
                        <Button onClick={handleSaveQuota}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
