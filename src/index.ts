import { EduAIApp } from './app.js';

// Initialize the application when DOM is ready
function initializeApp(): void {
  try {
    const app = new EduAIApp();
    
    // Make app globally accessible for debugging
    (window as any).eduAIApp = app;
    
    console.log('EduAI Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize EduAI Application:', error);
    
    // Show error message to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff6b6b;
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      z-index: 10000;
    `;
    errorDiv.innerHTML = `
      <h3>Application Error</h3>
      <p>Failed to initialize the application. Please refresh the page.</p>
      <button onclick="location.reload()" style="
        background: white;
        color: #ff6b6b;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
      ">Refresh Page</button>
    `;
    document.body.appendChild(errorDiv);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  if ((window as any).eduAIApp) {
    (window as any).eduAIApp.destroy();
  }
});

// Export for potential module usage
export { EduAIApp };
