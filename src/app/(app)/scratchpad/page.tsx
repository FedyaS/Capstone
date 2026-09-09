import { ScratchpadEditor } from '@/components/ScratchpadEditor';
import { loadNotes } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ScratchpadPage() {
  const notes = await loadNotes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-100">
          AI scratchpad
        </h1>
        <p className="mt-1.5 font-mono text-xs text-slate-600">data/ai_notes.md</p>
      </div>

      <ScratchpadEditor initial={notes} />
    </div>
  );
}
