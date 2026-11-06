import { useCallback, useEffect, useState } from "react";

export type SeasonNumber = 1 | 2;

function readSeason(): SeasonNumber {
  return new URLSearchParams(window.location.search).get("stagione") === "1" ? 1 : 2;
}

export function useSelectedSeason(): [SeasonNumber, (season: SeasonNumber) => void] {
  const [season, setSeason] = useState<SeasonNumber>(readSeason);

  useEffect(() => {
    const sync = () => setSeason(readSeason());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const selectSeason = useCallback((next: SeasonNumber) => {
    const params = new URLSearchParams(window.location.search);
    params.set("stagione", String(next));
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
    setSeason(next);
  }, []);

  return [season, selectSeason];
}
