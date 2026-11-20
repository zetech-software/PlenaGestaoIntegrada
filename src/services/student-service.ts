import { demoDate, demoStudents } from "@/data/demo-students";
import type { Student, StudentDraft, StudentService } from "@/types/student";
// Replace this adapter with a FastAPI REST implementation when the backend is ready.
// Each instance owns its data; no storage, network writes or module-level mutable state.
export class DemoStudentService implements StudentService {
  private students: Student[] = demoStudents.map((student) => ({ ...student }));
  list() {
    return this.students.map((student) => ({ ...student }));
  }
  get(id: string) {
    const student = this.students.find((item) => item.id === id);
    return student ? { ...student } : undefined;
  }
  create(draft: StudentDraft) {
    const student: Student = {
      ...draft,
      id: `demo-${this.students.length + 1}`,
      tone: "green",
      startDate: demoDate,
    };
    this.students = [student, ...this.students];
    return { ...student };
  }
}
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function filterStudents(students: Student[], query: string, status: string, school: string) {
  return students.filter(
    (student) =>
      normalize(`${student.name} ${student.guardian} ${student.school}`).includes(
        normalize(query.trim()),
      ) &&
      (status === "Todos" || student.status === status) &&
      (school === "Todas" || student.school === school),
  );
}
export function studentAge(birthDate: string) {
  const birth = new Date(`${birthDate}T12:00:00Z`);
  const reference = new Date(`${demoDate}T12:00:00Z`);
  let age = reference.getUTCFullYear() - birth.getUTCFullYear();
  if (
    reference.getUTCMonth() < birth.getUTCMonth() ||
    (reference.getUTCMonth() === birth.getUTCMonth() && reference.getUTCDate() < birth.getUTCDate())
  )
    age--;
  return age;
}
export function formatDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}
