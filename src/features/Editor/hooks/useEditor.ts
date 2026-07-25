import { useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../../../store/editorStore';
import { loggerService } from '../../../services/LoggerService';

export const useEditor = () => {
  const storeCode = useEditorStore((state) => state.code);
  const setStoreCode = useEditorStore((state) => state.setCode);
  const currentLine = useEditorStore((state) => state.currentLine);

  const [localCode, setLocalCode] = useState(storeCode);

  // Sync from store to local if it changes externally
  useEffect(() => {
    setLocalCode(storeCode);
  }, [storeCode]);

  // Debounced log & store sync
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localCode !== storeCode) {
        setStoreCode(localCode);
        loggerService.sendLog('DEBUG', 'Código modificado', 'frontend.editor', {
          char_count: localCode.length
        });
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [localCode, storeCode, setStoreCode]);

  const handleChange = useCallback((newCode: string) => {
    setLocalCode(newCode);
  }, []);

  return {
    code: localCode,
    currentLine,
    handleChange
  };
};
