import Image from 'next/image';

export function LogoIcon({ size = 28 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image
        src="/nursearena.png"
        alt="NurseArena"
        fill
        className="object-contain p-1"
      />
    </div>
  );
}
