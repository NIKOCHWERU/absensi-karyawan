const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'client', 'src', 'pages', 'admin', 'EmployeeListPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Define existingBranches and existingPositions variables right after users query mapping
const targetQuery = `    const { data: users = [], isLoading } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
        refetchInterval: 5000,
    });`;

const replacementQuery = `${targetQuery}

    // Unique branches and positions for auto-hint suggestion
    const existingBranches = Array.from(new Set(users.map(u => u.branch).filter(Boolean))) as string[];
    const existingPositions = Array.from(new Set(users.map(u => u.position).filter(Boolean))) as string[];`;

if (content.includes(targetQuery) && !content.includes('existingBranches')) {
    content = content.replace(targetQuery, replacementQuery);
}

// Helper to replace matching indentation cleanly regardless of CRLF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');
let updated = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('name="branch"') && lines[i+4] && lines[i+4].includes('<FormControl><Input')) {
        lines[i+4] = `                                                         <FormControl>
                                                             <>
                                                                 <Input {...field} list="branches-datalist" value={field.value || ''} />
                                                                 <datalist id="branches-datalist">
                                                                     {existingBranches.map(b => (
                                                                         <option key={b} value={b} />
                                                                     ))}
                                                                 </datalist>
                                                             </>
                                                         </FormControl>`;
        updated = true;
    }
    if (lines[i].includes('name="position"') && lines[i+4] && lines[i+4].includes('<FormControl><Input')) {
        lines[i+4] = `                                                         <FormControl>
                                                             <>
                                                                 <Input {...field} list="positions-datalist" value={field.value || ''} />
                                                                 <datalist id="positions-datalist">
                                                                     {existingPositions.map(p => (
                                                                         <option key={p} value={p} />
                                                                     ))}
                                                                 </datalist>
                                                             </>
                                                         </FormControl>`;
        updated = true;
    }
}

if (updated) {
    fs.writeFileSync(filePath, lines.join('\r\n'), 'utf8');
    console.log("SUCCESSFULLY UPDATED AUTO-HINTS IN EMPLOYEE LIST!");
} else {
    console.log("NO CHANGES NEEDED OR TARGET NOT FOUND.");
}
