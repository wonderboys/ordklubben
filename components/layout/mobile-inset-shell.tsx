import { cn } from '@/lib/utils';

type MobileInsetShellProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Compensates for main layout padding on small viewports so content can reach
 * the screen edge. Print Theme is global on `body` — this wrapper does not
 * activate theme, fonts, or raster.
 */
export function MobileInsetShell({ children, className }: MobileInsetShellProps) {
  return <div className={cn('print-shell max-md:pb-6', className)}>{children}</div>;
}
