'use client';

import { useState, useEffect, useRef } from 'react';
import * as OTPAuth from 'otpauth';
import QRCodeUploader from './QRCodeUploader';
import WebcamQRScanner from './WebcamQRScanner';
import { createTotpConfig, normalizeSecretInput } from '../utils/totp';

export default function TotpGenerator() {
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isSecretVisible, setIsSecretVisible] = useState(false);
  const [showWebcamScanner, setShowWebcamScanner] = useState(false);
  const secretInputRef = useRef<HTMLInputElement>(null);
  const currentPeriodRef = useRef(Math.floor(Date.now() / 1000 / 30));

  const generateToken = () => {
    const normalizedSecret = normalizeSecretInput(secret);
    if (!normalizedSecret) {
      setError('秘密キーを入力してください');
      return;
    }

    try {
      setError('');
      setStatusMessage('');
      setSecret(normalizedSecret);
      const totp = new OTPAuth.TOTP(createTotpConfig(normalizedSecret));

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
    setError('');
    setStatusMessage('');

    try {
      if (!navigator.clipboard?.readText) {
        throw new Error('Clipboard API is unavailable');
      }

      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setStatusMessage('クリップボードが空です。秘密キーをコピーしてから貼り付けてください。');
        secretInputRef.current?.focus();
        return;
      }
      setSecret(normalizeSecretInput(text));
      setStatusMessage('クリップボードから貼り付けました。');
    } catch {
      secretInputRef.current?.focus();
      setStatusMessage('入力欄にフォーカスしました。Ctrl+V（Macは⌘V）で貼り付けてください。');
    }
  };

  const handleSecretPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    setSecret(normalizeSecretInput(event.clipboardData.getData('text')));
    setError('');
    setStatusMessage('貼り付けました。');
  };

  const handleSecretChange = (value: string) => {
    setSecret(value);
    setError('');
    setStatusMessage('');
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopyFeedback(true);
      setStatusMessage('トークンをコピーしました。');
    } catch (err) {
      setError('クリップボードへのコピーに失敗しました');
      console.error(err);
    }
  };

  const handleSecretExtracted = (extractedSecret: string) => {
    const normalizedSecret = normalizeSecretInput(extractedSecret);
    setSecret(normalizedSecret);
    setError('');
    setStatusMessage('');
    // Automatically generate token with the extracted secret
    try {
      const totp = new OTPAuth.TOTP(createTotpConfig(normalizedSecret));
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
    <div className="space-y-7">
      <section className="space-y-3">
        <div>
          <label htmlFor="secret" className="block text-sm font-semibold text-slate-800">
            秘密キー
          </label>
          <p className="mt-1 text-sm text-slate-500">
            認証アプリに表示されたキー、または otpauth:// URI を入力できます。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <input
              ref={secretInputRef}
              id="secret"
              type={isSecretVisible ? 'text' : 'password'}
              value={secret}
              onChange={(e) => handleSecretChange(e.target.value)}
              onPaste={handleSecretPaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter') generateToken();
              }}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="secret-help"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-24 font-mono text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="例: JBSWY3DPEHPK3PXP"
            />
            <button
              type="button"
              onClick={() => setIsSecretVisible((visible) => !visible)}
              className="absolute inset-y-0 right-2 my-auto h-9 rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={isSecretVisible ? '秘密キーを隠す' : '秘密キーを表示'}
            >
              {isSecretVisible ? '隠す' : '表示'}
            </button>
          </div>
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:shrink-0"
          >
            貼り付け
          </button>
          {secret && (
            <button
              type="button"
              onClick={() => {
                setSecret('');
                setStatusMessage('');
                setError('');
                setIsGenerating(false);
                setToken('');
              }}
              className="rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:shrink-0"
            >
              クリア
            </button>
          )}
        </div>
        <p id="secret-help" className="text-xs leading-5 text-slate-500">
          貼り付けボタンで読み取れない場合は、入力欄を選択して Ctrl+V（Macは⌘V）をお使いください。
        </p>
      </section>

      <section className="space-y-3">
        <div className="text-sm font-semibold text-slate-800">
          QRコードから設定
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <QRCodeUploader 
            onSecretExtracted={handleSecretExtracted}
            onError={handleQRError}
          />
          <button
            type="button"
            onClick={handleOpenWebcamScanner}
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
          >
            カメラでスキャン
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {!error && statusMessage && (
        <div role="status" aria-live="polite" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {statusMessage}
        </div>
      )}

      <button
        type="button"
        onClick={generateToken}
        className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
      >
        {isGenerating ? 'トークンを更新' : 'トークンを生成'}
      </button>

      {isGenerating && token && (
        <section aria-label="生成されたワンタイムパスワード" className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
          <div className="text-center">
            <div className="mb-3 text-sm font-semibold text-slate-600">ワンタイムパスワード</div>
            <div aria-live="polite" aria-atomic="true" className="mb-3 break-all font-mono text-4xl font-bold tracking-[0.2em] text-slate-900 sm:text-5xl">
              {token}
            </div>
            <div className="text-sm text-slate-500">
              残り <span className="font-semibold tabular-nums text-slate-700">{timeRemaining}秒</span>
            </div>
            <div
              className="mx-auto mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-label="トークンの有効時間"
              aria-valuemin={0}
              aria-valuemax={30}
              aria-valuenow={timeRemaining}
            >
              <div
                className="h-full rounded-full bg-blue-500 transition-[width] duration-1000"
                style={{ width: `${(timeRemaining / 30) * 100}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyToken}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
          >
            {copyFeedback ? 'コピーしました' : 'トークンをコピー'}
          </button>
        </section>
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
