const configTargetsComponent = {
  schema: {
    targets: {type: 'array', default: ['']},
  },
  ensureImageTargetsConfigured() {
    if (this.configured || !this.configOk) {
      return
    }
    // console.log(`Scanning for targets: ${JSON.stringify(this.data.targets)}`)
    XR8.XrController.configure({imageTargets: this.data.targets})
    this.configured = true
  },
  init() {
    this.configured = false
    this.configOk = false
    this.el.sceneEl.addEventListener('realityready', () => {
      this.configOk = true
      this.ensureImageTargetsConfigured()
    })
  },
  update() {
    this.configured = false
    this.ensureImageTargetsConfigured()
  },
}

const panicComponent = {
  init() {
    const targets = ['macaw', 'owl', 'peacock', 'pelican', 'pigeon', 'puffin', 'cardinal', 'penguin', 'ostrich', 'roadrunner', 'toucan', 'blue-jay', 'rooster']
    const found = []
    let active

    const remainder = targets.length % 10

    let i = 0
    const updateImageTargets = () => {
      const notFound = targets.filter(target => !found.includes(target))

      if (i + 10 + remainder === targets.length) {
        notFound.splice(i, remainder)
      } else {
        notFound.splice(i, 10)
      }

      notFound.splice(10 - found.length)

      active = [...found, ...notFound]

      this.el.sceneEl.setAttribute('config-targets', `targets: ${active}`)

      if (i + remainder === targets.length) {
        i = 0
      } else {
        i += 10
      }
    }

    this.el.addEventListener('xrimagefound', ({detail}) => {
      found.push(detail.name)
    })

    this.el.addEventListener('xrimagelost', ({detail}) => {
      found.splice(found.indexOf(detail.name), 1)
    })

    // update active image targets every second
    setInterval(updateImageTargets, 1000)
  },
}

export {configTargetsComponent, panicComponent}
