import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function WorkTimer({ startTime }: { startTime: Date }) {
    const [elapsed, setElapsed] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const diff = now.getTime() - new Date(startTime).getTime();
            
            if (diff < 0) {
                setElapsed("00:00:00");
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setElapsed(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-orange-200/50 shadow-xl shadow-orange-500/10 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 border-b-4 border-b-orange-400">
                <div className="bg-orange-100 p-2 rounded-xl">
                    <Clock className="w-5 h-5 text-orange-600 animate-pulse" />
                </div>
                <span className="font-mono text-4xl font-black text-slate-800 tracking-tighter tabular-nums drop-shadow-sm">
                    {elapsed || "00:00:00"}
                </span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 animate-pulse">Running live</p>
        </div>
    );
}
