class CubeRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cube = null;
        this.edges = null;
        this.sideEdges = null; // Separate edges for side faces (animated)
        this.is3D = false;
        this.animationId = null;
        this.currentColor = '#000000';
        this.paintedPixels = [];
        this.gridResolution = 16;
        this.textures = {};
        this.activeFace = 'top';

        // Manual rotation controls
        this.autoRotate = true;
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.rotationVelocity = { x: 0, y: 0 };

        this.init();
    }

    init() {
        // Scene with white background
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.z = 3;

        // Renderer with alpha support for proper transparency
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            premultipliedAlpha: false
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Initial 2D square (outline only)
        this.createCube(this.currentColor, false);

        // Lighting (for 3D mode)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Manual rotation controls
        this.setupRotationControls();

        // Start animation loop
        this.animate();
    }

    setupRotationControls() {
        const canvas = this.renderer.domElement;

        // Mouse events
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('mouseleave', () => this.onMouseUp());

        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', () => this.onTouchEnd());
    }

    onMouseDown(event) {
        if (!this.is3D) return;
        this.isDragging = true;
        this.autoRotate = false; // Stop auto rotation
        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    onMouseMove(event) {
        if (!this.isDragging || !this.is3D) return;

        const deltaX = event.clientX - this.previousMousePosition.x;
        const deltaY = event.clientY - this.previousMousePosition.y;

        if (this.cube) {
            this.cube.rotation.y += deltaX * 0.01;
            this.cube.rotation.x += deltaY * 0.01;
        }
        if (this.edges) {
            this.edges.rotation.y += deltaX * 0.01;
            this.edges.rotation.x += deltaY * 0.01;
        }
        if (this.sideEdges) {
            this.sideEdges.rotation.y += deltaX * 0.01;
            this.sideEdges.rotation.x += deltaY * 0.01;
        }

        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onTouchStart(event) {
        if (!this.is3D) return;
        event.preventDefault();
        if (event.touches.length === 1) {
            this.isDragging = true;
            this.autoRotate = false; // Stop auto rotation
            this.previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
    }

    onTouchMove(event) {
        if (!this.isDragging || !this.is3D) return;
        event.preventDefault();

        if (event.touches.length === 1) {
            const deltaX = event.touches[0].clientX - this.previousMousePosition.x;
            const deltaY = event.touches[0].clientY - this.previousMousePosition.y;

            if (this.cube) {
                this.cube.rotation.y += deltaX * 0.01;
                this.cube.rotation.x += deltaY * 0.01;
            }
            if (this.edges) {
                this.edges.rotation.y += deltaX * 0.01;
                this.edges.rotation.x += deltaY * 0.01;
            }
            if (this.sideEdges) {
                this.sideEdges.rotation.y += deltaX * 0.01;
                this.sideEdges.rotation.x += deltaY * 0.01;
            }

            this.previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
    }

    onTouchEnd() {
        this.isDragging = false;
    }

    createCube(color, is3D = false) {
        // Save current rotation before removing cube
        let savedRotation = { x: 0, y: 0, z: 0 };
        if (this.cube && this.is3D) {
            savedRotation = {
                x: this.cube.rotation.x,
                y: this.cube.rotation.y,
                z: this.cube.rotation.z
            };
        }

        // Remove existing cube and edges
        if (this.cube) {
            this.scene.remove(this.cube);
            this.cube.geometry.dispose();

            // Handle both single material and array of materials
            if (Array.isArray(this.cube.material)) {
                this.cube.material.forEach(mat => {
                    if (mat.map) mat.map.dispose();
                    mat.dispose();
                });
            } else {
                if (this.cube.material.map) {
                    this.cube.material.map.dispose();
                }
                this.cube.material.dispose();
            }
        }
        if (this.edges) {
            this.scene.remove(this.edges);
            this.edges.geometry.dispose();
            this.edges.material.dispose();
        }
        if (this.sideEdges) {
            this.scene.remove(this.sideEdges);
            this.sideEdges.geometry.dispose();
            this.sideEdges.material.dispose();
            this.sideEdges = null;
        }

        this.is3D = is3D;

        // Geometry - flat for 2D, full cube for 3D
        const geometry = new THREE.BoxGeometry(2, 2, is3D ? 2 : 0.01);

        // Create material
        let material;
        if (this.paintedPixels.length > 0 && !is3D) {
            // Use texture for painted pixels in 2D
            const texture = this.createTexture('top');
            material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide
            });
        } else if (is3D && this.paintedPixels.length > 0) {
            // Use different textures for each face in 3D
            const materials = [
                new THREE.MeshBasicMaterial({ map: this.createTexture('right'), side: THREE.FrontSide, transparent: true, alphaTest: 0.01, depthWrite: false }),  // right
                new THREE.MeshBasicMaterial({ map: this.createTexture('left'), side: THREE.FrontSide, transparent: true, alphaTest: 0.01, depthWrite: false }),   // left
                new THREE.MeshBasicMaterial({ map: this.createTexture('top'), side: THREE.FrontSide, transparent: true, alphaTest: 0.01, depthWrite: false }),    // top
                new THREE.MeshBasicMaterial({ map: this.createTexture('bottom'), side: THREE.FrontSide, transparent: true, alphaTest: 0.01, depthWrite: false }), // bottom
                new THREE.MeshBasicMaterial({ map: this.createTexture('front'), side: THREE.FrontSide, transparent: true, alphaTest: 0.01, depthWrite: false }),  // front
                new THREE.MeshBasicMaterial({ map: this.createTexture('back'), side: THREE.FrontSide, transparent: true, alphaTest: 0.01, depthWrite: false })    // back
            ];
            material = materials;
        } else {
            // Simple color material
            material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide
            });
        }

        this.cube = new THREE.Mesh(geometry, material);

        // Set rotation - show top face by default
        if (is3D && savedRotation && (savedRotation.x !== 0 || savedRotation.y !== 0 || savedRotation.z !== 0)) {
            // Restore saved rotation if in 3D mode and not default
            this.cube.rotation.set(savedRotation.x, savedRotation.y, savedRotation.z);
        } else if (is3D) {
            // Default 3D view: show top face
            this.cube.rotation.x = Math.PI / 2; // Rotate to show top face
        }

        this.scene.add(this.cube);

        // Create edges (the outline)
        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: color === '#000000' ? 0x000000 : new THREE.Color(color),
            linewidth: 2
        });
        this.edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

        // Set rotation to match cube
        if (is3D && savedRotation && (savedRotation.x !== 0 || savedRotation.y !== 0 || savedRotation.z !== 0)) {
            // Restore saved rotation for edges too
            this.edges.rotation.set(savedRotation.x, savedRotation.y, savedRotation.z);
        } else if (is3D) {
            // Default 3D view: show top face
            this.edges.rotation.x = Math.PI / 2;
        }

        this.scene.add(this.edges);

        // Create side edges if in 3D mode and we have saved rotation (i.e., coming from animation)
        if (is3D && this.paintedPixels.length > 0 && savedRotation && (savedRotation.x !== 0 || savedRotation.y !== 0 || savedRotation.z !== 0)) {
            if (!this.sideEdges) {
                const sideEdgesGeometry = new THREE.EdgesGeometry(geometry);
                const sideEdgesMaterial = new THREE.LineBasicMaterial({
                    color: color === '#000000' ? 0x000000 : new THREE.Color(color),
                    linewidth: 2,
                    transparent: true,
                    opacity: 1
                });
                this.sideEdges = new THREE.LineSegments(sideEdgesGeometry, sideEdgesMaterial);
                this.sideEdges.rotation.set(savedRotation.x, savedRotation.y, savedRotation.z);
                this.scene.add(this.sideEdges);
            }
        }
    }

    createTexture(face) {
        const resolution = this.gridResolution;
        const size = 512; // Texture size in pixels
        const cellSize = size / resolution;

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Clear canvas to transparent (instead of white)
        // This allows the background color (white or black in dark mode) to show through
        ctx.clearRect(0, 0, size, size);

        // Draw painted pixels for this face
        this.paintedPixels.forEach(pixel => {
            if (pixel.face === face) {
                ctx.fillStyle = pixel.color;
                ctx.fillRect(
                    pixel.x * cellSize,
                    pixel.y * cellSize,
                    cellSize,
                    cellSize
                );
            }
        });

        // Create Three.js texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        return texture;
    }

    updateColor(color) {
        this.currentColor = color;

        // Update edges color
        if (this.edges) {
            this.edges.material.color.set(color);
        }
    }

    updatePaintedPixels(pixels, resolution) {
        this.paintedPixels = pixels;
        this.gridResolution = resolution;

        // Recreate cube with new textures
        this.createCube(this.currentColor, this.is3D);
    }

    enable3D() {
        if (this.is3D) return;

        // Smooth transition animation
        this.animateTransitionTo3D();
    }

    animateTransitionTo3D() {
        const duration = 2000; // 2 seconds
        const startTime = Date.now();

        // IMPORTANT: Create 3D materials with proper textures BEFORE animation
        // This prevents the "all faces showing same texture" bug during animation
        let materials3D = null;
        let materialsApplied = false;

        if (this.paintedPixels.length > 0) {
            // Create materials with initial opacity: top face fully visible, others transparent
            // alphaTest ensures pixels with low alpha stay completely transparent
            materials3D = [
                new THREE.MeshBasicMaterial({ map: this.createTexture('right'), side: THREE.FrontSide, transparent: true, opacity: 0, alphaTest: 0.01, depthWrite: false }),  // right - start invisible
                new THREE.MeshBasicMaterial({ map: this.createTexture('left'), side: THREE.FrontSide, transparent: true, opacity: 0, alphaTest: 0.01, depthWrite: false }),   // left - start invisible
                new THREE.MeshBasicMaterial({ map: this.createTexture('top'), side: THREE.FrontSide, transparent: true, opacity: 1, alphaTest: 0.01, depthWrite: false }),    // top - fully visible
                new THREE.MeshBasicMaterial({ map: this.createTexture('bottom'), side: THREE.FrontSide, transparent: true, opacity: 0, alphaTest: 0.01, depthWrite: false }), // bottom - start invisible
                new THREE.MeshBasicMaterial({ map: this.createTexture('front'), side: THREE.FrontSide, transparent: true, opacity: 0, alphaTest: 0.01, depthWrite: false }),  // front - start invisible
                new THREE.MeshBasicMaterial({ map: this.createTexture('back'), side: THREE.FrontSide, transparent: true, opacity: 0, alphaTest: 0.01, depthWrite: false })    // back - start invisible
            ];
        }

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease in-out cubic for smooth fade
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            // First frame setup
            if (this.cube && !this.is3D && !materialsApplied) {
                // Dispose old material
                if (Array.isArray(this.cube.material)) {
                    this.cube.material.forEach(mat => {
                        if (mat.map) mat.map.dispose();
                        mat.dispose();
                    });
                } else {
                    if (this.cube.material.map) this.cube.material.map.dispose();
                    this.cube.material.dispose();
                }

                // Apply 3D materials immediately
                if (materials3D) {
                    this.cube.material = materials3D;
                }

                // Create full 3D geometry immediately (no more animation of depth)
                this.cube.geometry.dispose();
                this.cube.geometry = new THREE.BoxGeometry(2, 2, 2);

                // Create edges only for the top face (4 lines forming a square)
                // Top face in original coordinates has Y = +1
                const topEdgesGeometry = new THREE.BufferGeometry();
                const topEdgesVertices = new Float32Array([
                    // Top face edges (Y = +1)
                    -1,  1, -1,   1,  1, -1,  // back edge
                     1,  1, -1,   1,  1,  1,  // right edge
                     1,  1,  1,  -1,  1,  1,  // front edge
                    -1,  1,  1,  -1,  1, -1   // left edge
                ]);
                topEdgesGeometry.setAttribute('position', new THREE.BufferAttribute(topEdgesVertices, 3));

                if (this.edges) {
                    this.edges.geometry.dispose();
                    this.edges.geometry = topEdgesGeometry;
                }

                // Create separate edges for ALL cube edges that will fade in
                if (this.sideEdges) {
                    this.scene.remove(this.sideEdges);
                    this.sideEdges.geometry.dispose();
                    this.sideEdges.material.dispose();
                }
                const allEdgesGeometry = new THREE.EdgesGeometry(this.cube.geometry);
                const allEdgesMaterial = new THREE.LineBasicMaterial({
                    color: this.currentColor === '#000000' ? 0x000000 : new THREE.Color(this.currentColor),
                    linewidth: 2,
                    transparent: true,
                    opacity: 0
                });
                this.sideEdges = new THREE.LineSegments(allEdgesGeometry, allEdgesMaterial);
                this.scene.add(this.sideEdges);

                // Set rotation immediately to show top face from the start
                this.cube.rotation.x = Math.PI / 2; // +90 degrees
                this.cube.rotation.y = 0;
                if (this.edges) {
                    this.edges.rotation.x = Math.PI / 2;
                    this.edges.rotation.y = 0;
                }
                if (this.sideEdges) {
                    this.sideEdges.rotation.x = Math.PI / 2;
                    this.sideEdges.rotation.y = 0;
                }

                materialsApplied = true;
            }

            // Animate opacity of side faces (not top) and side edges to fade them in
            if (materials3D && materialsApplied) {
                // Fade in all faces except top (index 2)
                materials3D.forEach((mat, index) => {
                    if (index !== 2) { // Not the top face
                        mat.opacity = eased;
                    }
                });

                // Also fade in the side edges (not the main edges which show the top face)
                if (this.sideEdges) {
                    this.sideEdges.material.opacity = eased;
                }
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Transition complete
                this.is3D = true;

                // Ensure all faces and side edges are fully opaque at the end
                if (materials3D) {
                    materials3D.forEach(mat => mat.opacity = 1);
                }
                if (this.sideEdges && this.sideEdges.material) {
                    this.sideEdges.material.opacity = 1;
                }

                // Remove the top-face-only edges and keep only sideEdges (which shows all edges)
                if (this.edges) {
                    this.scene.remove(this.edges);
                    this.edges.geometry.dispose();
                    this.edges.material.dispose();
                    this.edges = this.sideEdges;
                    this.sideEdges = null;
                }

                if (!materials3D) {
                    // No painted pixels, create standard 3D cube
                    this.createCube(this.currentColor, true);
                }

                // After animation completes, apply a subtle rotation to reveal it's 3D
                this.animateRevealRotation();
            }
        };

        animate();
    }

    animateRevealRotation() {
        // Gentle rotation to reveal the 3D nature while keeping the top face as main view
        const duration = 1500; // 1.5 seconds
        const startTime = Date.now();

        // Start from top view (looking down at the cube)
        const startRotationX = Math.PI / 2;  // +90 degrees (top view)
        const startRotationY = 0;

        // End with a subtle tilt to reveal it's 3D, but keep top face as primary view
        const targetRotationX = Math.PI / 2.5; // +72 degrees (mainly top view with slight tilt)
        const targetRotationY = Math.PI / 12;   // 15 degrees (gentle rotation)

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic for smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3);

            const currentRotationX = startRotationX + (targetRotationX - startRotationX) * eased;
            const currentRotationY = startRotationY + (targetRotationY - startRotationY) * eased;

            if (this.cube) {
                this.cube.rotation.x = currentRotationX;
                this.cube.rotation.y = currentRotationY;
            }
            if (this.edges) {
                this.edges.rotation.x = currentRotationX;
                this.edges.rotation.y = currentRotationY;
            }
            if (this.sideEdges) {
                this.sideEdges.rotation.x = currentRotationX;
                this.sideEdges.rotation.y = currentRotationY;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete, enable auto-rotation
                this.autoRotate = true;
            }
        };

        animate();
    }

    setActiveFace(face) {
        this.activeFace = face;
        // Could add visual indication of which face is active
    }

    reset() {
        this.currentColor = '#000000';
        this.paintedPixels = [];
        this.gridResolution = 16;
        this.is3D = false;
        this.createCube('#000000', false);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Rotate only in 3D mode and if auto-rotate is enabled
        if (this.cube && this.is3D && this.autoRotate) {
            // Balanced gentle rotation on all axes for smooth, natural movement
            // This allows free manipulation without axis locking
            this.cube.rotation.x += 0.001;
            this.cube.rotation.y += 0.002;
            this.cube.rotation.z += 0.0015;
            if (this.edges) {
                this.edges.rotation.x += 0.001;
                this.edges.rotation.y += 0.002;
                this.edges.rotation.z += 0.0015;
            }
            if (this.sideEdges) {
                this.sideEdges.rotation.x += 0.001;
                this.sideEdges.rotation.y += 0.002;
                this.sideEdges.rotation.z += 0.0015;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}
