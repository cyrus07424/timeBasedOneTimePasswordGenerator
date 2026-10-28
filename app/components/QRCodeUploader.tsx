'use client';

import { useRef } from 'react';
import jsQR from 'jsqr';
import { extractSecretFromUri } from '../utils/totp';

interface QRCodeUploaderProps {
  onSecretExtracted: (secret: string) => void;
  onError: (error: string) => void;
}

export default function QRCodeUploader({ onSecretExtracted, onError }: QRCodeUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('画像ファイルを選択してください');
      return;
    }

    try {
      // Create an image element
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          // Create canvas to get image data
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            onError('画像の処理に失敗しました');
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Decode QR code
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            // Extract secret from otpauth:// URI
            const secret = extractSecretFromUri(code.data);
            if (secret) {
              onSecretExtracted(secret);
              // Clear the file input
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            } else {
              onError('QRコードから秘密キーを抽出できませんでした');
            }
          } else {
            onError('QRコードが見つかりませんでした');
          }
        };

        img.onerror = () => {
          onError('画像の読み込みに失敗しました');
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        onError('ファイルの読み込みに失敗しました');
      };

      reader.readAsDataURL(file);
    } catch (err) {
      onError('QRコードの読み取りに失敗しました');
      console.error(err);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="qr-upload"
      />
      <label
        htmlFor="qr-upload"
        className="inline-block w-full cursor-pointer rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-center text-sm font-semibold text-violet-800 transition hover:bg-violet-100 focus-within:ring-4 focus-within:ring-violet-100"
      >
        QRコード画像をアップロード
      </label>
    </div>
  );
}
