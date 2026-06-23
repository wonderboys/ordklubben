import { InfoPage } from '@/components/layout/info-page';

export default function AboutPage() {
  return (
    <InfoPage
      label="Ordklubben"
      title="Om Ordklubben"
      intro="Ordklubben bygger små svenska ordspel med fokus på rytm, läsbarhet och spelglädje i mobilen."
      paragraphs={[
        'Målet är att göra ordspel som känns lugna, smarta och tydliga snarare än överlastade. Vi börjar litet och försöker göra varje spel lite vassare innan vi breddar.',
        'Just nu formas klubben kring dagliga format, snabba rundor och ett växande bibliotek av svenska ord, ledtrådar och spelidéer.',
      ]}
    />
  );
}
