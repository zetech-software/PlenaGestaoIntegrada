import { useEffect, useState } from "react";

const KEY = "plena-logo";
const EVENT = "plena-logo-change";

/** Logo personalizada da clínica, guardada neste navegador. */
export function useBrandLogo() {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setLogo(window.localStorage.getItem(KEY));
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);
  const save = (value: string | null) => {
    if (value) window.localStorage.setItem(KEY, value);
    else window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  };
  return { logo, save };
}
