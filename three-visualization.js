import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"

class SecurityBreachVisualization {
  constructor(containerId) {
    this.container = document.getElementById(containerId)
    this.data = []
    this.nodes = []
    this.selectedNode = null
    this.viewMode = "3d" // '3d' or '2d'

    this.init()
    this.setupEventListeners()
  }

  init() {
    // Set up scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a1a)

    // Set up camera
    this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000)
    this.camera.position.z = 30

    // Set up renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.container.appendChild(this.renderer.domElement)

    // Add orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(1, 1, 1)
    this.scene.add(directionalLight)

    // Add grid helper for orientation
    const gridHelper = new THREE.GridHelper(100, 20, 0x555555, 0x333333)
    this.scene.add(gridHelper)

    // Create a group for all nodes
    this.nodesGroup = new THREE.Group()
    this.scene.add(this.nodesGroup)

    // Add tooltip element
    this.tooltip = document.createElement("div")
    this.tooltip.className = "tooltip"
    this.tooltip.style.display = "none"
    document.body.appendChild(this.tooltip)

    // Set up raycaster for interaction
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    // Start animation loop
    this.animate()

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize())
  }

  setupEventListeners() {
    // Listen for data ready event
    document.addEventListener("dataReady", (event) => {
      this.data = event.detail.data
      this.createVisualization()
    })

    // Listen for company selection from table
    document.addEventListener("selectCompany", (event) => {
      const { companyIndex } = event.detail
      this.highlightNode(companyIndex)
    })

    // Listen for filter events
    document.addEventListener("filterData", (event) => {
      this.updateVisibility(event.detail.filteredData)
    })

    // Listen for view toggle
    document.addEventListener("toggleView", () => {
      this.toggleView()
    })

    // Mouse move for tooltip
    this.renderer.domElement.addEventListener("mousemove", (event) => {
      this.onMouseMove(event)
    })

    // Click to select node
    this.renderer.domElement.addEventListener("click", (event) => {
      this.onMouseClick(event)
    })
  }

  createVisualization() {
    // Clear existing nodes
    while (this.nodesGroup.children.length > 0) {
      this.nodesGroup.remove(this.nodesGroup.children[0])
    }
    this.nodes = []

    // Create a node for each filing
    this.data.forEach((filing, index) => {
      // Determine if this is a recent breach (within 30 days)
      const filingDate = new Date(filing.filedAt)
      const now = new Date()
      const daysDiff = Math.floor((now - filingDate) / (1000 * 60 * 60 * 24))
      const isRecent = daysDiff <= 30

      // Create geometry based on severity or other factors
      const geometry = new THREE.SphereGeometry(0.5 + (filing.breachSeverity || 1) * 0.2, 32, 32)

      // Material color based on recency
      const color = isRecent ? 0xff6b6b : 0x4b7bec
      const material = new THREE.MeshPhongMaterial({
        color,
        shininess: 100,
        emissive: color,
        emissiveIntensity: 0.2,
      })

      const node = new THREE.Mesh(geometry, material)

      // Position nodes in a spiral pattern
      const angle = index * 0.2
      const radius = 2 + index * 0.1

      if (this.viewMode === "3d") {
        node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, (index % 5) - 2)
      } else {
        node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
      }

      // Store original position and color for animations
      node.userData = {
        filing,
        index,
        originalPosition: node.position.clone(),
        originalColor: color,
        isRecent,
      }

      this.nodesGroup.add(node)
      this.nodes.push(node)
    })

    // Add connecting lines between nodes
    this.createConnections()

    // Add a pulsing effect to recent breaches
    this.nodes.forEach((node) => {
      if (node.userData.isRecent) {
        this.addPulsingEffect(node)
      }
    })
  }

  createConnections() {
    // Create connections between related nodes (e.g., same industry or similar breach types)
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        // Only connect some nodes based on criteria (here we're using a simple random check)
        if (Math.random() > 0.9) {
          const nodeA = this.nodes[i]
          const nodeB = this.nodes[j]

          const material = new THREE.LineBasicMaterial({
            color: 0x555555,
            transparent: true,
            opacity: 0.3,
          })

          const points = [nodeA.position, nodeB.position]
          const geometry = new THREE.BufferGeometry().setFromPoints(points)

          const line = new THREE.Line(geometry, material)
          line.userData = {
            nodeIndices: [i, j],
          }

          this.nodesGroup.add(line)
        }
      }
    }
  }

  addPulsingEffect(node) {
    // Create a pulsing glow effect for recent breaches
    const glowGeometry = new THREE.SphereGeometry(node.geometry.parameters.radius * 1.2, 32, 32)

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: node.userData.originalColor,
      transparent: true,
      opacity: 0.2,
    })

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    glowMesh.position.copy(node.position)

    // Store reference to the original node
    glowMesh.userData = {
      originalNode: node,
      pulsePhase: Math.random() * Math.PI * 2, // Random starting phase
    }

    this.nodesGroup.add(glowMesh)
  }

  highlightNode(index) {
    // Reset previously selected node
    if (this.selectedNode !== null) {
      const prevNode = this.nodes[this.selectedNode]
      if (prevNode) {
        prevNode.material.color.setHex(prevNode.userData.originalColor)
        prevNode.material.emissive.setHex(prevNode.userData.originalColor)
        prevNode.material.emissiveIntensity = 0.2
        prevNode.scale.set(1, 1, 1)
      }
    }

    // Highlight new selected node
    this.selectedNode = index
    const node = this.nodes[index]

    if (node) {
      // Highlight color
      node.material.color.setHex(0x2ecc71)
      node.material.emissive.setHex(0x2ecc71)
      node.material.emissiveIntensity = 0.5
      node.scale.set(1.3, 1.3, 1.3)

      // Move camera to focus on this node
      this.focusCameraOnNode(node)

      // Update info panel
      this.updateInfoPanel(node.userData.filing)
    }
  }

  focusCameraOnNode(node) {
    // Animate camera to focus on the selected node
    const targetPosition = node.position.clone()
    const distance = 10

    // Calculate position slightly away from the node
    const cameraTargetPosition = new THREE.Vector3(
      targetPosition.x + distance,
      targetPosition.y + distance / 2,
      targetPosition.z + distance,
    )

    // Animate camera movement
    const startPosition = this.camera.position.clone()
    const duration = 1000 // ms
    const startTime = Date.now()

    const animateCamera = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease function (ease-out cubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3)

      this.camera.position.lerpVectors(startPosition, cameraTargetPosition, easeProgress)
      this.controls.target.lerpVectors(new THREE.Vector3(0, 0, 0), targetPosition, easeProgress)

      if (progress < 1) {
        requestAnimationFrame(animateCamera)
      }
    }

    animateCamera()
  }

  updateInfoPanel(filing) {
    const infoPanel = document.getElementById("visualization-info")
    if (!infoPanel) return

    const filingDate = new Date(filing.filedAt).toLocaleDateString()

    infoPanel.innerHTML = `
            <h3>${filing.companyName} (${filing.ticker || "N/A"})</h3>
            <p>Filing Date: ${filingDate}</p>
            <p>CIK: ${filing.cik}</p>
            <p>View the <a href="${filing.secLink}" target="_blank" rel="noopener noreferrer">SEC filing</a> for more details.</p>
        `
  }

  updateVisibility(filteredData) {
    // Get array of CIKs from filtered data
    const filteredCIKs = filteredData.map((filing) => filing.cik)

    // Update visibility of nodes
    this.nodes.forEach((node) => {
      const isVisible = filteredCIKs.includes(node.userData.filing.cik)
      node.visible = isVisible

      // Also update any glow effects
      this.nodesGroup.children.forEach((child) => {
        if (child.userData && child.userData.originalNode === node) {
          child.visible = isVisible
        }
      })
    })

    // Update visibility of connections
    this.nodesGroup.children.forEach((child) => {
      if (child instanceof THREE.Line) {
        const [indexA, indexB] = child.userData.nodeIndices
        child.visible = this.nodes[indexA].visible && this.nodes[indexB].visible
      }
    })
  }

  toggleView() {
    this.viewMode = this.viewMode === "3d" ? "2d" : "3d"

    // Transition nodes to new positions
    this.nodes.forEach((node, index) => {
      const angle = index * 0.2
      const radius = 2 + index * 0.1

      const targetPosition = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        this.viewMode === "3d" ? (index % 5) - 2 : 0,
      )

      // Animate to new position
      const startPosition = node.position.clone()
      const duration = 1000 // ms
      const startTime = Date.now()

      const animatePosition = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Ease function
        const easeProgress = 1 - Math.pow(1 - progress, 3)

        node.position.lerpVectors(startPosition, targetPosition, easeProgress)

        // Update node's userData
        node.userData.originalPosition = targetPosition.clone()

        if (progress < 1) {
          requestAnimationFrame(animatePosition)
        } else {
          // Update connections after nodes have moved
          this.updateConnections()
        }
      }

      animatePosition()
    })

    // Update camera position for the new view
    if (this.viewMode === "2d") {
      this.camera.position.set(0, 0, 40)
      this.controls.target.set(0, 0, 0)
    } else {
      this.camera.position.set(20, 10, 20)
      this.controls.target.set(0, 0, 0)
    }
  }

  updateConnections() {
    // Update the geometry of all connection lines
    this.nodesGroup.children.forEach((child) => {
      if (child instanceof THREE.Line) {
        const [indexA, indexB] = child.userData.nodeIndices
        const nodeA = this.nodes[indexA]
        const nodeB = this.nodes[indexB]

        const points = [nodeA.position, nodeB.position]
        child.geometry.setFromPoints(points)
      }
    })
  }

  onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Update the raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // Find intersections
    const intersects = this.raycaster.intersectObjects(this.nodes)

    if (intersects.length > 0) {
      const intersectedNode = intersects[0].object
      const filing = intersectedNode.userData.filing

      // Show tooltip
      this.tooltip.style.display = "block"
      this.tooltip.style.left = `${event.clientX + 10}px`
      this.tooltip.style.top = `${event.clientY + 10}px`

      // Format date
      const filingDate = new Date(filing.filedAt).toLocaleDateString()

      this.tooltip.innerHTML = `
                <strong>${filing.companyName}</strong><br>
                Ticker: ${filing.ticker || "N/A"}<br>
                Filed: ${filingDate}
            `

      // Highlight hovered node slightly
      if (this.selectedNode !== intersectedNode.userData.index) {
        intersectedNode.material.emissiveIntensity = 0.4
      }

      this.renderer.domElement.style.cursor = "pointer"
    } else {
      // Hide tooltip
      this.tooltip.style.display = "none"

      // Reset all non-selected nodes
      this.nodes.forEach((node) => {
        if (this.selectedNode !== node.userData.index) {
          node.material.emissiveIntensity = 0.2
        }
      })

      this.renderer.domElement.style.cursor = "default"
    }
  }

  onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Update the raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // Find intersections
    const intersects = this.raycaster.intersectObjects(this.nodes)

    if (intersects.length > 0) {
      const intersectedNode = intersects[0].object
      this.highlightNode(intersectedNode.userData.index)

      // Also highlight the corresponding table row
      const tableRows = document.querySelectorAll("#breach-table-body tr")
      tableRows.forEach((row) => row.classList.remove("selected"))

      const rowIndex = intersectedNode.userData.index
      const row = document.querySelector(`#breach-table-body tr[data-index="${rowIndex}"]`)
      if (row) {
        row.classList.add("selected")
        row.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  onWindowResize() {
    // Update camera aspect ratio
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()

    // Update renderer size
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  animate() {
    requestAnimationFrame(() => this.animate())

    // Update controls
    this.controls.update()

    // Animate pulsing effect for recent breaches
    this.nodesGroup.children.forEach((child) => {
      if (child.userData && child.userData.pulsePhase !== undefined) {
        const originalNode = child.userData.originalNode

        // Only animate if the original node is visible
        if (originalNode.visible) {
          child.userData.pulsePhase += 0.02
          const scale = 1 + 0.2 * Math.sin(child.userData.pulsePhase)
          child.scale.set(scale, scale, scale)

          // Pulse opacity too
          child.material.opacity = 0.1 + 0.1 * Math.sin(child.userData.pulsePhase)
        }
      }
    })

    // Render scene
    this.renderer.render(this.scene, this.camera)
  }
}

// Initialize visualization when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SecurityBreachVisualization("three-container")
})

