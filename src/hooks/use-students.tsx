import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useState, type ReactNode } from "react";
import { DemoStudentService } from "@/services/student-service";
import { useAuth } from "@/hooks/use-auth";
import { canSeeStudent } from "@/services/permissions";
import type { Student, StudentDraft, StudentService } from "@/types/student";
interface StudentContextValue {
  students: Student[];
  isLoading: boolean;
  error: Error | null;
  addStudent: (draft: StudentDraft) => Promise<Student>;
}
const StudentContext = createContext<StudentContextValue | null>(null);
const studentsKey = ["students"] as const;
export function StudentsProvider({ children }: { children: ReactNode }) {
  const [service] = useState<StudentService>(() => new DemoStudentService());
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: studentsKey, queryFn: () => service.list() });
  const create = useMutation({
    mutationFn: (draft: StudentDraft) => service.create(draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: studentsKey }),
  });
  const { role, assigned } = useAuth();
  const visible = (query.data ?? []).filter(
    (s) => canSeeStudent(role, assigned, s.id) || s.id.startsWith("demo-"),
  );
  return (
    <StudentContext.Provider
      value={{
        students: visible,
        isLoading: query.isPending,
        error: query.error,
        addStudent: (draft) => create.mutateAsync(draft),
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}
export function useStudents() {
  const context = useContext(StudentContext);
  if (!context) throw new Error("StudentsProvider is required");
  return context;
}
