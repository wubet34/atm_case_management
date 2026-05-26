// Create a simple notification sound using Web Audio API
class NotificationSound {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
  }

  init() {
    if (!this.audioContext && window.AudioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  play() {
    if (!this.isEnabled) return;
    
    try {
      this.init();
      
      if (!this.audioContext) return;
      
      // Resume audio context if suspended (browser policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = 880; // A5 note
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.5);
      oscillator.stop(this.audioContext.currentTime + 0.5);
      
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }
}

export default new NotificationSound();