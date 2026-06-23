import { InfoPage } from '@/components/layout/info-page';

export default function PersonalDataPolicyPage() {
  return (
    <InfoPage
      label="Policy"
      title="Personuppgiftspolicy"
      intro="Här kommer Ordklubbens fullständiga personuppgiftspolicy att samlas när den publika versionen är redo."
      paragraphs={[
        'Tills vidare fungerar sidan som en enkel platshållare. Den ska senare beskriva vilka personuppgifter som behandlas, varför de behövs och hur länge de sparas.',
        'När konton, supportflöden eller andra personkopplade funktioner införs bör den här texten uppdateras samtidigt som funktionerna lanseras.',
      ]}
    />
  );
}
