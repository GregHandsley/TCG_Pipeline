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

export interface ImageUpdate {
  pair_index: number;
  card_type: 'front' | 'back';
  image_type: 'orientation_corrected' | 'background_removed' | 'enhanced';
  image_base64: string;
  step: string;
}

export interface AgentThought {
  step: string;
  thought: string;
  timestamp: number;
  image_update?: ImageUpdate;
  pair_index?: number;  // Metadata for identified cards
  card_name?: string;   // Metadata for identified cards
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

export interface ImageUpdateData {
  cardType: 'front' | 'back';
  imageBase64: string;
  imageType: 'orientation_corrected' | 'background_removed' | 'enhanced';
}

export interface CardStatus {
  status: string;
  progress?: number;
  imageUpdate?: ImageUpdateData;
  identifiedName?: string;
}
