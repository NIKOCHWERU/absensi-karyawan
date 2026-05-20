import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LeaveRequest, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Loader2, Check, X, ArrowLeft, Calendar, User as UserIcon, MessageSquare, Info, Image as ImageIcon } from "lucide-react";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import { toTitleCase } from "@/lib/utils";

export default function AdminLeavePage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

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
            toast({
                title: "Berhasil",
                description: "Status permohonan telah diperbarui.",
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

    const getUserName = (userId: number) => {
        const name = users?.find(u => u.id === userId)?.fullName || `User #${userId}`;
        return toTitleCase(name);
    };

    return (
        <div className="space-y-6">
            

            <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Permohonan Cuti</h1>
                    <p className="text-sm text-gray-500">Verifikasi dan kelola persetujuan cuti sakit, tahunan, dan cuti melahirkan karyawan.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Permohonan Cuti</h2>
                        <p className="text-sm text-gray-500">Setujui atau tolak permohonan cuti dari karyawan.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={sortField === 'createdAt' ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleSort('createdAt')}
                            className="text-xs rounded-full h-8 px-3"
                        >
                            Terbaru {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </Button>
                        <Button
                            variant={sortField === 'name' ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleSort('name')}
                            className="text-xs rounded-full h-8 px-3"
                        >
                            Nama {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </Button>
                        <Button
                            variant={sortField === 'status' ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleSort('status')}
                            className="text-xs rounded-full h-8 px-3"
                        >
                            Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </Button>
                    </div>
                </div>

                <Card className="border-gray-100 shadow-sm rounded-xl overflow-hidden mt-6">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4">Karyawan</th>
                                        <th className="px-6 py-4">Tanggal Pengajuan</th>
                                        <th className="px-6 py-4">Periode Cuti</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 max-w-[200px]">Alasan</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-200 mb-2" />
                                                <p className="text-gray-400 font-medium">Memuat data permohonan...</p>
                                            </td>
                                        </tr>
                                    ) : sortedRequests?.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                                                <Calendar className="w-12 h-12 mx-auto text-gray-200 mb-3 opacity-50" />
                                                <p className="font-semibold text-gray-500">Belum ada permohonan cuti.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedRequests?.map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs uppercase shrink-0">
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
                                                        <div className="flex flex-col gap-1.5 max-w-[200px]">
                                                            <span className="font-bold text-gray-700 whitespace-nowrap">{req.selectedDates.split(',').length} Hari Terpilih</span>
                                                            <div className="flex flex-wrap gap-1">
                                                                {req.selectedDates.split(',').map(d => (
                                                                    <span key={d} className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100 text-[10px] text-gray-600 font-medium tracking-wide">
                                                                        {format(new Date(d), "d MMM", { locale: id })}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="font-bold text-gray-700 whitespace-nowrap bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block text-xs">
                                                            {format(new Date(req.startDate), "d MMM yyyy", { locale: id })} <span className="text-gray-400 font-normal mx-1">-</span> {format(new Date(req.endDate), "d MMM yyyy", { locale: id })}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border whitespace-nowrap ${
                                                        req.status === 'approved' ? 'text-green-600 bg-green-50 border-green-100' :
                                                        req.status === 'rejected' ? 'text-red-600 bg-red-50 border-red-100' :
                                                        req.status === 'cancelled' ? 'text-gray-600 bg-gray-50 border-gray-100' :
                                                        'text-orange-600 bg-orange-50 border-orange-100'
                                                    }`}>
                                                        {req.status === 'approved' ? 'Disetujui' :
                                                         req.status === 'rejected' ? 'Ditolak' :
                                                         req.status === 'cancelled' ? 'Dibatalkan' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 max-w-[200px]">
                                                    <p className="text-gray-600 line-clamp-2 italic text-xs leading-relaxed">"{req.reason}"</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {req.status === 'pending' ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="rounded-lg text-red-600 border-red-100 hover:bg-red-50 gap-1.5 h-8 px-3"
                                                                onClick={() => mutation.mutate({ id: req.id, status: 'rejected' })}
                                                                disabled={mutation.isPending}
                                                                title="Tolak"
                                                            >
                                                                <X className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Tolak</span>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg gap-1.5 shadow-sm h-8 px-3"
                                                                onClick={() => mutation.mutate({ id: req.id, status: 'approved' })}
                                                                disabled={mutation.isPending}
                                                                title="Setujui"
                                                            >
                                                                <Check className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Setuju</span>
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-xs font-bold text-gray-400">-</div>
                                                    )}
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
