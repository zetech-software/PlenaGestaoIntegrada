import { useEffect, useState } from "react";

const KEY = "plena-clinic";
const EVENT = "plena-clinic-change";

export interface ClinicInfo {
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  responsible: string;
}
export const emptyClinic: ClinicInfo = {
  name: "",
  document: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  responsible: "",
};

/** Dados cadastrais da clínica, guardados neste navegador. */
export function useClinic() {
  const [clinic, setClinic] = useState<ClinicInfo>(emptyClinic);
  useEffect(() => {
    const read = () => {
      try {
        const raw = window.localStorage.getItem(KEY);
        setClinic(raw ? { ...emptyClinic, ...JSON.parse(raw) } : emptyClinic);
      } catch {
        setClinic(emptyClinic);
      }
    };
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);
  const save = (value: ClinicInfo) => {
    window.localStorage.setItem(KEY, JSON.stringify(value));
    window.dispatchEvent(new Event(EVENT));
  };
  return { clinic, save };
}
