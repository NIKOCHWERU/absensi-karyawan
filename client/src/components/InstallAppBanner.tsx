import { useState, useEffect, useRef } from "react";
import { Download, Smartphone, MoreVertical, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed',
        platform: string
    }>;
    prompt(): Promise<void>;
}

export default function InstallAppBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isChrome, setIsChrome] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [promptDismissed, setPromptDismissed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const autoTriggered = useRef(false);

    useEffect(() => {
        const ua = window.navigator.userAgent.toLowerCase();
        const chromeBased = /chrome/.test(ua) && !/edg/.test(ua) && !/opr/.test(ua);
        setIsChrome(chromeBased);

        // Already installed as PWA
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
        if (standalone) {
            setIsInstalled(true);
            return;
        }

        // Show blocking overlay for Chrome users after brief delay
        if (chromeBased) {
            setTimeout(() => setIsVisible(true), 800);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);

            // Auto-trigger native install dialog immediately
            if (!autoTriggered.current) {
                autoTriggered.current = true;
                promptEvent.prompt().catch(() => { });
            }
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            setIsVisible(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstalled(true);
                setIsVisible(false);
            }
        }
    };

    // Don't show if: not Chrome, already installed, or overlay not triggered
    if (!isChrome || isInstalled || !isVisible) return null;

    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 100%)' }}>

            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

            <div className="relative flex flex-col items-center px-8 text-center max-w-sm w-full mx-auto">
                {/* App icon */}
                <div className="w-24 h-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center mb-6"
                    style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                    <Smartphone className="w-12 h-12 text-green-600" />
                </div>

                <h1 className="text-white text-2xl font-bold mb-2 tracking-tight">
                    Install Aplikasi Absensi
                </h1>
                <p className="text-green-100 text-sm mb-1 font-medium">PT EJA</p>
                <p className="text-green-200 text-sm mb-8 leading-relaxed">
                    Untuk menggunakan aplikasi absensi, silakan install terlebih dahulu di perangkat Anda.
                </p>

                {/* Install button */}
                <Button
                    onClick={handleInstallClick}
                    disabled={!deferredPrompt}
                    className="w-full h-14 text-base font-bold rounded-2xl shadow-lg mb-6 transition-all active:scale-95"
                    style={{
                        background: deferredPrompt ? 'linear-gradient(to right, #ffffff, #f0fdf4)' : 'rgba(255,255,255,0.3)',
                        color: deferredPrompt ? '#15803d' : 'rgba(255,255,255,0.7)',
                        border: 'none',
                    }}
                >
                    <Download className="w-5 h-5 mr-2" />
                    {deferredPrompt ? 'Install Sekarang' : 'Menunggu browser...'}
                </Button>

                {/* Manual install instructions */}
                <div className="w-full bg-white/10 backdrop-blur rounded-2xl p-4 text-left">
                    <p className="text-green-100 text-xs font-semibold mb-3 uppercase tracking-wider">
                        Cara Install Manual:
                    </p>
                    {isAndroid ? (
                        <ol className="space-y-2">
                            <li className="flex items-start gap-2 text-green-100 text-sm">
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                                <span>Ketuk ikon <MoreVertical className="inline w-3 h-3" /> (tiga titik) di pojok kanan atas Chrome</span>
                            </li>
                            <li className="flex items-start gap-2 text-green-100 text-sm">
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                                <span>Pilih <strong className="text-white">"Tambahkan ke Layar Utama"</strong></span>
                            </li>
                            <li className="flex items-start gap-2 text-green-100 text-sm">
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                                <span>Ketuk <strong className="text-white">"Tambahkan"</strong> untuk konfirmasi</span>
                            </li>
                        </ol>
                    ) : isIOS ? (
                        <ol className="space-y-2">
                            <li className="flex items-start gap-2 text-green-100 text-sm">
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                                <span>Ketuk ikon <Share className="inline w-3 h-3" /> (Share) di bawah Safari</span>
                            </li>
                            <li className="flex items-start gap-2 text-green-100 text-sm">
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                                <span>Pilih <strong className="text-white">"Add to Home Screen"</strong></span>
                            </li>
                            <li className="flex items-start gap-2 text-green-100 text-sm">
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                                <span>Ketuk <strong className="text-white">"Add"</strong> untuk konfirmasi</span>
                            </li>
                        </ol>
                    ) : (
                        <ol className="space-y-2">
                            <li className="flex items-start gap-2 text-green-100 text-sm">
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                                <span>Klik ikon <strong className="text-white">⊕</strong> atau ikon install di address bar Chrome</span>
                            </li>
                            <li className="flex items-start gap-2 text-green-100 text-sm">
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                                <span>Klik <strong className="text-white">"Install"</strong> untuk konfirmasi</span>
                            </li>
                        </ol>
                    )}
                </div>
            </div>
        </div>
    );
}
