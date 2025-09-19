import { 
  AppState, 
  GeneratedContent,
  DOMElementCache,
  InputMethodType,
  OutputOptionType,
  LearningModeType
} from './types/index.js';

export class EduAIApp {
  private state: AppState;
  private elements: DOMElementCache;

  constructor() {
    this.state = this.initializeState();
    this.elements = this.cacheDOMElements();
    this.initializeEventListeners();
    this.updateUI();
  }

  private initializeState(): AppState {
    return {
      inputMethod: {
        id: 'text',
        name: 'Text',
        icon: 'fas fa-font',
        active: true
      },
      outputOption: {
        id: 'notes',
        name: 'Smart Notes',
        icon: 'fas fa-sticky-note',
        active: true
      },
      learningMode: {
        id: 'study',
        name: 'Study Mode',
        icon: 'fas fa-graduation-cap',
        active: true
      },
      suggestions: [
        {
          id: 'simplify',
          text: 'Simplify for beginners',
          icon: 'fas fa-lightbulb',
          applied: false
        },
        {
          id: 'examples',
          text: 'Add real-world examples',
          icon: 'fas fa-lightbulb',
          applied: false
        },
        {
          id: 'chart',
          text: 'Create a comparison chart',
          icon: 'fas fa-lightbulb',
          applied: false
        }
      ],
      generatedContent: null,
      isLoading: false
    };
  }

  private cacheDOMElements(): DOMElementCache {
    return {
      inputMethods: document.querySelectorAll('.input-method'),
      outputOptions: document.querySelectorAll('.output-option'),
      learningModes: document.querySelectorAll('.learning-mode'),
      suggestions: document.querySelectorAll('.suggestion'),
      generateBtn: document.querySelector('.generate-btn button'),
      preview: document.querySelector('.output-preview'),
      textarea: document.querySelector('textarea')
    };
  }

  private initializeEventListeners(): void {
    // Input method selection
    this.elements.inputMethods.forEach((element, index) => {
      element.addEventListener('click', () => {
        this.handleInputMethodChange(index);
      });
    });

    // Output option selection
    this.elements.outputOptions.forEach((element, index) => {
      element.addEventListener('click', () => {
        this.handleOutputOptionChange(index);
      });
    });

    // Learning mode selection
    this.elements.learningModes.forEach((element, index) => {
      element.addEventListener('click', () => {
        this.handleLearningModeChange(index);
      });
    });

    // AI suggestions
    this.elements.suggestions.forEach((element, index) => {
      element.addEventListener('click', () => {
        this.handleSuggestionClick(index);
      });
    });

    // Generate button
    if (this.elements.generateBtn) {
      this.elements.generateBtn.addEventListener('click', () => {
        this.handleGenerateClick();
      });
    }
  }

  private handleInputMethodChange(index: number): void {
    const methods: InputMethodType[] = ['text', 'upload', 'url', 'voice'];
    const methodNames = ['Text', 'Upload', 'URL', 'Voice'];
    const methodIcons = [
      'fas fa-font',
      'fas fa-file-upload',
      'fas fa-link',
      'fas fa-microphone'
    ];

    this.state.inputMethod = {
      id: methods[index]!,
      name: methodNames[index]!,
      icon: methodIcons[index]!,
      active: true
    };

    this.updateInputMethodUI();
  }

  private handleOutputOptionChange(index: number): void {
    const options: OutputOptionType[] = ['notes', 'video', 'flashcards', 'mindmap', 'quiz', 'summary'];
    const optionNames = ['Smart Notes', 'Explainer Video', 'Flashcards', 'Mind Map', 'Practice Quiz', 'Visual Summary'];
    const optionIcons = [
      'fas fa-sticky-note',
      'fas fa-video',
      'fas fa-layer-group',
      'fas fa-brain',
      'fas fa-question-circle',
      'fas fa-chart-bar'
    ];

    this.state.outputOption = {
      id: options[index]!,
      name: optionNames[index]!,
      icon: optionIcons[index]!,
      active: true
    };

    this.updateOutputOptionUI();
  }

  private handleLearningModeChange(index: number): void {
    const modes: LearningModeType[] = ['study', 'exam', 'quick'];
    const modeNames = ['Study Mode', 'Exam Prep', 'Quick Learn'];
    const modeIcons = [
      'fas fa-graduation-cap',
      'fas fa-trophy',
      'fas fa-lightbulb'
    ];

    this.state.learningMode = {
      id: modes[index]!,
      name: modeNames[index]!,
      icon: modeIcons[index]!,
      active: true
    };

    this.updateLearningModeUI();
  }

  private handleSuggestionClick(index: number): void {
    const suggestion = this.state.suggestions[index];
    if (suggestion) {
      suggestion.applied = !suggestion.applied;
      this.showNotification(`Applied AI suggestion: ${suggestion.text}`);
    }
  }

  private async handleGenerateClick(): Promise<void> {
    if (this.state.isLoading) return;

    this.state.isLoading = true;
    this.updateGenerateButton();

    // Show loading state
    this.showLoadingState();

    try {
      // Simulate API call
      await this.simulateContentGeneration();
      
      // Generate content
      const content = this.generateSampleContent();
      this.state.generatedContent = content;
      
      // Show generated content
      this.showGeneratedContent(content);
    } catch (error) {
      console.error('Error generating content:', error);
      this.showError('Failed to generate content. Please try again.');
    } finally {
      this.state.isLoading = false;
      this.updateGenerateButton();
    }
  }


  private updateUI(): void {
    this.updateInputMethodUI();
    this.updateOutputOptionUI();
    this.updateLearningModeUI();
  }

  private updateInputMethodUI(): void {
    this.elements.inputMethods.forEach((element, index) => {
      const isActive = this.state.inputMethod.name === element.querySelector('p')?.textContent;
      element.classList.toggle('active', isActive);
    });
  }

  private updateOutputOptionUI(): void {
    this.elements.outputOptions.forEach((element, index) => {
      const isActive = this.state.outputOption.name === element.querySelector('p')?.textContent;
      element.classList.toggle('active', isActive);
    });
  }

  private updateLearningModeUI(): void {
    this.elements.learningModes.forEach((element, index) => {
      const isActive = this.state.learningMode.name === element.querySelector('p')?.textContent;
      element.classList.toggle('active', isActive);
    });
  }


  private updateGenerateButton(): void {
    if (this.elements.generateBtn) {
      this.elements.generateBtn.disabled = this.state.isLoading;
      this.elements.generateBtn.innerHTML = this.state.isLoading 
        ? '<i class="fas fa-spinner fa-spin"></i> Generating...'
        : '<i class="fas fa-bolt"></i> Generate Learning Materials';
    }
  }

  private showLoadingState(): void {
    if (this.elements.preview) {
      this.elements.preview.innerHTML = `
        <h2 class="section-title"><i class="fas fa-eye"></i> Preview</h2>
        <p><strong>Creating ${this.state.outputOption.name}...</strong></p>
        <p>Our AI is analyzing your content and creating personalized ${this.state.outputOption.name.toLowerCase()}.</p>
        <div style="text-align: center; margin: 20px 0;">
          <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: var(--primary);"></i>
        </div>
      `;
    }
  }

  private showGeneratedContent(content: GeneratedContent): void {
    if (this.elements.preview) {
      this.elements.preview.innerHTML = `
        <h2 class="section-title"><i class="fas fa-eye"></i> Preview</h2>
        <p><strong>Generated ${this.state.outputOption.name}:</strong></p>
        <div style="background: white; padding: 20px; border-radius: 10px; margin-top: 15px; border: 1px solid var(--border);">
          <h3 style="color: var(--primary); margin-bottom: 15px;">${content.title}</h3>
          <p><strong>Key Concept:</strong> ${content.content}</p>
          <p><strong>Learning Mode:</strong> ${this.state.learningMode.name}</p>
          <p><strong>Generated:</strong> ${content.timestamp.toLocaleTimeString()}</p>
        </div>
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-outline"><i class="fas fa-download"></i> Download</button>
          <button class="btn btn-primary"><i class="fas fa-share-alt"></i> Share</button>
          <button class="btn btn-outline"><i class="fas fa-redo"></i> Regenerate</button>
        </div>
      `;
    }
  }

  private showError(message: string): void {
    if (this.elements.preview) {
      this.elements.preview.innerHTML = `
        <h2 class="section-title"><i class="fas fa-exclamation-triangle"></i> Error</h2>
        <p style="color: var(--accent);">${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
      `;
    }
  }

  private showNotification(message: string): void {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--primary);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  private async simulateContentGeneration(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  }

  private generateSampleContent(): GeneratedContent {
    return {
      type: this.state.outputOption.id,
      title: 'Quantum Computing',
      content: 'Quantum computing uses qubits that can represent multiple states simultaneously, enabling faster computation for certain problems. Unlike classical bits (0 or 1), qubits can be in a state of 0, 1, or both (superposition), allowing parallel computations.',
      timestamp: new Date()
    };
  }

  // Public methods for external access
  public getState(): AppState {
    return { ...this.state };
  }

  public updateInputContent(content: string): void {
    if (this.elements.textarea) {
      this.elements.textarea.value = content;
    }
  }

  public destroy(): void {
    // Cleanup any resources if needed
  }
}
