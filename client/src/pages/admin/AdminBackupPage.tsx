import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Trash2, Database, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";

type BackupFile = {
  name: string;
  size: number;
  createdAt: string;
};

export default function AdminBackupPage() {
  const { toast } = useToast();

  const { data: backups, isLoading } = useQuery<BackupFile[]>({
    queryKey: ["/api/admin/backups"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/backups");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/backups"] });
      toast({
        title: "Berhasil",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileName: string) => {
      await apiRequest("DELETE", `/api/admin/backups/${fileName}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/backups"] });
      toast({
        title: "Berhasil",
        description: "File backup berhasil dihapus",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  const handleDownload = (fileName: string) => {
    window.open(`/api/admin/backups/${fileName}/download`, '_blank');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Backup Database</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola backup data sistem. Sistem juga melakukan backup otomatis 5 kali sehari (00:00, 06:00, 12:00, 18:00, 23:59).
          </p>
        </div>
        <Button 
          onClick={() => createMutation.mutate()} 
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Database className="mr-2 h-4 w-4" />
          )}
          Buat Backup Sekarang
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar File Backup</CardTitle>
          <CardDescription>File backup disimpan berekstensi .sql dengan format nama (backup-db-[tgl].sql)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !backups || backups.length === 0 ? (
            <div className="text-center py-12 text-gray-500 flex flex-col items-center">
              <Database className="h-12 w-12 text-gray-300 mb-4" />
              <p>Belum ada file backup.</p>
            </div>
          ) : (
            <div className="relative overflow-x-auto rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-500">Nama File</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Tanggal Dibuat</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Ukuran</th>
                    <th className="px-6 py-3 font-medium text-gray-500 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {backups.map((file) => (
                    <tr key={file.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-700">{file.name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {format(new Date(file.createdAt), "d MMMM yyyy HH:mm:ss", { locale: id })}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatBytes(file.size)}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(file.name)}
                          title="Download Backup"
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              title="Hapus Backup"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus file backup ini?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tindakan ini tidak dapat dibatalkan. File <strong>{file.name}</strong> akan dihapus selamanya.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteMutation.mutate(file.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Informasi Fitur Backup</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sistem akan otomatis membackup database setiap jam <strong>00:00, 06:00, 12:00, 18:00, dan 23:59</strong>.</li>
            <li>Anda dapat membackup manual secara real-time kapan saja dengan tombol "Buat Backup Sekarang".</li>
            <li>File hasil backup bisa langsung didownload dan disimpan dengan aman.</li>
            <li>Backup yang diunduh dapat digunakan untuk memulihkan database secara utuh.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
