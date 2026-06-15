import { cn } from '@/lib/utils';
import { MonoLabel, StatValue } from '@/components/ui/typography';

type OrdstormStatBoxProps = {
  label: string;
  value: number;
  highlight?: boolean;
};

export function OrdstormStatBox({ label, value, highlight = false }: OrdstormStatBoxProps) {
  return (
    <div
      className={cn(
        'rounded-none border border-print-ink/20 bg-print-bg p-3 shadow-none sm:p-5',
        highlight && 'border-print-green bg-print-green text-white',
      )}
    >
      <StatValue className={highlight ? 'text-white' : undefined}>{value}</StatValue>
      <MonoLabel
        className={cn(
          'mt-1.5 normal-case tracking-normal sm:mt-2',
          highlight ? 'text-white/85' : undefined,
        )}
      >
        {label}
      </MonoLabel>
    </div>
  );
}
