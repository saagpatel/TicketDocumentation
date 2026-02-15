import { create } from 'zustand';
import type { Template } from '../lib/types';

interface TemplateState {
  templates: Template[];
  selectedTemplate: string | null;
  setTemplates: (templates: Template[]) => void;
  setSelectedTemplate: (id: string | null) => void;
}

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: [],
  selectedTemplate: null,

  setTemplates: (templates) => {
    set({ templates });
  },

  setSelectedTemplate: (id) => {
    set({ selectedTemplate: id });
  },
}));
