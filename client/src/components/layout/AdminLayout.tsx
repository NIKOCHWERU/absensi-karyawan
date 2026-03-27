import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
    SidebarFooter
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
    Users,
    Clock,
    CalendarDays,
    History,
    Info,
    FileText,
    MessageSquare,
    LogOut,
    Image as ImageIcon,
    ShieldCheck,
    UserCog
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [location, setLocation] = useLocation();
    const { logout, user } = useAuth();

    // Polling counts for notifications in sidebar
    const { data: complaintsStats } = useQuery<{ pendingCount: number }>({
        queryKey: ["/api/admin/complaints/stats"],
        refetchInterval: 5000,
    });

    const { data: leaveRequests } = useQuery<{ status: string }[]>({
        queryKey: ["/api/admin/attendance/leave/list"],
        refetchInterval: 5000,
    });

    const { data: unverifiedEmployees } = useQuery<any[]>({
        queryKey: ["/api/admin/unverified-employees"],
        refetchInterval: 10000,
    });

    const pendingLeaveCount = leaveRequests?.filter((r) => r.status === 'pending').length || 0;
    const pendingComplaintsCount = complaintsStats?.pendingCount || 0;
    const pendingVerificationCount = unverifiedEmployees?.filter((e) => e.registrationStatus === 'pending').length || 0;

    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-gray-50 w-full">
                <Sidebar collapsible="icon" className="border-r border-slate-200/50 bg-white/70 backdrop-blur-2xl">
                    <SidebarHeader className="border-b border-slate-100/50 p-6 flex flex-col items-center group-data-[collapsible=icon]:p-2">
                        <div className="flex flex-col items-center gap-4 w-full group-data-[collapsible=icon]:gap-0">
                            <div className="relative group/logo">
                                <div className="absolute -inset-2 bg-gradient-to-tr from-green-500/20 to-emerald-500/20 blur-xl rounded-full scale-150 group-data-[collapsible=icon]:hidden opacity-0 group-hover/logo:opacity-100 transition-all duration-700"></div>
                                <img 
                                    src="/logo_elok_buah.jpg" 
                                    alt="Logo" 
                                    className="w-16 h-16 object-contain rounded-2xl shadow-2xl border-2 border-white ring-1 ring-slate-100 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:rounded-xl transition-all duration-500 relative z-10" 
                                />
                            </div>
                            <div className="flex-1 text-center overflow-hidden group-data-[collapsible=icon]:hidden space-y-1">
                                <h1 className="text-[15px] font-black text-slate-900 tracking-tighter uppercase leading-none">
                                    Admin <span className="text-emerald-600">Panel</span>
                                </h1>
                                <p className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase">PT ELOK JAYA ABADHI</p>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="p-3 space-y-1">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Dashboard"
                                    isActive={location === "/admin"}
                                    onClick={() => setLocation("/admin")}
                                    className={`h-12 rounded-2xl transition-all duration-300 px-4 ${
                                        location === "/admin" 
                                        ? "bg-slate-900 text-white shadow-[0_10px_20px_-5px_rgba(15,23,42,0.3)] font-black" 
                                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-bold"
                                    }`}
                                >
                                    <CalendarDays className={`h-5 w-5 ${location === "/admin" ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                                    <span className="text-[13px] tracking-tight">Dashboard</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Daftar Karyawan"
                                    isActive={location === "/admin/employees"}
                                    onClick={() => setLocation("/admin/employees")}
                                    className={`h-12 rounded-2xl transition-all duration-300 px-4 ${
                                        location === "/admin/employees" 
                                        ? "bg-slate-900 text-white shadow-[0_10px_20px_-5px_rgba(15,23,42,0.3)] font-black" 
                                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-bold"
                                    }`}
                                >
                                    <Users className={`h-5 w-5 ${location === "/admin/employees" ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                                    <span className="text-[13px] tracking-tight">Daftar Karyawan</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Rekap Absensi"
                                    isActive={location === "/admin/recap"}
                                    onClick={() => setLocation("/admin/recap")}
                                    className={`h-12 rounded-2xl transition-all duration-300 px-4 ${
                                        location === "/admin/recap" 
                                        ? "bg-slate-900 text-white shadow-[0_10px_20px_-5px_rgba(15,23,42,0.3)] font-black" 
                                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-bold"
                                    }`}
                                >
                                    <Clock className={`h-5 w-5 ${location === "/admin/recap" ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                                    <span className="text-[13px] tracking-tight">Rekap Absensi</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Riwayat Absensi"
                                    isActive={location === "/admin/attendance-history"}
                                    onClick={() => setLocation("/admin/attendance-history")}
                                    className={`h-12 rounded-2xl transition-all duration-300 px-4 ${
                                        location === "/admin/attendance-history" 
                                        ? "bg-slate-900 text-white shadow-[0_10px_20px_-5px_rgba(15,23,42,0.3)] font-black" 
                                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-bold"
                                    }`}
                                >
                                    <ImageIcon className={`h-5 w-5 ${location === "/admin/attendance-history" ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                                    <span className="text-[13px] tracking-tight">Riwayat Absensi</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Manajemen Cuti"
                                    isActive={location === "/admin/leave"}
                                    onClick={() => setLocation("/admin/leave")}
                                    className={`h-12 rounded-2xl transition-all duration-300 px-4 ${
                                        location === "/admin/leave" 
                                        ? "bg-slate-900 text-white shadow-[0_10px_20_rgba(15,23,42,0.3)] font-black" 
                                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-bold"
                                    }`}
                                >
                                    <CalendarDays className={`h-5 w-5 ${location === "/admin/leave" ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                                    <span className="flex-1 text-[13px] tracking-tight text-left">Manajemen Cuti</span>
                                    {pendingLeaveCount > 0 && (
                                        <span className="bg-orange-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full group-data-[collapsible=icon]:hidden shadow-lg shadow-orange-200">
                                            {pendingLeaveCount}
                                        </span>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Riwayat Cuti"
                                    isActive={location === "/admin/leave-history"}
                                    onClick={() => setLocation("/admin/leave-history")}
                                    className={`h-12 rounded-2xl transition-all duration-300 px-4 ${
                                        location === "/admin/leave-history" 
                                        ? "bg-slate-900 text-white shadow-[0_10px_20px_-5px_rgba(15,23,42,0.3)] font-black" 
                                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-bold"
                                    }`}
                                >
                                    <History className={`h-5 w-5 ${location === "/admin/leave-history" ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                                    <span className="text-[13px] tracking-tight">Riwayat Cuti</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Papan Informasi"
                                    isActive={location === "/admin/info-board"}
                                    onClick={() => setLocation("/admin/info-board")}
                                    className={`h-12 rounded-2xl transition-all duration-300 px-4 ${
                                        location === "/admin/info-board" 
                                        ? "bg-slate-900 text-white shadow-[0_10px_20px_-5px_rgba(15,23,42,0.3)] font-black" 
                                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-bold"
                                    }`}
                                >
                                    <FileText className={`h-5 w-5 ${location === "/admin/info-board" ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                                    <span className="text-[13px] tracking-tight">Papan Informasi</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {user?.role === 'superadmin' && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        tooltip="Pengaduan Karyawan"
                                        isActive={location === "/admin/complaints"}
                                        onClick={() => setLocation("/admin/complaints")}
                                        className={`h-12 rounded-2xl transition-all duration-300 px-4 ${
                                            location === "/admin/complaints" 
                                            ? "bg-slate-900 text-white shadow-[0_10px_20_rgba(15,23,42,0.3)] font-black" 
                                            : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-bold"
                                        }`}
                                    >
                                        <MessageSquare className={`h-5 w-5 ${location === "/admin/complaints" ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                                        <span className="flex-1 text-[13px] tracking-tight text-left">Pengaduan</span>
                                        {pendingComplaintsCount > 0 && (
                                            <span className="bg-rose-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full group-data-[collapsible=icon]:hidden shadow-lg shadow-rose-200">
                                                {pendingComplaintsCount}
                                            </span>
                                        )}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Ringkasan Absensi"
                                    isActive={location === "/admin/attendance-summary"}
                                    onClick={() => setLocation("/admin/attendance-summary")}
                                    className={`h-12 rounded-2xl transition-all duration-300 px-4 ${
                                        location === "/admin/attendance-summary" 
                                        ? "bg-slate-900 text-white shadow-[0_10px_20px_-5px_rgba(15,23,42,0.3)] font-black" 
                                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-bold"
                                    }`}
                                >
                                    <FileText className={`h-5 w-5 ${location === "/admin/attendance-summary" ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                                    <span className="truncate text-[13px] tracking-tight">Ringkasan Absensi</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Verifikasi Karyawan"
                                    isActive={location === "/admin/verification"}
                                    onClick={() => setLocation("/admin/verification")}
                                    className={`h-12 rounded-2xl transition-all duration-300 px-4 ${
                                        location === "/admin/verification" 
                                        ? "bg-amber-500 text-white shadow-[0_10px_20px_-5px_rgba(245,158,11,0.3)] font-black" 
                                        : "text-slate-500 hover:bg-amber-50 hover:text-amber-700 font-bold shadow-sm border border-amber-100/50"
                                    }`}
                                >
                                    <ShieldCheck className={`h-5 w-5 ${location === "/admin/verification" ? "text-white" : "text-amber-500"}`} />
                                    <span className="flex-1 text-[13px] tracking-tight text-left">Verifikasi</span>
                                    {pendingVerificationCount > 0 && (
                                        <span className={`${location === "/admin/verification" ? "bg-white text-amber-600" : "bg-amber-600 text-white"} text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full group-data-[collapsible=icon]:hidden shadow-lg shadow-amber-200`}>
                                            {pendingVerificationCount}
                                        </span>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {user?.role === 'superadmin' && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        tooltip="Kelola Admin"
                                        isActive={location === "/admin/manage-admins"}
                                        onClick={() => setLocation("/admin/manage-admins")}
                                        className={`h-12 rounded-2xl transition-all duration-300 px-4 ${
                                            location === "/admin/manage-admins" 
                                            ? "bg-slate-900 text-white shadow-[0_10px_20px_-5px_rgba(15,23,42,0.3)] font-black" 
                                            : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 font-bold"
                                        }`}
                                    >
                                        <UserCog className={`h-5 w-5 ${location === "/admin/manage-admins" ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"}`} />
                                        <span className="text-[13px] tracking-tight">Kelola Admin</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarContent>

                    <SidebarFooter className="p-4 border-t border-slate-100/50 bg-slate-50/50">
                        <Button
                            variant="ghost"
                            className="w-full h-12 text-rose-500 hover:text-white hover:bg-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 group-data-[collapsible=icon]:px-0 shadow-sm hover:shadow-lg hover:shadow-rose-100"
                            onClick={() => logout()}
                        >
                            <LogOut className="h-4 w-4 group-data-[collapsible=icon]:mr-0 mr-3" />
                            <span className="group-data-[collapsible=icon]:hidden">Keluar Sistem</span>
                        </Button>
                    </SidebarFooter>
                </Sidebar>

                <SidebarInset className="flex-1 overflow-hidden flex flex-col bg-gray-50/30">
                    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200/50 bg-white/60 backdrop-blur-xl px-6 sticky top-0 z-30 shadow-sm">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="-ml-2 hover:bg-slate-100 rounded-xl transition-all duration-300 w-10 h-10" />
                            <div className="h-6 w-px bg-slate-200" />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-800 tracking-[0.15em] uppercase leading-tight">
                                    PT ELOK JAYA ABADHI
                                </span>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Sistem Manajemen Absensi</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">
                                    {format(new Date(), "EEEE, d MMM yyyy", { locale: id })}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Server Aktif</span>
                                </div>
                            </div>
                            <div className="h-10 w-10 rounded-2xl bg-white shadow-xl shadow-slate-100 border border-slate-100 flex items-center justify-center ring-4 ring-slate-50 transition-transform hover:scale-105 cursor-pointer">
                                <UserCog className="h-5 w-5 text-slate-500" />
                            </div>
                        </div>
                    </header>
                    <div className="flex-1 overflow-auto bg-gray-50/50">
                        {children}
                    </div>
                </SidebarInset>
                    <div className="flex-1 overflow-auto bg-gray-50/50">
                        {children}
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
