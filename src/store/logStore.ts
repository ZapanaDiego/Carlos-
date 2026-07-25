import { create } from 'zustand';
import { ILogEntry } from '../types/log.types';

interface LogState {
  logs: ILogEntry[];
  maxLogs: number;
  addLog: (entry: ILogEntry) => void;
  clearLogs: () => void;
  setMaxLogs: (n: number) => void;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  maxLogs: 5000,
  addLog: (entry) =>
    set((state) => {
      const newLogs = [...state.logs, entry];
      if (newLogs.length > state.maxLogs) {
        return { logs: newLogs.slice(newLogs.length - state.maxLogs) };
      }
      return { logs: newLogs };
    }),
  clearLogs: () => set({ logs: [] }),
  setMaxLogs: (n) => set((state) => {
      let newLogs = state.logs;
      if (state.logs.length > n) {
          newLogs = state.logs.slice(state.logs.length - n);
      }
      return { maxLogs: n, logs: newLogs };
  }),
}));
