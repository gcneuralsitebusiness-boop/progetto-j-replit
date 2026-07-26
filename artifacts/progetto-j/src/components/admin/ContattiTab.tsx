import { useEffect, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type Contatto = {
  id: number;
  nome: string;
  email: string;
  tipo: string;
  messaggio: string;
  createdAt: string;
};

export function ContattiTab() {
  const [items, setItems] = useState<Contatto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/contacts`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Errore nel caricamento");
        return res.json() as Promise<Contatto[]>;
      })
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Errore");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-muted-foreground font-sans animate-pulse">Caricamento...</p>;
  }

  if (error) {
    return <p className="text-primary font-sans">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground font-sans">Nessun messaggio ricevuto.</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-[28px] font-serif tracking-wider">MESSAGGI RICEVUTI</h2>
      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-left font-sans text-[13px]">
          <thead className="border-b border-border">
            <tr className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <th className="p-4 font-normal">Data</th>
              <th className="p-4 font-normal">Nome</th>
              <th className="p-4 font-normal">Email</th>
              <th className="p-4 font-normal">Tipo</th>
              <th className="p-4 font-normal">Messaggio</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="p-4 text-muted-foreground whitespace-nowrap">
                  {format(new Date(item.createdAt), "d MMM yyyy HH:mm", { locale: it })}
                </td>
                <td className="p-4 text-foreground">{item.nome}</td>
                <td className="p-4 text-foreground">{item.email}</td>
                <td className="p-4 text-foreground uppercase">{item.tipo}</td>
                <td className="p-4 text-foreground/80 max-w-md break-words">{item.messaggio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
