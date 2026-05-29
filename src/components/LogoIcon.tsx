import Image from 'next/image';

export function LogoIcon({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/nursearena.png"
      alt="NurseArena"
      width={size}
      height={size}
      className="object-contain"
    />
  );
}
