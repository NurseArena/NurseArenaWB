export function LogoIcon({ size = 28 }: { size?: number }) {
  return (
    <img
      src="/nursearena.png"
      alt="NurseArena"
      style={{ width: size, height: size, objectFit: 'cover' }}
    />
  );
}
