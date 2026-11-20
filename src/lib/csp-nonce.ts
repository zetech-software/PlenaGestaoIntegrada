import { newNonce } from "@/lib/security-headers";

// Um nonce por requisição. O server.ts o cria e devolve no cabeçalho; o roteador o lê para marcar os
// scripts que injeta. A chave é o próprio objeto Request, então requisições simultâneas não se misturam.
const nonces = new WeakMap<Request, string>();
export function nonceFor(request: Request): string {
  let nonce = nonces.get(request);
  if (!nonce) {
    nonce = newNonce();
    nonces.set(request, nonce);
  }
  return nonce;
}
