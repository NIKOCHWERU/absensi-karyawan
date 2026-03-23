import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronRight, ChevronLeft, Check, Camera, Upload, User, Briefcase, FileText, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const steps = [
  { id: 1, title: "Data Pribadi", icon: <User className="w-5 h-5" /> },
  { id: 2, title: "Pekerjaan", icon: <Briefcase className="w-5 h-5" /> },
  { id: 3, title: "Administrasi", icon: <FileText className="w-5 h-5" /> },
  { id: 4, title: "Upload", icon: <ImageIcon className="w-5 h-5" /> }
];

export default function RegistrationPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      fullName: user?.fullName || "",
      nik: user?.nik || "",
      birthPlace: user?.birthPlace || "",
      birthDate: user?.birthDate || "",
      gender: user?.gender || "Laki-laki",
      religion: user?.religion || "",
      address: user?.address || "",
      phoneNumber: user?.phoneNumber || "",
      email: user?.email || "",
      position: user?.position || "",
      branch: user?.branch || "",
      joinDate: user?.joinDate || "",
      employmentStatus: user?.employmentStatus || "Kontrak",
      npwp: user?.npwp || "",
      bpjs: user?.bpjs || "",
    }
  });

  const [previews, setPreviews] = useState<{ ktp?: string; profile?: string }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ktp' | 'profile') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const onSubmit = async (values: any) => {
    if (step < 4) {
      nextStep();
      return;
    }

    // Validation Check
    const requiredFields = [
      { key: 'fullName', name: 'Nama Lengkap' },
      { key: 'nik', name: 'NIK' },
      { key: 'birthPlace', name: 'Tempat Lahir' },
      { key: 'birthDate', name: 'Tanggal Lahir' },
      { key: 'phoneNumber', name: 'No. HP' },
      { key: 'address', name: 'Alamat' }
    ];

    const emptyFields = requiredFields.filter(f => !values[f.key]);
    
    if (emptyFields.length > 0) {
      const fieldNames = emptyFields.map(f => f.name).join(', ');
      toast({
        title: "Peringatan",
        description: `Mohon lengkapi data wajib berikut: ${fieldNames}`,
        variant: "destructive"
      });
      return; 
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (values[key]) formData.append(key, values[key]);
      });

      const ktpInput = document.getElementById('ktp-upload') as HTMLInputElement;
      const profInput = document.getElementById('prof-upload') as HTMLInputElement;

      if (!ktpInput?.files?.[0]) {
        toast({ title: "Peringatan", description: "Foto KTP wajib diunggah.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      if (!profInput?.files?.[0]) {
        toast({ title: "Peringatan", description: "Foto Profil wajib diunggah.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      if (ktpInput?.files?.[0]) formData.append('ktpPhoto', ktpInput.files[0]);
      if (profInput?.files?.[0]) formData.append('profilePhoto', profInput.files[0]);

      const res = await fetch("/api/register-data", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: "Terjadi kesalahan" }));
        throw new Error(errData.message || "Gagal mendaftar");
      }
      
      toast({
        title: "Pendaftaran Berhasil",
        description: "Data Anda telah dikirim dan sedang menunggu verifikasi admin.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/pending");
    } catch (err: any) {
      toast({
        title: "Gagal Mengirim data",
        description: err.message || "Terjadi kesalahan saat menyimpan pendaftaran.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (step / steps.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pendaftaran Karyawan</h1>
          <p className="text-slate-500">Silakan lengkapi data diri Anda untuk keperluan administrasi HR.</p>
        </div>

        {/* Progress Tracker */}
        <div className="mb-8 relative px-4">
          <div className="flex justify-between items-center mb-4 relative z-10">
            {steps.map((s) => (
              <div key={s.id} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                    step >= s.id ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  {step > s.id ? <Check className="w-5 h-5" /> : s.icon}
                </div>
                <span className={`text-[10px] mt-2 font-semibold uppercase tracking-tight ${step >= s.id ? "text-primary" : "text-slate-400"}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1.5 absolute top-5 left-8 right-8 bg-slate-200 z-0" />
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="p-6 sm:p-8 min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {step === 1 && (
                      <div className="space-y-4">
                        <CardTitle className="text-xl mb-4">Biodata Pribadi</CardTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem className="col-span-1 sm:col-span-2">
                                <FormLabel>Nama Lengkap</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="nik"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>NIK</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Jenis Kelamin</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih Jenis Kelamin" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="religion"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Agama</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih Agama" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Islam">Islam</SelectItem>
                                    <SelectItem value="Kristen Protestan">Kristen Protestan</SelectItem>
                                    <SelectItem value="Katolik">Katolik</SelectItem>
                                    <SelectItem value="Hindu">Hindu</SelectItem>
                                    <SelectItem value="Buddha">Buddha</SelectItem>
                                    <SelectItem value="Khonghucu">Khonghucu</SelectItem>
                                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="birthPlace"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tempat Lahir</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="birthDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tanggal Lahir</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>No. HP</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl><Input type="email" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Alamat Lengkap (KTP)</FormLabel>
                              <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-4">
                        <CardTitle className="text-xl mb-4">Informasi Pekerjaan</CardTitle>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Jabatan / Posisi</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="branch"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cabang</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="joinDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tanggal Masuk</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="employmentStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status Karyawan</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih Status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Kontrak">Kontrak</SelectItem>
                                    <SelectItem value="Tetap">Karyawan Tetap</SelectItem>
                                    <SelectItem value="Probation">Probation</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mt-6">
                           <p className="text-xs text-amber-800 font-medium">
                             Catatan: Data pekerjaan akan diverifikasi oleh HR. Pastikan data yang diisi sesuai dengan kontrak Anda.
                           </p>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-4">
                        <CardTitle className="text-xl mb-4">Data Administrasi</CardTitle>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="npwp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nomor NPWP</FormLabel>
                                <FormControl><Input placeholder="00.000.000.0-000.000" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="bpjs"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nomor BPJS Kesehatan / Ketenagakerjaan</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-6">
                        <CardTitle className="text-xl">Upload Dokumen</CardTitle>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <FormLabel>Foto KTP</FormLabel>
                            <label 
                              htmlFor="ktp-upload" 
                              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-primary transition-all overflow-hidden"
                            >
                              {previews.ktp ? (
                                <img src={previews.ktp} className="w-full h-full object-cover" />
                              ) : (
                                <>
                                  <Camera className="w-8 h-8 text-slate-400 mb-2" />
                                  <span className="text-xs text-slate-500 font-medium">Klik untuk upload KTP</span>
                                </>
                              )}
                              <input id="ktp-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'ktp')} />
                            </label>
                          </div>

                          <div className="space-y-3">
                            <FormLabel>Foto Profil</FormLabel>
                            <label 
                              htmlFor="prof-upload" 
                              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-primary transition-all overflow-hidden"
                            >
                              {previews.profile ? (
                                <img src={previews.profile} className="w-full h-full object-cover" />
                              ) : (
                                <>
                                  <User className="w-8 h-8 text-slate-400 mb-2" />
                                  <span className="text-xs text-slate-500 font-medium">Klik untuk upload Foto</span>
                                </>
                              )}
                              <input id="prof-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />
                            </label>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-800 leading-relaxed font-medium">
                            Pastikan foto KTP terbaca jelas dan foto profil menghadap ke depan dengan latar belakang polos.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>

              <CardFooter className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep} 
                  disabled={step === 1 || isSubmitting}
                  className="px-6 h-11"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Kembali
                </Button>
                
                <Button 
                  type="submit" 
                  className="px-8 h-11 font-bold shadow-lg shadow-primary/30" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...
                    </>
                  ) : step === 4 ? (
                    <>
                      Kirim Pendaftaran <Check className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Lanjut <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
