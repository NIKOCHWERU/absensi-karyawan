import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Compresses an image file using Canvas.
 * Returns a Blob that can be appended to FormData.
 */
export async function compressImage(
  file: File, 
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<Blob | File> {
  const { maxWidth = 1280, maxHeight = 1280, quality = 0.7 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('canvas-2d' as any) as CanvasRenderingContext2D;
        if (!ctx) return reject(new Error("Could not get canvas context"));
        
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
    };
    reader.onerror = () => reject(new Error("Failed to read file for compression"));
  });
}
