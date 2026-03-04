import fs from 'fs';
import path from 'path';

const files = [
    'client/src/pages/admin/EmployeeListPage.tsx',
    'client/src/pages/admin/RecapPage.tsx',
    'client/src/pages/admin/AttendanceSummaryPage.tsx',
    'client/src/pages/admin/InfoBoardPage.tsx',
    'client/src/pages/admin/ComplaintsPage.tsx',
    'client/src/pages/admin/AdminLeavePage.tsx',
    'client/src/pages/admin/AdminLeaveHistoryPage.tsx'
];

for (const f of files) {
    const file = path.resolve(f);
    let txt = fs.readFileSync(file, 'utf8');

    txt = txt.replace(/<div className="min-h-screen bg-gray-50 flex">/, '<div className="w-full flex">');
    txt = txt.replace(/<aside[\s\S]*?<\/aside>/, '{/* Sidebar replaced */}');
    txt = txt.replace(/<main className="flex-1 p-8 overflow-auto">/, '<main className="flex-1 md:p-8 p-4 overflow-auto">');
    // For smaller paddings used in some files:
    txt = txt.replace(/<main className="flex-1 p-4 md:p-8 overflow-auto">/, '<main className="flex-1 md:p-8 p-4 overflow-auto">');

    fs.writeFileSync(file, txt);
    console.log('Sidebar removed successfully for ' + f);
}
