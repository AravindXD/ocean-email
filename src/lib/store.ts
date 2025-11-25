import { create } from 'zustand';
import { Email, Prompt, Draft } from '@/types';

interface AppState {
  emails: Email[];
  prompts: Prompt[];
  drafts: Draft[];
  selectedEmailId: string | null;
  filterCategory: string | null;
  isLoading: boolean;
  error: string | null;
  
  setEmails: (emails: Email[]) => void;
  setPrompts: (prompts: Prompt[]) => void;
  setDrafts: (drafts: Draft[]) => void;
  setSelectedEmailId: (id: string | null) => void;
  setFilterCategory: (category: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  updateEmail: (id: string, updates: Partial<Email>) => void;
}

import { persist } from 'zustand/middleware';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      emails: [],
      prompts: [],
      drafts: [],
      selectedEmailId: null,
      filterCategory: null,
      isLoading: false,
      error: null,

      setEmails: (emails) => set({ emails }),
      setPrompts: (prompts) => set({ prompts }),
      setDrafts: (drafts) => set({ drafts }),
      setSelectedEmailId: (selectedEmailId) => set({ selectedEmailId }),
      setFilterCategory: (filterCategory) => set({ filterCategory }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      updateEmail: (id, updates) => set((state) => ({
        emails: state.emails.map((email) => 
          email.id === id ? { ...email, ...updates } : email
        ),
      })),
    }),
    {
      name: 'ocean-email-storage',
      partialize: (state) => ({ 
        emails: state.emails, 
        prompts: state.prompts, 
        drafts: state.drafts 
      }),
    }
  )
);
