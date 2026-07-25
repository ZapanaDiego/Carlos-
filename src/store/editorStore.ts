import { create } from 'zustand';

interface EditorState {
  code: string;
  currentLine: number;
  setCode: (code: string) => void;
  setCurrentLine: (line: number) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  code: 'int main() {\n  return 0;\n}',
  currentLine: 1, // 1-indexed for display usually, but mock says 1
  setCode: (code) => set({ code }),
  setCurrentLine: (currentLine) => set({ currentLine }),
}));
