export const SectionLabel = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-5 h-px bg-accent-ink" />
    <span className="text-accent-ink font-sans font-semibold text-[0.6875rem] tracking-[0.12em] uppercase">
      {text}
    </span>
  </div>
);
