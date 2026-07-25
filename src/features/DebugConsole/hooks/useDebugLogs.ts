import { useState, useMemo } from 'react';
import { useLogStore } from '../../../store/logStore';
import { LogLevel } from '../../../types/log.types';

export const useDebugLogs = () => {
  const logs = useLogStore((state) => state.logs);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'ALL'>('ALL');
  
  const filteredLogs = useMemo(() => {
      if (filterLevel === 'ALL') return logs;
      
      const levelHierarchy: Record<LogLevel, number> = {
          TRACE: 0,
          DEBUG: 1,
          INFO: 2,
          WARN: 3,
          ERROR: 4,
          FATAL: 5
      };
      
      const targetWeight = levelHierarchy[filterLevel];
      
      return logs.filter(log => levelHierarchy[log.level] >= targetWeight);
  }, [logs, filterLevel]);

  const stats = useMemo(() => {
      const counts: Record<string, number> = {
          ALL: logs.length,
          TRACE: 0,
          DEBUG: 0,
          INFO: 0,
          WARN: 0,
          ERROR: 0,
          FATAL: 0
      };
      logs.forEach(log => {
          counts[log.level] = (counts[log.level] || 0) + 1;
      });
      return counts;
  }, [logs]);

  return {
    logs: filteredLogs,
    filterLevel,
    setFilterLevel,
    stats,
    clearLogs: useLogStore.getState().clearLogs
  };
};
