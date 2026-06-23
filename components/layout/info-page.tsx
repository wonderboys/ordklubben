import { MobileInsetShell } from '@/components/layout/mobile-inset-shell';
import { BodyText, MonoLabel, PageTitle } from '@/components/ui/typography';

type InfoPageProps = {
  label: string;
  title: string;
  intro: string;
  paragraphs: string[];
};

export function InfoPage({ label, title, intro, paragraphs }: InfoPageProps) {
  return (
    <MobileInsetShell>
      <section className="flex max-w-3xl flex-1 flex-col gap-5 py-2 sm:gap-6 sm:py-8">
        <div className="space-y-2">
          <MonoLabel muted>{label}</MonoLabel>
          <div className="space-y-3">
            <PageTitle>{title}</PageTitle>
            <BodyText>{intro}</BodyText>
          </div>
        </div>

        <div className="space-y-4">
          {paragraphs.map((paragraph) => (
            <BodyText key={paragraph} variant="card">
              {paragraph}
            </BodyText>
          ))}
        </div>
      </section>
    </MobileInsetShell>
  );
}
