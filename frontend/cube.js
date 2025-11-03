class CubeRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cube = null;
        this.is3D = false;
        this.animationId = null;

        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

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

        // Initial 2D cube (flat square)
        this.createCube('#000000', false, 1.0);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation loop
        this.animate();
    }

    createCube(color, is3D = false, opacity = 1.0) {
        // Remove existing cube
        if (this.cube) {
            this.scene.remove(this.cube);
            this.cube.geometry.dispose();
            this.cube.material.dispose();
        }

        this.is3D = is3D;

        // Geometry
        const geometry = new THREE.BoxGeometry(2, 2, is3D ? 2 : 0.1);

        // Material
        const material = new THREE.MeshPhongMaterial({
            color: color,
            transparent: opacity < 1.0,
            opacity: opacity,
            shininess: 100
        });

        // Mesh
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
    }

    updateColor(color) {
        if (this.cube) {
            this.cube.material.color.set(color);
        }
    }

    updateOpacity(opacity) {
        if (this.cube) {
            this.cube.material.opacity = opacity;
            this.cube.material.transparent = opacity < 1.0;
        }
    }

    enableFill() {
        this.updateOpacity(1.0);
    }

    enable3D() {
        this.createCube(this.cube.material.color.getStyle(), true, this.cube.material.opacity);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Rotate cube
        if (this.cube) {
            this.cube.rotation.x += 0.005;
            this.cube.rotation.y += 0.01;
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
