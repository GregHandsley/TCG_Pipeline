# Components Organization

This folder contains all React components for the AI Agent feature, organized into logical subfolders for easy navigation and maintenance.

## Folder Structure

### 📁 `cards/`
Card-related components for displaying and managing individual cards and card pairs.

- `CardPairComponent.tsx` - Displays a single card pair (front + back)
- `CardStatusIndicator.tsx` - Shows the processing status of a card
- `CardTile.tsx` - Individual card display component
- `CardsGrid.tsx` - Grid layout for multiple cards
- `DrawPile.tsx` - Displays cards in the draw pile

### 📁 `pokemon/`
Pokemon-themed components that provide the Professor Oak interface and styling.

- `PokemonAIActivityPanel.tsx` - Pokemon-themed AI activity display
- `PokemonCardDisplay.tsx` - Main card display with Pokemon styling
- `PokemonEmptyState.tsx` - Empty state with Pokemon theme
- `PokemonErrorState.tsx` - Error state with Pokemon theme
- `PokemonLoadingState.tsx` - Loading state with Pokemon theme
- `PokemonPCInterface.tsx` - Main Pokemon PC interface
- `PokemonProcessingResults.tsx` - Pokemon-themed results display
- `PokemonResearchResults.tsx` - Pokemon-themed research results
- `ProfessorOak.tsx` - Professor Oak character component
- `ProfessorOakDialogue.tsx` - Professor Oak dialogue system

### 📁 `processing/`
Components related to the AI processing workflow and options.

- `ProcessButton.tsx` - Start/stop processing button
- `ProcessingOptions.tsx` - Options for AI processing steps
- `ProcessingResults.tsx` - Display processing results

### 📁 `ui/`
General UI utility components that can be reused across the application.

- `AIActivityPanel.tsx` - General AI activity display
- `Badge.tsx` - Simple badge component
- `ErrorBoundary.tsx` - React error boundary component
- `FileUpload.tsx` - File upload component

## Import Usage

### Import from specific category:
```typescript
import { CardPairComponent, DrawPile } from './components/cards';
import { PokemonCardDisplay, ProfessorOak } from './components/pokemon';
import { ProcessButton, ProcessingOptions } from './components/processing';
import { Badge, ErrorBoundary } from './components/ui';
```

### Import from main index:
```typescript
import { 
  CardPairComponent, 
  PokemonCardDisplay, 
  ProcessButton, 
  Badge 
} from './components';
```

## Benefits

- **Clear organization**: Components are grouped by functionality
- **Easy navigation**: Find components quickly by category
- **Maintainable**: Related components are kept together
- **Scalable**: Easy to add new components to appropriate folders
- **Clean imports**: Use category-specific or main index imports
