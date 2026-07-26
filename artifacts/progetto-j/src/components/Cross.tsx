export function Cross({ className = "" }: { className?: string }) {
  return (
    <div className={`text-primary text-[24px] leading-none opacity-80 ${className}`}>
      &#x2629;
    </div>
  );
}
