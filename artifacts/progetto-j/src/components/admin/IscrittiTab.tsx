import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type Iscritto = {
  id: number;
  email: string;
  createdAt: string;
};

export function IscrittiTab() {
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

  const exportCsv = () => {
    const csv = [
      "email,data",
      ...items.map((item) => `"${item.email.replaceAll('"', '""')}","${item.createdAt}"`),
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
      {items.length === 0 ? (
        <p className="text-muted-foreground font-sans text-[15px]">Nessun iscritto.</p>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full text-left font-sans text-[13px]">
            <thead className="border-b border-border">
              <tr className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="p-4 font-normal">Email</th>
                <th className="p-4 font-normal">Data</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="p-4 text-foreground">{item.email}</td>
                  <td className="p-4 whitespace-nowrap text-muted-foreground">
                    {format(new Date(item.createdAt), "d MMM yyyy HH:mm", { locale: it })}
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