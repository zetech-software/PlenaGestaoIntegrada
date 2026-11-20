/** Símbolo padrão da Plena: broto em círculo, verde petróleo com detalhe areia. */
export function PlenaMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Plena">
      <rect width="64" height="64" rx="16" fill="#173E43" />
      <path d="M32 50V30" stroke="#A6DDD0" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 32c0-9 6-15 16-15 0 10-6 15-16 15z" fill="#278D83" />
      <path d="M32 36c0-8-5-13-14-13 0 9 5 13 14 13z" fill="#A6DDD0" />
      <circle cx="47" cy="47" r="4" fill="#D2B47D" />
    </svg>
  );
}
