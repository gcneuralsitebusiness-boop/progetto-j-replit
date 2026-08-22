import { useQueryClient } from "@tanstack/react-query";
import {
  getListCandidatureQueryKey,
  useListCandidature,
  useUpdateCandidatura,
  type Candidatura,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { AdminRetry, AdminStatus } from "./AdminStatus";

type CandidaturaStatus = Candidatura["stato"];

const STATUS_OPTIONS: { value: CandidaturaStatus; label: string }[] = [
  { value: "nuova", label: "Nuova" },
  { value: "letta", label: "Letta" },
  { value: "gestita", label: "Gestita" },
];

function statusLabel(status: CandidaturaStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function CandidatureTab() {
  const queryClient = useQueryClient();
  const { data: items, isLoading, isError, refetch } = useListCandidature({
    query: { queryKey: getListCandidatureQueryKey(), retry: false },
  });
  const updateMutation = useUpdateCandidatura();

  const updateStatus = (id: number, stato: CandidaturaStatus) => {
    updateMutation.mutate(
      { id, data: { stato } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCandidatureQueryKey() });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[28px] font-serif tracking-wider">CANDIDATURE</h2>
        <p className="mt-2 font-sans text-sm text-muted-foreground">
          Richieste di accesso al progetto.
        </p>
      </div>

      {isLoading && (
        <AdminStatus>Caricamento candidature...</AdminStatus>
      )}

      {isError && (
        <div><AdminStatus tone="error">Non è stato possibile caricare le candidature.</AdminStatus><AdminRetry onRetry={() => void refetch()} /></div>
      )}

      {!isLoading && !isError && items?.length === 0 && (
        <div className="border border-border bg-card px-5 py-8">
          <p className="font-sans text-[15px] text-muted-foreground">
            Nessuna candidatura ricevuta.
          </p>
        </div>
      )}

      {!isLoading && !isError && items && items.length > 0 && (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[760px] text-left font-sans text-[13px]">
            <thead className="border-b border-border">
              <tr className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="p-4 font-normal">Data</th>
                <th className="p-4 font-normal">Nome</th>
                <th className="p-4 font-normal">Contatto</th>
                <th className="p-4 font-normal">Progetto</th>
                <th className="p-4 font-normal">Stato</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isUpdating =
                  updateMutation.isPending && updateMutation.variables?.id === item.id;

                return (
                  <tr key={item.id} className="border-b border-border last:border-0 align-top">
                    <td className="whitespace-nowrap p-4 text-muted-foreground">
                      {format(new Date(item.createdAt), "d MMM yyyy HH:mm", { locale: it })}
                    </td>
                    <td className="p-4 text-foreground">{item.nome}</td>
                    <td className="max-w-[180px] break-words p-4 text-foreground">
                      {item.contatto}
                    </td>
                    <td className="max-w-[420px] whitespace-pre-wrap break-words p-4 leading-relaxed text-foreground/80">
                      {item.progetto}
                    </td>
                    <td className="p-4">
                      <label className="sr-only" htmlFor={`candidatura-stato-${item.id}`}>
                        Stato candidatura di {item.nome}
                      </label>
                      <select
                        id={`candidatura-stato-${item.id}`}
                        value={item.stato}
                        disabled={isUpdating}
                        onChange={(event) =>
                          updateStatus(item.id, event.target.value as CandidaturaStatus)
                        }
                        className={`min-w-[116px] bg-[#141414] border p-2 text-[12px] uppercase tracking-wider text-white focus:outline-none focus:border-primary disabled:opacity-50 ${
                          item.stato === "nuova" ? "border-primary" : "border-border"
                        }`}
                        aria-label={`Stato: ${statusLabel(item.stato)}`}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}