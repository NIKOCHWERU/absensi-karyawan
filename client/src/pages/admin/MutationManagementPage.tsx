import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Plus,
    Search,
    Trash2,
    Edit2,
    Eye,
    FileText,
    Download,
    Calendar,
    ArrowLeftRight,
    TrendingUp,
    TrendingDown,
    Building,
    Briefcase,
    ChevronLeft
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

interface MutationData {
    id: number;
    userId: number;
    type: "mutasi" | "promosi" | "demosi";
    oldBranch: string | null;
    newBranch: string | null;
    oldPosition: string | null;
    newPosition: string | null;
    documentUrl: string | null;
    notes: string | null;
    createdAt: string;
    user: {
        fullName: string;
        nik: string | null;
    };
}

interface ActiveEmployee {
    id: number;
    fullName: string;
    nik: string | null;
    branch: string | null;
    position: string | null;
    role: string;
    employmentStatus: string | null;
}

export default function MutationManagementPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    
    // Modals state
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openViewModal, setOpenViewModal] = useState(false);
    
    // Selected data for edit/view
    const [selectedMutation, setSelectedMutation] = useState<MutationData | null>(null);
    
    // Form fields state
    const [formType, setFormType] = useState<"mutasi" | "promosi" | "demosi">("mutasi");
    const [formUserId, setFormUserId] = useState("");
    const [formNewBranch, setFormNewBranch] = useState("");
    const [formNewPosition, setFormNewPosition] = useState("");
    const [formNotes, setFormNotes] = useState("");
    const [formFile, setFormFile] = useState<File | null>(null);

    // Queries
    const { data: mutationsList = [], isLoading: isLoadingMutations } = useQuery<MutationData[]>({
        queryKey: ["/api/admin/mutations"],
    });

    const { data: employees = [] } = useQuery<ActiveEmployee[]>({
        queryKey: ["/api/admin/users"],
    });

    // Filter active employees (excluding resigned ones)
    const activeEmployees = employees.filter(
        (emp) => emp.role === "employee" && emp.employmentStatus !== "Resigned"
    );

    // Get selected employee's current branch/position
    const selectedEmployeeInfo = activeEmployees.find(e => e.id.toString() === formUserId);

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await fetch("/api/admin/mutations", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Gagal menyimpan data.");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Berhasil",
                description: data.message || "Data mutasi/promosi/demosi berhasil disimpan.",
                variant: "default",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/mutations"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            resetForm();
            setOpenAddModal(false);
        },
        onError: (err: any) => {
            toast({
                title: "Gagal",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
            const res = await fetch(`/api/admin/mutations/${id}`, {
                method: "PATCH",
                body: formData,
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Gagal memperbarui data.");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Berhasil",
                description: data.message || "Data karir berhasil diperbarui.",
                variant: "default",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/mutations"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            resetForm();
            setOpenEditModal(false);
        },
        onError: (err: any) => {
            toast({
                title: "Gagal",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/admin/mutations/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Gagal menghapus data.");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Berhasil",
                description: data.message || "Data karir berhasil dihapus.",
                variant: "default",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/mutations"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        },
        onError: (err: any) => {
            toast({
                title: "Gagal",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const resetForm = () => {
        setFormType("mutasi");
        setFormUserId("");
        setFormNewBranch("");
        setFormNewPosition("");
        setFormNotes("");
        setFormFile(null);
        setSelectedMutation(null);
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formUserId || !formType) {
            toast({
                title: "Peringatan",
                description: "Harap lengkapi semua field wajib.",
                variant: "destructive",
            });
            return;
        }

        if (formType === "mutasi" && !formNewBranch) {
            toast({
                title: "Peringatan",
                description: "Cabang Baru harus diisi untuk Mutasi.",
                variant: "destructive",
            });
            return;
        }

        if ((formType === "promosi" || formType === "demosi") && !formNewPosition) {
            toast({
                title: "Peringatan",
                description: "Jabatan Baru harus diisi untuk Promosi/Demosi.",
                variant: "destructive",
            });
            return;
        }

        const formData = new FormData();
        formData.append("userId", formUserId);
        formData.append("type", formType);
        if (formType === "mutasi") {
            formData.append("newBranch", formNewBranch);
        } else {
            formData.append("newPosition", formNewPosition);
        }
        formData.append("notes", formNotes);
        if (formFile) {
            formData.append("document", formFile);
        }

        createMutation.mutate(formData);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMutation) return;

        const formData = new FormData();
        formData.append("type", formType);
        if (formType === "mutasi") {
            formData.append("newBranch", formNewBranch);
        } else {
            formData.append("newPosition", formNewPosition);
        }
        formData.append("notes", formNotes);
        if (formFile) {
            formData.append("document", formFile);
        }

        updateMutation.mutate({ id: selectedMutation.id, formData });
    };

    const handleOpenFileEdit = (mut: MutationData) => {
        setSelectedMutation(mut);
        setFormType(mut.type);
        setFormNewBranch(mut.newBranch || "");
        setFormNewPosition(mut.newPosition || "");
        setFormNotes(mut.notes || "");
        setFormFile(null);
        setOpenEditModal(true);
    };

    const handleOpenFileView = (mut: MutationData) => {
        setSelectedMutation(mut);
        setOpenViewModal(true);
    };

    const handleDelete = (id: number) => {
        if (confirm("Apakah Anda yakin ingin menghapus catatan mutasi/promosi/demosi ini?")) {
            deleteMutation.mutate(id);
        }
    };

    // Filter mutations
    const filteredMutations = mutationsList.filter((m) => {
        const name = m.user?.fullName?.toLowerCase() || "";
        const term = searchTerm.toLowerCase();
        return name.includes(term);
    });

    const getActionBadge = (type: string) => {
        switch (type) {
            case "mutasi":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold uppercase"><ArrowLeftRight className="w-3 h-3" /> Mutasi</span>;
            case "promosi":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold uppercase"><TrendingUp className="w-3 h-3" /> Promosi</span>;
            case "demosi":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold uppercase"><TrendingDown className="w-3 h-3" /> Demosi</span>;
            default:
                return <span className="text-gray-400 capitalize">{type}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Mutasi, Promosi & Demosi</h1>
                    <p className="text-sm text-gray-500">Kelola perpindahan cabang dan penyesuaian karir jabatan karyawan.</p>
                </div>
                <div className="flex gap-2.5">
                    <Button
                        variant="outline"
                        className="rounded-lg gap-2 cursor-pointer"
                        onClick={() => setLocation("/admin/mutation-history")}
                    >
                        <FileText className="w-4 h-4" />
                        Lihat Riwayat
                    </Button>
                    <Button
                        onClick={() => {
                            resetForm();
                            setOpenAddModal(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Karyawan
                    </Button>
                </div>
            </div>

            {/* Main Table Card */}
            <Card className="border-gray-100 shadow-sm rounded-xl overflow-hidden">
                <CardContent className="p-0">
                    {/* Filters Bar */}
                    <div className="p-4 sm:p-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Cari karyawan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 rounded-lg border-gray-200"
                            />
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                            Menampilkan {filteredMutations.length} data.
                        </div>
                    </div>

                    {/* Table Viewport */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-wider">
                                    <th className="py-4 px-6 text-center w-16">No</th>
                                    <th className="py-4 px-6">Nama Karyawan</th>
                                    <th className="py-4 px-6">Aksi Karir</th>
                                    <th className="py-4 px-6">Lama</th>
                                    <th className="py-4 px-6">Baru</th>
                                    <th className="py-4 px-6 text-center">Dokumen Pendukung</th>
                                    <th className="py-4 px-6 text-center">Tanggal Input</th>
                                    <th className="py-4 px-6 text-center w-40">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {isLoadingMutations ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
                                                <span>Memuat data karir...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredMutations.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <ArrowLeftRight className="w-10 h-10 text-gray-300 animate-pulse" />
                                                <p className="font-semibold text-gray-500">Tidak ada data mutasi/promosi/demosi</p>
                                                <p className="text-xs text-gray-400">Silakan tambahkan data pergerakan karir karyawan baru.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMutations.map((m, index) => (
                                        <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-6 text-center font-semibold text-gray-400">{index + 1}</td>
                                            <td className="py-4 px-6 font-bold text-gray-900">{m.user?.fullName}</td>
                                            <td className="py-4 px-6">{getActionBadge(m.type)}</td>
                                            <td className="py-4 px-6 text-xs text-gray-500 font-medium">
                                                {m.type === "mutasi" ? (
                                                    <span className="flex items-center gap-1 text-blue-600"><Building className="w-3 h-3 shrink-0" /> {m.oldBranch || "-"}</span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-emerald-600"><Briefcase className="w-3 h-3 shrink-0" /> {m.oldPosition || "-"}</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-xs text-gray-900 font-bold">
                                                {m.type === "mutasi" ? (
                                                    <span className="flex items-center gap-1 text-blue-800"><Building className="w-3 h-3 shrink-0" /> {m.newBranch || "-"}</span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-emerald-800"><Briefcase className="w-3 h-3 shrink-0" /> {m.newPosition || "-"}</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {m.documentUrl ? (
                                                    <a
                                                        href={m.documentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        Lihat File
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Tanpa berkas</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center text-gray-500 font-medium">
                                                {format(new Date(m.createdAt), "dd MMM yyyy", { locale: id })}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                                                        onClick={() => handleOpenFileView(m)}
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                                                        onClick={() => handleOpenFileEdit(m)}
                                                        title="Edit Data"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                                                        onClick={() => handleDelete(m.id)}
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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

            {/* Modal: Tambah Pergerakan Karyawan */}
            <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
                <DialogContent className="max-w-lg rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Catat Mutasi / Promosi / Demosi</DialogTitle>
                        <DialogDescription>
                            Daftarkan aksi karir karyawan. Sistem akan secara otomatis mengupdate posisi cabang / jabatan karyawan terpilih.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-500 uppercase">Tipe Aksi Karir <span className="text-red-500">*</span></label>
                            <Select value={formType} onValueChange={(val: any) => setFormType(val)}>
                                <SelectTrigger className="rounded-lg border-gray-200">
                                    <SelectValue placeholder="Pilih Tipe Aksi..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                    <SelectItem value="mutasi">Mutasi (Pindah Cabang)</SelectItem>
                                    <SelectItem value="promosi">Promosi (Naik Jabatan)</SelectItem>
                                    <SelectItem value="demosi">Demosi (Turun Jabatan)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-500 uppercase">Pilih Karyawan <span className="text-red-500">*</span></label>
                            <Select value={formUserId} onValueChange={setFormUserId}>
                                <SelectTrigger className="rounded-lg border-gray-200">
                                    <SelectValue placeholder="Pilih Karyawan..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 rounded-lg">
                                    {activeEmployees.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-gray-400">Tidak ada karyawan aktif</div>
                                    ) : (
                                        activeEmployees.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.fullName} ({emp.position || "Staff"} - {emp.branch || "Pusat"})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedEmployeeInfo && (
                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg space-y-1 text-xs">
                                <span className="font-bold text-gray-400 uppercase tracking-wider block">Status Saat Ini:</span>
                                <div className="grid grid-cols-2 gap-2 text-gray-700">
                                    <div>Cabang: <span className="font-bold text-gray-800">{selectedEmployeeInfo.branch || "Pusat"}</span></div>
                                    <div>Jabatan: <span className="font-bold text-gray-800">{selectedEmployeeInfo.position || "Staff"}</span></div>
                                </div>
                            </div>
                        )}

                        {formType === "mutasi" ? (
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-500 uppercase">Cabang Baru <span className="text-red-500">*</span></label>
                                <Select value={formNewBranch} onValueChange={setFormNewBranch}>
                                    <SelectTrigger className="rounded-lg border-gray-200">
                                        <SelectValue placeholder="Pilih Cabang Baru..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="Jakarta">Jakarta</SelectItem>
                                        <SelectItem value="Surabaya">Surabaya</SelectItem>
                                        <SelectItem value="Bandung">Bandung</SelectItem>
                                        <SelectItem value="Tangerang">Tangerang</SelectItem>
                                        <SelectItem value="Medan">Medan</SelectItem>
                                        <SelectItem value="Pusat">Kantor Pusat</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-500 uppercase">Jabatan Baru <span className="text-red-500">*</span></label>
                                <Select value={formNewPosition} onValueChange={setFormNewPosition}>
                                    <SelectTrigger className="rounded-lg border-gray-200">
                                        <SelectValue placeholder="Pilih Jabatan Baru..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="Manager">Manager</SelectItem>
                                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                                        <SelectItem value="Admin Store">Admin Store</SelectItem>
                                        <SelectItem value="Cashier">Cashier</SelectItem>
                                        <SelectItem value="Kurir">Kurir</SelectItem>
                                        <SelectItem value="Staff">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-500 uppercase">Catatan / Keterangan SK</label>
                            <Textarea
                                placeholder="Tulis alasan, nomor SK, atau catatan mutasi/promosi/demosi karyawan di sini..."
                                value={formNotes}
                                onChange={(e) => setFormNotes(e.target.value)}
                                className="rounded-lg border-gray-200 min-h-[80px]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-500 uppercase">Upload Surat Keputusan (SK)</label>
                            <div className="border border-dashed border-gray-200 hover:border-green-300 rounded-lg p-4 bg-gray-50/50 flex flex-col items-center justify-center text-center cursor-pointer relative group transition-colors">
                                <Input
                                    type="file"
                                    onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                />
                                <Download className="w-6 h-6 text-gray-400 group-hover:text-green-600 mb-2 transition-colors" />
                                <span className="text-xs font-bold text-gray-700">
                                    {formFile ? formFile.name : "Klik atau seret file SK di sini untuk mengupload"}
                                </span>
                                <span className="text-[10px] text-gray-400 mt-1">PDF, JPG, PNG (Maks. 10MB)</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-lg cursor-pointer"
                                onClick={() => setOpenAddModal(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 shadow-sm cursor-pointer"
                            >
                                {createMutation.isPending ? "Menyimpan..." : "Simpan Pergerakan"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Edit Pergerakan Karyawan */}
            <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
                <DialogContent className="max-w-lg rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Edit Mutasi / Promosi / Demosi</DialogTitle>
                        <DialogDescription>
                            Sunting tipe karir, tujuan pemindahan cabang/jabatan, atau unggah ulang berkas pendukung.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedMutation && (
                        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                            <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                                    {selectedMutation.user.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">{selectedMutation.user.fullName}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Aksi: {selectedMutation.type}</p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-500 uppercase">Tipe Aksi Karir <span className="text-red-500">*</span></label>
                                <Select value={formType} onValueChange={(val: any) => setFormType(val)}>
                                    <SelectTrigger className="rounded-lg border-gray-200">
                                        <SelectValue placeholder="Pilih Tipe Aksi..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="mutasi">Mutasi (Pindah Cabang)</SelectItem>
                                        <SelectItem value="promosi">Promosi (Naik Jabatan)</SelectItem>
                                        <SelectItem value="demosi">Demosi (Turun Jabatan)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formType === "mutasi" ? (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-500 uppercase">Cabang Baru <span className="text-red-500">*</span></label>
                                    <Select value={formNewBranch} onValueChange={setFormNewBranch}>
                                        <SelectTrigger className="rounded-lg border-gray-200">
                                            <SelectValue placeholder="Pilih Cabang Baru..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg">
                                            <SelectItem value="Jakarta">Jakarta</SelectItem>
                                            <SelectItem value="Surabaya">Surabaya</SelectItem>
                                            <SelectItem value="Bandung">Bandung</SelectItem>
                                            <SelectItem value="Tangerang">Tangerang</SelectItem>
                                            <SelectItem value="Medan">Medan</SelectItem>
                                            <SelectItem value="Pusat">Kantor Pusat</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-500 uppercase">Jabatan Baru <span className="text-red-500">*</span></label>
                                    <Select value={formNewPosition} onValueChange={setFormNewPosition}>
                                        <SelectTrigger className="rounded-lg border-gray-200">
                                            <SelectValue placeholder="Pilih Jabatan Baru..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-lg">
                                            <SelectItem value="Manager">Manager</SelectItem>
                                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                                            <SelectItem value="Admin Store">Admin Store</SelectItem>
                                            <SelectItem value="Cashier">Cashier</SelectItem>
                                            <SelectItem value="Kurir">Kurir</SelectItem>
                                            <SelectItem value="Staff">Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-500 uppercase">Catatan / Keterangan SK</label>
                                <Textarea
                                    placeholder="Tulis catatan di sini..."
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    className="rounded-lg border-gray-200 min-h-[80px]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-500 uppercase">Unggah Ulang Surat Keputusan (SK)</label>
                                <div className="border border-dashed border-gray-200 hover:border-green-300 rounded-lg p-4 bg-gray-50/50 flex flex-col items-center justify-center text-center cursor-pointer relative group transition-colors">
                                    <Input
                                        type="file"
                                        onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                    />
                                    <Download className="w-6 h-6 text-gray-400 group-hover:text-green-600 mb-2 transition-colors" />
                                    <span className="text-xs font-bold text-gray-700">
                                        {formFile ? formFile.name : "Pilih file SK baru untuk menggantikan file lama"}
                                    </span>
                                    <span className="text-[10px] text-gray-400 mt-1">Biarkan kosong jika tidak ada perubahan</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => setOpenEditModal(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 shadow-sm cursor-pointer"
                                >
                                    {updateMutation.isPending ? "Memperbarui..." : "Simpan Perubahan"}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal: View Detail Pergerakan Karyawan */}
            <Dialog open={openViewModal} onOpenChange={setOpenViewModal}>
                <DialogContent className="max-w-md rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Detail Pergerakan Karir Karyawan</DialogTitle>
                        <DialogDescription>
                            Informasi detail pergerakan mutasi, promosi, atau demosi karyawan.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedMutation && (
                        <div className="space-y-4 pt-2">
                            {/* Profile Info */}
                            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                                    {selectedMutation.user.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-base">{selectedMutation.user.fullName}</h4>
                                    <p className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                                        Status Karir: {getActionBadge(selectedMutation.type)}
                                    </p>
                                </div>
                            </div>

                            {/* Details List */}
                            <div className="space-y-3.5 text-sm">
                                {selectedMutation.type === "mutasi" ? (
                                    <>
                                        <div className="grid grid-cols-3">
                                            <span className="text-gray-400 font-medium">Cabang Lama</span>
                                            <span className="col-span-2 font-bold text-gray-700">{selectedMutation.oldBranch || "-"}</span>
                                        </div>
                                        <div className="grid grid-cols-3">
                                            <span className="text-gray-400 font-medium">Cabang Baru</span>
                                            <span className="col-span-2 font-black text-blue-700 flex items-center gap-1">
                                                <Building className="w-4 h-4 shrink-0" /> {selectedMutation.newBranch || "-"}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-3">
                                            <span className="text-gray-400 font-medium">Jabatan Lama</span>
                                            <span className="col-span-2 font-bold text-gray-700">{selectedMutation.oldPosition || "-"}</span>
                                        </div>
                                        <div className="grid grid-cols-3">
                                            <span className="text-gray-400 font-medium">Jabatan Baru</span>
                                            <span className="col-span-2 font-black text-green-700 flex items-center gap-1">
                                                <Briefcase className="w-4 h-4 shrink-0" /> {selectedMutation.newPosition || "-"}
                                            </span>
                                        </div>
                                    </>
                                )}

                                <div className="grid grid-cols-3">
                                    <span className="text-gray-400 font-medium">Tanggal Dicatat</span>
                                    <span className="col-span-2 font-bold text-gray-800 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-green-600 shrink-0" />
                                        {format(new Date(selectedMutation.createdAt), "EEEE, dd MMMM yyyy HH:mm", { locale: id })}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-gray-400 font-medium block">Nomor SK / Catatan Pendukung</span>
                                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-700 leading-relaxed max-h-40 overflow-y-auto font-medium">
                                        {selectedMutation.notes || "Tidak ada catatan."}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 items-center">
                                    <span className="text-gray-400 font-medium">Berkas SK</span>
                                    <span className="col-span-2">
                                        {selectedMutation.documentUrl ? (
                                            <a
                                                href={selectedMutation.documentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Unduh Surat Keputusan (SK)
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">File SK belum diunggah</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end pt-3">
                                <Button
                                    variant="outline"
                                    className="rounded-lg cursor-pointer"
                                    onClick={() => setOpenViewModal(false)}
                                >
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
