import { create } from 'zustand';

interface SimulationState {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  speed: number;
  setStep: (step: number) => void;
  setSpeed: (speed: number) => void;
  incrementStep: (by?: number) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  isRunning: false,
  currentStep: 0,
  totalSteps: 100, // mock total steps
  speed: 1, // 0.25, 0.5, 1, 2, 4
  setStep: (step) => set({ currentStep: step }),
  setSpeed: (speed) => set({ speed }),
  incrementStep: (by = 1) => set((state) => ({ currentStep: state.currentStep + by })),
}));
