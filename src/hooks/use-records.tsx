import { createContext, useContext, useState, type ReactNode } from "react";
import { DemoRecordService } from "@/services/record-service";
import { demoAnamneses, demoRecords } from "@/data/demo-records";
import type { Anamnesis, AnamnesisDraft, RecordDraft, RecordEntry } from "@/types/record";
interface Ctx {
  anamneses: Anamnesis[];
  records: RecordEntry[];
  saveAnamnesis: (d: AnamnesisDraft) => Anamnesis;
  addRecord: (d: RecordDraft) => RecordEntry;
}
const RecordContext = createContext<Ctx | null>(null);
export function RecordsProvider({ children }: { children: ReactNode }) {
  const [service] = useState(() => new DemoRecordService(demoAnamneses, demoRecords));
  const [anamneses, setAnamneses] = useState(() => service.listAnamneses());
  const [records, setRecords] = useState(() => service.listRecords());
  const value: Ctx = {
    anamneses,
    records,
    saveAnamnesis(d) { const r = service.saveAnamnesis(d); setAnamneses(service.listAnamneses()); return r; },
    addRecord(d) { const r = service.addRecord(d); setRecords(service.listRecords()); return r; },
  };
  return <RecordContext.Provider value={value}>{children}</RecordContext.Provider>;
}
export function useRecords() {
  const ctx = useContext(RecordContext);
  if (!ctx) throw new Error("RecordsProvider is required");
  return ctx;
}
