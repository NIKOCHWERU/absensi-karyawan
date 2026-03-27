import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Attendance } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, UserPlus, Search, Calendar, Phone, Image as ImageIcon, ImageOff, MapPin, Trash2, MessageSquare, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AttendanceCalendar } from "@/components/AttendanceCalendar";
import { addMonths, subMonths, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, getWeek, getYear, addWeeks, subWeeks } from "date-fns";
import { id } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminEmployeeList() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [attendanceViewDate, setAttendanceViewDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [weekDate, setWeekDate] = useState(new Date());
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewingEmployee, setViewingEmployee] = useState<User | null>(null);
    const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

    const { data: complaintsStats } = useQuery<{ pendingCount: number }>({
        queryKey: ["/api/admin/complaints/stats"],
        refetchInterval: 5000,
    });

    const { data: users = [], isLoading } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
        refetchInterval: 5000,
    });

    // Fetch attendance for selected employee if needed
    const { data: employeeAttendance } = useQuery<Attendance[]>({
        queryKey: ["/api/attendance", selectedEmployee?.id, attendanceViewDate.toISOString()],
        refetchInterval: 5000,
        queryFn: async () => {
            if (!selectedEmployee) return [];
            const res = await fetch(`/api/attendance?userId=${selectedEmployee.id}`);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
        enabled: !!selectedEmployee
    });

    const employees = users?.filter(u => u.role === 'employee') || [];
    const { user } = useAuth();

    // Create a more flexible schema for the form
    const formSchema = z.object({
        fullName: z.string().min(1, "Nama lengkap wajib diisi"),
        password: z.string().optional(),
        role: z.string(),
        nik: z.string().optional(),
        branch: z.string().optional(),
        position: z.string().optional(),
        email: z.string().optional(),
        username: z.string().optional(),
        phoneNumber: z.string().optional(),
        religion: z.string().optional(),
        npwp: z.string().optional(),
        bpjs: z.string().optional(),
    });

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            password: "",
            role: "employee",
            nik: "",
            branch: "Pusat",
            position: "Staff",
            email: "",
            username: "",
            phoneNumber: "",
            religion: "",
            npwp: "",
            bpjs: ""
        }
    });

    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [selectedBpjsPhoto, setSelectedBpjsPhoto] = useState<File | null>(null);
    const [selectedNpwpPhoto, setSelectedNpwpPhoto] = useState<File | null>(null);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvOpen, setCsvOpen] = useState(false);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

    const csvMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/admin/users/upload', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to upload");
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "Berhasil", description: data.message });
            setCsvOpen(false);
            setCsvFile(null);
        },
        onError: (err: any) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        }
    });

    const upsertMutation = useMutation({
        mutationFn: async (data: any) => {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, data[key]);
                }
            });

            if (selectedPhoto) {
                formData.append('photo', selectedPhoto);
            }
            if (selectedBpjsPhoto) formData.append('bpjsPhoto', selectedBpjsPhoto);
            if (selectedNpwpPhoto) formData.append('npwpPhoto', selectedNpwpPhoto);

            const url = selectedEmployee ? `/api/admin/users/${selectedEmployee.id}` : "/api/admin/users";
            const method = selectedEmployee ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to save");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "Berhasil", description: selectedEmployee ? "Karyawan diperbarui" : "Karyawan ditambahkan" });
            setOpen(false);
            form.reset();
            setSelectedEmployee(null);
            setSelectedPhoto(null);
            setSelectedBpjsPhoto(null);
            setSelectedNpwpPhoto(null);
        },
        onError: (err: any) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/admin/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "Berhasil", description: "Karyawan berhasil dihapus" });
        },
        onError: (err: any) => {
            toast({ title: "Gagal", description: "Gagal menghapus karyawan: " + err.message, variant: "destructive" });
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (userIds: number[]) => {
            const res = await apiRequest("POST", "/api/admin/users/bulk-delete", { userIds });
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "Berhasil", description: "Karyawan terpilih telah dihapus." });
            setSelectedEmployeeIds([]);
        },
        onError: (err: any) => {
            toast({ title: "Gagal Menghapus", description: err.message, variant: "destructive" });
        }
    });

    const handleNext = () => {
        if (viewMode === 'month') setAttendanceViewDate(d => addMonths(d, 1));
        else setWeekDate(d => addWeeks(d, 1));
    };

    const handlePrev = () => {
        if (viewMode === 'month') setAttendanceViewDate(d => subMonths(d, 1));
        else setWeekDate(d => subWeeks(d, 1));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 p-4 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 z-10 gap-4">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">Daftar Karyawan</h1>
                        <Button variant="link" className="p-0 h-auto text-[10px] sm:text-xs text-green-600 justify-start" onClick={() => setLocation("/admin/complaints")}>
                            <MessageSquare className="mr-1 h-3 w-3" />
                            {complaintsStats?.pendingCount || 0} Pengaduan Baru
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                    {user?.role === 'superadmin' && selectedEmployeeIds.length > 0 && (
                        <Button 
                            variant="destructive" 
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 shadow-sm shrink-0 h-9"
                            onClick={() => setIsBulkDeleteConfirmOpen(true)}
                            disabled={bulkDeleteMutation.isPending}
                        >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Hapus ({selectedEmployeeIds.length})
                        </Button>
                    )}
                    <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50 bg-white shrink-0 h-9">
                                <Upload className="mr-1.5 h-3.5 w-3.5" />
                                CSV
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Upload Data Karyawan (CSV)</DialogTitle>
                                <DialogDescription>
                                    Unggah file CSV dengan urutan kolom:
                                    <br /><strong className="text-gray-900 mt-2 block">NIK, Nama Lengkap, Telepon, Cabang, Jabatan</strong>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                />
                                <Button
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                                    disabled={!csvFile || csvMutation.isPending}
                                    onClick={() => csvFile && csvMutation.mutate(csvFile)}
                                >
                                    {csvMutation.isPending ? "Mengunggah..." : "Upload File"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white shrink-0 h-9"
                                onClick={() => {
                                    setSelectedEmployee(null);
                                    form.reset({
                                        fullName: "",
                                        password: "",
                                        role: "employee",
                                        nik: "",
                                        branch: "Pusat",
                                        position: "Staff",
                                        email: "",
                                        username: "",
                                        phoneNumber: "",
                                        religion: "",
                                        npwp: "",
                                        bpjs: ""
                                    });
                                    setSelectedBpjsPhoto(null);
                                    setSelectedNpwpPhoto(null);
                                }}
                            >
                                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                Tambah
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{selectedEmployee ? "Edit Karyawan" : "Tambah Karyawan Baru"}</DialogTitle>
                                <DialogDescription>
                                    {selectedEmployee ? "Perbarui informasi data karyawan." : "Isi data lengkap untuk karyawan baru."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-center mb-4">
                                <div className="relative group">
                                    <div className="w-24 aspect-[2/3] bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden rounded-lg shadow-sm">
                                        {selectedPhoto ? (
                                            <img src={URL.createObjectURL(selectedPhoto)} className="w-full h-full object-cover" />
                                        ) : selectedEmployee?.photoUrl ? (
                                            <img src={selectedEmployee.photoUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-lg cursor-pointer transition-opacity">
                                        <span className="text-[10px] font-bold">Ganti Foto</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => setSelectedPhoto(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                </div>
                            </div>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit((d) => upsertMutation.mutate(d))} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nama Lengkap</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nik"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>NIK (Nomor Induk Karyawan)</FormLabel>
                                                <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nomor HP</FormLabel>
                                                <FormControl><Input {...field} value={field.value || ''} placeholder="08..." /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl><Input type="password" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="branch"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cabang</FormLabel>
                                                <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="position"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Jabatan</FormLabel>
                                                <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField control={form.control} name="religion" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Agama</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || undefined}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih Agama" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Islam">Islam</SelectItem>
                                                    <SelectItem value="Kristen Protestan">Kristen Protestan</SelectItem>
                                                    <SelectItem value="Katolik">Katolik</SelectItem>
                                                    <SelectItem value="Hindu">Hindu</SelectItem>
                                                    <SelectItem value="Buddha">Buddha</SelectItem>
                                                    <SelectItem value="Khonghucu">Khonghucu</SelectItem>
                                                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="npwp" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>NPWP</FormLabel>
                                            <FormControl><Input {...field} value={field.value || ''} placeholder="00.000.000.0-000.000" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="space-y-2">
                                        <FormLabel className="text-sm font-medium leading-none">Foto NPWP</FormLabel>
                                        <div className="flex items-center gap-3">
                                            <Input type="file" accept="image/*" onChange={(e) => setSelectedNpwpPhoto(e.target.files?.[0] || null)} />
                                            {(selectedEmployee as any)?.npwpPhotoUrl && (
                                                <a href={(selectedEmployee as any).npwpPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline shrink-0">Lihat Foto</a>
                                            )}
                                        </div>
                                    </div>
                                    <FormField control={form.control} name="bpjs" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>BPJS</FormLabel>
                                            <FormControl><Input {...field} value={field.value || ''} placeholder="Nomor BPJS" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="space-y-2 pb-4">
                                        <FormLabel className="text-sm font-medium leading-none">Foto BPJS</FormLabel>
                                        <div className="flex items-center gap-3">
                                            <Input type="file" accept="image/*" onChange={(e) => setSelectedBpjsPhoto(e.target.files?.[0] || null)} />
                                            {(selectedEmployee as any)?.bpjsPhotoUrl && (
                                                <a href={(selectedEmployee as any).bpjsPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline shrink-0">Lihat Foto</a>
                                            )}
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={upsertMutation.isPending}>
                                        {upsertMutation.isPending ? "Menyimpan..." : "Simpan Data"}
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <main className="p-4 sm:p-8 flex-1">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input placeholder="Cari karyawan..." className="pl-9" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                        <Table>
                        <TableHeader>
                            <TableRow>
                                {user?.role === 'superadmin' && (
                                    <TableHead className="w-[40px] text-center">
                                        <Checkbox 
                                            checked={selectedEmployeeIds.length === employees.length && employees.length > 0}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedEmployeeIds(employees.map(e => e.id));
                                                } else {
                                                    setSelectedEmployeeIds([]);
                                                }
                                            }}
                                        />
                                    </TableHead>
                                )}
                                <TableHead className="w-[50px]">No</TableHead>
                                <TableHead>Nama</TableHead>
                                <TableHead>NIK</TableHead>
                                <TableHead>Jabatan</TableHead>
                                <TableHead>Cabang</TableHead>
                                <TableHead>Status Data</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((emp, index) => (
                                <TableRow key={emp.id}>
                                    {user?.role === 'superadmin' && (
                                        <TableCell className="text-center">
                                            <Checkbox 
                                                checked={selectedEmployeeIds.includes(emp.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedEmployeeIds(prev => [...prev, emp.id]);
                                                    } else {
                                                        setSelectedEmployeeIds(prev => prev.filter(id => id !== emp.id));
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 aspect-[2/3] bg-gray-100 rounded flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                                                {emp.photoUrl ? (
                                                    <img src={emp.photoUrl} className="w-full h-full object-cover" alt={emp.fullName} />
                                                ) : (
                                                    <div className="text-xs font-bold text-gray-400">{emp.fullName.charAt(0)}</div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{emp.fullName}</span>
                                                {emp.phoneNumber && (
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> {emp.phoneNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-gray-600">{emp.nik}</TableCell>
                                    <TableCell>{emp.position}</TableCell>
                                    <TableCell>{emp.branch}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            emp.registrationStatus === 'approved' ? 'default' :
                                            emp.registrationStatus === 'pending' ? 'secondary' :
                                            emp.registrationStatus === 'rejected' ? 'destructive' : 'outline'
                                        } className="capitalize">
                                            {emp.registrationStatus || 'unregistered'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                                onClick={() => {
                                                    setSelectedEmployee(emp);
                                                    form.reset({
                                                        fullName: emp.fullName,
                                                        nik: emp.nik || "",
                                                        role: emp.role,
                                                        branch: emp.branch || "",
                                                        position: emp.position || "",
                                                        phoneNumber: emp.phoneNumber || "",
                                                        username: emp.username || "",
                                                        religion: (emp as any).religion || "",
                                                        npwp: (emp as any).npwp || "",
                                                        bpjs: (emp as any).bpjs || "",
                                                        password: "" // Keep empty to not change
                                                    });
                                                    setOpen(true);
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-slate-600 border-slate-200 hover:bg-slate-50"
                                                onClick={() => {
                                                    setViewingEmployee(emp);
                                                    setViewModalOpen(true);
                                                }}
                                            >
                                                Lihat
                                            </Button>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                        onClick={() => {
                                                            setSelectedEmployee(emp);
                                                            setAttendanceViewDate(new Date());
                                                            setSelectedDate(null);
                                                        }}
                                                    >
                                                        <Calendar className="w-4 h-4 mr-1" />
                                                        Absensi
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Riwayat Absensi - {emp.fullName}</DialogTitle>
                                                        <DialogDescription>
                                                            Daftar kehadiran dan aktivitas karyawan.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="mt-4">
                                                        <AttendanceCalendar
                                                            currentDate={attendanceViewDate}
                                                            onNextMonth={handleNext}
                                                            onPrevMonth={handlePrev}
                                                            attendanceData={employeeAttendance || []}
                                                            onDateSelect={(date) => {
                                                                setSelectedDate(date);
                                                            }}
                                                            viewMode={viewMode}
                                                            setViewMode={setViewMode}
                                                            weekDate={weekDate}
                                                        />
                                                    </div>

                                                    {/* Detailed Inline View - Shows only when a date is selected */}
                                                    {selectedDate && (
                                                        <div className="mt-8 space-y-6">
                                                            <h4 className="font-bold text-gray-800 border-b pb-2">
                                                                Detail {format(selectedDate, "EEEE, d MMM yyyy", { locale: id })}
                                                            </h4>

                                                            {(() => {
                                                                // Find ALL records for the selected date
                                                                const sessions = employeeAttendance?.filter(a =>
                                                                    new Date(a.date).toDateString() === selectedDate.toDateString()
                                                                ).sort((a, b) => (a as any).sessionNumber - (b as any).sessionNumber) || [];

                                                                if (sessions.length === 0) {
                                                                    return (
                                                                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                                            <p className="text-gray-400">Tidak ada data absensi pada tanggal ini.</p>
                                                                        </div>
                                                                    );
                                                                }

                                                                return sessions.map((att, index) => (
                                                                    <div key={att.id} className="bg-white border rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 mb-6">
                                                                        <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                                                                            <span className="font-bold text-gray-800">
                                                                                Sesi Ke-{(att as any).sessionNumber || (index + 1)}
                                                                            </span>
                                                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${att.status === 'present' ? 'bg-green-100 text-green-700' :
                                                                                att.status === 'late' ? 'bg-red-100 text-red-700' :
                                                                                    att.status === 'sick' ? 'bg-blue-100 text-blue-700' :
                                                                                        att.status === 'permission' ? 'bg-purple-100 text-purple-700' :
                                                                                            'bg-gray-100 text-gray-700'
                                                                                }`}>
                                                                                {att.status === 'present' ? 'Hadir' :
                                                                                    att.status === 'late' ? 'Telat' :
                                                                                        att.status === 'sick' ? 'Sakit' :
                                                                                            att.status === 'permission' ? 'Izin' :
                                                                                                att.status === 'absent' ? 'Alpha' : att.status}
                                                                            </span>
                                                                        </div>
                                                                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                            {/* Masuk */}
                                                                            <div className="space-y-2">
                                                                                <p className="text-xs font-semibold text-gray-500 text-center">Masuk</p>
                                                                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border flex items-center justify-center">
                                                                                    {att.checkInPhoto ? (
                                                                                        <a
                                                                                            href={`https://drive.google.com/file/d/${att.checkInPhoto}/view`}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="w-full h-full flex items-center justify-center hover:bg-blue-50 transition-colors group"
                                                                                        >
                                                                                            <ImageIcon className="w-12 h-12 text-blue-600 group-hover:scale-110 transition-transform" />
                                                                                        </a>
                                                                                    ) : (
                                                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                                            <ImageOff className="w-12 h-12" />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-center font-mono text-sm font-bold text-green-600">
                                                                                    {att.checkIn ? new Date(att.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                                </p>
                                                                            </div>

                                                                            {/* Mulai Istirahat */}
                                                                            <div className="space-y-2">
                                                                                <p className="text-xs font-semibold text-gray-500 text-center">Mulai Istirahat</p>
                                                                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border flex items-center justify-center">
                                                                                    {att.breakStartPhoto ? (
                                                                                        <a
                                                                                            href={`https://drive.google.com/file/d/${att.breakStartPhoto}/view`}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="w-full h-full flex items-center justify-center hover:bg-green-50 transition-colors group"
                                                                                        >
                                                                                            <ImageIcon className="w-12 h-12 text-green-600 group-hover:scale-110 transition-transform" />
                                                                                        </a>
                                                                                    ) : (
                                                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                                            <ImageOff className="w-12 h-12" />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-center font-mono text-sm font-bold text-green-600">
                                                                                    {att.breakStart ? new Date(att.breakStart).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                                </p>
                                                                            </div>

                                                                            {/* Selesai Istirahat */}
                                                                            <div className="space-y-2">
                                                                                <p className="text-xs font-semibold text-gray-500 text-center">Selesai Istirahat</p>
                                                                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border flex items-center justify-center">
                                                                                    {att.breakEndPhoto ? (
                                                                                        <a
                                                                                            href={`https://drive.google.com/file/d/${att.breakEndPhoto}/view`}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="w-full h-full flex items-center justify-center hover:bg-green-50 transition-colors group"
                                                                                        >
                                                                                            <ImageIcon className="w-12 h-12 text-green-600 group-hover:scale-110 transition-transform" />
                                                                                        </a>
                                                                                    ) : (
                                                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                                            <ImageOff className="w-12 h-12" />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-center font-mono text-sm font-bold text-green-600">
                                                                                    {att.breakEnd ? new Date(att.breakEnd).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                                </p>
                                                                            </div>

                                                                            {/* Pulang */}
                                                                            <div className="space-y-2">
                                                                                <p className="text-xs font-semibold text-gray-500 text-center">Pulang</p>
                                                                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border flex items-center justify-center">
                                                                                    {att.checkOutPhoto ? (
                                                                                        <a
                                                                                            href={`https://drive.google.com/file/d/${att.checkOutPhoto}/view`}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="w-full h-full flex items-center justify-center hover:bg-red-50 transition-colors group"
                                                                                        >
                                                                                            <ImageIcon className="w-12 h-12 text-red-600 group-hover:scale-110 transition-transform" />
                                                                                        </a>
                                                                                    ) : (
                                                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                                            <ImageOff className="w-12 h-12" />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-center font-mono text-sm font-bold text-red-600">
                                                                                    {att.checkOut ? new Date(att.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="px-4 pb-4 text-xs text-gray-500 flex items-center gap-1">
                                                                            📍 {(() => {
                                                                                const loc = att.checkInLocation || 'Lokasi tidak terdeteksi';
                                                                                // Check if it's coordinates (format: lat,lng)
                                                                                if (loc.match(/^-?\d+\.?\d*,-?\d+\.?\d*$/)) {
                                                                                    return (
                                                                                        <a
                                                                                            href={`https://www.google.com/maps/search/?api=1&query=${loc}`}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="text-blue-600 hover:underline flex items-center"
                                                                                        >
                                                                                            {loc} (Lihat di Peta)
                                                                                            <MapPin className="ml-1 h-3 w-3" />
                                                                                        </a>
                                                                                    );
                                                                                }
                                                                                // Otherwise display as address
                                                                                return <span className="line-clamp-2">{loc}</span>;
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                ));
                                                            })()}
                                                        </div>
                                                    )}

                                                    {/* Default List if no date selected: Last 5 Activities */}
                                                    {!selectedDate && (
                                                        <div className="mt-8">
                                                            <h4 className="font-bold text-gray-800 mb-4">Aktivitas Terakhir</h4>
                                                            <div className="border rounded-lg overflow-hidden">
                                                                <table className="w-full text-sm">
                                                                    <thead className="bg-gray-50 text-gray-500">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left">Tanggal</th>
                                                                            <th className="px-4 py-2 text-left">Masuk</th>
                                                                            <th className="px-4 py-2 text-left">Pulang</th>
                                                                            <th className="px-4 py-2 text-left">Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {employeeAttendance?.slice(0, 5).map(att => (
                                                                            <tr key={att.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedDate(new Date(att.date))}>
                                                                                <td className="px-4 py-2">{format(new Date(att.date), "EEEE, d MMM yyyy", { locale: id })}</td>
                                                                                <td className="px-4 py-2 font-mono text-green-600">
                                                                                    {att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                                </td>
                                                                                <td className="px-4 py-2 font-mono text-red-600">
                                                                                    {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                                </td>
                                                                                <td className="px-4 py-2">
                                                                                    <span className={
                                                                                        att.status === 'present' ? 'text-green-600 font-bold' :
                                                                                            att.status === 'late' ? 'text-red-600 font-bold' :
                                                                                                'text-gray-600'
                                                                                    }>
                                                                                        {att.status === 'present' ? 'Hadir' :
                                                                                            att.status === 'late' ? 'Telat' :
                                                                                                att.status === 'sick' ? 'Sakit' :
                                                                                                    att.status === 'permission' ? 'Izin' :
                                                                                                        att.status === 'absent' ? 'Alpha' : att.status}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            <p className="text-xs text-gray-400 mt-2 text-center">*Klik tanggal di kalender atau di tabel untuk melihat detail foto.</p>
                                                        </div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                        Hapus
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Tindakan ini tidak dapat dibatalkan. Data karyawan <strong>{emp.fullName}</strong> akan dihapus permanen beserta data absensinya.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => deleteMutation.mutate(emp.id)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Ya, Hapus
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {employees.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                                        Belum ada data karyawan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    </div>
                </div>
            </main>

            {/* View Employee Detail Modal */}
            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="max-w-2xl bg-white rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden outline-none">
                    {viewingEmployee && (
                        <div className="flex flex-col">
                            {/* Header Section */}
                            <div className="bg-slate-900 p-10 text-white relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                                <div className="relative flex items-center gap-8">
                                    <div className="w-32 h-48 bg-slate-800 rounded-3xl overflow-hidden border-4 border-slate-700 shadow-2xl shrink-0">
                                        {viewingEmployee.photoUrl ? (
                                            <img src={viewingEmployee.photoUrl} className="w-full h-full object-cover" alt={viewingEmployee.fullName} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-600">
                                                {viewingEmployee.fullName.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Badge className="bg-green-500 hover:bg-green-600 text-[10px] font-black uppercase tracking-[0.2em] mb-3 px-3 py-1 rounded-lg">
                                            {viewingEmployee.position || "Staff"}
                                        </Badge>
                                        <h2 className="text-4xl font-black tracking-tight leading-tight">{viewingEmployee.fullName}</h2>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest mt-1">NIK: {viewingEmployee.nik || "-"}</p>
                                        
                                        <div className="flex items-center gap-4 mt-8">
                                            <div className="bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/50">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Cabang</p>
                                                <p className="text-sm font-bold text-slate-200">{viewingEmployee.branch || "Pusat"}</p>
                                            </div>
                                            <div className="bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/50">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Status</p>
                                                <p className="text-sm font-bold text-emerald-400 capitalize">{viewingEmployee.registrationStatus || "Aktif"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="p-10 bg-slate-50 grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex flex-col space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nomor Telepon</label>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><Phone className="w-4 h-4 text-slate-400" /></div>
                                            <p className="font-bold text-slate-700">{viewingEmployee.phoneNumber || "-"}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Agama</label>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><Users className="w-4 h-4 text-slate-400" /></div>
                                            <p className="font-bold text-slate-700">{(viewingEmployee as any).religion || "-"}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Username</label>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><Search className="w-4 h-4 text-slate-400" /></div>
                                            <p className="font-bold text-slate-700">{viewingEmployee.username}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-col space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nomor BPJS</label>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><Search className="w-4 h-4 text-slate-400" /></div>
                                            <p className="font-bold text-slate-700">{(viewingEmployee as any).bpjs || "-"}</p>
                                            {(viewingEmployee as any).bpjsPhotoUrl && (
                                                <a href={(viewingEmployee as any).bpjsPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest ml-auto">Lihat Kartu</a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nomor NPWP</label>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><FileText className="w-4 h-4 text-slate-400" /></div>
                                            <p className="font-bold text-slate-700">{(viewingEmployee as any).npwp || "-"}</p>
                                            {(viewingEmployee as any).npwpPhotoUrl && (
                                                <a href={(viewingEmployee as any).npwpPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest ml-auto">Lihat Kartu</a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role Akses</label>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><Users className="w-4 h-4 text-slate-400" /></div>
                                            <p className="font-bold text-slate-700 capitalize">{viewingEmployee.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
                                <Button className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest px-8 h-12 rounded-2xl" onClick={() => setViewModalOpen(false)}>
                                    Tutup Profil
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
                <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8">
                    <AlertDialogHeader>
                        <div className="mx-auto w-20 h-20 bg-rose-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                            <Trash2 className="w-10 h-10 text-rose-600" />
                        </div>
                        <AlertDialogTitle className="text-center text-2xl font-black tracking-tight uppercase">Hapus Masal Karyawan?</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-sm font-medium text-slate-500 pt-3 leading-relaxed">
                            Anda akan menghapus <span className="text-slate-900 font-bold underline">{selectedEmployeeIds.length} karyawan</span> sekaligus.
                            <br/><br/>
                            <span className="text-rose-600 font-black tracking-widest uppercase">Peringatan:</span> Tindakan ini akan menghapus seluruh data profil dan riwayat absensi secara permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-3 sm:gap-0 sm:flex-row-reverse">
                        <AlertDialogAction 
                            onClick={() => {
                                bulkDeleteMutation.mutate(selectedEmployeeIds);
                                setIsBulkDeleteConfirmOpen(false);
                            }}
                            className="h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-200"
                        >
                            Ya, Hapus Semua
                        </AlertDialogAction>
                        <AlertDialogCancel className="h-14 rounded-2xl border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-50">
                            Batalkan
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
