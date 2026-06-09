export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-primary-500 text-lg">✦</span>
            <span className="font-semibold text-slate-700 text-sm">ShopAI</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} ShopAI. Powered by Gemini AI.
          </p>
        </div>
      </div>
    </footer>
  );
}
