import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { AdminRetry, AdminStatus } from "./AdminStatus";

type Contatto = {
  id: number;
  nome: string;
  email: string;
  tipo: string;
  messaggio: string;
  createdAt: string;
  stato: "nuova" | "letta" | "gestita";
};

const STATUS_LABELS: Record<Contatto["stato"], string> = {
  nuova: "Nuova",
  letta: "Letta",
  gestita: "Gestita",
};

function statusLabel(status: Contatto["stato"]): string {
  return STATUS_LABELS[status];
}

export function ContattiTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Contatto["stato"] | "tutti">("tutti");
  const [feedback, setFeedback] = useState<string | null>(null);
  const {
    data: items = [],
    isLoading: loading,
    isError,
    refetch,
  } = useQuery<Contatto[]>({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}api/contacts`, { credentials: "include" });
      if (!response.ok) throw new Error("Errore nel caricamento");
      return response.json() as Promise<Contatto[]>;
    },
  });
  const updateStatus = useMutation({
    mutationFn: async ({ id, stato }: { id: number; stato: Contatto["stato"] }) => {
      const response = await fetch(`${import.meta.env.BASE_URL}api/contacts/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stato }),
      });
      if (!response.ok) throw new Error("Aggiornamento non riuscito");
      return response.json() as Promise<Contatto>;
    },
    onSuccess: (_data, variables) => {
      setFeedback(`Richiesta segnata come ${statusLabel(variables.stato).toLowerCase()}.`);
      queryClient.invalidateQueries({ queryKey: ["admin-contacts"] });
    },
    onError: () => setFeedback("Non è stato possibile aggiornare lo stato."),
  });

  if (loading) {
    return <AdminStatus>Caricamento contatti...</AdminStatus>;
  }

  if (isError) {
    return <div><AdminStatus tone="error">Non è stato possibile caricare i contatti.</AdminStatus><AdminRetry onRetry={() => void refetch()} /></div>;
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground font-sans">Nessun messaggio ricevuto.</p>;
  }

  const visibleItems = items.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [item.nome, item.email, item.tipo, item.messaggio].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (filter === "tutti" || item.stato === filter);
  });

  return (
    <div className="space-y-6">
      <h2 className="text-[28px] font-serif tracking-wider">MESSAGGI RICEVUTI</h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cerca nome, email o messaggio..." className="min-w-0 flex-1 bg-[#141414] border border-border px-4 py-2.5 text-[13px] font-sans text-foreground focus:outline-none focus:border-primary" />
        <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="bg-[#141414] border border-border px-4 py-2.5 text-[13px] font-sans text-foreground">
          <option value="tutti">Tutti gli stati</option>
          <option value="nuova">Nuove</option>
          <option value="letta">Lette</option>
          <option value="gestita">Gestite</option>
        </select>
      </div>
      {feedback && <p className="border border-primary/40 bg-primary/10 px-4 py-3 text-[13px] font-sans text-primary" role="status">{feedback}</p>}
      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-left font-sans text-[13px]">
          <thead className="border-b border-border">
            <tr className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <th className="p-4 font-normal">Data</th>
              <th className="p-4 font-normal">Nome</th>
              <th className="p-4 font-normal">Email</th>
              <th className="p-4 font-normal">Tipo</th>
              <th className="p-4 font-normal">Messaggio</th>
              <th className="p-4 font-normal">Stato</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="p-4 text-muted-foreground whitespace-nowrap">
                  {format(new Date(item.createdAt), "d MMM yyyy HH:mm", { locale: it })}
                </td>
                <td className="p-4 text-foreground">{item.nome}</td>
                <td className="p-4 text-foreground">{item.email}</td>
                <td className="p-4 text-foreground uppercase">{item.tipo}</td>
                <td className="p-4 text-foreground/80 max-w-md break-words">{item.messaggio}</td>
                <td className="p-4">
                  <label className="sr-only" htmlFor={`contatto-stato-${item.id}`}>Stato di {item.nome}</label>
                  <select
                    id={`contatto-stato-${item.id}`}
                    value={item.stato}
                    disabled={updateStatus.isPending && updateStatus.variables?.id === item.id}
                    onChange={(event) => updateStatus.mutate({ id: item.id, stato: event.target.value as Contatto["stato"] })}
                    className="bg-[#141414] border border-border px-2 py-1.5 text-[11px] uppercase tracking-wider text-foreground"
                  >
                    <option value="nuova">Nuova</option>
                    <option value="letta">Letta</option>
                    <option value="gestita">Gestita</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visibleItems.length === 0 && (
        <p className="text-muted-foreground font-sans text-[13px]">Nessun messaggio corrisponde ai filtri.</p>
      )}
    </div>
  );
}
