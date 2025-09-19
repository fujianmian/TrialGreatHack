// Core application types and interfaces

export interface InputMethod {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

export interface OutputOption {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

export interface LearningMode {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

export interface AISuggestion {
  id: string;
  text: string;
  icon: string;
  applied: boolean;
}


export interface GeneratedContent {
  type: string;
  title: string;
  content: string;
  timestamp: Date;
}

export interface AppState {
  inputMethod: InputMethod;
  outputOption: OutputOption;
  learningMode: LearningMode;
  suggestions: AISuggestion[];
  generatedContent: GeneratedContent | null;
  isLoading: boolean;
}

export type InputMethodType = 'text' | 'upload' | 'url' | 'voice';
export type OutputOptionType = 'notes' | 'video' | 'flashcards' | 'mindmap' | 'quiz' | 'summary';
export type LearningModeType = 'study' | 'exam' | 'quick';

export interface DOMElementCache {
  inputMethods: NodeListOf<Element>;
  outputOptions: NodeListOf<Element>;
  learningModes: NodeListOf<Element>;
  suggestions: NodeListOf<Element>;
  generateBtn: HTMLButtonElement | null;
  preview: HTMLElement | null;
  textarea: HTMLTextAreaElement | null;
}

export interface EventHandlers {
  onInputMethodChange: (method: InputMethod) => void;
  onOutputOptionChange: (option: OutputOption) => void;
  onLearningModeChange: (mode: LearningMode) => void;
  onSuggestionClick: (suggestion: AISuggestion) => void;
  onGenerateClick: () => void;
}
