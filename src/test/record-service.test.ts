import { describe, expect, it } from "vitest";
import { DemoRecordService, recordsFor, validateRecord } from "@/services/record-service";
import { demoAnamneses, demoRecords } from "@/data/demo-records";
import type { RecordDraft } from "@/types/record";
const draft: RecordDraft = { studentId: "3", date: "2026-11-20", specialty: "Psicologia", objectives: "Objetivo de teste", activities: "", observations: "Observação de teste", evolution: "Estável", nextSteps: "" };
describe("anamnese e prontuário", () => {
  it("anamnese exige queixa principal", () => {
    const s = new DemoRecordService([], []);
    expect(() => s.saveAnamnesis({ ...demoAnamneses[0]!, mainComplaint: "curta" })).toThrow();
  });
  it("salvar anamnese substitui a anterior do mesmo aluno", () => {
    const s = new DemoRecordService(demoAnamneses, []);
    s.saveAnamnesis({ ...demoAnamneses[0]!, mainComplaint: "Nova queixa principal registrada" });
    expect(s.listAnamneses().filter((a) => a.studentId === "1")).toHaveLength(1);
  });
  it("não aceita sessão com data futura", () => {
    expect(validateRecord({ ...draft, date: "2026-11-21" })).not.toBeNull();
    expect(validateRecord(draft)).toBeNull();
  });
  it("prontuário lista o registro mais recente primeiro e não persiste", () => {
    expect(recordsFor(demoRecords, "1")[0]?.id).toBe("r2");
    const s = new DemoRecordService(demoAnamneses, demoRecords);
    s.addRecord(draft);
    expect(new DemoRecordService(demoAnamneses, demoRecords).listRecords()).toHaveLength(demoRecords.length);
  });
});
