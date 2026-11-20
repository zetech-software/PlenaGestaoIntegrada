/** Itens da assinatura automática a partir do plano, vagas e ciclo (puro, testável). */
export function subscriptionItems(tierCode: string, seats: number, includedSeats: number, annual: boolean) {
  const cycle = annual ? "yearly" : "monthly";
  const items = [{ priceId: `${tierCode}_${cycle}`, quantity: 1 }];
  const extra = Math.max(0, seats - includedSeats);
  if (tierCode === "multidisciplinar" && extra > 0) items.push({ priceId: `vaga_extra_${cycle}`, quantity: extra });
  return items;
}
