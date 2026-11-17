// Business Empire: RichMan - Application Entry Point

// Global Engine Instance
window.game = new GameEngine();

// Auto-initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.game.init();
});
