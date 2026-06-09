
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-primary-50 via-white to-surface-100 px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-primary-200">404</p>
        <h1 className="text-2xl font-bold text-slate-800 mt-4">Page not found</h1>
        <p className="text-slate-500 text-sm mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          Back to home
        </Link>
      </div>
    </div>
  );
}
