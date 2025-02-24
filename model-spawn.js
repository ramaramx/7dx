AFRAME.registerComponent('model-spawn', {
  init() {
    const {el} = this
    const video = document.querySelectorAll('#video')
    el.sceneEl.addEventListener('xrimagelost', () => {
      el.object3D.visible = true

      // Buat model
      const model = document.createElement('a-entity')
      model.setAttribute('geometry', 'primitive: plane; width: 1; height: 1')
      model.setAttribute('material', 'shader: flat; src: #starTexture1')
      model.setAttribute('position', '0 0 0.2')
      model.setAttribute('visible', false)
      console.log('image spawn')
      this.el.appendChild(model)
    })
  },
})
