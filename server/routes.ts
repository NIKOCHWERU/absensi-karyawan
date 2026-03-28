import express, { type Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import multer from "multer";
import { uploadFile } from "./services/googleDrive";
import { User as DbUser } from "@shared/schema";
import fs from "fs";
import path from "path";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import https from "https";
import http from "http";
import webpush from "web-push";
import { createBackup, importBackup } from "./backup";

// Configure web-push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@absensikaryawanpteja.com',
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  console.warn("VAPID keys are missing. Web Push will not work.");
}

declare global {
  namespace Express {
    interface User extends DbUser { }
  }
}

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register Object Storage routes
  registerObjectStorageRoutes(app);

  // Setup Auth
  setupAuth(app);

  // Setup uploads directory BEFORE routes that use it
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  app.use('/uploads', express.static(uploadsDir));


  // Middleware untuk mengecek apakah user sudah login atau belum
  const isAuthenticated = (req: Request, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Helper: check if user is admin or superadmin
  const isAdminRole = (req: Request) =>
    req.isAuthenticated() && (req.user!.role === 'admin' || req.user!.role === 'superadmin');

  // Helper: Normalize user data for create/update
  const normalizeUserData = (data: any) => {
    const updates = { ...data };

    // Clean up empty strings to null for unique/optional fields
    const nullableFields = [
      'email', 'nik', 'username', 'phoneNumber', 'birthDate',
      'birthPlace', 'gender', 'address', 'npwp', 'bpjs', 'bankAccount',
      'joinDate', 'employmentStatus', 'religion', 'shift', 'branch', 'position'
    ];
    nullableFields.forEach(field => {
      if (updates[field] === '' || updates[field] === 'undefined' || updates[field] === 'null') {
        updates[field] = null;
      }
    });

    // Normalize isAdmin and is_admin to boolean (handle FormData strings)
    if (updates.isAdmin === 'true' || updates.is_admin === 'true' || updates.isAdmin === true || updates.is_admin === true) {
      updates.isAdmin = true;
    } else if (updates.isAdmin === 'false' || updates.is_admin === 'false' || updates.isAdmin === false || updates.is_admin === false) {
      updates.isAdmin = false;
    }

    // Always delete snake_case version to avoid Drizzle conflicts
    if (updates.is_admin !== undefined) delete updates.is_admin;

    // Auto-set isAdmin based on role
    if (updates.role === 'admin' || updates.role === 'superadmin') {
      updates.isAdmin = true;
    }

    return updates;
  };

  // --- Employee: Edit own profile ---
  app.patch("/api/profile", upload.fields([{ name: 'profilePhoto', maxCount: 1 }, { name: 'bpjsPhoto', maxCount: 1 }, { name: 'npwpPhoto', maxCount: 1 }]), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user!.id;
      const allowed = ['phoneNumber', 'email', 'branch', 'npwp', 'bpjs', 'religion'];
      const updates: any = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files?.profilePhoto?.[0]) {
        const profFilename = `prof-${userId}-${Date.now()}-${files.profilePhoto[0].originalname}`;
        const profDir = path.join(uploadsDir, 'profile');
        if (!fs.existsSync(profDir)) fs.mkdirSync(profDir, { recursive: true });
        const profPath = path.join(profDir, profFilename);
        fs.writeFileSync(profPath, files.profilePhoto[0].buffer);
        updates.photoUrl = `/uploads/profile/${profFilename}`;
      }

      const empUploadsDir = path.join(uploadsDir, 'employees');
      if (!fs.existsSync(empUploadsDir)) fs.mkdirSync(empUploadsDir, { recursive: true });

      if (files?.bpjsPhoto?.[0]) {
        const filename = `emp-${userId}-bpjs-${Date.now()}-${files.bpjsPhoto[0].originalname}`;
        const filepath = path.join(empUploadsDir, filename);
        fs.writeFileSync(filepath, files.bpjsPhoto[0].buffer);
        updates.bpjsPhotoUrl = `/uploads/employees/${filename}`;
      }

      if (files?.npwpPhoto?.[0]) {
        const filename = `emp-${userId}-npwp-${Date.now()}-${files.npwpPhoto[0].originalname}`;
        const filepath = path.join(empUploadsDir, filename);
        fs.writeFileSync(filepath, files.npwpPhoto[0].buffer);
        updates.npwpPhotoUrl = `/uploads/employees/${filename}`;
      }

      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (err: any) {
      console.error("Profile Update Error:", err);
      res.status(500).json({ message: "Gagal memperbarui profil" });
    }
  });



  // Helper to handle photo upload
  async function handlePhotoUpload(
    req: Request,
    actionType: 'clockIn' | 'breakStart' | 'breakEnd' | 'clockOut' | 'lateReason'
  ): Promise<string | undefined> {
    console.log(`[handlePhotoUpload] Action: ${actionType}, Method: ${req.file ? 'Multipart' : 'Base64'}`);

    const fileName = `attendance-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const localFilePath = path.join(uploadsDir, fileName);

    let buffer: Buffer;
    let mimeType: string;

    if (req.file) {
      buffer = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (req.body.checkInPhoto && req.body.checkInPhoto.startsWith('data:image')) {
      const matches = req.body.checkInPhoto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        console.warn(`[handlePhotoUpload] Invalid base64 photo data for ${actionType}`);
        return undefined;
      }
    } else {
      console.warn(`[handlePhotoUpload] No photo data found in request payload for ${actionType}`);
      return undefined;
    }

    // 1. Save locally IMMEDIATELY (Fast)
    try {
      fs.writeFileSync(localFilePath, buffer);
      console.log(`[handlePhotoUpload] Saved locally: ${fileName}`);

      // 2. Await GDrive upload to get the actual File ID
      // This ensures we store the correct reference for the frontend
      const gDriveFile = await uploadFile(
        buffer,
        fileName,
        mimeType,
        {
          employeeName: (req.user as DbUser).fullName,
          actionType: actionType as any,
          timestamp: new Date()
        }
      );

      console.log(`[handlePhotoUpload] GDrive upload success: ${gDriveFile.fileId}`);

      // 3. Return the Google Drive File ID
      return gDriveFile.fileId;
    } catch (err: any) {
      console.error(`[handlePhotoUpload] Upload failed for ${fileName}:`, err.message);
      // Fallback to local filename if GDrive fails, though it might break links if frontend expects ID
      return fileName;
    }
  }

  // --- Attendance Routes ---

  // Helper date function for Jakarta Timezone
  // Day boundary is 04:00 AM Jakarta â€” before 04:00 counts as previous day
  function getJakartaDate(): string {
    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    if (jakartaTime.getHours() < 4) {
      jakartaTime.setDate(jakartaTime.getDate() - 1);
    }
    const y = jakartaTime.getFullYear();
    const m = String(jakartaTime.getMonth() + 1).padStart(2, '0');
    const d = String(jakartaTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // --- Attendance Routes ---

  app.post(api.attendance.clockIn.path, upload.single('photo'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const today = getJakartaDate();
      const userId = req.user!.id;
      console.log(`[ClockIn] User ${userId} attempting clock-in for date ${today}`);

      // Check existing sessions for today
      const existingSessions = await storage.getAttendanceSessionsByUserAndDate(userId, today);
      console.log(`[ClockIn] Found ${existingSessions.length} existing sessions for user ${userId}`);

      const activeSession = existingSessions.find(s => !s.checkOut);

      if (activeSession) {
        console.log(`[ClockIn] Blocked: Active session ${activeSession.id} exists`);
        return res.status(400).json({ message: `Anda masih status MASUK (Sesi ${activeSession.sessionNumber}). Harap absen PULANG terlebih dahulu.` });
      }

      const nextSessionNumber = existingSessions.length + 1;

      if (nextSessionNumber > 5) {
        console.log(`[ClockIn] Blocked: Session limit reached (${nextSessionNumber})`);
        return res.status(400).json({ message: "Batas harian 5 sesi tercapai." });
      }

      const photoFileId = await handlePhotoUpload(req, 'clockIn');
      const location = req.body.location;
      const isFakeGps = req.body.isFakeGps === true || req.body.isFakeGps === "true";
      const shiftId = req.body.shiftId ? parseInt(req.body.shiftId) : undefined;
      let shiftName = req.body.shift || 'Karyawan';
      const lateReason = req.body.lateReason;

      let lateReasonPhotoId = undefined;
      if (req.body.lateReasonPhoto) {
        lateReasonPhotoId = await handlePhotoUpload({
          ...req,
          body: { ...req.body, checkInPhoto: req.body.lateReasonPhoto }
        } as any, 'lateReason');
      }

      // Determine status based on Shift Rules
      const now = new Date();
      const jakartaFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });
      const timeParts = jakartaFormatter.formatToParts(now);
      const hour = parseInt(timeParts.find(p => p.type === 'hour')?.value || '0');
      const minute = parseInt(timeParts.find(p => p.type === 'minute')?.value || '0');
      const timeInMinutes = hour * 60 + minute;

      let status = "present";
      let thresholdMinutes = 420; // Default 07:00 (Shift 1)

      // Only evaluate status (present/late) for the FIRST SESSION of the day
      if (nextSessionNumber === 1) {
        if (shiftId) {
          const shiftData = await storage.getShift(shiftId);
          if (shiftData) {
            shiftName = shiftData.name;
            const [sHour, sMinute] = shiftData.checkInTime.split(':').map(Number);
            thresholdMinutes = sHour * 60 + sMinute;
          }
        } else {
          // Legacy/Hardcoded rules for backward compatibility
          if (shiftName === 'Shift 2') thresholdMinutes = 720;
          else if (shiftName === 'Shift 3') thresholdMinutes = 900;
        }

        if (timeInMinutes > thresholdMinutes) {
          status = "late";
        }
      } else {
        // Session 2-5 are always present regardless of time
        status = "present";
      }

      // Special case: if there's an 'off' session (which is always session 1), 
      // update it to present/late instead of creating a new session.
      const offSession = existingSessions.find(s => s.status === 'off');
      if (offSession) {
        console.log(`[ClockIn] Converting 'off' session ${offSession.id} to '${status}' work session for user ${userId}`);
        const attendance = await storage.updateAttendance(offSession.id, {
          checkIn: now,
          checkOut: null,
          status: status as any,
          checkInPhoto: photoFileId,
          checkInLocation: location,
          shiftId: shiftId,
          shift: shiftName,
          lateReason: lateReason,
          lateReasonPhoto: lateReasonPhotoId,
          isFakeGps: isFakeGps
        });
        await storage.updateUser(userId, { shift: shiftName });
        return res.json(attendance);
      }

      const attendance = await storage.createAttendance({
        userId,
        date: new Date(today),
        checkIn: now,
        status: status as any,
        checkInPhoto: photoFileId,
        checkInLocation: location,
        shiftId: shiftId,
        shift: shiftName,
        sessionNumber: nextSessionNumber,
        lateReason: lateReason,
        lateReasonPhoto: lateReasonPhotoId,
        isFakeGps: isFakeGps
      });

      // Update the user's shift in their profile automatically
      await storage.updateUser(userId, { shift: shiftName });

      console.log(`[ClockIn] Success: Created session ${nextSessionNumber} for user ${userId}`);
      res.json(attendance);
    } catch (err) {
      console.error("[ClockIn] Error:", err);
      res.status(500).json({ message: (err as Error).message || "Internal Server Error" });
    }
  });

  app.post(api.attendance.clockOut.path, upload.single('photo'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const today = getJakartaDate();
    const userId = req.user!.id;
    // Find the active (not checked out) session for today
    const sessions = await storage.getAttendanceSessionsByUserAndDate(userId, today);
    const existing = sessions.find(s => !s.checkOut);

    if (!existing) {
      return res.status(400).json({ message: "No active check-in record found for today" });
    }

    const photoFileId = await handlePhotoUpload(req, 'clockOut');
    const location = req.body.location;

    const attendance = await storage.updateAttendance(existing.id, {
      checkOut: new Date(),
      checkOutPhoto: photoFileId,
      checkOutLocation: location,
      isFakeGps: req.body.isFakeGps === true || req.body.isFakeGps === "true"
    });

    res.json(attendance);
  });

  app.post(api.attendance.breakStart.path, upload.single('photo'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const today = getJakartaDate();
    const userId = req.user!.id;
    // Find the active (not checked out) session for today
    const sessions = await storage.getAttendanceSessionsByUserAndDate(userId, today);
    const existing = sessions.find(s => !s.checkOut);

    if (!existing) {
      return res.status(400).json({ message: "No active check-in record found for today" });
    }

    const photoFileId = await handlePhotoUpload(req, 'breakStart');
    const location = req.body.location;

    const attendance = await storage.updateAttendance(existing.id, {
      breakStart: new Date(),
      breakStartPhoto: photoFileId,
      breakStartLocation: location,
      isFakeGps: req.body.isFakeGps === true || req.body.isFakeGps === "true"
    });

    res.json(attendance);
  });

  app.post(api.attendance.breakEnd.path, upload.single('photo'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const today = getJakartaDate();
    const userId = req.user!.id;
    // Find the active (not checked out) session for today
    const sessions = await storage.getAttendanceSessionsByUserAndDate(userId, today);
    const existing = sessions.find(s => !s.checkOut);

    if (!existing) {
      return res.status(400).json({ message: "No active check-in record found for today" });
    }

    const photoFileId = await handlePhotoUpload(req, 'breakEnd');
    const location = req.body.location;

    const attendance = await storage.updateAttendance(existing.id, {
      breakEnd: new Date(),
      breakEndPhoto: photoFileId,
      breakEndLocation: location,
      isFakeGps: req.body.isFakeGps === true || req.body.isFakeGps === "true"
    });

    res.json(attendance);
  });

  app.post(api.attendance.permit.path, upload.single('photo'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { notes, type } = req.body;
    const today = getJakartaDate();
    const userId = req.user!.id;
    const labelType = type === 'sick' ? 'Sakit' : type === 'off' ? 'Libur' : 'Izin';

    // Get ALL sessions today to find the ACTIVE one (not checked-out)
    const allSessions = await storage.getAttendanceSessionsByUserAndDate(userId, today);
    const activeSession = allSessions.find(s => !s.checkOut);

    // Upload photo (if any for off day, we bypass it)
    let photoFileId = undefined;
    if (req.body.checkInPhoto) {
      photoFileId = await handlePhotoUpload(req, 'clockIn');
    }
    const now = new Date();

    if (activeSession) {
      // Employee is currently working (or on break) â€” close the session

      // Determine what states the employee was in for context notes
      const wasOnBreak = !!(activeSession.breakStart && !activeSession.breakEnd);
      const wasWorking = !!activeSession.checkIn;

      // Build contextual notes
      const stateLabel = wasOnBreak
        ? '(saat istirahat)'
        : wasWorking
          ? '(saat bekerja)'
          : '';

      const contextNote = notes
        ? `[${labelType} ${stateLabel}] ${notes}`
        : `${labelType} ${stateLabel} - sesi dihentikan, dapat dilanjutkan kembali`;

      // Build update payload
      const updatePayload: any = {
        status: type,
        notes: contextNote,
        checkOut: now,
        checkOutPhoto: photoFileId,
        permitExitAt: now,
      };

      // Auto-close break if employee was on break when permit submitted
      if (wasOnBreak) {
        updatePayload.breakEnd = now;
      }

      const attendance = await storage.updateAttendance(activeSession.id, updatePayload);
      return res.json(attendance);
    }

    // No active session â€” permit submitted before starting work
    // Create a CLOSED permit record (checkIn = checkOut = now) so resume works
    const contextNote = notes
      ? `[${labelType} sebelum kerja] ${notes}`
      : `${labelType} - tidak masuk kerja`;

    const attendance = await storage.createAttendance({
      userId,
      date: new Date(today),
      status: type as any,
      notes: contextNote,
      checkInPhoto: photoFileId,
      checkIn: now,
      checkOut: now, // immediately closed â€” no actual work done
      sessionNumber: allSessions.length + 1,
    });

    res.json(attendance);
  });

  app.post(api.attendance.resume.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const today = getJakartaDate();
    const userId = req.user!.id;

    // Get all sessions for today to determine next session number
    const existingSessions = await storage.getAttendanceSessionsByUserAndDate(userId, today);

    if (existingSessions.length === 0) {
      return res.status(400).json({ message: "No attendance record found for today" });
    }

    // Check if there's an active (not checked out) session
    const activeSession = existingSessions.find(s => !s.checkOut);
    if (activeSession) {
      return res.status(400).json({ message: "Masih ada sesi aktif. Silakan pulang dulu sebelum lanjut kerja." });
    }

    // Create new session with incremented session number
    const nextSessionNumber = existingSessions.length + 1;
    const now = new Date();
    const jakartaFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const timeParts = jakartaFormatter.formatToParts(now);
    const hour = parseInt(timeParts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(timeParts.find(p => p.type === 'minute')?.value || '0');
    const timeInMinutes = hour * 60 + minute;

    let status = "present";
    const shift = 'Karyawan'; // Default for resume or should we inherit?

    if (timeInMinutes > 420) {
      status = "late";
    }

    // Create new attendance session
    const newSession = await storage.createAttendance({
      userId,
      date: new Date(today),
      checkIn: now,
      status: status as any,
      shift: 'Karyawan',
      sessionNumber: nextSessionNumber,
      notes: `Sesi ke-${nextSessionNumber}`
    });

    res.json(newSession);
  });

  app.get(api.attendance.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Admin/Superadmin can see all, Employee sees only theirs
    const qUserId = req.query.userId;
    const parsedUserId = qUserId ? Number(Array.isArray(qUserId) ? qUserId[0] : qUserId) : undefined;
    const monthStr = req.query.month ? (Array.isArray(req.query.month) ? req.query.month[0] as string : req.query.month as string) : undefined;

    const isAdmin = isAdminRole(req);
    const userId = isAdmin ? parsedUserId : req.user!.id;
    const month = monthStr;

    const records = await storage.getAttendanceHistory(userId, month);
    res.json(records);
  });

  app.get(api.attendance.today.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const today = getJakartaDate();
    const sessions = await storage.getAttendanceSessionsByUserAndDate(req.user!.id, today);

    // Auto-close logic: if we are past 04:00 AM, check for open sessions from previous days
    const now = new Date();
    const jakartaFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const timeParts = jakartaFormatter.formatToParts(now);
    const hour = parseInt(timeParts.find(p => p.type === 'hour')?.value || '0');

    if (hour >= 4) {
      if (sessions.length === 0) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        const yesterdaySessions = await storage.getAttendanceSessionsByUserAndDate(req.user!.id, yesterdayStr);
        const openSessions = yesterdaySessions.filter(s => !s.checkOut);

        for (const session of openSessions) {
          await storage.updateAttendance(session.id, {
            checkOut: new Date(new Date(session.date).setHours(23, 59, 59)), // End of that day
            notes: session.notes ? `${session.notes} (Sesi ditutup otomatis: Lupa Absen Pulang)` : "Sesi ditutup otomatis: Lupa Absen Pulang"
          });
          console.log(`[AutoReset] Closed session ${session.sessionNumber} for user ${req.user!.id} from ${yesterdayStr}`);
        }
      }
    }

    // Return all sessions for today as array
    res.json(sessions);
  });

  // --- Registration & Shift Routes ---

  app.post("/api/register-data", upload.fields([
    { name: 'ktpPhoto', maxCount: 1 }, 
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'bpjsPhoto', maxCount: 1 },
    { name: 'npwpPhoto', maxCount: 1 }
  ]), async (req, res) => {
    try {
      // Safety check for empty body or strange data
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error("Registration Error: Empty request body");
        return res.status(400).json({ message: "Data pendaftaran tidak lengkap." });
      }

      const updates: any = normalizeUserData(req.body);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let userToLogin;

      if (req.isAuthenticated()) {
        const userId = req.user!.id;
        
        // Remove sensitive/locked fields if they try to send them after approval
        if (req.user!.registrationStatus === 'approved') {
          return res.status(400).json({ message: "Data sudah terverifikasi dan terkunci." });
        }

        if (files?.ktpPhoto?.[0]) {
          const ktpFilename = `ktp-${userId}-${Date.now()}-${files.ktpPhoto[0].originalname}`;
          const ktpPath = path.join(uploadsDir, ktpFilename);
          fs.writeFileSync(ktpPath, files.ktpPhoto[0].buffer);
          updates.ktpPhotoUrl = `/uploads/${ktpFilename}`;
        }

        if (files?.profilePhoto?.[0]) {
          const profFilename = `prof-${userId}-${Date.now()}-${files.profilePhoto[0].originalname}`;
          const profDir = path.join(uploadsDir, 'profile');
          if (!fs.existsSync(profDir)) fs.mkdirSync(profDir, { recursive: true });
          const profPath = path.join(profDir, profFilename);
          fs.writeFileSync(profPath, files.profilePhoto[0].buffer);
          updates.photoUrl = `/uploads/profile/${profFilename}`;
        }

        const empUploadsDir = path.join(uploadsDir, 'employees');
        if (!fs.existsSync(empUploadsDir)) fs.mkdirSync(empUploadsDir, { recursive: true });

        if (files?.bpjsPhoto?.[0]) {
          const filename = `emp-${userId}-bpjs-${Date.now()}-${files.bpjsPhoto[0].originalname}`;
          const filepath = path.join(empUploadsDir, filename);
          fs.writeFileSync(filepath, files.bpjsPhoto[0].buffer);
          updates.bpjsPhotoUrl = `/uploads/employees/${filename}`;
        }

        if (files?.npwpPhoto?.[0]) {
          const filename = `emp-${userId}-npwp-${Date.now()}-${files.npwpPhoto[0].originalname}`;
          const filepath = path.join(empUploadsDir, filename);
          fs.writeFileSync(filepath, files.npwpPhoto[0].buffer);
          updates.npwpPhotoUrl = `/uploads/employees/${filename}`;
        }

        updates.registrationStatus = 'pending';
        userToLogin = await storage.updateUser(userId, updates);
      } else {
        // User is not authenticated -> CREATE new unregistered user
        const nik = updates.nik;
        if (!nik) {
          return res.status(400).json({ message: "NIK wajib diisi untuk pendaftaran baru." });
        }
        
        // Check if NIK already exists
        const existing = await storage.getUserByNik(nik);
        if (existing) {
          return res.status(400).json({ message: "NIK sudah terdaftar. Silakan login menggunakan NIK Anda." });
        }

        const hashedPassword = await hashPassword(nik); // Default password same as NIK
        
        if (files?.ktpPhoto?.[0]) {
          const ktpFilename = `ktp-${nik}-${Date.now()}-${files.ktpPhoto[0].originalname}`;
          const ktpPath = path.join(uploadsDir, ktpFilename);
          fs.writeFileSync(ktpPath, files.ktpPhoto[0].buffer);
          updates.ktpPhotoUrl = `/uploads/${ktpFilename}`;
        }

        if (files?.profilePhoto?.[0]) {
          const profFilename = `prof-${nik}-${Date.now()}-${files.profilePhoto[0].originalname}`;
          const profDir = path.join(uploadsDir, 'profile');
          if (!fs.existsSync(profDir)) fs.mkdirSync(profDir, { recursive: true });
          const profPath = path.join(profDir, profFilename);
          fs.writeFileSync(profPath, files.profilePhoto[0].buffer);
          updates.photoUrl = `/uploads/profile/${profFilename}`;
        }

        const empUploadsDir = path.join(uploadsDir, 'employees');
        if (!fs.existsSync(empUploadsDir)) fs.mkdirSync(empUploadsDir, { recursive: true });

        if (files?.bpjsPhoto?.[0]) {
          const filename = `emp-${nik}-bpjs-${Date.now()}-${files.bpjsPhoto[0].originalname}`;
          const filepath = path.join(empUploadsDir, filename);
          fs.writeFileSync(filepath, files.bpjsPhoto[0].buffer);
          updates.bpjsPhotoUrl = `/uploads/employees/${filename}`;
        }

        if (files?.npwpPhoto?.[0]) {
          const filename = `emp-${nik}-npwp-${Date.now()}-${files.npwpPhoto[0].originalname}`;
          const filepath = path.join(empUploadsDir, filename);
          fs.writeFileSync(filepath, files.npwpPhoto[0].buffer);
          updates.npwpPhotoUrl = `/uploads/employees/${filename}`;
        }

        updates.username = nik;
        updates.password = hashedPassword;
        updates.role = 'employee';
        updates.registrationStatus = 'pending';
        updates.isAdmin = false;
        
        // Clean up empty strings to null for unique constraints
        if (updates.email === "") updates.email = null;
        if (updates.phoneNumber === "") updates.phoneNumber = null;

        userToLogin = await storage.createUser(updates);
      }

      // Re-login to create/update the session
      req.login(userToLogin, (err) => {
        if (err) {
          console.error("Login after registration failed:", err);
          return res.status(500).json({ message: "Data tersimpan namun gagal memulai sesi. Silakan login ulang." });
        }
        res.json(userToLogin);
      });
    } catch (err: any) {
      console.error("Registration Error Full:", err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: "Data sudah digunakan (NIK/Email/No HP/Username)" });
      }
      res.status(500).json({ message: "Gagal menyimpan data pendaftaran: " + (err.message || "Unknown error") });
    }
  });

  app.get("/api/shifts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const shifts = await storage.getAllShifts();
    res.json(shifts);
  });

  app.get("/api/admin/unverified-employees", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);
    const employees = await storage.getUnverifiedEmployees();
    res.json(employees);
  });

  app.post("/api/admin/verify-employee", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);
    
    const { userId, status } = req.body; // status: 'approved' or 'rejected'
    if (!userId || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid verification data" });
    }

    try {
      const user = await storage.updateUser(userId, { registrationStatus: status });
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ message: "Gagal verifikasi karyawan" });
    }
  });

  app.post("/api/admin/shifts", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);
    try {
      const shift = await storage.createShift(req.body);
      res.status(201).json(shift);
    } catch (err: any) {
      res.status(400).json({ message: "Gagal membuat shift" });
    }
  });

  app.patch("/api/admin/shifts/:id", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);
    try {
      const updated = await storage.updateShift(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: "Gagal update shift" });
    }
  });

  app.delete("/api/admin/shifts/:id", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);
    try {
      await storage.deleteShift(parseInt(req.params.id));
      res.sendStatus(204);
    } catch (err: any) {
      res.status(400).json({ message: "Gagal menghapus shift" });
    }
  });

  // --- Admin Routes ---

  app.get(api.admin.users.list.path, async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);
    let roleFilter: "all" | "admin" | "employee" = "all";
    if (req.query.role) {
      const rVal = Array.isArray(req.query.role) ? req.query.role[0] : req.query.role;
      // @ts-ignore
      if (typeof rVal === 'string' && ["all", "admin", "employee"].includes(rVal)) {
        roleFilter = rVal as "all" | "admin" | "employee";
      }
    }
    const users = await storage.getAllUsers();

    // Filter by role if requested
    if (roleFilter !== "all") {
      const filteredUsers = users.filter((u: DbUser) => u.role === roleFilter);
      return res.json(filteredUsers);
    }
    res.json(users);
  });

  app.post(api.admin.users.create.path, upload.single('photo'), async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);
 
    try {
      const userData = normalizeUserData(req.body);
 
      // For employee, ensure username matches NIK if not provided
      if (userData.role === 'employee' && !userData.username && userData.nik) {
        userData.username = userData.nik;
      }
 
      // If still no username, return error as it's required for login
      if (!userData.username) {
        return res.status(400).json({ message: "Username atau NIK wajib diisi" });
      }
 
      // Hash the password before storing
      const hashedPassword = await hashPassword(userData.password || "password123");
 
      // Create user
      const user = await storage.createUser({ ...userData, password: hashedPassword });

      // If photo is uploaded, save it locally and update user
      if (req.file) {
        const filename = `emp-${user.id}-${Date.now()}-${req.file.originalname}`;
        const empUploadsDir = path.join(uploadsDir, 'employees');
        if (!fs.existsSync(empUploadsDir)) fs.mkdirSync(empUploadsDir);

        const filepath = path.join(empUploadsDir, filename);
        fs.writeFileSync(filepath, req.file.buffer);

        await storage.updateUser(user.id, { photoUrl: `/uploads/employees/${filename}` });
        user.photoUrl = `/uploads/employees/${filename}`;
      }

      res.status(201).json(user);
    } catch (err: any) {
      console.error("Create User Error:", err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: "NIK atau Username sudah digunakan" });
      }
      res.status(400).json({ message: "Gagal membuat karyawan: " + (err.message || "Internal error") });
    }
  });

  app.post("/api/admin/users/upload", upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated() || (req.user as DbUser).role !== 'admin') return res.sendStatus(401);

    try {
      const multerReq = req as any;
      if (!multerReq.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = multerReq.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file is empty or missing headers" });
      }

      // Default format expected: NIK, Nama Lengkap, Telepon, Cabang, Posisi, Shift
      // Assuming headers in line 0, data starts line 1
      let createdCount = 0;
      let skippedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        // Handle basic CSV splitting. Does not properly handle quotes with commas inside perfectly,
        // but for NIK, Name, Phone, Branch, Shift, it should be enough in 99% of simple cases.
        const cols = lines[i].split(',');
        if (cols.length >= 2) {
          const nik = cols[0]?.trim() || "";
          const fullName = cols[1]?.trim() || "";
          const phone = cols[2]?.trim() || "";
          const branch = cols[3]?.trim() || "Pusat";
          const position = cols[4]?.trim() || "Staff";
          const shift = cols[5]?.trim() || "Shift 1";

          if (!nik || !fullName) {
            skippedCount++;
            continue;
          }

          try {
            // Check if NIK exists
            const existing = await storage.getUserByNik(nik);
            if (existing) {
              skippedCount++;
              continue;
            }

            // Since it's an employee, NIK-only login allows them to login without entering password.
            // We set default password anyway.
            const hashedPassword = await hashPassword(nik);

            await storage.createUser({
              nik,
              username: nik, // username = nik
              fullName,
              phoneNumber: phone || null,
              branch,
              position,
              shift,
              password: hashedPassword,
              role: 'employee',
              isAdmin: false,
            });
            createdCount++;
          } catch (err: any) {
            console.error(`Failed to insert ${nik}:`, err);
            skippedCount++;
          }
        }
      }

      res.status(200).json({ message: `Successfully added ${createdCount} employees. Skipped: ${skippedCount}.` });
    } catch (err: any) {
      console.error("CSV Upload Error:", err);
      res.status(500).json({ message: "Gagal memproses file CSV" });
    }
  });

  app.post("/api/admin/users/:id", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });

      const updateData = normalizeUserData(req.body);
      
      const updatedUser = await storage.updateUser(id, updateData);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user (POST):", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Google Drive proxy endpoint (uses native Node.js https - no external deps required)
  app.get('/api/images/:id', (req, res) => {
    const { id } = req.params;
    const driveUrl = `https://drive.google.com/thumbnail?id=${id}&sz=w800`;

    const handleRequest = (url: string, redirectCount = 0) => {
      if (redirectCount > 5) {
        res.status(500).send("Too many redirects");
        return;
      }
      const mod = url.startsWith('https') ? https : http;
      mod.get(url, (proxyRes) => {
        // Follow redirects
        if ((proxyRes.statusCode === 301 || proxyRes.statusCode === 302) && proxyRes.headers.location) {
          return handleRequest(proxyRes.headers.location, redirectCount + 1);
        }
        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'image/jpeg');
        proxyRes.pipe(res);
      }).on('error', (err) => {
        console.error("Error proxying image from Drive:", err);
        res.status(404).send("File not found");
      });
    };

    handleRequest(driveUrl);
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });

      await storage.deleteUser(id);
      res.sendStatus(204);
    } catch (err) {
      console.error("Delete User Error:", err);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.post(api.admin.attendance.manual.path, async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);

    try {
      const { userId, date, status, notes, shift } = req.body;
      if (!userId || !date || !status) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if record exists for this user and date
      // getAttendanceByUserAndDate uses sql`DATE(date)` so it's robust
      const existing = await storage.getAttendanceByUserAndDate(userId, date);

      let record;
      if (existing) {
        record = await storage.updateAttendance(existing.id, {
          status,
          notes,
          shift: shift || existing.shift
        });
      } else {
        record = await storage.createAttendance({
          userId,
          date: new Date(date),
          status,
          notes: notes || "",
          shift: shift || 'Karyawan',
          sessionNumber: 1
        });
      }

      res.json(record);
    } catch (err: any) {
      console.error("Manual Attendance Error:", err);
      res.status(500).json({ message: "Gagal memproses data absensi" });
    }
  });

  app.patch("/api/admin/users/:id", upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'bpjsPhoto', maxCount: 1 }, { name: 'npwpPhoto', maxCount: 1 }]), async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });

      const updates = normalizeUserData(req.body);

      // Remove fields that shouldn't be directly updated via this endpoint
      delete updates.registrationStatus; // handled by separate endpoint

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const empUploadsDir = path.join(uploadsDir, 'employees');
      if (!fs.existsSync(empUploadsDir)) fs.mkdirSync(empUploadsDir);

      if (files?.photo?.[0]) {
        const filename = `emp-${id}-photo-${Date.now()}-${files.photo[0].originalname}`;
        const filepath = path.join(empUploadsDir, filename);
        fs.writeFileSync(filepath, files.photo[0].buffer);
        updates.photoUrl = `/uploads/employees/${filename}`;
      }

      if (files?.bpjsPhoto?.[0]) {
        const filename = `emp-${id}-bpjs-${Date.now()}-${files.bpjsPhoto[0].originalname}`;
        const filepath = path.join(empUploadsDir, filename);
        fs.writeFileSync(filepath, files.bpjsPhoto[0].buffer);
        updates.bpjsPhotoUrl = `/uploads/employees/${filename}`;
      }

      if (files?.npwpPhoto?.[0]) {
        const filename = `emp-${id}-npwp-${Date.now()}-${files.npwpPhoto[0].originalname}`;
        const filepath = path.join(empUploadsDir, filename);
        fs.writeFileSync(filepath, files.npwpPhoto[0].buffer);
        updates.npwpPhotoUrl = `/uploads/employees/${filename}`;
      }

      // If password provided, hash it
      if (updates.password && updates.password.length > 0) {
        updates.password = await hashPassword(updates.password);
      } else {
        delete updates.password; // Don't update password if empty
      }

      const user = await storage.updateUser(id, updates);
      res.json(user);
    } catch (err: any) {
      console.error("Update User Error:", err.message || err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: "NIK atau Username sudah digunakan" });
      }
      res.status(400).json({ message: err.message || "Gagal memperbarui karyawan" });
    }
  });

  app.get(api.admin.dashboard.stats.path, async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);

    const users = await storage.getAllUsers();
    const totalEmployees = users.filter(u => u.role === 'employee').length;

    // Present today - use Jakarta timezone for consistency
    const today = getJakartaDate();
    const allAttendance = await storage.getAttendanceHistory(undefined, undefined);
    const todayRecords = allAttendance.filter(a => {
      const dateStr = typeof a.date === 'string' ? a.date : new Date(a.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      return dateStr === today && (a.status === 'present' || a.status === 'late');
    });

    res.json({
      totalEmployees,
      presentToday: todayRecords.length,
    });
  });

  app.post("/api/admin/backup", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);

    try {
      const fileName = await createBackup();
      res.json({ success: true, fileName, message: `Backup berhasil dibuat: ${fileName}` });
    } catch (error: any) {
      console.error("Manual Backup Error:", error);
      res.status(500).json({ success: false, message: "Gagal membuat backup database" });
    }
  });

  app.get("/api/admin/backups/download/:fileName", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);

    const fileName = req.params.fileName;
    // Validate filename to prevent path traversal
    if (!fileName.match(/^backup-.*?\.sql$/)) {
      return res.status(400).send("Invalid backup file name");
    }

    const filePath = path.join(process.cwd(), "backups", fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Backup file not found");
    }

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error downloading backup:", err);
        if (!res.headersSent) {
          res.status(500).send("Gagal mengunduh file backup");
        }
      }
    });
  });

  app.post("/api/admin/backups/import", upload.single('file'), async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);

    try {
      const multerReq = req as any;
      if (!multerReq.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check file extension
      if (!multerReq.file.originalname.endsWith('.sql')) {
        return res.status(400).json({ message: "File must be a .sql file" });
      }

      const filename = `import-${Date.now()}-${multerReq.file.originalname}`;
      const backupsDir = path.join(process.cwd(), "backups");
      if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

      const filepath = path.join(backupsDir, filename);
      fs.writeFileSync(filepath, multerReq.file.buffer);

      // Execute import
      await importBackup(filepath);

      // Clean up the temporary uploaded file
      fs.unlinkSync(filepath);

      res.status(200).json({ message: "Database berhasil di-import" });
    } catch (err: any) {
      console.error("Database Import Error:", err);
      res.status(500).json({ message: "Gagal meng-import database: " + (err.message || "Internal error") });
    }
  });


  // --- Push Notifications ---
  app.get("/api/push/public-key", (req, res) => {
    if (!vapidPublicKey) {
      return res.status(500).json({ message: "VAPID key is not configured" });
    }
    res.json({ publicKey: vapidPublicKey });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const subscription = req.body;
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ message: "Invalid subscription data" });
      }

      await storage.addPushSubscription({
        userId: req.user!.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });

      res.status(201).json({ message: "Subscription saved." });
    } catch (e) {
      console.error("Push Subscribe Error:", e);
      res.status(500).json({ message: "Server error" });
    }
  });

  // --- Announcement Routes ---

  // uploadsDir already declared and configured at the top of registerRoutes

  app.get(api.announcements.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const list = await storage.getAnnouncements();
      // Filter expired on the fly or in DB query. Since DB query is simple select *, filter here.
      const now = new Date();
      const active = list.filter(a => !a.expiresAt || new Date(a.expiresAt).getTime() > now.getTime());
      res.json(active);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.announcements.create.path, upload.single('image'), async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);

    try {
      // Parse body (multipart/form-data means numbers come as strings)
      // We manually construct input object because z.parse might fail specific format
      // But let's try to match what schema expects

      let imageUrl = undefined;
      const multerReq = req as any;
      if (multerReq.file) {
        const filename = `${Date.now()}-${multerReq.file.originalname}`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, multerReq.file.buffer);
        imageUrl = `/uploads/${filename}`;
      }

      const inputData = {
        title: req.body.title,
        content: req.body.content,
        imageUrl: imageUrl,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined, // Handle empty string
      };

      const announcement = await storage.createAnnouncement({
        ...inputData,
        authorId: req.user!.id,
      });

      // Trigger Web Push Notifications for all subscribers
      if (vapidPublicKey && vapidPrivateKey) {
        try {
          const subscriptions = await storage.getPushSubscriptions();
          const payload = JSON.stringify({
            title: "Pengumuman Baru!",
            body: announcement.title,
            url: "/" // Redirects to Dashboard/Info Board
          });

          // Send to all subscribers concurrently
          const pushPromises = subscriptions.map((sub) => {
            const pushSub = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              }
            };
            return webpush.sendNotification(pushSub, payload).catch(err => {
              console.error("Failed to send push notification to endpoint:", sub.endpoint, err.message);
            });
          });

          await Promise.all(pushPromises);
          console.log(`Pushed announcement to ${pushPromises.length} subscribers.`);
        } catch (pushErr) {
          console.error("General Push Error:", pushErr);
        }
      }

      res.status(201).json(announcement);
    } catch (e) {
      console.error("Announcement Create Error:", e);
      res.status(400).json({ message: "Invalid input or server error" });
    }
  });

  // Admin: Get complaint stats
  app.get("/api/admin/complaints/stats", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);

    try {
      const count = await storage.getPendingComplaintsCount();
      res.json({ pendingCount: count });
    } catch (e) {
      console.error("Complaint Stats Error:", e);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/announcements/:id", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);

    // We need to implement deleteAnnouncement in storage first, but for now let's do direct DB delete if possible 
    // or assume storage.deleteAnnouncement exists (it doesn't yet).
    // I will need to update storage.ts first! 
    // Wait, I can't update TWO files in one replace_file_content.
    // So I will update storage.ts in NEXT step.
    // For now, I will add the route and it will fail if method missing. 
    // Actually, I can use db directly here if I import db?
    // No, let's stick to storage pattern. I will add storage.deleteAnnouncement in next step.
    // So I'll comment out the call or just add it knowing I'll fix it immediately.

    try {
      const id = parseInt(req.params.id);
      await storage.deleteAnnouncement(id);
      res.sendStatus(204);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  });

  // --- Complaint Routes ---

  // Employee: create complaint with photos
  app.post("/api/complaints", upload.array('photos', 10), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { title, description, captions } = req.body;
      const complaint = await storage.createComplaint({
        userId: req.user!.id,
        title,
        description,
      });

      // Handle uploaded photos
      const files = (req.files as Express.Multer.File[]) || [];
      const captionList = captions ? (Array.isArray(captions) ? captions : [captions]) : [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = `complaint-${Date.now()}-${i}-${file.originalname}`;
        const filepath = path.join(uploadsDir, filename);

        // Use async write to avoid blocking event loop
        await fs.promises.writeFile(filepath, file.buffer);
        const photoUrl = `/uploads/${filename}`;

        await storage.createComplaintPhoto({
          complaintId: complaint.id,
          photoUrl,
          caption: captionList[i] || null,
        });
      }

      res.status(201).json(complaint);
    } catch (e) {
      console.error("Complaint Create Error:", e);
      // Ensure we return JSON, not HTML, even if something weird happens
      if (!res.headersSent) {
        res.status(500).json({ message: "Gagal membuat pengaduan: Server error" });
      }
    }
  });

  // Employee: get own complaints
  app.get("/api/complaints", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const list = await storage.getComplaintsByUser(req.user!.id);
    res.json(list);
  });

  // Admin: get all complaints
  app.get("/api/admin/complaints", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);
    const list = await storage.getAllComplaints();
    res.json(list);
  });

  // Get complaint photos
  app.get("/api/complaints/:id/photos", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const photos = await storage.getComplaintPhotos(parseInt(req.params.id));
    res.json(photos);
  });

  // Admin: update complaint status
  app.patch("/api/admin/complaints/:id/status", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);
    try {
      const updated = await storage.updateComplaintStatus(
        parseInt(req.params.id),
        req.body.status
      );
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Gagal update status" });
    }
  });

  // --- Leave Request Routes ---

  app.get(api.leave.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const requests = await storage.getLeaveRequestsByUser(req.user!.id);
    res.json(requests);
  });

  app.get(api.leave.balance.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const year = new Date().getFullYear();
    const used = await storage.getApprovedLeaveDaysCount(req.user!.id, year);
    res.json({ used, remaining: 12 - used, limit: 12 });
  });

  app.post(api.leave.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { startDate, endDate, reason, selectedDates } = req.body;

    const year = new Date(startDate).getFullYear();
    const used = await storage.getApprovedLeaveDaysCount(req.user!.id, year);

    let requestedDays = 0;
    if (selectedDates && Array.isArray(selectedDates)) {
      requestedDays = selectedDates.length;
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    if (used + requestedDays > 12) {
      return res.status(400).json({ message: `Sisa kuota cuti Anda tidak mencukupi. (Terpakai: ${used}/12, Diminta: ${requestedDays})` });
    }

    const request = await storage.createLeaveRequest({
      userId: req.user!.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      selectedDates: selectedDates ? selectedDates.join(',') : null,
      reason,
      status: 'pending'
    });
    res.status(201).json(request);
  });

  app.post(api.leave.cancel.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(String(req.params.id));
    const requests = await storage.getLeaveRequestsByUser(req.user!.id);
    const request = requests.find(r => r.id === id);

    if (!request) return res.status(404).json({ message: "Permohonan tidak ditemukan" });
    if (request.status !== 'pending') return res.status(400).json({ message: "Hanya permohonan pending yang bisa dibatalkan" });

    const updated = await storage.updateLeaveRequestStatus(id, 'cancelled');
    res.json(updated);
  });

  // Admin Leave Routes
  app.get("/api/admin/leave-requests/recent", async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);
    const requests = await storage.getRecentLeaveRequests(5);
    res.json(requests);
  });

  app.get(api.admin.attendance.leave.list.path, async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);
    const requests = await storage.getAllLeaveRequests();
    res.json(requests);
  });

  app.patch(api.admin.attendance.leave.update.path, async (req, res) => {
    try {
      if (!isAdminRole(req)) return res.sendStatus(401);
      const id = parseInt(String(req.params.id));
      const { status } = req.body;

      console.log(`[AdminLeaveUpdate] Processing ID: ${id}, Status: ${status}`);

      // Get the request first to know the dates
      const request = await storage.getLeaveRequestById(id);
      if (!request) {
        console.error(`[AdminLeaveUpdate] Request ${id} not found`);
        return res.status(404).json({ message: "Request not found" });
      }

      const updated = await storage.updateLeaveRequestStatus(id, status);
      console.log(`[AdminLeaveUpdate] Status updated to: ${status}`);

      // If approved, create attendance records automatically for those dates
      if (status === 'approved') {
        const datesToProcess: string[] = [];
        if (request.selectedDates) {
          console.log(`[AdminLeaveUpdate] Processing selected dates list`);
          datesToProcess.push(...request.selectedDates.split(',').filter(d => d.trim() !== ''));
        } else {
          console.log(`[AdminLeaveUpdate] Processing date range: ${request.startDate} to ${request.endDate}`);
          // Ensure we have valid dates
          let current = new Date(request.startDate);
          const end = new Date(request.endDate);

          // Safety check for absolute dates to avoid timezone shifts
          // If the date is string like YYYY-MM-DD, new Date() might be UTC
          const rawStartDate = request.startDate as unknown as string | Date;
          if (typeof rawStartDate === 'string' && rawStartDate.includes('-')) {
            // Use UTC to avoid local timezone shifts which can change the day
            current = new Date(rawStartDate + 'T00:00:00Z');
          }

          let safetyCounter = 0;
          while (current <= end && safetyCounter < 40) { // Safety limit of 40 days
            const dateStr = format(current, "yyyy-MM-dd");
            datesToProcess.push(dateStr);
            current.setUTCDate(current.getUTCDate() + 1);
            safetyCounter++;
          }
        }

        console.log(`[AdminLeaveUpdate] Dates to process: ${datesToProcess.join(', ')}`);

        for (const dateStr of datesToProcess) {
          if (!dateStr) continue;

          // Find existing record
          const existing = await storage.getAttendanceByUserAndDate(request.userId, dateStr);

          if (!existing) {
            await storage.createAttendance({
              userId: request.userId,
              date: dateStr as any,
              status: 'cuti',
              notes: `Cuti Disetujui: ${request.reason}`,
              shift: 'Karyawan',
              sessionNumber: 1
            });
          } else {
            await storage.updateAttendance(existing.id, {
              status: 'cuti',
              notes: `Cuti Disetujui: ${request.reason}`
            });
          }
        }
      }

      res.json(updated);
    } catch (error: any) {
      console.error(`[AdminLeaveUpdate] FATAL ERROR:`, error);
      res.status(500).json({ message: "Internal Server Error", detail: error.message });
    }
  });

  // --- Admin Attendance CRUD ---

  // POST: Create manual attendance record
  app.post(api.admin.attendance.manual.path, async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);

    const { userId, date, status, notes, shift, checkIn, checkOut, breakStart, breakEnd } = req.body;
    if (!userId || !date) return res.status(400).json({ message: "userId dan date wajib diisi" });

    const toDate = (dateStr: string | undefined, timeStr: string | undefined): Date | undefined => {
      if (!timeStr) return undefined;
      return new Date(`${dateStr}T${timeStr}:00+07:00`);
    };

    try {
      // Check for existing session count
      const existing = await storage.getAttendanceSessionsByUserAndDate(userId, date);
      const sessionNumber = existing.length + 1;

      const record = await storage.createAttendance({
        userId: parseInt(userId),
        date: new Date(date + 'T00:00:00+07:00'),
        status: status || 'present',
        notes: notes || null,
        shift: shift || 'Karyawan',
        sessionNumber,
        checkIn: toDate(date, checkIn) || new Date(date + 'T00:00:00+07:00'),
        checkOut: toDate(date, checkOut) || null,
        breakStart: toDate(date, breakStart) || null,
        breakEnd: toDate(date, breakEnd) || null,
      });
      res.json(record);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // PUT: Edit existing attendance record (admin override)
  app.put('/api/admin/attendance/:id', async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);

    const id = parseInt(req.params.id);
    const { status, notes, checkIn, checkOut, breakStart, breakEnd, date } = req.body;

    const toDate = (dateStr: string | undefined, timeStr: string | undefined): Date | null => {
      if (!timeStr || timeStr.trim() === '') return null;
      return new Date(`${dateStr}T${timeStr}:00+07:00`);
    };

    try {
      const updated = await storage.updateAttendance(id, {
        status: status || undefined,
        notes: notes || null,
        checkIn: checkIn ? new Date(`${date}T${checkIn}:00+07:00`) : undefined,
        checkOut: toDate(date, checkOut),
        breakStart: toDate(date, breakStart),
        breakEnd: toDate(date, breakEnd),
      });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // DELETE: Remove an attendance record
  app.delete('/api/admin/attendance/:id', async (req, res) => {
    if (!isAdminRole(req)) return res.sendStatus(401);

    const id = parseInt(req.params.id);
    try {
      await storage.deleteAttendance(id);
      res.sendStatus(204);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}


