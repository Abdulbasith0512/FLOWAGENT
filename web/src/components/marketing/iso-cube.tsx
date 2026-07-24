export function IsoCube({ className }: { className?: string }) {
  const s = 72;
  const h = s / 2;
  return (
    <div className={className} aria-hidden style={{ perspective: 800 }}>
      <div
        className="animate-[bob_6s_ease-in-out_infinite]"
        style={{
          width: s,
          height: s,
          transformStyle: "preserve-3d",
          transform: "rotateX(-28deg) rotateY(-38deg)",
        }}
      >
        <Face size={s} transform={`translateZ(${h}px)`} tone="var(--color-accent)" shade={1} />
        <Face size={s} transform={`rotateY(90deg) translateZ(${h}px)`} tone="var(--color-accent)" shade={0.78} />
        <Face size={s} transform={`rotateX(90deg) translateZ(${h}px)`} tone="var(--color-accent)" shade={0.55} />
      </div>
      <style>{`@keyframes bob{0%,100%{transform:rotateX(-28deg) rotateY(-38deg) translateY(0)}50%{transform:rotateX(-28deg) rotateY(-38deg) translateY(-10px)}}`}</style>
    </div>
  );
}

function Face({
  size,
  transform,
  tone,
  shade,
}: {
  size: number;
  transform: string;
  tone: string;
  shade: number;
}) {
  return (
    <div
      className="absolute left-0 top-0 border border-black/10"
      style={{
        width: size,
        height: size,
        transform,
        background: tone,
        filter: `brightness(${shade})`,
      }}
    />
  );
}
