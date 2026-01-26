'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { extractSecretFromUri } from '../utils/totp';

interface WebcamQRScannerProps {
  onSecretExtracted: (secret: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export default function WebcamQRScanner({ onSecretExtracted, onError, onClose }: WebcamQRScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(true);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const captureAndScan = useCallback(() => {
    const webcam = webcamRef.current;
    if (!webcam) return;

    const imageSrc = webcam.getScreenshot();
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        setIsScanning(false);
        const secret = extractSecretFromUri(code.data);
        if (secret) {
          onSecretExtracted(secret);
          onClose();
        } else {
          onError('QRコードから秘密キーを抽出できませんでした');
        }
      }
    };

    img.src = imageSrc;
  }, [onSecretExtracted, onError, onClose]);

  useEffect(() => {
    if (!isScanning) return;

    scanIntervalRef.current = setInterval(() => {
      captureAndScan();
    }, 1000); // Scan every 1000ms (reduced from 500ms for better performance)

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isScanning, captureAndScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">QRコードをスキャン</h2>
          <p className="text-sm text-gray-600">
            カメラにQRコードをかざしてください
          </p>
        </div>
        
        <div className="mb-4 rounded-lg overflow-hidden bg-gray-900">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full"
            videoConstraints={{
              facingMode: { ideal: 'environment' }, // Prefer rear camera with fallback
            }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
