const dayMonth = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;
export interface ReminderInput {
  guardian: string;
  studentFirstName: string;
  date: string;
  start: string;
}
/** Mensagem curta, sem dados clínicos: só nome, data e horário. */
export function reminderMessage(input: ReminderInput) {
  const first = input.guardian.trim().split(/\s+/)[0] ?? "";
  return `Olá${first ? `, ${first}` : ""}! Confirmamos o atendimento de ${input.studentFirstName} em ${dayMonth(input.date)} às ${input.start}? Responda SIM para confirmar. Plena Gestão Integrada.`;
}
/** Link de WhatsApp (Brasil) ou null quando o telefone não parece válido. */
export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const national = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  if (national.length < 10 || national.length > 11) return null;
  if (/^(\d)\1+$/.test(national.slice(2))) return null; // ex.: 00000-0000
  return `https://wa.me/55${national}?text=${encodeURIComponent(message)}`;
}
