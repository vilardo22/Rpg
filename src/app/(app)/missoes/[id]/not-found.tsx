import { EmptyState } from "@/components/empty-state";

export default function MissionNotFound() {
  return (
    <EmptyState
      title="Missão não encontrada"
      description="Ela pode ter sido apagada, ou o link está incompleto."
      action={{ href: "/missoes", label: "Ver missões" }}
    />
  );
}
