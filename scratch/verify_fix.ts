
import { calculateDailyTotal } from "../client/src/lib/attendance";

const mockAttendance = [
    {
        id: 1,
        userId: 1,
        date: new Date("2026-04-09"),
        checkIn: new Date("2026-04-09T07:04:00"),
        checkOut: new Date("2026-04-09T22:59:00"),
        status: "late",
        sessionNumber: 1
    },
    {
        id: 2,
        userId: 1,
        date: new Date("2026-04-09"),
        checkIn: new Date("2026-04-09T07:04:00"),
        checkOut: new Date("2026-04-10T00:05:00"), // Next day
        permitExitAt: new Date("2026-04-09T13:17:00"),
        permitResumeAt: new Date("2026-04-09T14:51:00"),
        status: "permission",
        sessionNumber: 2
    }
];

// @ts-ignore
const result = calculateDailyTotal(mockAttendance);

console.log("--- RESULTS ---");
console.log(`Total Work Mins: ${result.totalWorkMins} (${Math.floor(result.totalWorkMins/60)}j ${result.totalWorkMins%60}m)`);
console.log(`Net Work Mins: ${result.netWorkMins} (${Math.floor(result.netWorkMins/60)}j ${result.netWorkMins%60}m)`);

if (result.netWorkMins < 1000) {
    console.log("✅ SUCCESS: Duration is correctly merged (~15-17 hours)");
} else {
    console.log("❌ FAILED: Duration is still summed (>30 hours)");
}
