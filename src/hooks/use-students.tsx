import { createContext, useContext, useState, type ReactNode } from "react";
import { DemoStudentService } from "@/services/student-service";
import { useAuth } from "@/hooks/use-auth";
import { canSeeStudent } from "@/services/permissions";
import type { Student, StudentDraft, StudentService } from "@/types/student";
interface StudentContextValue {
  students: Student[];
  addStudent: (draft: StudentDraft) => Student;
}
const StudentContext = createContext<StudentContextValue | null>(null);
export function StudentsProvider({ children }: { children: ReactNode }) {
  const [service] = useState<StudentService>(() => new DemoStudentService());
  const [students, setStudents] = useState(() => service.list());
  const { role, assigned } = useAuth();
  const visible = students.filter((s) => canSeeStudent(role, assigned, s.id) || s.id.startsWith("demo-"));
  function addStudent(draft: StudentDraft) {
    const student = service.create(draft);
    setStudents(service.list());
    return student;
  }
  return (
    <StudentContext.Provider value={{ students: visible, addStudent }}>{children}</StudentContext.Provider>
  );
}
export function useStudents() {
  const context = useContext(StudentContext);
  if (!context) throw new Error("StudentsProvider is required");
  return context;
}
