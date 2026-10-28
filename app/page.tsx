import TotpGenerator from './components/TotpGenerator';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 px-4 py-10 sm:py-16">
      <main className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-10">
          <header className="mb-9 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700" aria-hidden="true">
              2FA
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              ワンタイムパスワード生成
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              認証キーから現在有効な6桁のコードを生成します。
            </p>
          </header>
          <TotpGenerator />
        </div>
        <footer className="mt-6 text-center text-xs leading-5 text-slate-500">
          秘密キーはこのブラウザー内で処理されます。共有端末では使用後にキーをクリアしてください。
          <div className="mt-2">
            &copy; 2025{' '}
            <a
              href="https://github.com/cyrus07424"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-600 underline-offset-4 hover:underline"
            >
              cyrus
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
