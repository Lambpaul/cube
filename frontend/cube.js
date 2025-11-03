class CubeRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cube = null;
        this.edges = null;
        this.is3D = false;
        this.animationId = null;

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

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Initial 2D square (outline only)
        this.createCube('#000000', false);

        // Lighting (for 3D mode)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation loop
        this.animate();
    }

    createCube(color, is3D = false) {
        // Remove existing cube and edges
        if (this.cube) {
            this.scene.remove(this.cube);
            this.cube.geometry.dispose();
            this.cube.material.dispose();
        }
        if (this.edges) {
            this.scene.remove(this.edges);
            this.edges.geometry.dispose();
            this.edges.material.dispose();
        }

        this.is3D = is3D;

        // Geometry - flat for 2D, full cube for 3D
        const geometry = new THREE.BoxGeometry(2, 2, is3D ? 2 : 0.01);

        // For 2D: invisible fill, only edges visible
        // For 3D: visible fill with edges
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });

        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);

        // Create edges (the black outline)
        const edgesGeometry = new THREE.EdgesGeometry(geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 2
        });
        this.edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        this.scene.add(this.edges);
    }

    updateColor(color) {
        if (this.cube) {
            this.cube.material.color.set(color);
        }
    }

    enableFill() {
        // Make the cube visible (filled)
        if (this.cube) {
            this.cube.material.opacity = 1.0;
        }
    }

    enable3D() {
        // Recreate as 3D cube
        const currentColor = this.cube ? this.cube.material.color.getStyle() : '#000000';
        const currentOpacity = this.cube ? this.cube.material.opacity : 0;
        this.createCube(currentColor, true);
        if (currentOpacity > 0) {
            this.cube.material.opacity = currentOpacity;
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Rotate only in 3D mode
        if (this.cube && this.is3D) {
            this.cube.rotation.x += 0.005;
            this.cube.rotation.y += 0.01;
            if (this.edges) {
                this.edges.rotation.x += 0.005;
                this.edges.rotation.y += 0.01;
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
