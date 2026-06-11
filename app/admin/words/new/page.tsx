import {
  AdminLinkButton,
  AdminPage,
  AdminPanel,
  FeedbackMessage,
  Field,
  SelectInput,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/admin/admin-ui";
import { createWord } from "@/lib/content/actions";
import { CONTENT_STATUSES, STATUS_LABELS } from "@/lib/content/constants";

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

export default async function NewWordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <AdminPage
      title="Nytt ord"
      description="Ordet normaliseras automatiskt för sökning och dublettkontroll."
      actions={
        <AdminLinkButton href="/admin/words" variant="secondary">
          Tillbaka
        </AdminLinkButton>
      }
    >
      <FeedbackMessage error={params.error} success={params.success} />

      <AdminPanel title="Ordformulär">
        <form action={createWord} className="grid max-w-xl gap-3">
          <Field label="Ord" htmlFor="answer" hint="Exempel: SNÖ-SKOTTNING">
            <TextInput id="answer" name="answer" required />
          </Field>

          <Field label="Status" htmlFor="status">
            <SelectInput id="status" name="status" defaultValue="DRAFT">
              {CONTENT_STATUSES.filter((value) => value !== "ARCHIVED").map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Anteckningar" htmlFor="notes">
            <TextArea id="notes" name="notes" className="min-h-20" />
          </Field>

          <p className="text-xs text-print-muted">
            Källa sätts automatiskt till manuell. Språk default är svenska.
          </p>

          <div>
            <SubmitButton variant="primary">Spara ord</SubmitButton>
          </div>
        </form>
      </AdminPanel>
    </AdminPage>
  );
}
