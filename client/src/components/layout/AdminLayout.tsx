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

    // Persist collapsible sidebar using localStorage
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("admin_sidebar_collapsed") === "true";
        }
        return false;
    });

    const toggleSidebarCollapse = () => {
        setSidebarCollapsed(prev => {
            const next = !prev;
            localStorage.setItem("admin_sidebar_collapsed", String(next));
            return next;
        });
    };

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

    const isLinkActive = (path: string) => location === path;
    const getLinkClass = (path: string) => {
        const active = isLinkActive(path);
        if (sidebarCollapsed) {
            return `flex items-center justify-center lg:w-11 lg:h-11 mx-auto rounded-lg text-sm font-medium transition-all duration-200 relative ${
                active
                    ? "bg-green-50 text-green-700 font-bold shadow-xs border border-green-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`;
        }
        return `flex items-center gap-3 w-full rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
            active
                ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-600 pl-2.5 shadow-xs"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 pl-3"
        }`;
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50/50">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity duration-300"
                />
            )}

            {/* Sidebar Component */}
            <aside
                ref={sidebarRef}
                className={`fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden bg-white border-r border-gray-100 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
                } ${sidebarCollapsed ? "lg:w-20" : "lg:w-72"}`}
            >
                {/* Sidebar Header Brand */}
                <div className={`flex items-center justify-between gap-2 px-6 py-5 border-b border-gray-50 bg-white ${sidebarCollapsed ? "lg:px-4 lg:justify-center" : ""}`}>
                    <div className="flex items-center gap-3">
                        <img src="/logo_elok_buah.jpg" alt="Logo" className="w-10 h-10 object-contain rounded-lg shadow-xs shrink-0" />
                        {!sidebarCollapsed && (
                            <div className="flex flex-col lg:animate-in lg:fade-in duration-200">
                                <h1 className="text-sm font-black text-gray-900 tracking-tight leading-tight">PT ELOK JAYA ABADHI</h1>
                                <p className="text-[10px] text-green-600 font-bold tracking-wider">ADMIN PANEL</p>
                            </div>
                        )}
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
                            {!sidebarCollapsed ? (
                                <p className="px-3 mb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest lg:animate-in lg:fade-in duration-200">
                                    Menu Utama
                                </p>
                            ) : (
                                <div className="border-t border-gray-100 my-4 first:hidden" />
                            )}
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin")}
                                        className={getLinkClass("/admin")}
                                        title={sidebarCollapsed ? "Dashboard" : undefined}
                                    >
                                        <CalendarDays className="h-4.5 w-4.5 shrink-0" />
                                        {!sidebarCollapsed && <span>Dashboard</span>}
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/employees")}
                                        className={getLinkClass("/admin/employees")}
                                        title={sidebarCollapsed ? "Daftar Karyawan" : undefined}
                                    >
                                        <Users className="h-4.5 w-4.5 shrink-0" />
                                        {!sidebarCollapsed && <span>Daftar Karyawan</span>}
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Section: Attendance & Leave */}
                        <div>
                            {!sidebarCollapsed ? (
                                <p className="px-3 mb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest lg:animate-in lg:fade-in duration-200">
                                    Absensi & Cuti
                                </p>
                            ) : (
                                <div className="border-t border-gray-100 my-4" />
                            )}
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/recap")}
                                        className={getLinkClass("/admin/recap")}
                                        title={sidebarCollapsed ? "Rekap Absensi" : undefined}
                                    >
                                        <Clock className="h-4.5 w-4.5 shrink-0" />
                                        {!sidebarCollapsed && <span>Rekap Absensi</span>}
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/attendance-history")}
                                        className={getLinkClass("/admin/attendance-history")}
                                        title={sidebarCollapsed ? "Riwayat Absensi" : undefined}
                                    >
                                        <ImageIcon className="h-4.5 w-4.5 shrink-0" />
                                        {!sidebarCollapsed && <span>Riwayat Absensi</span>}
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/leave")}
                                        className={getLinkClass("/admin/leave")}
                                        title={sidebarCollapsed ? `Manajemen Cuti (${pendingLeaveCount})` : undefined}
                                    >
                                        {sidebarCollapsed ? (
                                            <>
                                                <CalendarDays className="h-4.5 w-4.5 shrink-0" />
                                                {pendingLeaveCount > 0 && (
                                                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white animate-pulse" />
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <CalendarDays className="h-4.5 w-4.5 shrink-0" />
                                                    <span>Manajemen Cuti</span>
                                                </div>
                                                {pendingLeaveCount > 0 && (
                                                    <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                        {pendingLeaveCount}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/leave-history")}
                                        className={getLinkClass("/admin/leave-history")}
                                        title={sidebarCollapsed ? "Riwayat Cuti" : undefined}
                                    >
                                        <History className="h-4.5 w-4.5 shrink-0" />
                                        {!sidebarCollapsed && <span>Riwayat Cuti</span>}
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/attendance-summary")}
                                        className={getLinkClass("/admin/attendance-summary")}
                                        title={sidebarCollapsed ? "Ringkasan Absensi" : undefined}
                                    >
                                        <FileText className="h-4.5 w-4.5 shrink-0" />
                                        {!sidebarCollapsed && <span className="truncate">Ringkasan Absensi</span>}
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Section: Management & Setting */}
                        <div>
                            {!sidebarCollapsed ? (
                                <p className="px-3 mb-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest lg:animate-in lg:fade-in duration-200">
                                    Manajemen
                                </p>
                            ) : (
                                <div className="border-t border-gray-100 my-4" />
                            )}
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/info-board")}
                                        className={getLinkClass("/admin/info-board")}
                                        title={sidebarCollapsed ? "Papan Informasi" : undefined}
                                    >
                                        <FileText className="h-4.5 w-4.5 shrink-0" />
                                        {!sidebarCollapsed && <span>Papan Informasi</span>}
                                    </button>
                                </li>

                                {(user?.role === 'superadmin' || user?.role === 'admin') && (
                                    <li>
                                        <button
                                            onClick={() => setLocation("/admin/complaints")}
                                            className={getLinkClass("/admin/complaints")}
                                            title={sidebarCollapsed ? `Pengaduan Karyawan (${pendingComplaintsCount})` : undefined}
                                        >
                                            {sidebarCollapsed ? (
                                                <>
                                                    <MessageSquare className="h-4.5 w-4.5 shrink-0" />
                                                    {pendingComplaintsCount > 0 && (
                                                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-3">
                                                        <MessageSquare className="h-4.5 w-4.5 shrink-0" />
                                                        <span>Pengaduan Karyawan</span>
                                                    </div>
                                                    {pendingComplaintsCount > 0 && (
                                                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                                            {pendingComplaintsCount}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    </li>
                                )}

                                <li>
                                    <button
                                        onClick={() => setLocation("/admin/verification")}
                                        className={getLinkClass("/admin/verification")}
                                        title={sidebarCollapsed ? `Verifikasi Karyawan (${pendingVerificationCount})` : undefined}
                                    >
                                        {sidebarCollapsed ? (
                                            <>
                                                <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                                                {pendingVerificationCount > 0 && (
                                                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                                                    <span>Verifikasi Karyawan</span>
                                                </div>
                                                {pendingVerificationCount > 0 && (
                                                    <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                        {pendingVerificationCount}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                </li>

                                {user?.role === 'superadmin' && (
                                    <li>
                                        <button
                                            onClick={() => setLocation("/admin/manage-admins")}
                                            className={getLinkClass("/admin/manage-admins")}
                                            title={sidebarCollapsed ? "Kelola Admin" : undefined}
                                        >
                                            <UserCog className="h-4.5 w-4.5 shrink-0" />
                                            {!sidebarCollapsed && <span>Kelola Admin</span>}
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </nav>
                </div>

                {/* Sidebar Footer Logout (Premium Style) */}
                <div className={`p-4 border-t border-gray-100 bg-white ${sidebarCollapsed ? "lg:p-2.5" : ""}`}>
                    <button
                        onClick={() => logout()}
                        className={`flex items-center gap-3 text-sm font-semibold text-red-600 hover:text-red-700 rounded-lg bg-red-50/50 hover:bg-red-50 transition-all duration-200 active:scale-[0.98] border border-red-100/50 hover:border-red-200 ${
                            sidebarCollapsed 
                                ? "w-11 h-11 mx-auto justify-center p-0" 
                                : "w-full px-4 py-3"
                        }`}
                        title={sidebarCollapsed ? "Keluar" : undefined}
                    >
                        <LogOut className="w-4.5 h-4.5 shrink-0" />
                        {!sidebarCollapsed && <span>Keluar</span>}
                    </button>
                </div>
            </aside>

            {/* Main Page Area Container */}
            <div className="relative flex flex-grow flex-col overflow-y-auto overflow-x-hidden">
                {/* Header */}
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

                        {/* Desktop Hamburg Toggle Button */}
                        <button
                            onClick={() => toggleSidebarCollapse()}
                            className="hidden lg:block rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:text-gray-900 shadow-xs transition-all active:scale-95 hover:bg-gray-50 focus:outline-none cursor-pointer"
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
                                className="flex items-center gap-2 sm:gap-3 hover:bg-gray-50 p-1.5 rounded-lg sm:rounded-xl transition-all duration-200 focus:outline-none"
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
                                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-gray-100 shadow-2xl py-2 z-50 transition-all origin-top-right animate-in fade-in slide-in-from-top-2 duration-150">
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
                                            setLocation("/admin/profile");
                                        }}
                                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                                    >
                                        <UserCog className="w-4 h-4 text-gray-400" />
                                        <span>Profil Admin</span>
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
