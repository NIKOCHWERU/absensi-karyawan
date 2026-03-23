import { useState, useEffect } from "react";
import { Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function InstallAppBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isChrome, setIsChrome] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showFab, setShowFab] = useState(false);

    useEffect(() => {
        const ua = window.navigator.userAgent.toLowerCase();
        const chromeBased =
            /chrome/.test(ua) && !/edg/.test(ua) && !/opr/.test(ua);
        setIsChrome(chromeBased);

        // Already installed as PWA — hide everything
        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true;
        if (standalone) {
            setIsInstalled(true);
            return;
        }

        if (chromeBased) {
            const dismissed = localStorage.getItem("installModalDismissed");
            if (!dismissed) {
                // First visit — show modal after 1s delay
                setTimeout(() => setShowModal(true), 1000);
            } else {
                // Previously dismissed — show FAB only
                setShowFab(true);
            }
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowModal(false);
            setShowFab(false);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const triggerInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setIsInstalled(true);
            setShowModal(false);
            setShowFab(false);
        }
    };

    const handleLater = () => {
        localStorage.setItem("installModalDismissed", "1");
        setShowModal(false);
        setShowFab(true);
    };

    if (!isChrome || isInstalled) return null;

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
                    <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div
                            className="h-36 flex flex-col items-center justify-center"
                            style={{
                                background: "linear-gradient(135deg, #166534 0%, #15803d 100%)",
                            }}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Smartphone className="w-9 h-9 text-white" />
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 text-center">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">
                                Install Aplikasi Absensi
                            </h2>
                            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                                Tambahkan ke layar utama untuk akses lebih cepat dan
                                pengalaman yang lebih baik.
                            </p>

                            <Button
                                onClick={triggerInstall}
                                disabled={!deferredPrompt}
                                className="w-full h-11 font-bold rounded-xl mb-3 text-white border-none"
                                style={{
                                    background: deferredPrompt 
                                        ? "linear-gradient(to right, #166534, #15803d)" 
                                        : "#9ca3af",
                                }}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                {deferredPrompt ? "Install Sekarang" : "Menyiapkan tombol..."}
                            </Button>

                            {!deferredPrompt && (
                                <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-100 text-left">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 mb-2">
                                        Cara Manual (Jika tombol belum muncul):
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2 text-[11px] text-green-800 leading-tight">
                                            <span className="font-bold">1.</span>
                                            <span>Klik menu titik tiga <b>(⋮)</b> di pojok kanan atas Chrome.</span>
                                        </div>
                                        <div className="flex items-start gap-2 text-[11px] text-green-800 leading-tight">
                                            <span className="font-bold">2.</span>
                                            <span>Pilih <b>"Instal Aplikasi"</b> atau <b>"Tambahkan ke Layar Utama"</b>.</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleLater}
                                className="w-full h-10 text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium"
                            >
                                Nanti saja
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Floating Install Button (after dismiss) ── */}
            {showFab && !showModal && (
                <button
                    onClick={deferredPrompt ? triggerInstall : () => setShowModal(true)}
                    className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-white text-sm font-semibold transition-all active:scale-95 hover:shadow-xl"
                    style={{ background: "linear-gradient(to right, #166534, #15803d)" }}
                    title="Install Aplikasi"
                >
                    <Download className="w-4 h-4" />
                    <span>Install App</span>
                </button>
            )}
        </>
    );
}
