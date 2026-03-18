import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, User, Camera, Pencil, Check } from "lucide-react";
import { motion } from "framer-motion";

const profileSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter"),
  phoneNumber: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  address: z.string().optional(),
  birthPlace: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  religion: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phoneNumber: user?.phoneNumber || "",
      email: user?.email || "",
      address: user?.address || "",
      birthPlace: user?.birthPlace || "",
      birthDate: user?.birthDate || "",
      gender: user?.gender || "",
      religion: user?.religion || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v) formData.append(k, v);
      });
      if (photoFile) formData.append("profilePhoto", photoFile);

      const res = await fetch("/api/profile", {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Terjadi kesalahan" }));
        throw new Error(err.message || "Gagal memperbarui profil");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Profil Diperbarui", description: "Data diri Anda berhasil disimpan." });
      setIsEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const currentPhoto = photoPreview || user?.photoUrl;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 pt-10 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-4 border-white" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full border-4 border-white" />
        </div>
        <div className="max-w-lg mx-auto relative z-10">
          <h1 className="text-white text-2xl font-bold mb-1">Profil Saya</h1>
          <p className="text-white/70 text-sm">Data diri dan informasi pribadi</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-12 space-y-4">
        {/* Avatar Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-3xl shadow-xl shadow-black/5 p-6 flex items-center gap-5"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 overflow-hidden border-2 border-white shadow-lg">
              {currentPhoto ? (
                <img src={currentPhoto} alt="Foto Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary text-3xl font-bold">
                  {user?.fullName?.charAt(0) || "?"}
                </div>
              )}
            </div>
            {isEditing && (
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-lg leading-tight">{user?.fullName}</h2>
            <p className="text-sm text-gray-500">{user?.position || "Karyawan"} • {user?.branch || "-"}</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">NIK: {user?.nik || "-"}</p>
          </div>
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (isEditing) {
                // Reset
                form.reset({
                  fullName: user?.fullName || "",
                  phoneNumber: user?.phoneNumber || "",
                  email: user?.email || "",
                  address: user?.address || "",
                  birthPlace: user?.birthPlace || "",
                  birthDate: user?.birthDate || "",
                  gender: user?.gender || "",
                  religion: user?.religion || "",
                });
                setPhotoPreview(null);
                setPhotoFile(null);
              }
              setIsEditing((v) => !v);
            }}
            className="shrink-0"
          >
            {isEditing ? "Batal" : <><Pencil className="w-3.5 h-3.5 mr-1" />Edit</>}
          </Button>
        </motion.div>

        {/* Info / Form Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-lg shadow-black/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Data Diri
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="birthPlace" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tempat Lahir</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="birthDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tanggal Lahir</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jenis Kelamin</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                              <SelectItem value="Perempuan">Perempuan</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="religion" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agama</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Islam","Kristen","Katolik","Hindu","Buddha","Konghucu"].map(r => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. HP</FormLabel>
                        <FormControl><Input type="tel" placeholder="08..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="contoh@email.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat (KTP)</FormLabel>
                        <FormControl><Textarea className="resize-none" rows={3} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Button
                      type="submit"
                      className="w-full h-11 font-bold shadow-md shadow-primary/20"
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
                      ) : (
                        <><Check className="w-4 h-4 mr-2" />Simpan Perubahan</>
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="space-y-3 text-sm">
                  {[
                    { label: "No. HP", value: user?.phoneNumber },
                    { label: "Email", value: user?.email },
                    { label: "Tempat, Tgl Lahir", value: [user?.birthPlace, user?.birthDate].filter(Boolean).join(", ") },
                    { label: "Jenis Kelamin", value: user?.gender },
                    { label: "Agama", value: user?.religion },
                    { label: "Alamat", value: user?.address },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5 py-2 border-b border-slate-50 last:border-0">
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</span>
                      <span className="text-gray-800 font-medium">{value || <span className="text-slate-300 italic">Belum diisi</span>}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Read-only Work Info */}
        {!isEditing && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="border-none shadow-lg shadow-black/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-700">Informasi Pekerjaan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Jabatan", value: user?.position },
                    { label: "Cabang", value: user?.branch },
                    { label: "Status Karyawan", value: (user as any)?.employmentStatus },
                    { label: "Tanggal Masuk", value: (user as any)?.joinDate },
                    { label: "NPWP", value: user?.npwp },
                    { label: "BPJS", value: user?.bpjs },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5 py-2 border-b border-slate-50 last:border-0">
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</span>
                      <span className="text-gray-800 font-medium">{value || <span className="text-slate-300 italic">Belum diisi</span>}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-4 text-center">
                  Data pekerjaan hanya dapat diubah oleh Admin/HR.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
