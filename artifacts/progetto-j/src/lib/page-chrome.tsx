import { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from "react";

const PageChrome = createContext<{ navigationHidden: boolean; setNavigationHidden: Dispatch<SetStateAction<boolean>> }>({
  navigationHidden: false,
  setNavigationHidden: () => {},
});

export function PageChromeProvider({ children }: { children: ReactNode }) {
  const [navigationHidden, setNavigationHidden] = useState(false);
  return <PageChrome.Provider value={{ navigationHidden, setNavigationHidden }}>{children}</PageChrome.Provider>;
}

export function usePageChrome() {
  return useContext(PageChrome);
}
