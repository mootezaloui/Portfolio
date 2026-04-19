export function TwinAvatar() {
  return (
    <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-full border border-border bg-background text-sm font-semibold">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, var(--avatar-glow-a), transparent 55%), radial-gradient(circle at 80% 75%, var(--avatar-glow-b), transparent 55%)",
        }}
      />
      <span className="relative z-10">TA</span>
    </div>
  );
}
