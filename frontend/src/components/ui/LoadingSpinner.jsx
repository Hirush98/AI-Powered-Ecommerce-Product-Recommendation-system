import clsx from 'clsx';

const sizeMap = {
  sm:  'h-4 w-4 border-2',
  md:  'h-8 w-8 border-2',
  lg:  'h-12 w-12 border-[3px]',
  xl:  'h-16 w-16 border-4',
};

export default function LoadingSpinner({ size = 'md', className, fullPage = false }) {
  const spinner = (
    <div
      className={clsx(
        'rounded-full border-primary-200 border-t-primary-500 animate-spin',
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {spinner}
      </div>
    );
  }

  return spinner;
}
