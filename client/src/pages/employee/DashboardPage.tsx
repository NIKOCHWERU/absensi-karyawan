import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useAttendance } from "@/hooks/use-attendance";
import { CompanyHeader } from "@/components/CompanyHeader";
import { DigitalClock } from "@/components/DigitalClock";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Camera, MapPin, Coffee, LogOut, X, Check, RefreshCw, SwitchCamera, Zap, ChevronRight, Stethoscope, Umbrella, FileText, Timer, Bell, Info } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { CameraModal } from "@/components/CameraModal";
import { LateReasonModal } from "@/components/LateReasonModal";
import { WorkTimer } from "@/components/WorkTimer";

// Helper: resolve photo URL — handles both local uploads and Google Drive File IDs
function getPhotoUrl(value: string): string {
    if (!value) return '';
    // Base64 data URI
    if (value.startsWith('data:')) return value;
    // Google Drive File ID: no dots, no slashes, length > 20 — use server proxy to avoid CORS/auth issues
    if (!value.includes('/') && !value.includes('.') && value.length > 20) {
        return `/api/images/${value}`;
    }
    // Local file
    return `/uploads/${value}`;
}

// Helper component for Shift Selection Modal
function ShiftModal({
    open,
    shifts,
    onSelect,
    onClose
}: {
    open: boolean,
    shifts: any[],
    onSelect: (shiftId: number, name: string) => void,
    onClose: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="rounded-2xl max-w-xs md:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">Pilih Shift Kerja</DialogTitle>
                    <DialogDescription className="text-center">
                        Silakan pilih shift Anda hari ini untuk mulai absensi.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 py-4">
                    {!shifts || shifts.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                           <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                           Memuat daftar shift...
                        </div>
                    ) : (
                        shifts.map(s => (
                            <Button
                                key={s.id}
                                variant="outline"
                                className="h-16 justify-between px-6 text-base border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                                onClick={() => onSelect(s.id, s.name)}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="font-bold text-slate-900">{s.name}</span>
                                    <span className="text-xs text-slate-500 font-mono">{s.checkInTime} - {s.checkOutTime}</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                                </div>
                            </Button>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const { today, activeSession, todaySessions, sessionCount, completedSessions, isLoadingToday, clockIn, clockOut, breakStart, breakEnd, permit, resume, isPending } = useAttendance();
    const { toast } = useToast();

    const [permitOpen, setPermitOpen] = useState(false);
    const [permitNote, setPermitNote] = useState("");
    const [permitType, setPermitType] = useState<"sick" | "permission" | "off">("permission");
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    // Shift Selection State
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [isOffDayOpen, setIsOffDayOpen] = useState(false);
    const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);

    const shiftList = [
        { id: 1, name: 'Shift 1', checkInTime: '07:00', checkOutTime: '17:00' },
        { id: 2, name: 'Shift 2', checkInTime: '12:00', checkOutTime: '23:00' },
        { id: 3, name: 'Shift 3', checkInTime: '15:00', checkOutTime: '23:00' },
        { id: 4, name: 'longshift', checkInTime: '07:00', checkOutTime: '23:00' }
    ];

    // Push Notifications State
    const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unavailable'>(
        typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unavailable'
    );
    const [isSubscribing, setIsSubscribing] = useState(false);

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            toast({ title: "Tidak Didukung", description: "Browser Anda tidak mendukung Web Push.", variant: "destructive" });
            return;
        }

        try {
            setIsSubscribing(true);
            const permission = await Notification.requestPermission();
            setPushPermission(permission);

            if (permission === 'granted') {
                const reg = await navigator.serviceWorker.register('/sw.js');

                // Fetch public key
                const keyRes = await fetch('/api/push/public-key');
                if (!keyRes.ok) throw new Error("Gagal mengambil kunci Notifikasi dari server");
                const { publicKey } = await keyRes.json();

                // Convert VAPID key
                const urlBase64ToUint8Array = (base64String: string) => {
                    const padding = '='.repeat((4 - base64String.length % 4) % 4);
                    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
                    const rawData = window.atob(base64);
                    const outputArray = new Uint8Array(rawData.length);
                    for (let i = 0; i < rawData.length; ++i) {
                        outputArray[i] = rawData.charCodeAt(i);
                    }
                    return outputArray;
                };

                const subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey)
                });

                const saveRes = await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                });

                if (saveRes.ok) {
                    toast({ title: "Notifikasi Aktif!", description: "Anda akan menerima pengumuman dari Admin." });
                }
            } else {
                toast({ title: "Izin Ditolak", description: "Anda telah menolak izin notifikasi.", variant: "destructive" });
            }
        } catch (err: any) {
            console.error("Push Error", err);
            toast({ title: "Gagal Mengaktifkan Notifikasi", description: err.message, variant: "destructive" });
        } finally {
            setIsSubscribing(false);
        }
    };

    const [activeAction, setActiveAction] = useState<{
        fn: (data: any) => Promise<any>,
        successTitle: string,
        type: 'attendance' | 'permit'
    } | null>(null);

    const [isLateReasonModalOpen, setIsLateReasonModalOpen] = useState(false);
    const [lateReasonData, setLateReasonData] = useState<{ reason: string, photo?: string } | null>(null);

    const [locationAddress, setLocationAddress] = useState<string>("");
    const [processingLocation, setProcessingLocation] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    // ... (Keep existing getCoordinates logic)
    const lastLocationFetch = useRef<number>(0);
    const getCoordinates = async (force = false): Promise<{ lat: number, lng: number, address: string }> => {
        const now = Date.now();
        // If we have a location fetched in the last 5 mins, reuse it unless forced
        if (!force && locationAddress && (now - lastLocationFetch.current < 300000)) {
            return { lat: 0, lng: 0, address: locationAddress };
        }

        if (!navigator.geolocation) {
            throw new Error("Geolocation is not supported by your browser");
        }

        setProcessingLocation(true);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;
            let address = `${latitude},${longitude}`;

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();
                if (data && data.display_name) {
                    address = data.display_name;
                }
            } catch (e) {
                console.error("Reverse geocoding failed", e);
            }

            setLocationAddress(address);
            lastLocationFetch.current = Date.now();
            return { lat: latitude, lng: longitude, address };
        } catch (err: any) {
            if (err.code === 1) { // PERMISSION_DENIED
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
                if (isIOS) {
                    throw new Error("Akses lokasi ditolak. Buka Pengaturan iPhone -> Privasi -> Layanan Lokasi (Aktifkan), lalu pastikan Browser memiliki izin.");
                } else {
                    throw new Error("Akses lokasi ditolak. Silakan aktifkan izin lokasi di pengaturan browser atau HP Anda.");
                }
            } else if (err.code === 3) { // TIMEOUT
                throw new Error("Gagal mengambil lokasi (Timeout). Pastikan Anda berada di area terbuka dan koneksi internet stabil.");
            }
            throw err;
        } finally {
            setProcessingLocation(false);
        }
    };

    const handleError = (err: any) => {
        console.error(err);
        toast({
            title: "Gagal",
            description: err.message || "Terjadi kesalahan",
            variant: "destructive"
        });
    };

    const startAttendanceFlow = async (actionFn: (data: any) => Promise<any>, successTitle: string, isClockIn = false) => {
        if (isClockIn && sessionCount === 0) {
            setActiveAction({ fn: actionFn, successTitle, type: 'attendance' });
            setIsShiftModalOpen(true);
            return;
        }

        let finalActionFn = actionFn;
        if (isClockIn && sessionCount > 0) {
            const initialShift = todaySessions && todaySessions.length > 0 ? (todaySessions[0] as any).shift : 'Karyawan';
            finalActionFn = async (data: any) => actionFn({ ...data, shift: initialShift });
        }

        setActiveAction({ fn: finalActionFn, successTitle, type: 'attendance' });
        setIsCameraOpen(true);
    };

    const handleShiftSelect = (shiftId: number, shiftName: string) => {
        setSelectedShiftId(shiftId);
        setIsShiftModalOpen(false);

        const shiftData = shiftList?.find(s => s.id === shiftId);
        if (!shiftData) return;

        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const timeInMinutes = hour * 60 + minute;

        const [sHour, sMinute] = shiftData.checkInTime.split(':').map(Number);
        const thresholdMinutes = sHour * 60 + sMinute;

        const isLate = timeInMinutes > thresholdMinutes;

        const wrappedClockIn = async (data: any) => {
            return clockIn({ ...data, shiftId, shift: shiftName });
        };

        if (activeAction) {
            setActiveAction({ ...activeAction, fn: wrappedClockIn });
        }

        if (isLate) {
            setIsLateReasonModalOpen(true);
        } else {
            setIsCameraOpen(true);
        }
    };

    const handleLateReasonSubmit = (reason: string, photo?: string) => {
        setLateReasonData({ reason, photo });
        setIsLateReasonModalOpen(false);
        setIsCameraOpen(true);
    };

    const startPermitFlow = () => {
        setPermitOpen(true);
    };

    const handlePermitCameraTrigger = () => {
        setPermitOpen(false);
        setActiveAction({
            fn: async (data: any) => {
                return permit({
                    type: permitType,
                    notes: permitNote,
                    checkInPhoto: data?.checkInPhoto, // Make optional for off day
                    location: data?.location
                });
            },
            successTitle: permitType === "off" ? "Off Day Tercatat" : "Izin Diajukan",
            type: 'permit'
        });

        if (permitType === "off") {
            // Bypass camera
            const offAction = async () => {
                const { address } = await getCoordinates(false);
                await permit({
                    type: 'off',
                    notes: permitNote || "Libur Bekerja",
                    checkInPhoto: null,
                    location: address
                });
            };

            toast({ title: "Memproses...", description: "Mencatat absensi libur anda." });
            offAction().then(() => {
                toast({ title: "Off Day Tercatat", description: "Selamat beristirahat!", className: "bg-green-500 text-white" });
                setActiveAction(null);
            }).catch(err => {
                handleError(err);
                setActiveAction(null);
            });
        } else {
            setIsCameraOpen(true);
        }
    }

    const handlePhotoCaptured = async (photoData: string) => {
        if (!activeAction) return;

        try {
            const { address } = await getCoordinates(false);
            const payload: any = {
                location: address,
                checkInPhoto: photoData
            };

            if (lateReasonData) {
                payload.lateReason = lateReasonData.reason;
                payload.lateReasonPhoto = lateReasonData.photo;
            }

            await activeAction.fn(payload);

            toast({
                title: activeAction.successTitle,
                description: `Lokasi: ${address}`,
                className: "bg-green-500 text-white"
            });

            // Only close on success
            setIsCameraOpen(false);
            setActiveAction(null);
            // Clear shift selection after success
            setSelectedShiftId(null);
            setLateReasonData(null);

        } catch (err: any) {
            handleError(err);
            // Re-throw so the modal knows it failed
            throw err;
        }
    };

    // Clock Out Logic for Early Leave Check
    const handleClockOutClick = () => {
        // Logic: if current time < shift end time, warn user
        // We need to know shift end time. 
        // User prompt says: "jika karyawan pulang sebelum jam nya beri peringatan... dan beri pilihan IZIN"
        // Since we don't track shift info in 'today' object fully (we just added it to schema), we might need to rely on assumptions or fetch it.
        // Let's assume standard 8 hours from clockIn or fixed times based on shift name if we can get it.
        // BUT 'today' object in 'useAttendance' might not have 'shift' field yet on frontend type.
        // We should check shared/schema.ts updates are reflected in frontend types (Drizzle types are inferred usually).

        // Let's assume we can access today.shift or infer it.
        // If we can't get it easily, we will just prompt "Apakah anda yakin pulang sekarang?" -> "Izin Pulang Cepat" or "Pulang Biasa".
        // But prompt asks specific warning. 

        // Since I just added 'shift' to schema, 'today' SHOULD have it if I refetched.
        // Let's check time.

        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const timeInMinutes = hour * 60 + minute;
        
        let isEarly = false;
        const currentShiftId = (today as any)?.shiftId;
        const currentShift = shiftList?.find((s: any) => s.id === currentShiftId) || (today as any);

        if (currentShift?.checkOutTime) {
            const [eHour, eMinute] = currentShift.checkOutTime.split(':').map(Number);
            const endMinutes = eHour * 60 + eMinute;
            if (timeInMinutes < endMinutes) isEarly = true;
        } else {
            const sName = currentShift?.shift || '';
            if (sName === 'Shift 1' && hour < 15) isEarly = true;
            else if (sName === 'Shift 2' && hour < 20) isEarly = true;
            else if (sName === 'Shift 3' && hour < 23) isEarly = true;
        }

        if (isEarly) {
            if (confirm("Belum waktunya pulang. Apakah Anda ingin mengajukan IZIN Pulang Cepat? \n\nKlik OK untuk Form Izin.\nKlik Cancel untuk membatalkan.")) {
                setPermitType('permission');
                setPermitNote("Pulang Cepat (Early Leave)");
                setPermitOpen(true);
            }
            return;
        }

        startAttendanceFlow(clockOut, "Hati-hati di jalan");
    };

    const isLoading = isPending || processingLocation;

    const hasCheckedIn = !!today?.checkIn;
    const hasCheckedOut = !!today?.checkOut;
    const isBreak = !!today?.breakStart && !today?.breakEnd;
    const hasBreakEnded = !!today?.breakEnd;

    const getStatusText = () => {
        if (!today) return "Belum Absen";
        if (today.status === 'sick') return "Sakit";
        if (today.status === 'permission') return "Izin";
        if (today.status === 'off') return "Libur";
        if (today.status === 'late') return "Telat";
        if (today.status === 'present') return "Hadir";
        if (today.checkOut) return "Absensi Selesai";
        if (isBreak) return "Sedang Istirahat";
        if (hasBreakEnded) return "Waktunya Pulang";
        return "Sedang Bekerja";
    };

    const handleResumeWork = async () => {
        if (confirm("Mau lanjut kerja hari ini?")) {
            try {
                await resume();
                toast({ title: "Selamat Bekerja Kembali", description: "Sesi Anda telah diaktifkan kembali." });
            } catch (err: any) {
                handleError(err);
            }
        }
    };

    const renderMainButton = () => {
        if (today?.status === 'sick' || today?.status === 'permission' || today?.status === 'off') {
            const permitLabel = today.status === 'sick' ? 'Sakit' : today.status === 'off' ? 'Libur' : 'Izin';
            const permitColor = today.status === 'sick' ? 'blue' : today.status === 'off' ? 'slate' : 'purple';
            const Icon = today.status === 'sick' ? Stethoscope : today.status === 'off' ? Umbrella : FileText;
            
            return (
                <div className="flex flex-col gap-4 w-full">
                    <div className={`rounded-3xl p-5 bg-${permitColor}-50/50 border border-${permitColor}-100 flex items-start gap-4 shadow-sm`}>
                        <div className={`w-12 h-12 rounded-2xl bg-${permitColor}-500/10 flex items-center justify-center shrink-0`}>
                            <Icon className={`w-6 h-6 text-${permitColor}-600`} />
                        </div>
                        <div className="space-y-1">
                            <p className={`text-[10px] font-black text-${permitColor}-600 uppercase tracking-[0.2em]`}>Status: {permitLabel}</p>
                            <p className="text-sm text-slate-700 font-bold leading-relaxed">
                                {today.notes || `Absensi ${permitLabel} hari ini sudah tercatat.`}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => startAttendanceFlow(clockIn, "Berhasil Absen Masuk", true)}
                        disabled={isLoading || sessionCount >= 5}
                        className="w-full h-16 rounded-[1.25rem] bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 text-lg group transition-all"
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : (
                            <div className="flex items-center gap-3">
                                <Zap className="h-6 w-6 text-yellow-400 group-hover:scale-110 transition-transform" />
                                <span>Lanjut Bekerja {sessionCount > 0 ? `(Sesi ${sessionCount + 1})` : ''}</span>
                            </div>
                        )}
                    </Button>
                </div>
            );
        }

        if (today?.checkOut) {
            return (
                <div className="flex flex-col gap-4 w-full">
                    <div className="bg-slate-100/50 rounded-3xl p-6 border border-slate-200 border-dashed text-center">
                        <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Sesi Hari Ini Selesai</p>
                    </div>
                    <Button
                        onClick={() => startAttendanceFlow(clockIn, "Berhasil Absen Masuk", true)}
                        disabled={sessionCount >= 5}
                        className="w-full h-16 rounded-[1.25rem] bg-slate-900 hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 text-lg group transition-all"
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : (
                            <div className="flex items-center gap-3">
                                <Zap className="h-6 w-6 text-yellow-400 group-hover:scale-110 transition-transform" />
                                <span>Lanjut Kerja (Sesi {sessionCount + 1})</span>
                            </div>
                        )}
                    </Button>
                </div>
            );
        }

        if (!hasCheckedIn) {
            return (
                <Button
                    onClick={() => startAttendanceFlow(clockIn, "Berhasil Absen Masuk", true)}
                    disabled={isLoading}
                    className="w-full h-20 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-2xl shadow-emerald-200 text-xl group transition-all"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : (
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Camera className="h-7 w-7" />
                            </div>
                            <span>ABSEN MASUK</span>
                        </div>
                    )}
                </Button>
            );
        }

        if (!isBreak && !hasBreakEnded) {
            return (
                <Button
                    onClick={() => startAttendanceFlow(breakStart, "Selamat Istirahat")}
                    disabled={isLoading}
                    className="w-full h-20 rounded-[1.5rem] bg-amber-500 hover:bg-amber-600 text-white font-black shadow-2xl shadow-amber-200 text-xl group transition-all"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : (
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Coffee className="h-7 w-7" />
                            </div>
                            <span>MULAI ISTIRAHAT</span>
                        </div>
                    )}
                </Button>
            );
        }

        if (isBreak && !hasBreakEnded) {
            return (
                <Button
                    onClick={() => startAttendanceFlow(breakEnd, "Selamat Bekerja Kembali")}
                    disabled={isLoading}
                    className="w-full h-20 rounded-[1.5rem] bg-orange-600 hover:bg-orange-700 text-white font-black shadow-2xl shadow-orange-200 text-xl group transition-all"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : (
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Camera className="h-7 w-7" />
                            </div>
                            <span>SELESAI ISTIRAHAT</span>
                        </div>
                    )}
                </Button>
            );
        }

        if (hasCheckedIn && hasBreakEnded && !hasCheckedOut) {
            return (
                <Button
                    onClick={handleClockOutClick}
                    disabled={isLoading}
                    className="w-full h-20 rounded-[1.5rem] bg-rose-500 hover:bg-rose-600 text-white font-black shadow-2xl shadow-rose-200 text-xl group transition-all"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : (
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <LogOut className="h-7 w-7" />
                            </div>
                            <span>ABSEN PULANG</span>
                        </div>
                    )}
                </Button>
            );
        }
    };

    // Fetch location when camera opens or on mount per user request
    useEffect(() => {
        getCoordinates().catch(console.error);
    }, []);

    useEffect(() => {
        if (isCameraOpen) {
            getCoordinates().catch(console.error);
        }
    }, [isCameraOpen]);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Late Reason Modal */}
            <LateReasonModal
                isOpen={isLateReasonModalOpen}
                onClose={() => setIsLateReasonModalOpen(false)}
                onSubmit={handleLateReasonSubmit}
            />

            {/* Camera Modal */}
            <CameraModal
                open={isCameraOpen}
                onCapture={handlePhotoCaptured}
                onClose={() => setIsCameraOpen(false)}
                locationAddress={locationAddress}
            />

            {/* Shift Modal added back */}
            <ShiftModal
                open={isShiftModalOpen}
                shifts={shiftList || []}
                onSelect={handleShiftSelect}
                onClose={() => setIsShiftModalOpen(false)}
            />

            <CompanyHeader />

            <main className="px-4 -mt-8 max-w-lg mx-auto space-y-6">

                {/* Push Notification Banner */}
                {pushPermission !== 'granted' && pushPermission !== 'unavailable' && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col gap-3 shadow-md z-20 relative"
                    >
                        <div>
                            <h3 className="text-blue-800 font-bold text-sm">Aktifkan Notifikasi Pengumuman</h3>
                            <p className="text-blue-600 text-xs mt-0.5">Agar Anda tidak ketinggalan info penting dari Admin meskipun aplikasi ditutup.</p>
                        </div>
                        <Button
                            onClick={subscribeToPush}
                            disabled={isSubscribing}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 text-sm font-semibold"
                        >
                            {isSubscribing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                            {isSubscribing ? 'Mengaktifkan...' : 'Izinkan Notifikasi'}
                        </Button>
                    </motion.div>
                )}

                {/* User Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[2rem] p-6 shadow-2xl shadow-slate-200/50 border border-slate-100 flex items-center justify-between relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                    <div className="space-y-2 z-10">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Selamat Datang,</p>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">{user?.fullName}</h2>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-lg w-fit border border-slate-100">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{user?.username}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium flex flex-wrap gap-x-3 gap-y-1">
                                <p className="flex items-center gap-1"><span className="w-1 h-1 bg-slate-300 rounded-full"></span> {user?.branch || '-'}</p>
                                <p className="flex items-center gap-1"><span className="w-1 h-1 bg-slate-300 rounded-full"></span> {user?.position || '-'}</p>
                            </div>
                        </div>
                        <div className="pt-1">
                            <span className="text-[10px] font-black bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-100 inline-block uppercase tracking-widest">
                                {(() => {
                                    const baseShift = (todaySessions && todaySessions.length > 0) ? (todaySessions[0] as any).shift : (shiftList?.find(s => s.id === selectedShiftId)?.name);
                                    if (!baseShift) return 'Belum Absen Masuk';
                                    return sessionCount > 1 ? `${baseShift} ( Sesi ${sessionCount} )` : baseShift;
                                })()}
                            </span>
                        </div>
                    </div>
                    <div className="z-10">
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden ring-1 ring-slate-100">
                            {user?.photoUrl ? (
                                <img src={user.photoUrl} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 font-black text-3xl">
                                    {user?.fullName?.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Timer */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center justify-center bg-primary/5 py-4 rounded-3xl"
                >
                    <DigitalClock />

                    <div className="mt-4 flex flex-col items-center">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Status Hari Ini</p>
                        <div className="flex items-center gap-3">
                            <span className={`text-4xl font-black tracking-tighter ${getStatusText() === 'Telat' ? 'text-rose-600' : 'text-slate-900 border-b-4 border-primary/20 pb-1'}`}>
                                {getStatusText().toUpperCase()}
                            </span>
                            {today?.status === 'late' && <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse shadow-lg shadow-rose-200">TELAT</span>}
                            {sessionCount > 0 && <span className="bg-blue-50 text-blue-700 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-blue-100">Sesi {sessionCount}/5</span>}
                        </div>
                        {locationAddress && (
                            <div className="mt-4 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 flex items-center justify-center gap-2 max-w-[280px]">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <p className="text-[11px] text-slate-500 font-bold text-center leading-tight truncate">
                                    {locationAddress}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Work Timer / Break Timer - Show if checked in and not checked out */}
                    {hasCheckedIn && !hasCheckedOut && (
                        <div className="mt-4 flex flex-col items-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                {isBreak ? <Timer className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                                {isBreak ? "Durasi Istirahat" : "Durasi Kerja"}
                            </p>
                            <WorkTimer
                                startTime={new Date(isBreak ? today!.breakStart! : today!.checkIn!)}
                            />
                        </div>
                    )}
                </motion.div>

                {/* Controls */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    <div className="flex flex-col gap-4 w-full">
                        {renderMainButton()}

                        <div className="grid grid-cols-3 gap-3">
                            <Button
                                variant="outline"
                                disabled={!!today?.checkOut || today?.status === 'sick' || today?.status === 'permission' || today?.status === 'off'}
                                onClick={() => {
                                    setPermitType('sick');
                                    setPermitNote("");
                                    setPermitOpen(true);
                                }}
                                className="h-16 flex-col gap-1 rounded-2xl border-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all font-bold group shadow-sm bg-white"
                            >
                                <Stethoscope className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                <span className="text-[11px] uppercase tracking-wider">Sakit</span>
                            </Button>
                            <Button
                                variant="outline"
                                disabled={!!today?.checkOut || today?.status === 'sick' || today?.status === 'permission' || today?.status === 'off'}
                                onClick={() => {
                                    setPermitType('permission');
                                    setPermitNote("");
                                    setPermitOpen(true);
                                }}
                                className="h-16 flex-col gap-1 rounded-2xl border-slate-100 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-100 transition-all font-bold group shadow-sm bg-white"
                            >
                                <FileText className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
                                <span className="text-[11px] uppercase tracking-wider">Izin</span>
                            </Button>
                            <Button
                                variant="outline"
                                disabled={!!today?.checkOut || today?.status === 'sick' || today?.status === 'permission' || today?.status === 'off' || hasCheckedIn}
                                onClick={() => setIsOffDayOpen(true)}
                                className="h-16 flex-col gap-1 rounded-2xl border-slate-100 hover:bg-slate-100 hover:text-slate-800 transition-all font-bold group shadow-sm bg-white"
                            >
                                <Umbrella className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                <span className="text-[11px] uppercase tracking-wider">Libur</span>
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Today Summary */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 space-y-6"
                >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Riwayat Hari Ini</h4>
                        <div className="w-2 h-2 rounded-full bg-primary/20"></div>
                    </div>

                    {/* ⚠️ Warnings */}
                    <div className="space-y-3">
                        {isBreak && !hasBreakEnded && (
                            <div className="flex items-start gap-4 bg-amber-50 rounded-2xl p-4 border border-amber-100 shadow-sm shadow-amber-100/50">
                                <Timer className="text-amber-600 w-5 h-5 shrink-0" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Sedang Istirahat</p>
                                    <p className="text-sm text-slate-700 font-bold leading-relaxed">Jangan lupa tekan <span className="text-amber-700">Selesai Istirahat</span> saat kembali bekerja!</p>
                                </div>
                            </div>
                        )}

                        {hasCheckedIn && hasBreakEnded && !hasCheckedOut && (
                            <div className="flex items-start gap-4 bg-rose-50 rounded-2xl p-4 border border-rose-100 shadow-sm shadow-rose-100/50">
                                <Bell className="text-rose-600 w-5 h-5 shrink-0" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">Peringatan</p>
                                    <p className="text-sm text-slate-700 font-bold leading-relaxed">Tekan <span className="text-rose-700">Absen Pulang</span> sebelum meninggalkan tempat kerja.</p>
                                </div>
                            </div>
                        )}

                        {hasCheckedIn && !isBreak && !hasBreakEnded && !hasCheckedOut && (
                            <div className="flex items-start gap-4 bg-blue-50 rounded-2xl p-4 border border-blue-100 shadow-sm shadow-blue-100/50">
                                <Info className="text-blue-600 w-5 h-5 shrink-0" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Sedang Bekerja</p>
                                    <p className="text-sm text-slate-700 font-bold leading-relaxed">Sesi aktif. Gunakan menu istirahat atau pulang jika diperlukan.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                        <div className="space-y-1">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Masuk</p>
                            <p className="font-black text-slate-800 text-lg font-mono">
                                {today?.checkIn ? format(new Date(today.checkIn), "HH:mm") : "--:--"}
                            </p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Pulang</p>
                            <p className="font-black text-slate-800 text-lg font-mono">
                                {today?.checkOut ? format(new Date(today.checkOut), "HH:mm") : "--:--"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Istirahat</p>
                            <p className="font-black text-slate-800 text-lg font-mono">
                                {today?.breakStart ? format(new Date(today.breakStart), "HH:mm") : "--:--"}
                            </p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Selesai</p>
                            <p className="font-black text-slate-800 text-lg font-mono">
                                {today?.breakEnd ? format(new Date(today.breakEnd), "HH:mm") : "--:--"}
                            </p>
                        </div>
                    </div>

                    {today?.notes && (
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Catatan:</p>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"{today.notes}"</p>
                        </div>
                    )}

                    {(today as any)?.lateReason && (
                        <div className="p-5 bg-rose-50/50 rounded-3xl border border-rose-100 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest">Alasan Terlambat</p>
                            </div>
                            <p className="text-sm text-slate-700 font-bold italic leading-relaxed">"{(today as any).lateReason}"</p>
                            {(today as any).lateReasonPhoto && (
                                <div
                                    className="aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-xl cursor-pointer relative group ring-1 ring-rose-100"
                                    onClick={() => setSelectedPhoto(getPhotoUrl((today as any).lateReasonPhoto))}
                                >
                                    <img
                                        src={getPhotoUrl((today as any).lateReasonPhoto)}
                                        alt="Bukti Telat"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white h-8 w-8 drop-shadow-lg" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                     {/* Completed Sessions Summary */}
                     {completedSessions.length > 0 && (
                        <div className="pt-8 border-t border-slate-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Sesi Selesai</p>
                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase tracking-widest">{completedSessions.length} Berhasil</span>
                            </div>
                            <div className="grid gap-3">
                                {completedSessions.map((s: any, i: number) => (
                                    <div key={s.id} className="flex justify-between items-center bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/30 rounded-3xl px-5 py-4 border border-slate-100 transition-all duration-300 group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500 font-black text-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                {s.sessionNumber}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-[11px] uppercase tracking-wider">Sesi {s.sessionNumber}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Dokumentasi Foto ✓</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono font-black text-slate-900 text-xs">
                                                {s.checkIn ? format(new Date(s.checkIn), "HH:mm") : "--:--"}
                                                <span className="mx-2 text-slate-300">→</span>
                                                {s.checkOut ? format(new Date(s.checkOut), "HH:mm") : "--:--"}
                                            </div>
                                            <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-1">Selesai</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </main>

            {/* Photo Viewer Dialog */}
            <Dialog open={!!selectedPhoto} onOpenChange={(val) => !val && setSelectedPhoto(null)}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none bg-black">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Lihat Foto</DialogTitle>
                        <DialogDescription>Tampilan detail foto bukti.</DialogDescription>
                    </DialogHeader>
                    <div className="relative aspect-[3/4] sm:aspect-square flex items-center justify-center">
                        <img
                            src={selectedPhoto || ""}
                            alt="Bukti"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (selectedPhoto && !selectedPhoto.includes('base64') && selectedPhoto.length > 100) {
                                    target.src = selectedPhoto;
                                }
                            }}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md"
                            onClick={() => setSelectedPhoto(null)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <BottomNav />

            {/* Permission Dialog */}
            <Dialog open={permitOpen} onOpenChange={setPermitOpen}>
                <DialogContent className="rounded-3xl max-w-xs md:max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
                            {permitType === 'sick' ? <Stethoscope className="w-6 h-6 text-blue-600" /> : <FileText className="w-6 h-6 text-purple-600" />}
                            {permitType === 'sick' ? 'Form Sakit' : 'Form Izin'}
                        </DialogTitle>
                        <DialogDescription className="text-center text-sm text-muted-foreground">
                            Silakan isi form di bawah ini untuk mengajukan {permitType === 'sick' ? 'sakit' : 'izin'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <Textarea
                            placeholder={`Alasan ${permitType === 'sick' ? 'sakit' : 'izin'}...`}
                            value={permitNote}
                            onChange={(e) => setPermitNote(e.target.value)}
                            className="resize-none rounded-2xl border-gray-200 focus:border-primary min-h-[100px]"
                        />

                        {/* Contextual state warning */}
                        {isBreak && !hasBreakEnded ? (
                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
                                <p className="text-[10px] font-bold text-orange-700 uppercase mb-2">⚠️ Anda Sedang Istirahat</p>
                                <ul className="text-[11px] text-orange-700 space-y-1">
                                    <li className="flex gap-2"><span>•</span><span>Jam istirahat akan <strong>ditutup otomatis</strong>.</span></li>
                                    <li className="flex gap-2"><span>•</span><span>Jam kerja yang sudah berlangsung <strong>tetap dihitung</strong>.</span></li>
                                    <li className="flex gap-2"><span>•</span><span>Anda dapat <strong>Lanjut Bekerja</strong> kapan saja setelah ini.</span></li>
                                </ul>
                            </div>
                        ) : hasCheckedIn && !hasCheckedOut ? (
                            <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200">
                                <p className="text-[10px] font-bold text-yellow-700 uppercase mb-2">⚠️ Anda Sedang Bekerja</p>
                                <ul className="text-[11px] text-yellow-700 space-y-1">
                                    <li className="flex gap-2"><span>•</span><span>Sesi kerja Anda akan <strong>dihentikan</strong> sekarang.</span></li>
                                    <li className="flex gap-2"><span>•</span><span>Jam kerja yang sudah berlangsung <strong>tetap dihitung</strong>.</span></li>
                                    <li className="flex gap-2"><span>•</span><span>Anda dapat <strong>Lanjut Bekerja</strong> kapan saja setelah ini.</span></li>
                                </ul>
                            </div>
                        ) : (
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                <p className="text-[10px] font-bold text-blue-700 uppercase mb-2">ℹ️ Sebelum Mulai Kerja</p>
                                <ul className="text-[11px] text-blue-600/80 space-y-1">
                                    <li className="flex gap-2"><span>•</span><span>Absensi {permitType === 'sick' ? 'Sakit' : 'Izin'} akan dicatat untuk hari ini.</span></li>
                                    <li className="flex gap-2"><span>•</span><span>Anda tetap dapat <strong>Lanjut Bekerja</strong> kapan saja hari ini.</span></li>
                                    <li className="flex gap-2"><span>•</span><span>Sistem akan mengambil foto dan mencatat lokasi.</span></li>
                                </ul>
                            </div>
                        )}

                        <Button
                            onClick={handlePermitCameraTrigger}
                            className="w-full h-14 rounded-2xl gap-3 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20"
                        >
                            <Camera className="w-5 h-5" />
                            Ambil Foto &amp; Kirim
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={() => setPermitOpen(false)}
                            className="w-full text-gray-400 text-sm"
                        >
                            Batalkan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Off Day Confirmation Modal */}
            <Dialog open={isOffDayOpen} onOpenChange={setIsOffDayOpen}>
                <DialogContent className="rounded-3xl max-w-xs md:max-w-md p-6">
                    <DialogHeader>
                        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                            <Umbrella className="w-8 h-8 text-orange-600" />
                        </div>
                        <DialogTitle className="text-center text-xl font-bold">Libur Bekerja</DialogTitle>
                        <DialogDescription className="text-center text-sm pt-2">
                            Apakah Anda yakin ingin menyatakan <strong>Off Day / Libur</strong> hari ini?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mt-4">
                        <ul className="text-[11px] text-orange-700 space-y-2">
                            <li className="flex gap-2"><span>•</span><span>Anda tidak perlu melakukan absen kamera.</span></li>
                            <li className="flex gap-2"><span>•</span><span>Status absen hari ini akan dicatat sebagai <strong>Libur</strong>.</span></li>
                            <li className="flex gap-2"><span>•</span><span>Tindakan ini tidak dapat dibatalkan untuk hari ini.</span></li>
                        </ul>
                    </div>
                    <div className="grid grid-cols-1 gap-3 mt-6">
                        <Button
                            onClick={async () => {
                                setIsOffDayOpen(false);
                                toast({ title: "Memproses...", description: "Mencatat absensi libur anda." });
                                try {
                                    const { address } = await getCoordinates(false);
                                    await permit({
                                        type: 'off',
                                        notes: "Libur Bekerja / Off Day",
                                        checkInPhoto: null,
                                        location: address
                                    });
                                    toast({ title: "Off Day Tercatat", description: "Selamat beristirahat!", className: "bg-green-500 text-white" });
                                } catch (err) {
                                    handleError(err);
                                }
                            }}
                            className="w-full h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
                        >
                            Ya, Saya Libur
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsOffDayOpen(false)}
                            className="w-full h-12 text-gray-400"
                        >
                            Batalkan
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
