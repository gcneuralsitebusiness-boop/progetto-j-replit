export function Cross({ className = "" }: { className?: string }) {
  return (
    <div data-public-icon className={`text-iron text-[24px] leading-none opacity-80 ${className}`}>
      &#x2629;
    </div>
  );
}
