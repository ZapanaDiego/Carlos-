import { create } from 'zustand';

export type TopicCategory = 
  | 'arrays' 
  | 'stacks-queues' 
  | 'linked-lists' 
  | 'trees' 
  | 'graphs' 
  | 'hash-tables';

export interface TopicItem {
  id: string;
  label: string;
  category: TopicCategory;
  description: string;
}

export interface ConceptualState {
  activeTopicId: string;
  expandedCategories: Record<TopicCategory, boolean>;
  setActiveTopic: (topicId: string) => void;
  toggleCategory: (category: TopicCategory) => void;
}

export const useConceptualStore = create<ConceptualState>((set) => ({
  activeTopicId: 'vectors',
  expandedCategories: {
    'arrays': true,
    'stacks-queues': false,
    'linked-lists': false,
    'trees': false,
    'graphs': false,
    'hash-tables': false,
  },
  
  setActiveTopic: (topicId: string) => 
    set(() => ({ activeTopicId: topicId })),
    
  toggleCategory: (category: TopicCategory) =>
    set((state) => ({
      expandedCategories: {
        ...state.expandedCategories,
        [category]: !state.expandedCategories[category]
      }
    })),
}));
