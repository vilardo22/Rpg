import { EmptyState } from "@/components/empty-state";

export default function ProfileNotFound() {
  return (
    <EmptyState
      title="Perfil não encontrado"
      description="O link pode estar incompleto, ou a conta foi excluída."
      action={{ href: "/missoes", label: "Ver missões" }}
    />
  );
}
