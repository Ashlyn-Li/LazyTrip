type ItineraryNotesProps = {
  notes: string[];
};

export const ItineraryNotes = ({ notes }: ItineraryNotesProps) => (
  <section className="rounded-[2rem] border border-coral-100 bg-coral-100/50 p-5">
    <h2 className="text-xl font-bold text-ink">Important notes</h2>
    <ul className="mt-3 space-y-2 text-sm font-medium text-slate-700">
      {notes.map((note) => (
        <li key={note}>- {note}</li>
      ))}
    </ul>
  </section>
);
