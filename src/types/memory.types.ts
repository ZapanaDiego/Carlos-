/**
 * Memory Canvas Data Contracts
 * Defines the structured snapshot of the C++ program's memory state.
 */

export interface Variable {
  name: string;
  type: string;
  value: string;
  address: string;
  isPointer: boolean;
  pointsTo?: string;
  isArray?: boolean;
  length?: number;
  members?: Variable[];
}

export interface Frame {
  id: string;
  functionName: string;
  variables: Variable[];
  line: number;
  parentId?: string;
}

export interface MemoryBlock {
  address: string;
  type: string;
  size: number;
  content: string;
  isArray: boolean;
  isFreed: boolean;
  references: string[];
  createdAt: number;
  semanticHint?: string;
}

export interface Snapshot {
  step: number;
  line: number;
  functionName: string;
  frames: Frame[];
  heap: MemoryBlock[];
  output?: string;
  error?: string;
}
