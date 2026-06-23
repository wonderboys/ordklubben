import { InfoPage } from '@/components/layout/info-page';

export default function PrivacyPage() {
  return (
    <InfoPage
      label="Integritet"
      title="Integritet"
      intro="Ordklubben är byggt för att fungera lätt och lokalt, med så lite insamling som möjligt."
      paragraphs={[
        'I den nuvarande versionen sparas främst lokal speldata i din egen webbläsare, till exempel framsteg och enkel statistik. Det gör att upplevelsen fungerar utan konto.',
        'Den här sidan är en placeholder tills den slutliga integritetstexten är på plats. När datainsamling eller externa tjänster förändras ska informationen här uppdateras tydligt.',
      ]}
    />
  );
}
