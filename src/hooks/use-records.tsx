import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useState, type ReactNode } from "react";
import { DemoRecordService } from "@/services/record-service";
import { demoAnamneses, demoRecords } from "@/data/demo-records";
import type {
  Anamnesis,
  AnamnesisDraft,
  RecordDraft,
  RecordEntry,
  RecordService,
} from "@/types/record";
interface Ctx {
  anamneses: Anamnesis[];
  records: RecordEntry[];
  isLoading: boolean;
  error: Error | null;
  saveAnamnesis: (d: AnamnesisDraft) => Promise<Anamnesis>;
  addRecord: (d: RecordDraft) => Promise<RecordEntry>;
}
const RecordContext = createContext<Ctx | null>(null);
const anamnesesKey = ["anamneses"] as const;
const recordsKey = ["records"] as const;
export function RecordsProvider({ children }: { children: ReactNode }) {
  const [service] = useState<RecordService>(
    () => new DemoRecordService(demoAnamneses, demoRecords),
  );
  const queryClient = useQueryClient();
  const anamneses = useQuery({ queryKey: anamnesesKey, queryFn: () => service.listAnamneses() });
  const records = useQuery({ queryKey: recordsKey, queryFn: () => service.listRecords() });
  const saveAnamnesis = useMutation({
    mutationFn: (d: AnamnesisDraft) => service.saveAnamnesis(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: anamnesesKey }),
  });
  const addRecord = useMutation({
    mutationFn: (d: RecordDraft) => service.addRecord(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recordsKey }),
  });
  const value: Ctx = {
    anamneses: anamneses.data ?? [],
    records: records.data ?? [],
    isLoading: anamneses.isPending || records.isPending,
    error: anamneses.error ?? records.error,
    saveAnamnesis: (d) => saveAnamnesis.mutateAsync(d),
    addRecord: (d) => addRecord.mutateAsync(d),
  };
  return <RecordContext.Provider value={value}>{children}</RecordContext.Provider>;
}
export function useRecords() {
  const ctx = useContext(RecordContext);
  if (!ctx) throw new Error("RecordsProvider is required");
  return ctx;
}
