import type { ThemeChoice } from "./storage";
import type { State } from "./types";

export interface Screen {
  state: State;
  today: string;
  corrupt: boolean;
  rerender: () => void;
  replaceState: (state: State) => void;
  setTheme: (theme: ThemeChoice) => void;
  theme: () => ThemeChoice;
}

export interface View {
  title: string;
  node: HTMLElement;
  cleanup?: () => void;
  focus?: () => void;
}
