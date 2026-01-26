'use client';

import { useState, useEffect, useRef } from 'react';
import * as OTPAuth from 'otpauth';
import QRCodeUploader from './QRCodeUploader';
import WebcamQRScanner from './WebcamQRScanner';
import { createTotpConfig } from '../utils/totp';

export default function TotpGenerator() {
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [error, setError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showWebcamScanner, setShowWebcamScanner] = useState(false);
  const currentPeriodRef = useRef(Math.floor(Date.now() / 1000 / 30));

  const generateToken = () => {
    if (!secret) {
      setError('秘密キーを入力してください');
      return;
    }

    try {
      setError('');
      const totp = new OTPAuth.TOTP(createTotpConfig(secret));

      const currentToken = totp.generate();
      setToken(currentToken);
      setIsGenerating(true);
    } catch (err) {
      setError('トークン生成エラー: 秘密キーが無効です');
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isGenerating || !secret) return;

    // Update the current period ref when starting
    currentPeriodRef.current = Math.floor(Date.now() / 1000 / 30);

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const newPeriod = Math.floor(now / 30);
      const remaining = 30 - (now % 30);
      
      setTimeRemaining(remaining);
      
      // Only regenerate token when entering a new 30-second period
      if (newPeriod !== currentPeriodRef.current) {
        try {
          const totp = new OTPAuth.TOTP(createTotpConfig(secret));
          setToken(totp.generate());
          currentPeriodRef.current = newPeriod;
        } catch (err) {
          setError('トークン生成エラー: 秘密キーが無効です');
          console.error(err);
        }
      }
    }, 1000);

    // Initial time remaining calculation
    const now = Math.floor(Date.now() / 1000);
    const remaining = 30 - (now % 30);
    setTimeRemaining(remaining);

    return () => clearInterval(interval);
  }, [isGenerating, secret]);

  useEffect(() => {
    if (!copyFeedback) return;
    
    const timeoutId = setTimeout(() => setCopyFeedback(false), 1000);
    return () => clearTimeout(timeoutId);
  }, [copyFeedback]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSecret(text);
      setError('');
    } catch (err) {
      setError('クリップボードからの読み取りに失敗しました');
      console.error(err);
    }
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopyFeedback(true);
    } catch (err) {
      setError('クリップボードへのコピーに失敗しました');
      console.error(err);
    }
  };

  const handleSecretExtracted = (extractedSecret: string) => {
    setSecret(extractedSecret);
    setError('');
    // Automatically generate token with the extracted secret
    try {
      const totp = new OTPAuth.TOTP(createTotpConfig(extractedSecret));
      const currentToken = totp.generate();
      setToken(currentToken);
      setIsGenerating(true);
    } catch (err) {
      setError('トークン生成エラー: 秘密キーが無効です');
      console.error(err);
    }
  };

  const handleQRError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleOpenWebcamScanner = () => {
    setShowWebcamScanner(true);
    setError('');
  };

  const handleCloseWebcamScanner = () => {
    setShowWebcamScanner(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="secret" className="block text-sm font-medium text-gray-700">
          秘密キー
        </label>
        <div className="flex gap-2">
          <input
            id="secret"
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="秘密キーを入力してください"
          />
          <button
            onClick={handlePasteFromClipboard}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            クリップボードから貼り付け
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 mb-2">
          またはQRコードから読み込む
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <QRCodeUploader 
            onSecretExtracted={handleSecretExtracted}
            onError={handleQRError}
          />
          <button
            onClick={handleOpenWebcamScanner}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            カメラでスキャン
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <button
        onClick={generateToken}
        className="w-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-semibold"
      >
        トークン生成
      </button>

      {isGenerating && token && (
        <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">生成されたトークン</div>
            <div className="text-4xl font-mono font-bold text-gray-800 mb-2 tracking-wider">
              {token}
            </div>
            <div className="text-sm text-gray-500">
              {timeRemaining}秒後に更新
            </div>
          </div>
          <button
            onClick={handleCopyToken}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            {copyFeedback ? 'コピーしました！' : 'クリップボードにコピー'}
          </button>
        </div>
      )}

      {showWebcamScanner && (
        <WebcamQRScanner
          onSecretExtracted={handleSecretExtracted}
          onError={handleQRError}
          onClose={handleCloseWebcamScanner}
        />
      )}
    </div>
  );
}
