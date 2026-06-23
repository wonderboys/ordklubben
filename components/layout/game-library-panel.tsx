import { GameLibraryTile } from '@/components/games/game-library-tile';
import { MonoLabel, SectionTitle } from '@/components/ui/typography';
import { menuGames } from '@/lib/games/registry';
import { cn } from '@/lib/utils';

type GameLibraryPanelProps = {
  id: string;
  open: boolean;
  onClose: () => void;
};

export function GameLibraryPanel({ id, open, onClose }: GameLibraryPanelProps) {
  return (
    <nav
      id={id}
      aria-hidden={!open}
      aria-label="Spelbibliotek"
      className={cn(
        'absolute inset-x-0 top-[47px] z-50 border-b border-print-ink/10 bg-print-bg shadow-[0_12px_40px_rgba(0,0,0,0.06)]',
        !open && 'hidden',
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="max-h-[calc(100vh-7rem)] space-y-8 overflow-y-auto">
          <section className="space-y-4">
            <div className="space-y-1">
              <MonoLabel muted>Spelbibliotek</MonoLabel>
              <SectionTitle>Välj spel</SectionTitle>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
              {menuGames.map((game) => (
                <li key={game.id}>
                  <GameLibraryTile game={game} onNavigate={onClose} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </nav>
  );
}
