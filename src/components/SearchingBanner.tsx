export function SearchingBanner({ text = "Daha fazla yer arıyorum…" }: { text?: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full bg-accent-soft px-4 py-2.5 text-[13px] font-medium text-accent" role="status">
      <span className="relative flex size-2.5">
        <span className="absolute inset-0 rounded-full bg-accent [animation:lr-pulse_1.4s_ease-out_infinite]" />
        <span className="relative size-2.5 rounded-full bg-accent" />
      </span>
      {text}
    </div>
  );
}
