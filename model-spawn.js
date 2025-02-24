AFRAME.registerComponent('model-spawn', {
  init() {
    const {el} = this
    const video = document.querySelectorAll('#video')
    const text = document.querySelector('.already-found-text')
    el.sceneEl.addEventListener('xrimagelost', () => {
      el.object3D.visible = true

      text.style.opacity = '0'

      // Buat model
      const model = document.createElement('a-entity')
      model.setAttribute('visible', false)
      console.log('image spawn')
      this.el.appendChild(model)
    })
  },
})
