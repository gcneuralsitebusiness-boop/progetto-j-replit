import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useMemo, useState } from "react";

type Iscritto = {
  id: number;
  email: string;
  createdAt: string;
};

export function IscrittiTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [feedback, setFeedback] = useState<string | null>(null);
  const {
    data: items = [],
    isLoading: loading,
    isError,
  } = useQuery<Iscritto[]>({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}api/subscribers`, { credentials: "include" });
      if (!response.ok) throw new Error("Errore nel caricamento");
      return response.json() as Promise<Iscritto[]>;
    },
  });
  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${import.meta.env.BASE_URL}api/subscribers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Rimozione non riuscita");
      return body;
    },
    onSuccess: () => {
      setFeedback("Iscritto rimosso correttamente.");
      queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
    },
    onError: (error: Error) => setFeedback(error.message),
  });

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((item) => !query || item.email.toLowerCase().includes(query))
      .sort((a, b) => {
        const difference = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortOrder === "newest" ? -difference : difference;
      });
  }, [items, search, sortOrder]);

  const exportCsv = () => {
    const csv = [
      "email,data",
      ...visibleItems.map((item) => `"${item.email.replaceAll('"', '""')}","${item.createdAt}"`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `progetto-j-iscritti-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return <p className="text-muted-foreground font-sans animate-pulse">Caricamento...</p>;
  if (isError) return <p className="text-primary font-sans">Errore nel caricamento</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[28px] font-serif tracking-wider">ISCRITTI</h2>
          <p className="mt-2 font-sans text-sm text-muted-foreground">{items.length} email raccolte</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={items.length === 0}
          className="border border-border px-5 py-2.5 font-sans text-[12px] uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
        >
          Esporta CSV
        </button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca per email..."
          aria-label="Cerca iscritti per email"
          className="min-w-0 flex-1 border border-border bg-[#141414] px-4 py-2.5 text-[13px] font-sans text-foreground focus:border-primary focus:outline-none"
        />
        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
          aria-label="Ordina iscritti"
          className="border border-border bg-[#141414] px-4 py-2.5 text-[13px] font-sans text-foreground"
        >
          <option value="newest">Più recenti</option>
          <option value="oldest">Più vecchi</option>
        </select>
      </div>
      {feedback && (
        <p className="border border-primary/40 bg-primary/10 px-4 py-3 text-[13px] font-sans text-primary" role="status">
          {feedback}
        </p>
      )}
      {items.length === 0 ? (
        <p className="text-muted-foreground font-sans text-[15px]">Nessun iscritto.</p>
      ) : visibleItems.length === 0 ? (
        <p className="text-muted-foreground font-sans text-[15px]">Nessun iscritto corrisponde alla ricerca.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full text-left font-sans text-[13px]">
            <thead className="border-b border-border">
              <tr className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="p-4 font-normal">Email</th>
                <th className="p-4 font-normal">Data</th>
                <th className="p-4 font-normal">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-foreground">{item.email}</td>
                  <td className="p-4 whitespace-nowrap text-muted-foreground">
                    {format(new Date(item.createdAt), "d MMM yyyy HH:mm", { locale: it })}
                  </td>
                  <td className="p-4">
                    <button
                      type="button"
                      disabled={removeMutation.isPending && removeMutation.variables === item.id}
                      onClick={() => {
                        if (window.confirm(`Rimuovere ${item.email} dagli iscritti?`)) {
                          removeMutation.mutate(item.id);
                        }
                      }}
                      className="text-[11px] uppercase tracking-wider text-primary hover:text-primary/80 disabled:opacity-40"
                    >
                      Rimuovi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}