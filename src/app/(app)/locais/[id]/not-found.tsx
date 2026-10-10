import { EmptyState } from "@/components/empty-state";

export default function VenueNotFound() {
  return (
    <EmptyState
      title="Local não encontrado"
      description="Ele pode ainda não ter sido verificado, ou o link está incompleto."
      action={{ href: "/locais", label: "Ver locais" }}
    />
  );
}
