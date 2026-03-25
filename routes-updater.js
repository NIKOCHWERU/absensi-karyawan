const fs = require('fs');
let code = fs.readFileSync('server/routes.ts', 'utf8');

// Allow both admin and superadmin initially
code = code.replace(/req\.user!\.role !== 'admin'/g, "!['admin', 'superadmin'].includes(req.user!.role)");
code = code.replace(/\(req\.user as DbUser\)\.role !== 'admin'/g, "!['admin', 'superadmin'].includes((req.user as DbUser).role)");
code = code.replace(/req\.user\.role !== 'admin'/g, "!['admin', 'superadmin'].includes(req.user.role)");

// Now restrict specific routes to superadmin only
const replaceRoutePermission = (routeMarker, newPermission) => {
    const idx = code.indexOf(routeMarker);
    if (idx !== -1) {
        // Find the next permission check
        const checkIdx = code.indexOf("!['admin', 'superadmin'].includes", idx);
        if (checkIdx !== -1 && checkIdx - idx < 500) { // within reasonable distance
            const endIdx = code.indexOf(")", checkIdx + "!['admin', 'superadmin'].includes".length);
            const toReplace = code.substring(checkIdx, endIdx + 1);
            code = code.replace(toReplace, newPermission);
        }
    }
};

const restrictSuperadminOnly = (routeMarker, userAccessor) => {
    replaceRoutePermission(routeMarker, `${userAccessor}.role !== 'superadmin'`);
};

// POST /api/admin/users
restrictSuperadminOnly('app.post(api.admin.users.create.path', '(req.user as DbUser)');

// POST /api/admin/users/upload
restrictSuperadminOnly('app.post("/api/admin/users/upload"', '(req.user as DbUser)');

// POST /api/admin/users/:id
restrictSuperadminOnly('app.post("/api/admin/users/:id"', 'req.user');

// DELETE /api/admin/users/:id
restrictSuperadminOnly('app.delete("/api/admin/users/:id"', 'req.user!');

// POST /api/admin/attendance/manual
restrictSuperadminOnly('app.post(api.admin.attendance.manual.path', 'req.user!');

// PATCH /api/admin/users/:id
restrictSuperadminOnly('app.patch("/api/admin/users/:id"', 'req.user!');

// GET /api/admin/complaints/stats
restrictSuperadminOnly('app.get("/api/admin/complaints/stats"', 'req.user!');

// GET /api/admin/complaints
restrictSuperadminOnly('app.get("/api/admin/complaints"', 'req.user!');

// PATCH /api/admin/complaints/:id/status
restrictSuperadminOnly('app.patch("/api/admin/complaints/:id/status"', 'req.user!');

// Add bulk delete route
const bulkDeleteRoute = `

  app.post("/api/admin/users/bulk-delete", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'superadmin') return res.sendStatus(401);

    try {
      const { userIds } = req.body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "Daftar ID karyawan tidak valid" });
      }

      // Prevent superadmin from deleting themselves in a bulk delete
      const safeIds = userIds.filter(id => id !== req.user!.id);
      
      for (const id of safeIds) {
        await storage.deleteUser(id);
      }
      
      res.status(200).json({ message: \`Berhasil menghapus \${safeIds.length} karyawan\` });
    } catch (err) {
      console.error("Bulk Delete Users Error:", err);
      res.status(500).json({ message: "Gagal menghapus beberapa karyawan" });
    }
  });
`;

if (!code.includes("/api/admin/users/bulk-delete")) {
    const listRouteMarker = 'app.get(api.admin.users.list.path';
    code = code.replace(listRouteMarker, bulkDeleteRoute + "\\n" + listRouteMarker);
}

fs.writeFileSync('server/routes.ts', code);
console.log("Modifications complete");
