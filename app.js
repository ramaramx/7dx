// Initialize found targets tracking with localStorage
const STORAGE_KEY = "visitBritainFoundTargets";
const ALL_TARGETS = [
  "vb-target-01",
  "vb-target-02",
  "vb-target-03",
  "vb-target-04",
  "vb-target-05",
  "vb-target-06",
];

// Register custom geometry for video frame
AFRAME.registerGeometry("custom", {
  schema: {},
  init: function (data) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(data.vertices);
    const indices = new Uint16Array(data.faces);

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    this.geometry = geometry;
  },
});

// Cache button elements
let playButton = null;
let collectButton = null;

// Helper functions for button visibility
const showPlayButton = () => {
  if (playButton) {
    playButton.classList.add("visible");
    playButtonVisible = true;
  }
};

const hidePlayButton = () => {
  if (playButton) {
    playButton.classList.remove("visible");
    playButtonVisible = false;
  }
};

const showCollectButton = () => {
  if (collectButton) {
    collectButton.classList.add("visible");
    collectButtonVisible = true;

    // Show and animate 3D item
    if (activeItemModel) {
      activeItemModel.setAttribute("visible", "true");

      // Move forward animation
      activeItemModel.setAttribute("animation__position", {
        property: "position",
        from: "0 0 0.4",
        to: "0 0 1.5",
        dur: 1500,
        easing: "easeOutQuad",
      });

      // Scale up animation
      activeItemModel.setAttribute("animation__scale", {
        property: "scale",
        from: "0 0 0",
        to: "1 1 1",
        dur: 1500,
        easing: "easeOutElastic",
      });

      // Rotate animation
      activeItemModel.setAttribute("animation__rotate", {
        property: "rotation",
        from: "0 0 0",
        to: "0 360 0",
        dur: 3000,
        easing: "linear",
        loop: true,
      });

      // Play swoosh2 sound
      const swooshSound = document.querySelector("#swoosh2-sound-player");
      if (swooshSound && swooshSound.components.sound) {
        swooshSound.components.sound.playSound();
      }
    }
  }
};

const hideCollectButton = () => {
  if (collectButton) {
    collectButton.classList.remove("visible");
    collectButtonVisible = false;
  }
};

// Set up button handlers
document.addEventListener("DOMContentLoaded", () => {
  // Initialize button references
  playButton = document.getElementById("play-button");
  collectButton = document.getElementById("collect-button");

  // Request permissions for device motion and orientation
  if (typeof DeviceMotionEvent.requestPermission === "function") {
    DeviceMotionEvent.requestPermission()
      .then((response) => {
        if (response === "granted") {
          console.log("Device motion permission granted");
          // Initialize SLAM or any other functionality that requires motion
        } else {
          console.error("Device motion permission denied");
        }
      })
      .catch((error) => {
        console.error("Error requesting device motion permission:", error);
      });
  } else {
    console.log("Device motion permission not required");
    // Initialize SLAM or any other functionality that requires motion
  }

  const scene = document.querySelector("a-scene");
  scene.setAttribute("xrweb", "disableWorldTracking: false"); // Enable SLAM

  // Play button handler
  playButton.addEventListener("click", () => {
    if (activeVideo && activeVideoScreen && playButtonVisible) {
      // Hide play button
      hidePlayButton();

      // Keep everything visible and animate star out
      if (activeMarker) {
        activeMarker.el.setAttribute("visible", "true");
        activeMarker.videoScreen.setAttribute("visible", "true");

        // Animate star out smoothly
        if (activeMarker.star) {
          activeMarker.star.setAttribute("visible", "true");
          activeMarker.star.setAttribute("animation__scaleout", {
            property: "scale",
            from: "1.6 1.6 1.6",
            to: "0 0 0",
            dur: 800,
            easing: "easeInQuad",
          });
        }
      }

      if (activeVideo) {
        console.log("Video state before:", {
          paused: activeVideo.paused,
          muted: activeVideo.muted,
          currentTime: activeVideo.currentTime,
          readyState: activeVideo.readyState,
        });

        // Reset video state but keep playsinline
        activeVideo.setAttribute("playsinline", "");
        activeVideo.setAttribute("webkit-playsinline", "");
        activeVideo.muted = false;
        activeVideo.currentTime = 0;

        // Force play with both methods
        const playPromise = activeVideo.play();
        if (playPromise) {
          playPromise
            .then(() => {
              console.log("Video started playing!");
            })
            .catch((error) => {
              console.error("Error playing video:", error);
              // Try again with muted
              console.log("Trying muted playback...");
              activeVideo.muted = true;
              return activeVideo.play();
            })
            .then(() => {
              // If muted playback worked, slowly unmute
              setTimeout(() => {
                activeVideo.muted = false;
              }, 500);
            })
            .catch((error) => {
              console.error("All playback attempts failed:", error);
            });
        }

        // Then show everything
        activeVideoScreen.setAttribute("visible", "true");
        activeVideoScreen.emit("animatein");

        // Play swoosh sound
        const swooshSound = document.querySelector("#swoosh-sound-player");
        if (swooshSound && swooshSound.components.sound) {
          console.log("Playing swoosh sound");
          swooshSound.components.sound.playSound();
        }

        // Debug video state after a moment
        setTimeout(() => {
          console.log("Video state after:", {
            paused: activeVideo.paused,
            muted: activeVideo.muted,
            currentTime: activeVideo.currentTime,
            readyState: activeVideo.readyState,
          });
        }, 1000);

        // Scale out star after a delay
        setTimeout(() => {
          if (activeMarker && activeMarker.star) {
            activeMarker.star.setAttribute("animation__scaleout", {
              property: "scale",
              from: "1.6 1.6 1.6",
              to: "0 0 0",
              dur: 800,
              easing: "easeInQuad",
            });

            // Hide star after animation
            activeMarker.star.addEventListener(
              "animationcomplete__scaleout",
              () => {
                activeMarker.star.setAttribute("visible", "false");
              },
              { once: true }
            );
          }
        }, 2000); // Wait for video screen to move into position
      }
    }
  });

  // Collect button handler
  collectButton.addEventListener("click", () => {
    if (activeItemModel && collectButtonVisible) {
      // Hide collect button
      hideCollectButton();
      

      // Play success sound
      const successSound = document.querySelector("#success-sound-player");
      if (successSound && successSound.components.sound) {
        successSound.components.sound.playSound();
      }

      // Animate item collection
      if (activeItemModel) {
        // Reset any existing animations
        activeItemModel.removeAttribute("animation__scale");

        // Scale down animation
        activeItemModel.setAttribute("animation__scale", {
          property: "scale",
          from: "1 1 1",
          to: "0 0 0",
          dur: 800, // Slightly faster
          easing: "easeInQuad",
        });

        // Hide after animation completes
        activeItemModel.addEventListener(
          "animationcomplete__scale",
          () => {
            activeItemModel.setAttribute("visible", "false");
            // Reset scale for next time
            activeItemModel.setAttribute("scale", "0 0 0");
            // Clean up animation
            activeItemModel.removeAttribute("animation__scale");
          },
          { once: true }
        );
      }

      // Mark target as found and update icon
      if (!foundTargets[activeItemModel.targetName]) {
        // First time finding this target
        console.log(
          "Target handler: First time finding target:",
          activeItemModel.targetName
        );
        foundTargets[activeItemModel.targetName] = true;
        saveFoundTargets();
        updateIconOpacity(activeItemModel.targetName);
      }
    }
  });
});

// Track currently active marker and video
let activeMarker = null;
let activeVideo = null;
let activeVideoScreen = null;
let activeItemModel = null;
let targetTrackingEnabled = true; // Flag to control target tracking
let playButtonVisible = false;
let collectButtonVisible = false;

// Enable sound immediately
let soundEnabled = true;

// Load found targets from localStorage or initialize empty
let foundTargets = ALL_TARGETS.reduce(
  (acc, target) => ({ ...acc, [target]: false }),
  {}
);

// Initialize saved state once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const savedTargets = JSON.parse(saved);
      // Merge saved state with default state
      foundTargets = { ...foundTargets, ...savedTargets };
      // Update icons for any previously found targets
      Object.keys(foundTargets).forEach((targetName) => {
        if (foundTargets[targetName]) {
          updateIconOpacity(targetName, true);
          hidePlayButton(); // Sembunyikan tombol play jika item sudah ditemukan
        }
      });
    }
  } catch (e) {
    console.error("Error loading found targets:", e);
  }
});

// Function to save found targets to localStorage
const saveFoundTargets = () => {
  try {
    // Check if all targets are found
    const allFound = ALL_TARGETS.every((target) => foundTargets[target]);
    if (allFound) {
      console.log("All targets found! Game complete.");
      localStorage.removeItem(STORAGE_KEY); // Clear storage for next session
      // Wait 2 seconds then show end screen
      setTimeout(() => {
        const endScreen = document.getElementById("endscreen");
        const video = document.getElementById("end-video");
        const endUsername = document.getElementById("end-username");

        // Update username
        const storedName = localStorage.getItem("userName");
        if (storedName) {
          endUsername.textContent = storedName.toUpperCase();
        }

        // Show end screen
        endScreen.classList.remove("hidden");

        // Turn off AR first
        const scene = document.querySelector("a-scene");
        if (scene) {
          scene.style.display = "none";
        }

        // Start video after fade in
        setTimeout(() => {
          // Reset video to start
          video.currentTime = 0;
          // Try to play video
          video.play().catch((e) => {
            console.error("Error playing video:", e);
            // Try playing again after user interaction
            document.addEventListener(
              "click",
              () => {
                video.currentTime = 0;
                video.play();
              },
              { once: true }
            );
          });
        }, 500);
      }, 2000);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(foundTargets));
    }
  } catch (e) {
    console.error("Error saving found targets:", e);
  }
};

// Update icon opacity when target is found
const updateIconOpacity = (targetName, isPreviouslyFound = false) => {
  console.log(
    "Updating icon for target:",
    targetName,
    "isPreviouslyFound:",
    isPreviouslyFound
  );
  const targetNumber = parseInt(targetName.split("-")[2]);
  console.log("Target number:", targetNumber);

  // Get the nth icon (1-based index since icons are 01-06)
  const iconBar = document.querySelector(".icon-bar");
  console.log("Icon bar found:", !!iconBar);

  const icons = iconBar ? iconBar.querySelectorAll(".icon") : [];
  console.log("Number of icons found:", icons.length);

  const icon = icons[targetNumber - 1]; // Convert to 0-based index
  console.log("Found icon:", !!icon);

  if (icon) {
    console.log("Current icon classes:", icon.className);
    if (isPreviouslyFound) {
      icon.classList.add("previously-found");
    } else {
      icon.classList.add("collected");
    }
    console.log("Updated icon classes:", icon.className);
    // Force a reflow to ensure the class change takes effect
    icon.offsetHeight;
  } else {
    console.error(`Could not find icon ${targetNumber}`);
  }
};

// Configure targets component
// AFRAME.registerComponent("config-targets", {
//   schema: {
//     targets: { type: "string", default: "" },
//   },
//   init() {
//     console.log("Initializing config-targets component");
//     this.configured = false;
//     this.configOk = false;

//     this.el.sceneEl.addEventListener("realityready", () => {
//       console.log("Reality ready event received");
//       this.configOk = true;
//       this.ensureImageTargetsConfigured();
//     });
//   },
//   ensureImageTargetsConfigured() {
//     console.log("Checking image target configuration");
//     if (this.configured || !this.configOk) {
//       console.log("Skipping configuration - already configured or not ready");
//       return;
//     }
//     const targets = this.data.targets.split(",").map((t) => t.trim());
//     console.log("Configuring image targets:", targets);
//     XR8.XrController.configure({ imageTargets: targets });
//     this.configured = true;
//     console.log("Image targets configured successfully");
//   },
//   update(oldData) {
//     console.log("Config-targets update called");
//     console.log("Old targets:", oldData.targets);
//     console.log("New targets:", this.data.targets);
//     this.configured = false;
//     this.ensureImageTargetsConfigured();
//   },
// });

AFRAME.registerComponent("config-targets", {
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
})
// Panic mode component to handle target rotation
AFRAME.registerComponent("panic-mode", {
  init() {
    // console.log("Initializing panic-mode component");
    const targets = [
      "vb-target-01",
      "vb-target-02",
      "vb-target-03",
      "vb-target-04",
      "vb-target-05",
      "vb-target-06",
    ];
    const found = [];
    const maxActiveTargets = 5; // 8th Wall has a limit on concurrent active targets

    let i = 0;
    const updateImageTargets = () => {
      // Get targets that haven't been found yet
      const notFound = targets.filter((target) => !found.includes(target));

      // Take a slice of not-found targets
      const notFoundSlice = notFound.slice(i, i + maxActiveTargets);

      // Combine found targets with current slice of not-found targets
      const active = [...found, ...notFoundSlice].slice(0, maxActiveTargets);

      // Update the active targets
      const targetString = "targets: " + active.join(", ");
      console.log("Setting active targets:", targetString);
      this.el.setAttribute("config-targets", targetString);

      // Move to next slice, wrapping around if needed
      i = i + maxActiveTargets >= notFound.length ? 0 : i + maxActiveTargets;
    };

    // Track found/lost targets
    this.el.sceneEl.addEventListener("xrimagefound", ({ detail }) => {
      if (!found.includes(detail.name)) {
        found.push(detail.name);
      }
    });

    this.el.sceneEl.addEventListener("xrimagelost", ({ detail }) => {

      // Don't handle target lost during video playback
      if (activeVideo && !activeVideo.paused) {
        console.log("Ignoring target lost during video playback");
        return;
      }

      const index = found.indexOf(detail.name);
      if (index !== -1) {
        found.splice(index, 1);
        // Hide play button when target is lost
        hidePlayButton();
      }
    });

    // Update active targets every second
    console.log("Starting target rotation interval");
    setInterval(updateImageTargets, 1000);
  },
});

// Component to handle target found behavior
AFRAME.registerComponent("target-handler", {
  init() {
    console.log("Initializing target-handler component");
    this.targetName = this.el.getAttribute("xrextras-named-image-target").name;
    console.log("Target name:", this.targetName);

    this.plane = this.el.querySelector("a-plane");
    this.text = this.plane.querySelector("a-text");

    // Create the star model
    const star = document.createElement("a-entity");
    star.setAttribute("gltf-model", "#starModel");
    star.setAttribute("scale", "1 1 1");
    star.setAttribute("position", "0 0 0");
    star.setAttribute("visible", "false");

    // Add SLAM tracking to the star
    // star.setAttribute("slam-tracking", { targetName: this.targetName });

    // Create hider object and parent it to the star
    const hider = document.createElement("a-entity");
    hider.setAttribute("gltf-model", "#hiderModel");
    hider.setAttribute("xrextras-hider-material", "");
    star.appendChild(hider);

    // Create 'Already Found!' text element in UI
    const foundTextDiv = document.createElement("div");
    foundTextDiv.textContent = "Already Found!";
    foundTextDiv.className = "already-found-text";
    document.body.appendChild(foundTextDiv);
    this.foundTextDiv = foundTextDiv; // Store reference for later use

    // Create video screen
    const videoScreen = document.createElement("a-video");
    videoScreen.setAttribute("class", "video");
    videoScreen.setAttribute("width", "2.04"); // 3 * 0.85 * 0.8 = 2.04 (35% smaller)
    videoScreen.setAttribute("height", "1.1475"); // 1.6875 * 0.85 * 0.8 = 1.1475 (maintaining 16:9 aspect ratio)
    videoScreen.setAttribute("position", "0 0 -0.1"); // Start at animation start position
    videoScreen.setAttribute("scale", "0 0 0");
    videoScreen.setAttribute("visible", "false");

    // Create black background plane as child of video screen
    const backgroundPlane = document.createElement("a-plane");
    backgroundPlane.setAttribute("width", "2.04"); // Match video width
    backgroundPlane.setAttribute("height", "1.1475"); // Match video height
    backgroundPlane.setAttribute("color", "#000000");
    backgroundPlane.setAttribute("position", "0 0 -0.01"); // Slightly behind video
    backgroundPlane.setAttribute("scale", "1 1 1");

    // Add background as child of video screen
    videoScreen.appendChild(backgroundPlane);

    // Add animations with identical timing
    const animationDuration = 2000; // Sped up by 200%
    const scaleDuration = 6000;

    // Position animation
    videoScreen.setAttribute("animation__position", {
      property: "position",
      from: "0 0 -0.1",
      to: "0 0 0.6", // Move forward to final position
      dur: animationDuration,
      easing: "easeOutSine",
      startEvents: "animatein",
    });

    // Scale animation
    videoScreen.setAttribute("animation__scale", {
      property: "scale",
      from: "0.2 0.2 0.2",
      to: "1 1 1",
      dur: scaleDuration,
      easing: "easeInOutSine",
      startEvents: "animatein",
    });

    // Create frame as child of video screen using border material
    const videoFrame = document.createElement("a-entity");
    const videoWidth = 2.04; // Match video width exactly
    const videoHeight = 1.1475; // Match video height exactly
    const borderWidth = 0.02; // Thinner border
    const frameWidth = videoWidth + borderWidth * 2; // Just enough for border
    const frameHeight = videoHeight + borderWidth * 2; // Just enough for border

    // Create custom geometry for frame (just the border)
    const frameGeometry = {
      primitive: "custom",
      vertices: [
        // Outer rectangle
        -frameWidth / 2,
        -frameHeight / 2,
        0, // Bottom left
        frameWidth / 2,
        -frameHeight / 2,
        0, // Bottom right
        frameWidth / 2,
        frameHeight / 2,
        0, // Top right
        -frameWidth / 2,
        frameHeight / 2,
        0, // Top left
        // Inner rectangle (matches video size exactly)
        -videoWidth / 2,
        -videoHeight / 2,
        0, // Bottom left
        videoWidth / 2,
        -videoHeight / 2,
        0, // Bottom right
        videoWidth / 2,
        videoHeight / 2,
        0, // Top right
        -videoWidth / 2,
        videoHeight / 2,
        0, // Top left
      ],
      faces: [
        // Outer border faces
        0,
        1,
        5,
        0,
        5,
        4, // Bottom
        1,
        2,
        6,
        1,
        6,
        5, // Right
        2,
        3,
        7,
        2,
        7,
        6, // Top
        3,
        0,
        4,
        3,
        4,
        7, // Left
      ],
    };

    videoFrame.setAttribute("geometry", frameGeometry);
    videoFrame.setAttribute("material", {
      color: "white",
      side: "double",
    });
    videoFrame.setAttribute("position", "0 0 -0.001"); // Just behind video

    // Add frame as child of video screen
    videoScreen.appendChild(videoFrame);

    // Create 3D object
    const itemModel = document.createElement("a-entity");
    itemModel.setAttribute("position", "0 0 0.4"); // Start at star's position
    itemModel.setAttribute("scale", "0 0 0"); // Start invisible
    itemModel.setAttribute("rotation", "0 0 0");
    itemModel.setAttribute("visible", "false");

    // Add animation for video screen
    videoScreen.setAttribute("animation", {
      property: "scale",
      from: "0 0 0",
      to: "1 1 1",
      dur: 1700,
      easing: "easeOutSine",
      startEvents: "animatein",
    });

    // Add animation complete handler
    videoScreen.addEventListener("animationcomplete__position", () => {
      // Scale out star
      if (this.star) {
        this.star.setAttribute("animation__scaleout", {
          property: "scale",
          from: "1.6 1.6 1.6",
          to: "0 0 0",
          dur: 800,
          easing: "easeInQuad",
        });

        // Hide star after animation
        this.star.addEventListener(
          "animationcomplete__scaleout",
          () => {
            this.star.setAttribute("visible", "false");
          },
          { once: true }
        );
      }
    });

    // Ensure video never autoplays
    videoScreen.addEventListener("animatein", () => {
      if (activeVideo) {
        activeVideo.pause();
        activeVideo.currentTime = 0;
        activeVideo.muted = true;
      }
    });

    this.el.appendChild(star);
    this.el.appendChild(videoScreen);
    this.el.appendChild(itemModel);
    this.star = star;
    this.videoScreen = videoScreen;
    this.videoFrame = videoFrame;
    this.itemModel = itemModel;
    this.foundTextDiv = foundTextDiv;

    // Get the target number (e.g., 'vb-target-01' -> 1)
    const targetNum = parseInt(this.targetName.split("-")[2]);

    // Set the 3D model based on target number
    this.itemModel.setAttribute(
      "gltf-model",
      `#item-${targetNum.toString().padStart(2, "0")}`
    );

    // Log when the model is loaded and modify materials
    star.addEventListener("model-loaded", (event) => {
      console.log("Star model loaded successfully for target", targetNum);
      const mesh = event.detail.model;
      mesh.traverse((node) => {
        // Log each node's name to inspect the structure
        console.log("Node name:", node.name);

        if (node.isMesh && node.material) {
          if (node.material.name === "background") {
            console.log("Found background material:", node.material);
            // Get the corresponding texture for this target
            const texture = document.querySelector(`#starTexture${targetNum}`);
            const tex = new THREE.Texture(texture);
            tex.flipY = false; // Prevent automatic Y-flip that THREE.js does by default
            tex.needsUpdate = true;
            node.material.map = tex;

            // Set material color to white
            node.material.color.setHex(0xffffff);
            node.material.needsUpdate = true;
          } else if (node.name === "HIDER") {
            console.log("Found HIDER object:", node);
            // Apply xrextras-hider-material
            const el = node.el || node.parent.el;
            if (el) {
              el.setAttribute("xrextras-hider-material", "");
            }
          }
        }
      });
    });

    // Log any loading errors
    star.addEventListener("model-error", (error) => {
      console.error("Error loading star model:", error);
    });

    // Listen on the scene element for events
    const sceneEl = document.querySelector("a-scene");

    // Handle target lost events
    sceneEl.addEventListener("xrimagelost", (evt) => {
      if (evt.detail.name === this.targetName) {
        // Don't do anything if video is playing
        if (activeVideo && !activeVideo.paused) return;

        // Hide play button
        hidePlayButton();

        if (this.foundTextDiv) {
          this.foundTextDiv.style.opacity = "0";
        }

        if (this.star) {
          star.setAttribute("visible", "false");
        }
      }
    });

    // Only handle target found events before video starts
    sceneEl.addEventListener("xrimagefound", (evt) => {
      if (evt.detail.name === this.targetName) {
        console.log("Target handler: Image found:", this.targetName);

        // Don't do anything if video is playing
        if (activeVideo && !activeVideo.paused) return;

        // Set active marker and show initial state
        activeMarker = this;
        this.star.setAttribute("visible", "true");
        this.star.setAttribute("position", "0 0 0");
        this.star.setAttribute("scale", "1 1 1");

        // Show play button if video is ready
        if (this.videoScreen && !activeVideo) {
          showPlayButton();
        }

        // Check if we're in the collect sequence
        if (activeItemModel && collectButtonVisible) {
          // Show 3D model and collect button
          if (this.itemModel) {
            this.itemModel.setAttribute("visible", "true");
          }
          collectButton.classList.add("visible");
          return; // Don't do anything else during collect sequence
        }

        // Check if target was previously found
        if (foundTargets[this.targetName]) {
          // Show Already Found text
          if (this.foundTextDiv) {
            this.foundTextDiv.style.opacity = "1";
          }

          

          // Show and animate 3D model
          if (this.itemModel) {
            // Reset initial state and make visible
            this.itemModel.setAttribute("visible", "true");
            this.itemModel.removeAttribute("animation__position");
            this.itemModel.removeAttribute("animation__scale");
            this.itemModel.setAttribute("position", "0 0 0.4");
            this.itemModel.setAttribute("scale", "0 0 0");

            // Move forward animation
            this.itemModel.setAttribute("animation__position", {
              property: "position",
              from: "0 0 0.4",
              to: "0 0 2.5", // Move further out
              dur: 1500,
              easing: "easeOutQuad",
            });

            // Scale up animation
            this.itemModel.setAttribute("animation__scale", {
              property: "scale",
              from: "0 0 0",
              to: "1 1 1",
              dur: 1500,
              easing: "easeOutElastic",
            });
          }

          // Hide star for found targets
          if (this.star) {
            this.star.setAttribute("visible", "false");
          }
        } else if (!activeVideo && !collectButtonVisible) {

          // Only show star if we haven't started the sequence
          if (this.star) {
            this.star.setAttribute("visible", "true");
            this.star.setAttribute("scale", "1 1 1");
          }
          showPlayButton();
        }

        // Remove the plane and text
        if (this.plane) {
          this.plane.parentNode.removeChild(this.plane);
          this.plane = null;
          this.text = null;
        }

        // Check if target was previously found
        if (foundTargets[this.targetName]) {
          console.log("Target previously found, showing 3D item directly");
          this.itemModel.setAttribute("visible", "false");
          hidePlayButton();

          // Move forward animation
          this.itemModel.setAttribute("animation__position", {
            property: "position",
            from: "0 0 0.4",
            to: "0 0 1.5",
            dur: 1500,
            easing: "easeOutQuad",
          });

          // Scale up animation
          this.itemModel.setAttribute("animation__scale", {
            property: "scale",
            from: "0 0 0",
            to: "0.8 0.8 0.8",
            dur: 1500,
            easing: "easeOutElastic",
          });

          // Continuous rotation animation
          this.itemModel.setAttribute("animation__rotate", {
            property: "rotation",
            from: "0 0 0",
            to: "0 360 0",
            dur: 5000,
            loop: true,
            easing: "linear",
          });

          // Show 'Already Found!' text in UI
          this.foundTextDiv.style.opacity = "1";

          // Make sure star is hidden for already found targets
          this.star.setAttribute("visible", "false");
          this.star.setAttribute("scale", "0 0 0");
        } else {
          console.log("Making star visible");

          // Show and animate star for new targets
          this.star.setAttribute("visible", "true");
          this.star.setAttribute("scale", "0 0 0");

          // Remove any existing animations
          this.star.removeAttribute("animation__scale");
          this.star.removeAttribute("animation__scaleout");

          // Re-add the scale up animation
          this.star.setAttribute("animation__scale", {
            property: "scale",
            from: "0 0 0",
            to: "1.6 1.6 1.6",
            dur: 9000,
            easing: "easeOutElastic",
            startEvents: "animatein",
          });

          // Trigger the animation
          this.star.emit("animatein");

          // Play star animation sound
          const swoosh2Sound = document.querySelector("#swoosh2-sound-player");
          if (swoosh2Sound && swoosh2Sound.components.sound) {
            console.log("Playing swoosh2 sound");
            swoosh2Sound.components.sound.playSound();
          }

          // Show play button after star animation
          setTimeout(() => {
            // Stop ALL videos before starting a new one
            ALL_TARGETS.forEach((target) => {
              const num = parseInt(target.split("-")[2]);
              const v = document.querySelector(`#video${num}`);
              if (v) {
                v.pause();
                v.currentTime = 0;
                v.muted = true; // Reset muted state
              }
            });

            const video = document.querySelector(`#video${targetNum}`);

            // Reset video state
            video.pause();
            video.currentTime = 0;
            video.muted = true;

            activeVideo = video;
            activeVideoScreen = this.videoScreen;

            // Show play button
            showPlayButton();

            // Set up video screen
            this.videoScreen.setAttribute("src", `#video${targetNum}`);
            this.videoScreen.setAttribute("visible", "true"); // Keep visible

            // Add video end listener
            const handleVideoEnd = () => {
              console.log("Video ended, transitioning to collect state");

              // Scale away video
              this.videoScreen.setAttribute("animation__scaleaway", {
                property: "scale",
                from: "1 1 1",
                to: "0 0 0",
                dur: 900,
                easing: "linear",
              });

              // After video scales away, show collect button
              setTimeout(() => {
                // Clear video playback state
                activeVideo = null;
                activeVideoScreen = null;

                // Re-enable target tracking
                targetTrackingEnabled = true;

                // Store reference to item model and target info for collect button
                activeItemModel = this.itemModel;
                activeItemModel.targetName = this.targetName;

                // Show collect button
                showCollectButton();
              }, 900);

              // Remove the listener
              video.removeEventListener("ended", handleVideoEnd);
            };

            // Add the video end listener
            video.addEventListener("ended", handleVideoEnd);
          }, 800);

          this.plane.setAttribute("visible", "true");
        }
      }
    });
  },
});

// Register the splash image component
AFRAME.registerComponent("splash-image", {
  init() {
    const splashimage = document.getElementById("splashimage");
    const start = document.getElementById("start");
    const nameInput = document.getElementById("nameInput");
    const instructionsScreen = document.getElementById("instructions-screen");
    const cameraScreen = document.getElementById("camera-screen");
    const cameraButton = document.getElementById("camera-button");

    if (!start || !nameInput) return;

    // Load saved name if available
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      nameInput.value = savedName;
      start.disabled = false;
    }

    // Function to check name and enable/disable button
    const checkName = () => {
      const name = nameInput.value.trim();
      const hasName = !!name;
      console.log("Name check:", { value: name, hasName });
      start.disabled = !hasName;

      // Update stored name whenever it changes
      if (hasName) {
        localStorage.setItem("userName", name);
      }
    };

    // Enable button when name is entered - multiple events for Android
    nameInput.addEventListener("input", checkName);
    nameInput.addEventListener("change", checkName);
    nameInput.addEventListener("keyup", checkName);
    nameInput.addEventListener("blur", checkName);

    // Handle keyboard enter key
    nameInput.addEventListener("keyup", (e) => {
      console.log("Keyup event:", e.key);
      if (e.key === "Enter" || e.key === "Done" || e.key === "Go") {
        nameInput.blur(); // Hide keyboard
        if (!nameInput.value.trim()) return;
        start.click();
      }
    });

    // Handle start button click - Show camera screen
    start.onclick = () => {
      const userName = nameInput.value.trim();
      if (!userName) return;

      // Store name
      localStorage.setItem("userName", userName);

      // Switch to camera screen and hide Next button
      instructionsScreen.classList.add("hidden");
      cameraScreen.classList.remove("hidden");
      start.classList.add("hidden");
    };

    // Handle camera button click - Start AR
    cameraButton.onclick = () => {
      // Initialize AR with world tracking disabled
      this.el.sceneEl.setAttribute("xrweb", "disableWorldTracking: false");

      // Hide splash screen
      splashimage.classList.add("hidden");

      // Play background music when reality is ready
      this.el.sceneEl.addEventListener("realityready", () => {
        const snd = document.querySelector("[sound]");
        if (snd && snd.components.sound) {
          snd.components.sound.playSound();
        }
      });
    };
  },
});
