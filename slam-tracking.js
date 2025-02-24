AFRAME.registerComponent('slam-tracking', {
  schema: {
    targetName: { type: 'string' }
  },
  
  init() {
    this.found = false;
    this.el.sceneEl.addEventListener('xrimagefound', this.onImageFound.bind(this));
    this.el.sceneEl.addEventListener('xrimagelost', this.onImageLost.bind(this));
  },

  onImageFound(evt) {
    if (evt.detail.name === this.data.targetName && !this.found) {
      this.found = true;
      const position = evt.detail.position;
      this.el.setAttribute('position', position);
      this.el.setAttribute('visible', true);
      console.log('SLAM Tracking: Image found, star is now visible at', position);
    }
  },

  onImageLost(evt) {
    if (evt.detail.name === this.data.targetName) {
      console.log('SLAM Tracking: Image lost, but star remains visible.');
      // The star remains visible, no action needed here
    }
  }
}); 