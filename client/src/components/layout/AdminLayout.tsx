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
                <Sidebar collapsible="icon" className="border-r border-gray-200">
                    <SidebarHeader className="border-b border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <img src="/logo_elok_buah.jpg" alt="Logo" className="w-10 h-10 object-contain rounded" />
                            <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                                <h1 className="text-lg font-bold text-green-600 truncate">Admin Panel</h1>
                                <p className="text-[10px] text-gray-400 truncate">PT ELOK JAYA ABADHI</p>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="p-2">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Dashboard"
                                    isActive={location === "/admin"}
                                    onClick={() => setLocation("/admin")}
                                    className={location === "/admin" ? "bg-green-50 text-green-700 font-medium" : "text-gray-600"}
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Daftar Karyawan"
                                    isActive={location === "/admin/employees"}
                                    onClick={() => setLocation("/admin/employees")}
                                    className={location === "/admin/employees" ? "bg-green-50 text-green-700 font-medium" : "text-gray-600"}
                                >
                                    <Users className="h-4 w-4" />
                                    <span>Daftar Karyawan</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Rekap Absensi"
                                    isActive={location === "/admin/recap"}
                                    onClick={() => setLocation("/admin/recap")}
                                    className={location === "/admin/recap" ? "bg-green-50 text-green-700 font-medium" : "text-gray-600"}
                                >
                                    <Clock className="h-4 w-4" />
                                    <span>Rekap Absensi</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Riwayat Absensi"
                                    isActive={location === "/admin/attendance-history"}
                                    onClick={() => setLocation("/admin/attendance-history")}
                                    className={location === "/admin/attendance-history" ? "bg-green-50 text-green-700 font-medium" : "text-gray-600"}
                                >
                                    <ImageIcon className="h-4 w-4" />
                                    <span>Riwayat Absensi</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Manajemen Cuti"
                                    isActive={location === "/admin/leave"}
                                    onClick={() => setLocation("/admin/leave")}
                                    className={location === "/admin/leave" ? "bg-green-50 text-green-700 font-medium" : "text-gray-600"}
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    <span className="flex-1">Manajemen Cuti</span>
                                    {pendingLeaveCount > 0 && (
                                        <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full group-data-[collapsible=icon]:hidden">
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
                                    className={location === "/admin/leave-history" ? "bg-green-50 text-green-700 font-medium" : "text-gray-600"}
                                >
                                    <History className="h-4 w-4" />
                                    <span>Riwayat Cuti</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Papan Informasi"
                                    isActive={location === "/admin/info-board"}
                                    onClick={() => setLocation("/admin/info-board")}
                                    className={location === "/admin/info-board" ? "bg-green-50 text-green-700 font-medium" : "text-gray-600"}
                                >
                                    <FileText className="h-4 w-4" />
                                    <span>Papan Informasi</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {user?.role === 'superadmin' && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        tooltip="Pengaduan Karyawan"
                                        isActive={location === "/admin/complaints"}
                                        onClick={() => setLocation("/admin/complaints")}
                                        className={location === "/admin/complaints" ? "bg-green-50 text-green-700 font-medium" : "text-gray-600"}
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="flex-1">Pengaduan</span>
                                        {pendingComplaintsCount > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full group-data-[collapsible=icon]:hidden">
                                                {pendingComplaintsCount}
                                            </span>
                                        )}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Absensi Karyawan PT ELOK JAYA ABADHI"
                                    isActive={location === "/admin/attendance-summary"}
                                    onClick={() => setLocation("/admin/attendance-summary")}
                                    className={location === "/admin/attendance-summary" ? "bg-green-50 text-green-700 font-medium" : "text-gray-600"}
                                >
                                    <FileText className="h-4 w-4" />
                                    <span className="truncate">Ringkasan Absensi</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip="Verifikasi Karyawan"
                                    isActive={location === "/admin/verification"}
                                    onClick={() => setLocation("/admin/verification")}
                                    className={location === "/admin/verification" ? "bg-amber-50 text-amber-700 font-medium" : "text-gray-600"}
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="flex-1">Verifikasi Karyawan</span>
                                    {pendingVerificationCount > 0 && (
                                        <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full group-data-[collapsible=icon]:hidden">
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
                                        className={location === "/admin/manage-admins" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600"}
                                    >
                                        <UserCog className="h-4 w-4" />
                                        <span>Kelola Admin</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarContent>

                    <SidebarFooter className="p-4 border-t border-gray-100">
                        <Button
                            variant="outline"
                            className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 group-data-[collapsible=icon]:px-0"
                            onClick={() => logout()}
                        >
                            <LogOut className="h-4 w-4 group-data-[collapsible=icon]:mr-0 mr-2" />
                            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                        </Button>
                    </SidebarFooter>
                </Sidebar>

                <SidebarInset className="flex-1 overflow-hidden flex flex-col">
                    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-white px-4">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <div className="h-4 w-px bg-gray-200" />
                            <span className="text-sm font-medium text-gray-500 hidden sm:block">
                                PT ELOK JAYA ABADHI
                            </span>
                        </div>
                        <div className="text-sm text-gray-500 font-medium capitalize hidden md:block">
                            {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}
                        </div>
                    </header>
                    <div className="flex-1 overflow-auto bg-gray-50/50">
                        {children}
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
