import { useState, useEffect } from "react";
import { Download, Smartphone, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function InstallAppBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>((window as any).deferredPrompt);
    const [isIOS, setIsIOS] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showFab, setShowFab] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const ua = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(ua);
        const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua);
        
        setIsIOS(ios);
        setIsMobile(mobile);

        // Already installed as PWA — hide everything
        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true;
        
        if (standalone) {
            setIsInstalled(true);
            return;
        }

        // Persistent visibility: Always show FAB if not installed
        // We only hide the MODAL if dismissed, but the FAB stays
        const dismissed = localStorage.getItem("installModalDismissed");
        if (!dismissed) {
            setShowModal(true);
        }
        setShowFab(true); // Always show FAB if not standalone and not installed


        // Check if pre-captured
        if ((window as any).deferredPrompt) {
            setDeferredPrompt((window as any).deferredPrompt);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            console.log("✅ PWA: beforeinstallprompt event caught!");
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);
            (window as any).deferredPrompt = promptEvent;
        };

        const handleAppInstalled = () => {
            console.log("✅ PWA: App installed!");
            setIsInstalled(true);
            setShowModal(false);
            setShowFab(false);
            setDeferredPrompt(null);
            (window as any).deferredPrompt = null;
        };

        // Check HTTPS
        if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
            console.warn("⚠️ PWA: Install prompt will NOT fire because connection is not secure (HTTPS).");
        }

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const triggerInstall = async () => {
        const promptToUse = deferredPrompt || (window as any).deferredPrompt;

        if (promptToUse) {
            try {
                promptToUse.prompt();
                const { outcome } = await promptToUse.userChoice;
                console.log(`PWA: User choice outcome: ${outcome}`);
                if (outcome === "accepted") {
                    setIsInstalled(true);
                    setShowModal(false);
                    setShowFab(false);
                    setDeferredPrompt(null);
                    (window as any).deferredPrompt = null;
                }
            } catch (err) {
                console.error("PWA: Install error:", err);
            }
        } else {
            toast({
                title: "Gunakan Menu Browser",
                description: "Browser belum mengaktifkan fitur instal otomatis (Status: Menunggu). Silakan klik titik tiga di pojok kanan atas Chrome, lalu pilih 'Instal aplikasi'.",
            });
        }
    };

    const handleLater = () => {
        localStorage.setItem("installModalDismissed", "1");
        setShowModal(false);
        setShowFab(true);
    };

    if (isInstalled) return null;

    return (
        <>
            {/* ── Modal Popup ── */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
                    style={{
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(4px)",
                    }}
                >
                    <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        {/* Body */}
                        <div className="px-6 py-8 text-center">
                            <div className="mx-auto w-16 h-16 mb-4 rounded-2xl bg-green-100 flex items-center justify-center">
                                <Smartphone className="w-8 h-8 text-green-700" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">
                                Install Aplikasi Absensi
                            </h2>
                            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                                Tambahkan ke layar utama untuk akses cepat dan pengalaman absen yang lancar.
                            </p>

                            <Button
                                onClick={triggerInstall}
                                className="w-full h-11 font-bold rounded-xl mb-4 text-white border-none shadow-md active:scale-95 transition-all hover:brightness-110"
                                style={{
                                    background: "linear-gradient(to right, #166534, #15803d)",
                                }}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                {deferredPrompt ? "INSTAL SEKARANG" : "PASANG APLIKASI"}
                            </Button>

                            {/* Automated Prompt NOT ready - Show Instructions */}
                            {!deferredPrompt && (
                                <div className="mb-4 p-4 bg-green-50 rounded-2xl border border-green-100 text-left">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-3 text-center">
                                        CARA PASANG MANUAL
                                    </p>
                                    
                                    {isIOS ? (
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3 text-xs text-green-900">
                                                <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">1</div>
                                                <p>Klik tombol <b>Share</b> <Share className="inline w-3 h-3 mb-1 ml-0.5" /> (kotak dengan panah atas).</p>
                                            </div>
                                            <div className="flex items-start gap-3 text-xs text-green-900">
                                                <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">2</div>
                                                <p>Gulir ke bawah dan pilih <b>"Add to Home Screen"</b>.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3 text-xs text-green-900">
                                                <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">1</div>
                                                <p>Klik menu titik tiga <b>(⋮)</b> di pojok kanan atas browser.</p>
                                            </div>
                                            <div className="flex items-start gap-3 text-xs text-green-900">
                                                <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">2</div>
                                                <p>Cari & Pilih <b>"Instal Aplikasi"</b> atau <b>"Tambahkan ke Layar Utama"</b>.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleLater}
                                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium border-t border-gray-100"
                            >
                                Nanti saja
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Floating Install Button ── */}
            {showFab && !showModal && (
                <button
                    onClick={() => setShowModal(true)}
                    className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-white text-sm font-semibold transition-all active:scale-95 hover:shadow-xl animate-in slide-in-from-right duration-500"
                    style={{ background: "linear-gradient(to right, #166534, #15803d)" }}
                >
                    <Download className="w-4 h-4" />
                    <span>Pasang App</span>
                </button>
            )}
        </>
    );
}
