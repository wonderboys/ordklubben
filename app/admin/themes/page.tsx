import Link from 'next/link';
import {
  AdminPage,
  AdminPanel,
  DatabaseNotice,
  FeedbackMessage,
  Field,
  SubmitButton,
  Table,
  TextArea,
  TextInput,
} from '@/components/admin/admin-ui';
import { createTheme } from '@/lib/content/actions';
import { getPrisma, isDatabaseConfigured } from '@/lib/db/prisma';

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

export default async function ThemesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Teman">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();
  const themes = await prisma.theme.findMany({
    include: {
      _count: {
        select: { words: true },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
  });

  return (
    <AdminPage title="Teman" description="Tematiska samlingar för att strukturera ordbanken.">
      <FeedbackMessage error={params.error} success={params.success} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <AdminPanel title="Temalista">
          <Table headers={['Tema', 'Antal ord', 'Uppdaterad']}>
            {themes.map((theme) => (
              <tr key={theme.id} className="border-b border-print-ink/10 align-top">
                <td className="font-medium text-print-ink">
                  <Link
                    href={`/admin/themes/${theme.slug}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {theme.name}
                  </Link>
                  {theme.description?.trim() ? (
                    <p className="mt-0.5 text-xs font-normal text-print-muted">
                      {theme.description.trim()}
                    </p>
                  ) : null}
                </td>
                <td>{theme._count.words}</td>
                <td className="text-print-muted">{theme.updatedAt.toLocaleDateString('sv-SE')}</td>
              </tr>
            ))}
          </Table>
          {themes.length === 0 ? (
            <p className="mt-3 text-sm text-print-muted">Inga teman ännu.</p>
          ) : null}
        </AdminPanel>

        <AdminPanel title="Skapa tema">
          <form action={createTheme} className="grid gap-3">
            <Field label="Namn" htmlFor="name">
              <TextInput id="name" name="name" required />
            </Field>
            <Field label="Slug" htmlFor="slug" hint="Lämna tomt för auto-generering.">
              <TextInput id="slug" name="slug" placeholder="t.ex. natur-och-vader" />
            </Field>
            <Field label="Beskrivning" htmlFor="description">
              <TextArea id="description" name="description" className="min-h-20" />
            </Field>
            <div>
              <SubmitButton variant="primary">Skapa tema</SubmitButton>
            </div>
          </form>
        </AdminPanel>
      </div>
    </AdminPage>
  );
}
