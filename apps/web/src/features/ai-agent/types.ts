// Types and interfaces for AI Agent Processor

export interface ProcessingOptions {
  remove_background: boolean;
  identify: boolean;
  grade: boolean;
  enhance: boolean;
  generate_description: boolean;
}

export interface CardPair {
  id: string;
  front: File | null;
  back: File | null;
  name?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  type: 'front' | 'back' | 'unpaired';
  pairId?: string;
}

export interface AgentThought {
  step: string;
  thought: string;
  timestamp: number;
}

export interface ProcessingResult {
  card_index: number;
  steps_completed: string[];
  results: {
    orientation_corrected?: string;
    background_removed?: string;
    identification?: {
      best?: {
        name?: string;
        full_name?: string;
        set?: string;
        number?: string;
        rarity?: string;
        language?: string;
        edition?: string;
      };
      confidence?: number;
      needsManualReview?: boolean;
    };
    grade?: {
      records?: Array<{
        _full_url_card?: string;
        _exact_url_card?: string;
        grades?: {
          corners?: number;
          edges?: number;
          surface?: number;
          centering?: number;
          final?: number;
          condition?: string;
        };
      }>;
    };
    listing_description?: {
      title?: string;
      description?: string;
    };
  };
  errors: string[];
  agent_thoughts: AgentThought[];
}

export interface BatchResults {
  results: ProcessingResult[];
  summary: {
    total_cards: number;
    successful: number;
    failed: number;
    success_rate: string;
    steps_completed: Record<string, number>;
    ready_for_ebay: number;
    needs_manual_review: number;
  };
  thought_log: AgentThought[];
}

export interface CardStatus {
  status: string;
  progress?: number;
}
