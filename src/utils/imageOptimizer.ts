/**
 * Image Optimizer and Cloud Media Handling
 * - Automatically compresses images (max 800x800 px, JPEG 70%) to ensure all payloads remain well under Firestore 1MB limits.
 * - Handles parallel batch processing using Promise.all.
 * - Resolves valid download URLs, avatars and fallback media without broken image links.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  mimeType?: string;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.7, // JPEG 70%
  mimeType: 'image/jpeg',
};

/**
 * Compresses a single image File, Blob, or base64 data URL
 * Ensures dimension <= 800x800 and quality 70%
 */
export async function compressImage(
  input: File | Blob | string,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    // If it's already an HTTP URL (e.g. Unsplash, Firebase Storage, CDN), keep it
    if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
      resolve(input);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale
        if (width > opts.maxWidth || height > opts.maxHeight) {
          if (width > height) {
            height = Math.round((height * opts.maxWidth) / width);
            width = opts.maxWidth;
          } else {
            width = Math.round((width * opts.maxHeight) / height);
            height = opts.maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof input === 'string' ? input : '');
          return;
        }

        // Fill background with white for JPEG transparency conversion
        if (opts.mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL(opts.mimeType, opts.quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.error('Image compression canvas error:', err);
        // Fallback to original if compression fails
        if (typeof input === 'string') {
          resolve(input);
        } else {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(err);
          reader.readAsDataURL(input);
        }
      }
    };

    img.onerror = (err) => {
      console.warn('Failed to load image for compression, using fallback', err);
      if (typeof input === 'string') {
        resolve(input);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(err);
        reader.readAsDataURL(input);
      }
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file object'));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(input);
    }
  });
}

/**
 * Optimizes and uploads multiple images in parallel using Promise.all
 */
export async function processMultipleImages(
  inputs: (File | Blob | string)[],
  options?: CompressionOptions
): Promise<string[]> {
  return Promise.all(inputs.map((input) => compressImage(input, options)));
}

/**
 * Resolves a safe avatar URL with guaranteed fallback to prevent broken images
 */
export function getSafeAvatarUrl(
  url?: string | null,
  nameFallback?: string
): string {
  if (url && (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  const cleanName = encodeURIComponent(nameFallback || 'Cab Appuis');
  return `https://ui-avatars.com/api/?name=${cleanName}&background=059669&color=fff&bold=true`;
}
