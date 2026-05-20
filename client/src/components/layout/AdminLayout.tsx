import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
    Users,
    Clock,
    CalendarDays,
    History,
    FileText,
    MessageSquare,
    LogOut,
    Image as ImageIcon,
    ShieldCheck,
    UserCog,
    Menu,
    X,
    Calendar,
    ChevronDown,
    Bell
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useState, useRef, useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [location, setLocation] = useLocation();
    const { logout, user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

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

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Close sidebar on location change (for mobile viewports)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50/50">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity duration-300"
                />
            )}

            {/* Sidebar Component (TailAdmin structural layout style) */}
            <aside
                ref={sidebarRef}
                className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-hidden bg-white border-r border-gray-100 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
                }`}
            >
                {/* Sidebar Header Brand */}
                <div className="flex items-center justify-between gap-2 px-6 py-5 border-b border-gray-50 bg-white">
                    <div className="flex items-center gap-3">
                        <img src="/logo_elok_buah.jpg" alt="Logo" className="w-10 h-10 object-contain rounded-lg shadow-xs" />
                        <div className="flex flex-col">
                            <h1 className="text-sm font-black text-gray-900 tracking-tight">PT ELOK JAYA ABADHI</h1>
                            <p className="text-[10px] text-green-600 font-bold tracking-wider">ADMIN PANEL</p>
                        </div>
                    </div>
                    {/* Mobile close button */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="block lg:hidden text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sidebar Links Menu */}
                <div className="flex flex-col overflow-y-auto flex-1 p-4 no-scrollbar">
                    <nav className="space-y-6">
                        {/* Section: Main Menu */}
                        <div>
                            <p className="px-3 mb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Menu Utama
                            </p>
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin")}
                                        className={`flex items-center gap-3 w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                                            location === "/admin"
                                                ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-600 pl-2.5 shadow-xs"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 pl-3"
                                        }`}
                                    >
                                        <CalendarDays className="h-4.5 w-4.5 shrink-0" />
                                        <span>Dashboard</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/employees")}
                                        className={`flex items-center gap-3 w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                                            location === "/admin/employees"
                                                ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-600 pl-2.5 shadow-xs"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 pl-3"
                                        }`}
                                    >
                                        <Users className="h-4.5 w-4.5 shrink-0" />
                                        <span>Daftar Karyawan</span>
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Section: Attendance & Leave */}
                        <div>
                            <p className="px-3 mb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Absensi & Cuti
                            </p>
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/recap")}
                                        className={`flex items-center gap-3 w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                                            location === "/admin/recap"
                                                ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-600 pl-2.5 shadow-xs"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 pl-3"
                                        }`}
                                    >
                                        <Clock className="h-4.5 w-4.5 shrink-0" />
                                        <span>Rekap Absensi</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/attendance-history")}
                                        className={`flex items-center gap-3 w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                                            location === "/admin/attendance-history"
                                                ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-600 pl-2.5 shadow-xs"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 pl-3"
                                        }`}
                                    >
                                        <ImageIcon className="h-4.5 w-4.5 shrink-0" />
                                        <span>Riwayat Absensi</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/leave")}
                                        className={`flex items-center justify-between w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                                            location === "/admin/leave"
                                                ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-600 pl-2.5 pr-3 shadow-xs"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 pl-3 pr-3"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <CalendarDays className="h-4.5 w-4.5 shrink-0" />
                                            <span>Manajemen Cuti</span>
                                        </div>
                                        {pendingLeaveCount > 0 && (
                                            <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                {pendingLeaveCount}
                                            </span>
                                        )}
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/leave-history")}
                                        className={`flex items-center gap-3 w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                                            location === "/admin/leave-history"
                                                ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-600 pl-2.5 shadow-xs"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 pl-3"
                                        }`}
                                    >
                                        <History className="h-4.5 w-4.5 shrink-0" />
                                        <span>Riwayat Cuti</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/attendance-summary")}
                                        className={`flex items-center gap-3 w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                                            location === "/admin/attendance-summary"
                                                ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-600 pl-2.5 shadow-xs"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 pl-3"
                                        }`}
                                    >
                                        <FileText className="h-4.5 w-4.5 shrink-0" />
                                        <span className="truncate">Ringkasan Absensi</span>
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Section: Management & Setting */}
                        <div>
                            <p className="px-3 mb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Manajemen
                            </p>
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/info-board")}
                                        className={`flex items-center gap-3 w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                                            location === "/admin/info-board"
                                                ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-600 pl-2.5 shadow-xs"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 pl-3"
                                        }`}
                                    >
                                        <FileText className="h-4.5 w-4.5 shrink-0" />
                                        <span>Papan Informasi</span>
                                    </button>
                                </li>

                                {(user?.role === 'superadmin' || user?.role === 'admin') && (
                                    <li>
                                        <button
                                            onClick={() => setLocation("/admin/complaints")}
                                            className={`flex items-center justify-between w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                                                location === "/admin/complaints"
                                                    ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-600 pl-2.5 pr-3 shadow-xs"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 pl-3 pr-3"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <MessageSquare className="h-4.5 w-4.5 shrink-0" />
                                                <span>Pengaduan Karyawan</span>
                                            </div>
                                            {pendingComplaintsCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                                    {pendingComplaintsCount}
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                )}

                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/verification")}
                                        className={`flex items-center justify-between w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                                            location === "/admin/verification"
                                                ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-600 pl-2.5 pr-3 shadow-xs"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 pl-3 pr-3"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                                            <span>Verifikasi Karyawan</span>
                                        </div>
                                        {pendingVerificationCount > 0 && (
                                            <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                {pendingVerificationCount}
                                            </span>
                                        )}
                                    </button>
                                </li>

                                {user?.role === 'superadmin' && (
                                    <li>
                                        <button
                                            onClick={() => setLocation("/admin/manage-admins")}
                                            className={`flex items-center gap-3 w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                                                location === "/admin/manage-admins"
                                                    ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-600 pl-2.5 shadow-xs"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 pl-3"
                                            }`}
                                        >
                                            <UserCog className="h-4.5 w-4.5 shrink-0" />
                                            <span>Kelola Admin</span>
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </nav>
                </div>

                {/* Sidebar Footer Logout (Premium Style) */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-red-600 hover:text-red-700 rounded-xl bg-red-50/50 hover:bg-red-50 transition-all duration-200 active:scale-[0.98] shadow-xs border border-red-100/50 hover:border-red-200"
                    >
                        <LogOut className="w-4.5 h-4.5 shrink-0" />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Main Page Area Container */}
            <div className="relative flex flex-grow flex-col overflow-y-auto overflow-x-hidden">
                {/* Header (TailAdmin structural layout style) */}
                <header className="sticky top-0 z-30 flex w-full bg-white border-b border-gray-100 px-4 sm:px-6 h-16 shrink-0 items-center justify-between shadow-xs">
                    {/* Header Left Side */}
                    <div className="flex items-center gap-4">
                        {/* Mobile Hamburg Toggle Button */}
                        <button
                            aria-controls="sidebar"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSidebarOpen(!sidebarOpen);
                            }}
                            className="block lg:hidden rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:text-gray-900 shadow-xs transition-all active:scale-95 hover:bg-gray-50 focus:outline-none"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        
                        {/* Company branding pill for desktop */}
                        <div className="hidden lg:flex items-center">
                            <span className="text-xs font-black text-green-600 bg-green-50/80 border border-green-100 px-3 py-1 rounded-full uppercase tracking-wider">
                                PT Elok Jaya Abadhi
                            </span>
                        </div>
                    </div>

                    {/* Header Center: Elegant Date Indicator */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100/70 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium text-gray-600 shadow-inner">
                        <Calendar className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="capitalize">{format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}</span>
                    </div>

                    {/* Header Right Side */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Notifications Bell Button */}
                        <div className="relative">
                            <button
                                onClick={() => setLocation("/admin/complaints")}
                                className="relative flex items-center justify-center w-10 h-10 rounded-full border border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
                            >
                                <Bell className="w-4.5 h-4.5" />
                                {(pendingLeaveCount + pendingComplaintsCount + pendingVerificationCount) > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                                        {pendingLeaveCount + pendingComplaintsCount + pendingVerificationCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Separation Line */}
                        <div className="h-6 w-px bg-gray-200" />

                        {/* User Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 sm:gap-3 hover:bg-gray-50 p-1.5 rounded-xl sm:rounded-2xl transition-all duration-200 focus:outline-none"
                            >
                                <div className="hidden text-right sm:block">
                                    <p className="text-xs font-black text-gray-800 tracking-tight leading-none truncate max-w-[120px]">
                                        {user?.fullName || user?.username || "Admin"}
                                    </p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                        {user?.role === "superadmin" ? "Super Admin" : "Admin"}
                                    </p>
                                </div>
                                
                                {/* User Avatar Fallback */}
                                <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs hover:scale-105 transition-all">
                                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : (user?.username ? user.username.charAt(0).toUpperCase() : "A")}
                                </div>
                                
                                <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200" style={{ transform: dropdownOpen ? "rotate(180deg)" : "none" }} />
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-gray-100 shadow-2xl py-2 z-50 transition-all origin-top-right animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="px-4 py-2 border-b border-gray-50 mb-1.5">
                                        <p className="text-xs font-bold text-gray-800 truncate">
                                            {user?.fullName || "User Admin"}
                                        </p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                            {user?.role === "superadmin" ? "Super Admin" : "Admin"}
                                        </p>
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            setLocation("/profile");
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                                    >
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span>Profil Karyawan</span>
                                    </button>
                                    
                                    <div className="h-px bg-gray-50 my-1" />
                                    
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            logout();
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50/50 transition-colors font-semibold"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Keluar</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content Viewport */}
                <main className="flex-1 overflow-auto bg-gray-50/40 p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
