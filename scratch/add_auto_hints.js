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

// Replace branch FormControl with our datalist
const branchSearch = `                                                 name="branch"
                                                 render={({ field }) => (
                                                     <FormItem>
                                                         <FormLabel>Cabang</FormLabel>
                                                         <FormControl><Input {...field} value={field.value || ''} /></FormControl>`;

const branchReplace = `                                                 name="branch"
                                                 render={({ field }) => (
                                                     <FormItem>
                                                         <FormLabel>Cabang</FormLabel>
                                                         <FormControl>
                                                             <>
                                                                 <Input {...field} list="branches-datalist" value={field.value || ''} />
                                                                 <datalist id="branches-datalist">
                                                                     {existingBranches.map(b => (
                                                                         <option key={b} value={b} />
                                                                     ))}
                                                                 </datalist>
                                                             </>
                                                         </FormControl>`;

// Replace position FormControl with our datalist
const positionSearch = `                                                 name="position"
                                                 render={({ field }) => (
                                                     <FormItem>
                                                         <FormLabel>Jabatan</FormLabel>
                                                         <FormControl><Input {...field} value={field.value || ''} /></FormControl>`;

const positionReplace = `                                                 name="position"
                                                 render={({ field }) => (
                                                     <FormItem>
                                                         <FormLabel>Jabatan</FormLabel>
                                                         <FormControl>
                                                             <>
                                                                 <Input {...field} list="positions-datalist" value={field.value || ''} />
                                                                 <datalist id="positions-datalist">
                                                                     {existingPositions.map(p => (
                                                                         <option key={p} value={p} />
                                                                     ))}
                                                                 </datalist>
                                                             </>
                                                         </FormControl>`;

// Helper to replace matching indentation cleanly regardless of CRLF
const normalize = s => s.replace(/\r\n/g, '\n').trim();

// Try robust substring replacements by matching the content
content = content.replace(/\r\n/g, '\n');

if (content.includes(normalize(branchSearch).split('\n')[0])) {
    // Perform exact replacement using dynamic replacement logic
    const lines = content.split('\n');
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
        }
    }
    content = lines.join('\n');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("SUCCESSFULLY UPDATED AUTO-HINTS!");
