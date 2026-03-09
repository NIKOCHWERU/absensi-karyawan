import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
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
    const [isDismissed, setIsDismissed] = useState(false);
    const [isChrome, setIsChrome] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if it's Chrome and not Edge or other Chromium-based that might identify as Chrome
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isChromeBrowser = /chrome/.test(userAgent) && !/edg/.test(userAgent) && !/opr/.test(userAgent);
        setIsChrome(isChromeBrowser);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
            setIsInstalled(true);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (!isChrome || isInstalled || isDismissed || !deferredPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden animate-in slide-in-from-bottom-5">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 flex items-center justify-between">
                <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                    <Download className="w-4 h-4" /> Install Aplikasi
                </h3>
                <button
                    onClick={() => setIsDismissed(true)}
                    className="text-white/80 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="p-4">
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Install aplikasi Absensi PT EJA di perangkat Anda agar absen lebih cepat dan mudah.
                </p>
                <Button
                    onClick={handleInstallClick}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold shadow-md"
                >
                    Install Sekarang
                </Button>
            </div>
        </div>
    );
}
