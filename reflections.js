// Register reflection component for realtime reflections
AFRAME.registerComponent('reflection', {
  schema: {
    directionalLight: {type: 'selector'},
    probe: {type: 'selector'}
  },

  init: function() {
    this.renderer = this.el.sceneEl.renderer
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer)
    this.pmremGenerator.compileCubemapShader()

    // Create the reflection probe
    const probeGeometry = new THREE.SphereGeometry(0.1, 32, 32)
    const probeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
    this.probe = new THREE.Mesh(probeGeometry, probeMaterial)
    this.probe.visible = false
    this.el.object3D.add(this.probe)

    // Create the cubemap camera
    this.cubeCamera = new THREE.CubeCamera(0.1, 1000, 256)
    this.el.object3D.add(this.cubeCamera)
  },

  tick: function() {
    if (this.data.directionalLight && this.data.probe) {
      // Update the cubemap
      this.cubeCamera.position.copy(this.probe.position)
      this.cubeCamera.update(this.renderer, this.el.sceneEl.object3D)

      // Generate environment map
      const envMap = this.pmremGenerator.fromCubemap(this.cubeCamera.renderTarget.texture).texture

      // Apply to all meshes in the scene
      this.el.sceneEl.object3D.traverse((node) => {
        if (node.isMesh && node.material) {
          node.material.envMap = envMap
          node.material.needsUpdate = true
        }
      })
    }
  }
})
