// Wait for DOM and Three.js to be ready
function init() {
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js is not loaded. Please check your internet connection.');
        setTimeout(init, 100); // Retry after 100ms
        return;
    }

    // Check if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
        return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);

    // Camera setup
    let cameraDistance = 12;
    let cameraRotationX = 1.57; // π/2
    let cameraRotationY = 1.57; // π/2
    // Screen-space translation (CSS transform, not 3D)
    let screenOffsetX = 0;
    let screenOffsetY = 0;
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.01, // Reduced near plane to prevent clipping when zooming in very close
        1000
    );

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
        console.error('Canvas container not found!');
        return;
    }
    canvasContainer.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x89b4fa, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x74c7ec, 0.5);
    pointLight.position.set(-5, -5, -5);
    scene.add(pointLight);

    // Torus parameters
    let innerRadius = 1.5;
    let outerRadius = 3.0;
    let transparency = 0.5;
    let photonSpeed = 1.0; // Default photon speed (logarithmic scale: 0 slider = 1.0, 1 slider = 10.0)

    // Create torus geometry and material
    let torusGeometry = new THREE.TorusGeometry(
        (innerRadius + outerRadius) / 2,
        (outerRadius - innerRadius) / 2,
        32,
        64
    );
    const torusMaterial = new THREE.MeshStandardMaterial({
        color: 0x89b4fa,
        transparent: true,
        opacity: 1 - transparency,
        side: THREE.DoubleSide,
        roughness: 0.3,
        metalness: 0.7
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    scene.add(torus);

    // Add wireframe for better visibility
    const wireframeGeometry = new THREE.TorusGeometry(
        (innerRadius + outerRadius) / 2,
        (outerRadius - innerRadius) / 2,
        32,
        64
    );
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x74c7ec,
        wireframe: true,
        transparent: true,
        opacity: 0.2 * (1 - transparency) // Will be updated when transparency changes
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    wireframe.visible = false; // Hidden by default
    scene.add(wireframe);

    // Prolate spheroid for C-type lemniscate (Viviani's curve)
    // Create initial spheroid geometry (will be updated based on R and r)
    // Prolate spheroid (rugby ball): x²/a² + y²/a² + z²/c² = 1, where c > a
    // R is the length (z-axis), r is the center radius (x, y plane)
    // So: a = r (equatorial/center radius), c = R (polar/length)
    let spheroidGeometry = new THREE.SphereGeometry(1, 32, 32);
    // Scale to make it prolate: scale z-axis by c/a ratio
    spheroidGeometry.scale(1, 1, 1); // Will be updated in updateSpheroid()
    const spheroidMaterial = new THREE.MeshStandardMaterial({
        color: 0x89b4fa,
        transparent: true,
        opacity: 1 - transparency,
        side: THREE.DoubleSide,
        roughness: 0.3,
        metalness: 0.7
    });
    const spheroid = new THREE.Mesh(spheroidGeometry, spheroidMaterial);
    spheroid.visible = false; // Hidden by default (only shown for lemniscate-c)
    scene.add(spheroid);

    // Spheroid wireframe
    let spheroidWireframeGeometry = new THREE.SphereGeometry(1, 32, 32);
    spheroidWireframeGeometry.scale(1, 1, 1); // Will be updated in updateSpheroid()
    const spheroidWireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x74c7ec,
        wireframe: true,
        transparent: true,
        opacity: 0.2 * (1 - transparency) // Will be updated when transparency changes
    });
    const spheroidWireframe = new THREE.Mesh(spheroidWireframeGeometry, spheroidWireframeMaterial);
    spheroidWireframe.visible = false; // Hidden by default
    scene.add(spheroidWireframe);
    
    // S-type: Two side-by-side elongated spheroids
    let spheroidS1Geometry = new THREE.SphereGeometry(1, 32, 32);
    const spheroidS1Material = new THREE.MeshStandardMaterial({
        color: 0x89b4fa,
        transparent: true,
        opacity: 1 - transparency,
        side: THREE.DoubleSide,
        roughness: 0.3,
        metalness: 0.7
    });
    const spheroidS1 = new THREE.Mesh(spheroidS1Geometry, spheroidS1Material);
    spheroidS1.visible = false; // Hidden by default (only shown for lemniscate-s)
    scene.add(spheroidS1);
    
    let spheroidS2Geometry = new THREE.SphereGeometry(1, 32, 32);
    const spheroidS2Material = new THREE.MeshStandardMaterial({
        color: 0x89b4fa,
        transparent: true,
        opacity: 1 - transparency,
        side: THREE.DoubleSide,
        roughness: 0.3,
        metalness: 0.7
    });
    const spheroidS2 = new THREE.Mesh(spheroidS2Geometry, spheroidS2Material);
    spheroidS2.visible = false; // Hidden by default (only shown for lemniscate-s)
    scene.add(spheroidS2);
    
    // S-type wireframes
    let spheroidS1WireframeGeometry = new THREE.SphereGeometry(1, 32, 32);
    const spheroidS1WireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x74c7ec,
        wireframe: true,
        transparent: true,
        opacity: 0.2 * (1 - transparency)
    });
    const spheroidS1Wireframe = new THREE.Mesh(spheroidS1WireframeGeometry, spheroidS1WireframeMaterial);
    spheroidS1Wireframe.visible = false;
    scene.add(spheroidS1Wireframe);
    
    let spheroidS2WireframeGeometry = new THREE.SphereGeometry(1, 32, 32);
    const spheroidS2WireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x74c7ec,
        wireframe: true,
        transparent: true,
        opacity: 0.2 * (1 - transparency)
    });
    const spheroidS2Wireframe = new THREE.Mesh(spheroidS2WireframeGeometry, spheroidS2WireframeMaterial);
    spheroidS2Wireframe.visible = false;
    scene.add(spheroidS2Wireframe);

    // Photon particle - size will be scaled based on torus size
    let photonBaseSize = 0.10;
    let photonGlowBaseSize = 0.15;
    const photonGeometry = new THREE.SphereGeometry(photonBaseSize, 16, 16);
    const photonMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6b6b,
        emissive: 0xff6b6b,
        emissiveIntensity: 1.0
    });
    const photon = new THREE.Mesh(photonGeometry, photonMaterial);
    scene.add(photon);

    // Add glow effect to photon
    const photonGlowGeometry = new THREE.SphereGeometry(photonGlowBaseSize, 16, 16);
    const photonGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6b6b,
        transparent: true,
        opacity: 0.3
    });
    const photonGlow = new THREE.Mesh(photonGlowGeometry, photonGlowMaterial);
    photon.add(photonGlow);
    
    // Second photon for S-type right track
    const photon2Material = new THREE.MeshStandardMaterial({
        color: 0xff6b6b,
        emissive: 0xff6b6b,
        transparent: true,
        opacity: 0.9
    });
    const photon2GlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6b6b,
        transparent: true,
        opacity: 0.3
    });
    const photon2 = new THREE.Mesh(photonGeometry, photon2Material);
    const photon2Glow = new THREE.Mesh(photonGlowGeometry, photon2GlowMaterial);
    photon2.add(photon2Glow);
    photon2.visible = false; // Hidden by default, shown only for S-type
    scene.add(photon2);

    // Trail for photon path - visible even behind torus
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
        vertexColors: true, // Enable vertex colors for per-segment coloring
        transparent: true,
        opacity: 0.9,
        depthTest: false, // Make visible even when behind objects
        depthWrite: false,
        side: THREE.DoubleSide // Ensure lines are visible from both sides
    });
    const trailPoints = [];
    const trailColors = []; // Store colors for each point
    const trailOriginalIndices = []; // Track original sequential index for each point in trailPoints (to detect gaps)
    const trailToroidalAngles = []; // Store toroidal angle for each point (without precession, for trail length tracking)
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    trail.renderOrder = 1000; // Render trails on top to ensure visibility
    scene.add(trail);
    
    // Second trail for right spheroid (S-type mode)
    const trailGeometry2 = new THREE.BufferGeometry();
    const trailMaterial2 = new THREE.LineBasicMaterial({
        vertexColors: true, // Enable vertex colors for per-segment coloring
        transparent: true,
        opacity: 0.9,
        depthTest: false, // Make visible even when behind objects
        depthWrite: false,
        side: THREE.DoubleSide // Ensure lines are visible from both sides
    });
    const trailPoints2 = [];
    const trailColors2 = []; // Store colors for each point
    const trailOriginalIndices2 = []; // Track original sequential index for each point in trailPoints2 (to detect gaps)
    const trailToroidalAngles2 = []; // Store toroidal angle for each point (without precession, for trail length tracking)
    const trail2 = new THREE.Line(trailGeometry2, trailMaterial2);
    trail2.renderOrder = 1000; // Render trails on top to ensure visibility
    scene.add(trail2);
    
    // Helper function to update trail geometry (simple line - WebGL doesn't support linewidth)
    function updateTrailGeometry(points, colors) {
        if (points.length < 2) {
            trailGeometry.setFromPoints([]);
            return;
        }
        
        trailGeometry.setFromPoints(points);
        
        // Set vertex colors
        const colorArray = new Float32Array(points.length * 3);
        for (let i = 0; i < points.length; i++) {
            const color = (colors && colors[i]) ? colors[i] : new THREE.Color(0xffdd00); // Bright yellow
            if (!(color instanceof THREE.Color)) {
                const c = new THREE.Color(color);
                colorArray[i * 3] = c.r;
                colorArray[i * 3 + 1] = c.g;
                colorArray[i * 3 + 2] = c.b;
            } else {
                colorArray[i * 3] = color.r;
                colorArray[i * 3 + 1] = color.g;
                colorArray[i * 3 + 2] = color.b;
            }
        }
        trailGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        trailGeometry.setIndex(null);
    }
    
    // Helper function to update trail2 geometry (for right spheroid in S-type mode)
    function updateTrailGeometry2(points, colors) {
        if (points.length < 2) {
            trailGeometry2.setFromPoints([]);
            return;
        }
        
        trailGeometry2.setFromPoints(points);
        
        // Set vertex colors
        const colorArray = new Float32Array(points.length * 3);
        for (let i = 0; i < points.length; i++) {
            const color = (colors && colors[i]) ? colors[i] : new THREE.Color(0xffdd00); // Bright yellow
            if (!(color instanceof THREE.Color)) {
                const c = new THREE.Color(color);
                colorArray[i * 3] = c.r;
                colorArray[i * 3 + 1] = c.g;
                colorArray[i * 3 + 2] = c.b;
            } else {
                colorArray[i * 3] = color.r;
                colorArray[i * 3 + 1] = color.g;
                colorArray[i * 3 + 2] = color.b;
            }
        }
        trailGeometry2.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        trailGeometry2.setIndex(null);
    }
    
    // Arrow markers on trail to show direction
    const arrowMarkerGeometry = new THREE.BufferGeometry();
    const arrowMarkerMaterial = new THREE.LineBasicMaterial({
        color: 0xff6b6b,
        transparent: true,
        opacity: 0.8,
        linewidth: 2
    });

    // Raycaster for detecting if photon is behind torus
    const raycaster = new THREE.Raycaster();
    
    // Axes with labels
    const axesGroup = new THREE.Group();
    scene.add(axesGroup);
    
    // Function to create axis with labels
    function createAxis(direction, color, label) {
        const axisGroup = new THREE.Group();
        axisGroup.userData.direction = direction;
        axisGroup.userData.color = color;
        axisGroup.userData.label = label;
        return axisGroup;
    }
    
    // Create X, Y, Z axes
    const xAxis = createAxis(new THREE.Vector3(1, 0, 0), 0xff0000, 'X');
    const yAxis = createAxis(new THREE.Vector3(0, 1, 0), 0x00ff00, 'Y');
    const zAxis = createAxis(new THREE.Vector3(0, 0, 1), 0x0000ff, 'Z');
    axesGroup.add(xAxis);
    axesGroup.add(yAxis);
    axesGroup.add(zAxis);
    
    // Function to update axes scale based on R
    function updateAxes(R) {
        const axisLength = 1.5 * R;
        const numTicks = 5;
        
        // Clear existing axis children
        [xAxis, yAxis, zAxis].forEach(axis => {
            while (axis.children.length > 0) {
                const child = axis.children[0];
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat.map) mat.map.dispose();
                            mat.dispose();
                        });
                    } else {
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                }
                axis.remove(child);
            }
        });
        
        // Update each axis
        [xAxis, yAxis, zAxis].forEach(axis => {
            const direction = axis.userData.direction;
            const color = axis.userData.color;
            const label = axis.userData.label;
            
            // Axis line
            const axisGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                direction.clone().multiplyScalar(axisLength)
            ]);
            const axisMaterial = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
            const axisLine = new THREE.Line(axisGeometry, axisMaterial);
            axis.add(axisLine);
            
            // Arrow at the end
            const arrowHelper = new THREE.ArrowHelper(
                direction,
                direction.clone().multiplyScalar(axisLength),
                axisLength * 0.1,
                color,
                axisLength * 0.05,
                axisLength * 0.02
            );
            axis.add(arrowHelper);
            
            // Axis label (X, Y, or Z) at the end
            const labelCanvas = document.createElement('canvas');
            const labelContext = labelCanvas.getContext('2d');
            labelCanvas.width = 64;
            labelCanvas.height = 64;
            // Transparent background
            labelContext.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
            // Light colored text
            labelContext.fillStyle = '#cdd6f4'; // Light text color
            labelContext.font = 'bold 32px Arial';
            labelContext.textAlign = 'center';
            labelContext.textBaseline = 'middle';
            labelContext.fillText(label, labelCanvas.width / 2, labelCanvas.height / 2);
            
            const labelTexture = new THREE.CanvasTexture(labelCanvas);
            const labelSpriteMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
            const labelSprite = new THREE.Sprite(labelSpriteMaterial);
            // Position label just beyond the arrow
            const labelPos = direction.clone().multiplyScalar(axisLength * 1.15);
            labelSprite.position.copy(labelPos);
            labelSprite.scale.set(axisLength * 0.15, axisLength * 0.15, 1);
            axis.add(labelSprite);
            
            // Tick marks and labels
            const tickSize = axisLength * 0.02;
            const tickMaterial = new THREE.LineBasicMaterial({ color: color });
            
            // Determine perpendicular direction for tick marks
            let tickDir;
            if (Math.abs(direction.x) > 0.9) {
                tickDir = new THREE.Vector3(0, 1, 0);
            } else if (Math.abs(direction.y) > 0.9) {
                tickDir = new THREE.Vector3(1, 0, 0);
            } else {
                tickDir = new THREE.Vector3(1, 0, 0);
            }
            
            for (let i = 0; i <= numTicks; i++) {
                const t = i / numTicks; // 0 to 1
                const pos = direction.clone().multiplyScalar(axisLength * t);
                const value = (t * 1.5 * R).toFixed(1);
                
                // Tick mark
                const tickStart = pos.clone().add(tickDir.clone().multiplyScalar(tickSize));
                const tickEnd = pos.clone().add(tickDir.clone().multiplyScalar(-tickSize));
                const tickLine = new THREE.Line(
                    new THREE.BufferGeometry().setFromPoints([tickStart, tickEnd]),
                    tickMaterial
                );
                axis.add(tickLine);
                
                // Label sprite for scale values
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = 128;
                canvas.height = 64;
                // Transparent background
                context.clearRect(0, 0, canvas.width, canvas.height);
                // Light colored text
                context.fillStyle = '#cdd6f4'; // Light text color
                context.font = 'bold 20px Arial';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(value, canvas.width / 2, canvas.height / 2);
                
                const texture = new THREE.CanvasTexture(canvas);
                const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
                const sprite = new THREE.Sprite(spriteMaterial);
                sprite.position.copy(pos);
                sprite.scale.set(axisLength * 0.12, axisLength * 0.06, 1);
                axis.add(sprite);
            }
        });
    }

    // Animation state
    let animationTime = 0;
    let isPaused = false;
    let lastDisplayUpdateTime = 0; // Track last display update time
    const displayUpdateInterval = 500; // Update displays every 500ms (twice per second)
    let trailLengthRotations = 1.0; // Trail length in toroidal rotations (default 1 rotation)
    let precession = 0.0; // Precession parameter (default 0, no precession)
    let particleType = 'electron'; // 'electron' or 'positron'
    let windingRatio = '1:2'; // '2:1' (2π toroidal, 4π poloidal) or '1:2' (4π toroidal, 2π poloidal)
    let spinDirection = -1; // -1 for forward (clockwise), 1 for reverse (counter-clockwise)
    let pathMode = 'torus'; // 'torus', 'lemniscate-s', or 'lemniscate-c'
    
    // Fine structure constant (α ≈ 1/137.036)
    const FINE_STRUCTURE_CONSTANT = 1 / 137.035999084;
    
    // Accumulated field vectors
    // Field vectors (for loop-based averaging)
    let accumulatedElectricField = new THREE.Vector3(0, 0, 0);
    let accumulatedMagneticField = new THREE.Vector3(0, 0, 0);
    let fieldSampleCount = 0;
    
    // Stored averages from last completed cycle (only updated when cycle completes)
    let lastCompletedAvgElectricField = new THREE.Vector3(0, 0, 0);
    let lastCompletedAvgMagneticField = new THREE.Vector3(0, 0, 0);
    
    // Momentum vectors (for loop-based averaging)
    let accumulatedLinearMomentum = new THREE.Vector3(0, 0, 0);
    let accumulatedToroidalAngularMomentum = new THREE.Vector3(0, 0, 0);
    let accumulatedPoloidalAngularMomentum = new THREE.Vector3(0, 0, 0);
    let accumulatedTotalAngularMomentum = new THREE.Vector3(0, 0, 0);
    let momentumSampleCount = 0;
    let lastToroidalAngle = 0; // Track toroidal angle to detect loop completion
    let angleAtCycleStart = 0; // Track angle when current cycle started
    
    // Stored averages from last completed cycle (only updated when cycle completes)
    let lastCompletedAvgLinearMomentum = new THREE.Vector3(0, 0, 0);
    let lastCompletedAvgToroidalAngularMomentum = new THREE.Vector3(0, 0, 0);
    let lastCompletedAvgPoloidalAngularMomentum = new THREE.Vector3(0, 0, 0);
    let lastCompletedAvgTotalAngularMomentum = new THREE.Vector3(0, 0, 0);
    
    // Photon colors
    const photonColorVisible = 0xff6b6b; // Red when visible
    const photonColorObstructed = 0x8888ff; // Blue when behind torus

    // ============================================================================
    // TORUS MODE: Original WVdM style helix on a torus
    // ============================================================================
    
    // Calculate photon position on torus
    function getTorusPosition(t, majorRadius, minorRadius, useAnimationTime = false) {
        // Parametric equations for torus (standard torus parameterization)
        // majorRadius is the distance from center of torus to center of tube
        // minorRadius is the radius of the tube
        // These equations guarantee the point is always on the torus surface
        
        // Apply precession: modifies the effective rotation rates
        // If precession = 0.1, the pattern repeats after 10 cycles (1/precession)
        // This creates a spirograph-like effect where the path slowly precesses
        // Use animationTime directly (not wrapped t) so precession accumulates continuously
        // Winding ratios:
        //  2:1 mode: u = 2π toroidal, v = 4π poloidal (2:1 winding)
        //  1:2 mode: u = 4π toroidal, v = 2π poloidal (1:2 winding)
        const timeParam = useAnimationTime ? animationTime : t;
        let uToroidal, vPoloidal;
        if (windingRatio === '1:2') {
            // 1:2 winding: 4π toroidal, 2π poloidal
            uToroidal = 4 * Math.PI;
            vPoloidal = 2 * Math.PI;
        } else {
            // 2:1 winding: 2π toroidal, 4π poloidal (default)
            uToroidal = 2 * Math.PI;
            vPoloidal = 4 * Math.PI;
        }
        const u = timeParam * uToroidal * (1 + precession) * spinDirection; // Angle around the major radius (toroidal) with precession and spin direction
        const v = timeParam * vPoloidal * (1 + precession * 2) * spinDirection; // Angle around the minor radius (poloidal) with 2× precession and spin direction
        
        // Standard torus parametric equations
        // Distance from center in xy-plane: majorRadius + minorRadius * cos(v)
        // This ranges from (majorRadius - minorRadius) to (majorRadius + minorRadius)
        // Which matches innerRadius to outerRadius exactly
        const x = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
        const y = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
        const z = minorRadius * Math.sin(v);
        
        return new THREE.Vector3(x, y, z);
    }
    
    // ============================================================================
    // LEMNISCATE MODE: Figure-8 curve in body frame, precessed in 3D
    // ============================================================================
    
    // ============================================================================
    // LEMNISCATE MODE: Gerono Lemniscate (Figure-8) - S and C variants
    // ============================================================================
    
    // t in [0, 2*Math.PI]
    // R = outer radius, r = inner radius
    function getStripPosition_S(t, R, r) {
        // S-type curve in body frame (legacy function, may not be used)
        const cosT = Math.cos(t);
        const sinT = Math.sin(t);
        const sinT2 = sinT * sinT;
        const denom = 1 + sinT2; // 1 + sin^2(t)

        // x–y figure-8 (lemniscate)
        const x = R * cosT / denom;
        const y = R * sinT * cosT / denom;

        // z profile
        const z = (R - r) * cosT;

        return { x, y, z };
    }
    
    // Get base left S-curve position (no precession)
    function getSLeftBase(animationTime, spinDirection, minorAxis, majorAxis) {
        const a = minorAxis;
        const c = majorAxis;
        
        const basePhase = animationTime * 4 * Math.PI * spinDirection;
        const uNormalized = ((basePhase % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
        
        const x0 = a * (1 + Math.cos(uNormalized)) / 2 - a;
        const y0 = c * Math.sin(uNormalized / 2);
        const z0 = a * Math.sin(uNormalized) / 2;
        
        return { x0, y0, z0, uNormalized };
    }
    
    // Get base right S-curve position (no precession)
    function getSRightBase(animationTime, spinDirection, minorAxis, majorAxis) {
        const a = minorAxis;
        const c = majorAxis;
        
        const u = animationTime * 4 * Math.PI * spinDirection;
        const uNormalized = ((u % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
        
        const uReversed = (4 * Math.PI - uNormalized + 2 * Math.PI) % (4 * Math.PI);
        if (uReversed < 0) uReversed += 4 * Math.PI;
        
        const x_body = a * (1 + Math.cos(uReversed)) / 2;
        const z_body = a * Math.sin(uReversed) / 2;
        const y_body = c * Math.sin(uReversed / 2);
        
        const x0 = -x_body + a;  // final right track, no precession
        const y0 = y_body;
        const z0 = -z_body;
        
        return { x0, y0, z0, uNormalized, uReversed };
    }
    
    // Get right S-curve position with precession
    function getSRightPrecessed(animationTime, spinDirection, minorAxis, majorAxis, precession) {
        const a = minorAxis;
        const c = majorAxis;
        
        const p = precession;
        const k = p > 0 ? 1 / p : 1;
        const totalLength = 4 * Math.PI * k;
        
        const rawPhase = animationTime * 4 * Math.PI * spinDirection;
        const multiPhase = ((rawPhase % totalLength) + totalLength) % totalLength;
        
        // Local S-lap phase for visibility etc.
        const uS = multiPhase % (4 * Math.PI);
        
        // Get base right-curve position using uS
        // We want the same geometry as getSRightBase would give for uNormalized = uS.
        let uReversed = (4 * Math.PI - uS + 2 * Math.PI) % (4 * Math.PI);
        if (uReversed < 0) uReversed += 4 * Math.PI;
        
        const x_body = a * (1 + Math.cos(uReversed)) / 2;
        const z_body = a * Math.sin(uReversed) / 2;
        const y_body = c * Math.sin(uReversed / 2);
        
        const x0 = -x_body + a;  // as in getSRightBase
        const y0 = y_body;
        const z0 = -z_body;
        
        // Precession angle:
        // Same rule as left:
        //   theta = (p * multiPhase) / 2
        // Check:
        //   Over one S-lap: ΔmultiPhase = 4*pi -> Δtheta = p * 4*pi / 2 = 2*pi * p
        //   Over full multitrack: ΔmultiPhase = 4*pi/p -> Δtheta = p * (4*pi/p) / 2 = 2*pi
        const theta = (p * multiPhase) / 2;
        
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        
        // Rotate around global Y axis (through y=0), as with left loop
        const x = x0 * cosT + z0 * sinT;
        const y = y0;
        const z = -x0 * sinT + z0 * cosT;
        
        return { x, y, z, multiPhase };
    }
    
    // Get left S-curve position with precession
    function getSLeftPrecessed(animationTime, spinDirection, minorAxis, majorAxis, precession) {
        const a = minorAxis;
        const c = majorAxis;
        
        // Handle p = 0 as a special case: single lap, no precession.
        const p = precession;
        const k = p > 0 ? 1 / p : 1;       // number of laps to close the pattern
        const totalLength = 4 * Math.PI * k;  // L = 4π/p (or 4π if p = 0)
        
        // Multi-track phase that wraps over totalLength
        const rawPhase = animationTime * 4 * Math.PI * spinDirection;
        const multiPhase = ((rawPhase % totalLength) + totalLength) % totalLength;
        
        // Local S-lap phase uNormalized ∈ [0, 4π)
        const uNormalized = multiPhase % (4 * Math.PI);
        
        // Base left-curve position for this uNormalized
        const xLeftCentered = a * (1 + Math.cos(uNormalized)) / 2;  // without the "-a" shift
        const yLeftBase = c * Math.sin(uNormalized / 2);
        const zLeftBase = a * Math.sin(uNormalized) / 2;
        
        // Shift to center at x = -a as before (we'll apply rotation relative to this shifted center)
        const x0 = xLeftCentered - a;
        const y0 = yLeftBase;
        const z0 = zLeftBase;
        
        // Precession angle:
        // We want:
        //   - Over one S-lap (Δu = 4π), the left loop rotates by Δθ = 2π * p
        //   - Over the full multitrack length L = 4π/p, the total rotation is Δθ_total = 2π
        //
        // multiPhase runs from 0 to 4π*k = 4π/p over one full multi-track.
        // Choose:
        //   theta = (p * multiPhase) / 2
        //
        // Check:
        //   When multiPhase increases by 4π (one lap), Δtheta = p * 4π / 2 = 2π * p  ✅
        //   When multiPhase increases by 4π/p (full multi-track), Δtheta = p * (4π/p) / 2 = 2π  ✅
        const theta = (p * multiPhase) / 2;
        
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        
        // Rotate around global Y axis (x,z) -> (x',z'), keep y unchanged.
        const xRot = x0 * cosT + z0 * sinT;
        const yRot = y0;
        const zRot = -x0 * sinT + z0 * cosT;
        
        return { x: xRot, y: yRot, z: zRot, multiPhase };
    }
    
    function getSLemniscateLabFrame(t, R, r, precessionValue = 0) {
        // Match updateSSpheroids() to ensure consistency
        // Allow r to be any value >= 0.1, and allow r > R for oblate spheroids
        const safeR = Math.max(0.1, R);
        const safer = Math.max(0.1, r);
        
        // Spheroid parameters (matching updateSSpheroids() exactly)
        // The spheroid scales the Y-axis, so:
        // - Final spheroid: radius a in x and z, radius c in y
        // - When r > R (oblate): a > c, so spheroid is wider than tall
        // - When r < R (prolate): a < c, so spheroid is taller than wide
        const a = safer; // Equatorial radius (x-z plane, horizontal)
        const c = safeR; // Polar radius (y-axis, vertical)
        
        // Standard Viviani curve equations for "C" type in body frame:
        const cosT = Math.cos(t);
        const sinT = Math.sin(t);
        const halfT = 0.5 * t;
        
        // Calculate curve directly in lab frame (no transformations needed)
        // Standard Viviani curve equations for "C" type:
        // x = a·(1 + cos(t))/2  (figure-8 in x-z plane)
        // z = a·sin(t)/2  (figure-8 in x-z plane)
        // y = c·sin(t/2)  (vertical, elongated dimension)
        const x = a * (1 + cosT) / 2;
        const z = a * sinT / 2;
        const y = c * Math.sin(halfT);
        
        // Apply precession as a rotation about Y-axis (vertical)
        // This rotates the figure-8 pattern in the x-z plane
        // Precession angle: psi = precessionValue * t
        const psi = precessionValue * t;
        const cosPsi = Math.cos(psi);
        const sinPsi = Math.sin(psi);
        
        // Rotate about Y-axis (precession rotates the x-z figure-8)
        const xLab = x * cosPsi + z * sinPsi;
        const yLab = y; // Y stays the same (rotation axis)
        const zLab = -x * sinPsi + z * cosPsi;
        
        // Shift curve to the left by r on X axis (for left spheroid)
        return { x: xLab - safer, y: yLab, z: zLab };
    }
    
    function getStripPosition_C(t, R, r) {
        // C type: Viviani's curve on a spheroid
        // This function returns the curve in BODY FRAME (for compatibility with existing code)
        // The actual lab frame calculation is done in getVivianiCurveLabFrame()
        
        // Match updateSpheroid() to ensure consistency
        // Allow r to be any value >= 0.1, and allow r > R for oblate spheroids
        const safeR = Math.max(0.1, R);
        const safer = Math.max(0.1, r);
        
        // Spheroid parameters (matching updateSpheroid() exactly)
        const a = safer; // Equatorial radius (x-z plane, horizontal) - minor axis
        const c = safeR; // Polar radius (y-axis, vertical) - major axis
        
        // Standard Viviani curve equations for "C" type:
        // In our coordinate system, the spheroid is elongated along y-axis
        // The figure-8 is in the x-z plane, and y is the vertical (elongated) dimension
        // x = a·(1 + cos(t))/2  (figure-8 in x-z plane)
        // z = a·sin(t)/2  (figure-8 in x-z plane)
        // y = c·sin(t/2)  (vertical, elongated dimension)
        
        const cosT = Math.cos(t);
        const sinT = Math.sin(t);
        const halfT = 0.5 * t;
        
        // Viviani curve in x-z plane (horizontal figure-8)
        const x = a * (1 + cosT) / 2;
        const z = a * sinT / 2;
        
        // Vertical coordinate (elongated dimension) - this creates the pole crossings
        const y = c * Math.sin(halfT);
        
        return { x, y, z };
    }
    
    // Calculate Viviani curve directly in LAB FRAME (aligned with spheroid)
    // This ensures the curve lies on the spheroid surface without transformation issues
    // u: normalized curve parameter [0, 4π)
    // theta: precession angle (rotation about Y-axis)
    function getVivianiCurveLabFrame(u, R, r, theta = 0) {
        // Match updateSpheroid() to ensure consistency
        // Allow r to be any value >= 0.1, and allow r > R for oblate spheroids
        const safeR = Math.max(0.1, R);
        const safer = Math.max(0.1, r);
        
        // Spheroid parameters (matching updateSpheroid() exactly)
        // The spheroid has: radius a in x and z, radius c in y
        // When r > R (oblate): a > c, spheroid is wider than tall
        // When r < R (prolate): a < c, spheroid is taller than wide
        const a = safer; // Equatorial radius (x-z plane, horizontal)
        const c = safeR; // Polar radius (y-axis, vertical)
        
        // Standard Viviani curve equations for "C" type (body frame)
        // The curve must lie on the spheroid: x²/a² + y²/c² + z²/a² = 1
        // u is normalized to [0, 4π) for one lemniscate lap
        const cosU = Math.cos(u);
        const sinU = Math.sin(u);
        const halfU = 0.5 * u;
        
        // Base curve in body frame
        // x0 = a·(1 + cos(u))/2  (figure-8 in x-z plane, ranges from 0 to a)
        // z0 = a·sin(u)/2  (figure-8 in x-z plane, ranges from -a/2 to a/2)
        // y0 = c·sin(u/2)  (vertical, ranges from -c to c)
        // These equations satisfy x²/a² + y²/c² + z²/a² = 1 for all a, c
        const x0 = a * (1 + cosU) / 2;
        const z0 = a * sinU / 2;
        const y0 = c * Math.sin(halfU);
        
        // Rotate body-frame coordinates into lab frame by Y-axis rotation
        // Precession angle theta grows linearly with t (unbounded parameter)
        const cx = Math.cos(theta);
        const sx = Math.sin(theta);
        const xLab = x0 * cx + z0 * sx;
        const yLab = y0; // Y stays the same (rotation axis)
        const zLab = -x0 * sx + z0 * cx;
        
        return { x: xLab, y: yLab, z: zLab };
    }
    
    // Get figure-8 position in body frame
    // Parameter u should be in [0, 4π) to cover the full figure-8
    function getFigure8BodyPosition(u, R, r, mode) {
        // Normalize u to [0, 4π)
        const uNorm = ((u % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
        
        let pos;
        if (mode === 'lemniscate-s') {
            // S type: t wraps at 2π, so we need 2 full cycles of t to cover 4π of u
            const t = uNorm % (2 * Math.PI);
            pos = getStripPosition_S(t, R, r);
        } else { // 'lemniscate-c' (Viviani's curve)
            // C type: Viviani's curve needs t ∈ [0, 4π] directly, no wrapping
            const t = uNorm; // Use u directly, t ∈ [0, 4π]
            pos = getStripPosition_C(t, R, r);
        }
        
        return new THREE.Vector3(pos.x, pos.y, pos.z);
    }
    
    // Get figure-8 position in lab frame with precession
    // For C-type (Viviani curve): Calculate directly in lab frame to align with spheroid
    // For S-type: Use getSLeftBase/getSLeftPrecessed or getSRightBase/getSRightPrecessed functions
    function getFigure8Position(t, R, r, mode, useAnimationTime = false) {
        const timeParam = useAnimationTime ? animationTime : t;
        
        // Figure-8 mode uses 4π for the major path (similar to 1:2 winding)
        // For C-type (Viviani curve), the parameter t goes from 0 to 2π for one full cycle
        // To match the visual speed with torus (which uses 4π for 1:2 mode), we need to double the speed
        let u;
        if (mode === 'lemniscate-c') {
            // C-type: Viviani curve completes one cycle in 2π parameter range
            // To match torus 1:2 mode visual speed (4π range), we double the parameter speed
            // Parameter t can grow beyond 4π to trace multiple laps
            const t = timeParam * 2 * 4 * Math.PI * spinDirection; // Unbounded parameter
            // Lemniscate phase: normalize t to [0, 4π) for curve parameterization
            const u = ((t % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
            // Precession angle: grows linearly with t
            // After one 4π lap, theta advances by 2π * precession
            const theta = spinDirection * (precession / 2) * t;
            const pos = getVivianiCurveLabFrame(u, R, r, theta);
            return new THREE.Vector3(pos.x, pos.y, pos.z);
        } else {
            // S-type: Use precession functions for left track
            if (precession === 0) {
                const leftBase = getSLeftBase(timeParam, spinDirection, r, R);
                return new THREE.Vector3(leftBase.x0, leftBase.y0, leftBase.z0);
            } else {
                const leftPrecessed = getSLeftPrecessed(timeParam, spinDirection, r, R, precession);
                return new THREE.Vector3(leftPrecessed.x, leftPrecessed.y, leftPrecessed.z);
            }
        }
    }
    
    // ============================================================================
    // UNIFIED POSITION FUNCTION: Dispatches to mode-specific implementations
    // ============================================================================
    
    // Unified function to get photon position based on current path mode
    // This allows momentum and field calculations to work without knowing the mode
    function getPhotonPosition(t, majorRadius, minorRadius, useAnimationTime = false) {
        if (pathMode === 'lemniscate-s' || pathMode === 'lemniscate-c') {
            // In figure-8 mode: use R (outer radius) and r (inner radius) directly
            // For torus: majorRadius = (innerRadius + outerRadius) / 2, minorRadius = (outerRadius - innerRadius) / 2
            // So: outerRadius = majorRadius + minorRadius = R, innerRadius = majorRadius - minorRadius = r
            // BUT: When r > R (oblate), this conversion is wrong! We need to handle it differently.
            // For lemniscates, we should use innerRadius and outerRadius directly from the global variables
            // to avoid the conversion error when r > R
            const R = outerRadius; // Use outerRadius directly (may be smaller than innerRadius when oblate)
            const r = Math.max(0.1, innerRadius); // Use innerRadius directly (may be larger than outerRadius when oblate)
            return getFigure8Position(t, R, r, pathMode, useAnimationTime);
        } else {
            // Torus mode (default)
            return getTorusPosition(t, majorRadius, minorRadius, useAnimationTime);
        }
    }

    // Update camera position
    // Simple spherical coordinate conversion
    // Camera Rotation Y: azimuth angle (works perfectly)
    // Camera Rotation X: polar angle from +Y axis
    function updateCamera() {
        // Standard spherical to Cartesian conversion
        // This is the mathematically correct formula
        
        // Normalize X to [0, 2π) to determine hemisphere
        let normalizedX = cameraRotationX % (2 * Math.PI);
        if (normalizedX < 0) normalizedX += 2 * Math.PI;
        
        // Determine if we're in the back hemisphere (X in [π, 2π))
        const isBackHemisphere = normalizedX > Math.PI;
        
        // Flip camera up vector when in back hemisphere to maintain correct orientation
        if (isBackHemisphere) {
            camera.up.set(0, -1, 0);
        } else {
            camera.up.set(0, 1, 0);
        }
        
        // Use original spherical coordinate formula
        let x = Math.sin(cameraRotationX) * Math.cos(cameraRotationY);
        let y = Math.cos(cameraRotationX);
        let z = Math.sin(cameraRotationX) * Math.sin(cameraRotationY);
        
        // Scale by distance
        x = x * cameraDistance;
        y = y * cameraDistance;
        z = z * cameraDistance;
        
        camera.position.set(x, y, z);
        camera.lookAt(0, 0, 0);
    }

    // Update torus geometry
    function updateTorus() {
        // Ensure outerRadius is always greater than innerRadius for valid geometry
        // When innerRadius is negative, this allows interesting shapes
        const effectiveInnerRadius = Math.min(innerRadius, outerRadius - 0.1);
        
        const majorRadius = (effectiveInnerRadius + outerRadius) / 2;
        const minorRadius = (outerRadius - effectiveInnerRadius) / 2;
        
        // Ensure minimum values for valid geometry
        const safeMajorRadius = Math.max(0.1, majorRadius);
        const safeMinorRadius = Math.max(0.1, minorRadius);
        
        // Update main torus
        torus.geometry.dispose();
        torus.geometry = new THREE.TorusGeometry(safeMajorRadius, safeMinorRadius, 32, 64);
        
        // Update wireframe
        wireframe.geometry.dispose();
        wireframe.geometry = new THREE.TorusGeometry(safeMajorRadius, safeMinorRadius, 32, 64);
        
        // Update material opacity (0 = solid, 1 = invisible)
        torusMaterial.opacity = 1 - transparency;
        // Wireframe disappears at transparency = 0, becomes more visible as transparency increases
        wireframeMaterial.opacity = transparency > 0 ? 0.2 * (1 - transparency) : 0;
        
        // Update axes scale based on outer radius
        updateAxes(outerRadius);
        
        // Clear trail when torus geometry changes to avoid old points extending beyond new bounds
        trailPoints.length = 0;
        trailColors.length = 0;
        trailOriginalIndices.length = 0;
        trailToroidalAngles.length = 0;
        if (trailPoints.length > 1) {
            trailGeometry.setFromPoints(trailPoints);
        }
    }

    // Update two side-by-side spheroids for S-type lemniscate
    // Two elongated spheroids positioned side-by-side
    function updateSSpheroids() {
        // For spheroid: a = r (equatorial/center radius), c = R (polar/length)
        // Calculate from innerRadius and outerRadius
        // Allow r to be any value >= 0.1, and allow r > R for oblate spheroids
        const R = outerRadius; // Major axis (polar/length dimension)
        const r = Math.max(0.1, innerRadius); // Minor axis (equatorial radius)
        const a = r; // Equatorial radius
        const c = R; // Polar radius
        
        // Ensure minimum values for valid geometry
        const safeA = Math.max(0.1, a);
        const safeC = Math.max(0.1, c);
        // Allow squashing: if r < R, then a < c (prolate/elongated)
        // If r > R, then a > c (oblate/squashed) - use c/a for yScale
        const finalC = safeC; // Use actual value, don't force elongation
        
        // Calculate y-axis scale factor
        // If finalC > safeA: yScale > 1 (elongated/prolate)
        // If finalC < safeA: yScale < 1 (squashed/oblate)
        const yScale = finalC / safeA;
        
        // Spheroid dimensions: width = 2*a, height = 2*c
        // Position them side-by-side, touching at the center
        const spheroidWidth = 2 * safeA;
        const totalWidth = 2 * spheroidWidth; // No gap - spheroids touch at center
        
        // Update first spheroid (left side)
        spheroidS1.geometry.dispose();
        spheroidS1.geometry = new THREE.SphereGeometry(safeA, 32, 32);
        spheroidS1.scale.set(1, yScale, 1);
        spheroidS1.position.set(-totalWidth / 2 + spheroidWidth / 2, 0, 0);
        spheroidS1.updateMatrix();
        
        // Update first spheroid wireframe
        spheroidS1Wireframe.geometry.dispose();
        spheroidS1Wireframe.geometry = new THREE.SphereGeometry(safeA, 32, 32);
        spheroidS1Wireframe.scale.set(1, yScale, 1);
        spheroidS1Wireframe.position.set(-totalWidth / 2 + spheroidWidth / 2, 0, 0);
        spheroidS1Wireframe.updateMatrix();
        
        // Update second spheroid (right side)
        spheroidS2.geometry.dispose();
        spheroidS2.geometry = new THREE.SphereGeometry(safeA, 32, 32);
        spheroidS2.scale.set(1, yScale, 1);
        spheroidS2.position.set(totalWidth / 2 - spheroidWidth / 2, 0, 0);
        spheroidS2.rotation.z = Math.PI; // Rotate 180 degrees around minor axis (Z-axis)
        spheroidS2.updateMatrix();
        
        // Update second spheroid wireframe
        spheroidS2Wireframe.geometry.dispose();
        spheroidS2Wireframe.geometry = new THREE.SphereGeometry(safeA, 32, 32);
        spheroidS2Wireframe.scale.set(1, yScale, 1);
        spheroidS2Wireframe.position.set(totalWidth / 2 - spheroidWidth / 2, 0, 0);
        spheroidS2Wireframe.rotation.z = Math.PI; // Rotate 180 degrees around minor axis (Z-axis)
        spheroidS2Wireframe.updateMatrix();
        
        // Update material opacity
        spheroidS1Material.opacity = 1 - transparency;
        spheroidS2Material.opacity = 1 - transparency;
        spheroidS1WireframeMaterial.opacity = transparency > 0 ? 0.2 * (1 - transparency) : 0;
        spheroidS2WireframeMaterial.opacity = transparency > 0 ? 0.2 * (1 - transparency) : 0;
        
        // Update axes scale based on outer radius
        updateAxes(outerRadius);
        
        // Clear trail when geometry changes
        trailPoints.length = 0;
        trailColors.length = 0;
        trailOriginalIndices.length = 0;
        trailToroidalAngles.length = 0;
        // Also clear trail2 for S-type
        trailPoints2.length = 0;
        trailColors2.length = 0;
        trailOriginalIndices2.length = 0;
        trailToroidalAngles2.length = 0;
        if (trailPoints.length > 1) {
            trailGeometry.setFromPoints(trailPoints);
        }
        if (trailPoints2.length > 1) {
            trailGeometry2.setFromPoints(trailPoints2);
        }
    }
    
    // Update spheroid geometry for C-type lemniscate (Viviani's curve)
    // Prolate spheroid (rugby ball): R is the length (z-axis), r is the center radius (x, y plane)
    function updateSpheroid() {
        // For spheroid: a = r (equatorial/center radius in x, y plane), c = R (polar/length in z axis)
        // Calculate from innerRadius and outerRadius
        // Allow r to be any value >= 0.1, and allow r > R for oblate spheroids
        const R = outerRadius; // Major axis (polar/length in z axis)
        const r = Math.max(0.1, innerRadius); // Minor axis (equatorial radius in x, y plane)
        const a = r; // Equatorial radius (x, y plane) - the "center radius"
        const c = R; // Polar radius (z axis) - the "length"
        
        // Ensure minimum values for valid geometry
        const safeA = Math.max(0.1, a);
        const safeC = Math.max(0.1, c);
        
        // Allow both prolate (elongated) and oblate (squashed) spheroids
        // If c > a: prolate (elongated along z-axis)
        // If c < a: oblate (squashed/flattened along z-axis)
        const finalC = safeC; // Use actual value, don't force elongation
        
        // Update main spheroid
        // For prolate spheroid: a = r (equatorial radius in x-y plane), c = R (polar radius along z-axis)
        // Create sphere with radius = a, then scale z-axis by c/a to elongate it
        // Since c > a for prolate, zScale > 1, making it taller than wide
        
        spheroid.geometry.dispose();
        // Create base sphere with radius a (equatorial radius)
        spheroid.geometry = new THREE.SphereGeometry(safeA, 32, 32);
        
        // Calculate y-axis scale factor: c/a
        // When c > a (prolate): yScale > 1, spheroid is taller than wide
        // When c < a (oblate): yScale < 1, spheroid is wider than tall
        const yScale = finalC / safeA;
        
        // Apply scale to mesh: scale the y-axis
        // Final spheroid: radius a in x and z, radius c in y
        // This matches the curve which uses a for x,z and c for y
        spheroid.scale.set(1, yScale, 1);
        spheroid.updateMatrix(); // Ensure the scale is applied
        
        // Update wireframe with same scaling
        spheroidWireframe.geometry.dispose();
        spheroidWireframe.geometry = new THREE.SphereGeometry(safeA, 32, 32);
        spheroidWireframe.scale.set(1, yScale, 1);
        spheroidWireframe.updateMatrix(); // Ensure the scale is applied
        
        // Update material opacity (0 = solid, 1 = invisible)
        spheroidMaterial.opacity = 1 - transparency;
        // Wireframe disappears at transparency = 0, becomes more visible as transparency increases
        spheroidWireframeMaterial.opacity = transparency > 0 ? 0.2 * (1 - transparency) : 0;
        
        // Update axes scale based on outer radius
        updateAxes(outerRadius);
        
        // Clear trail when spheroid geometry changes to avoid old points extending beyond new bounds
        trailPoints.length = 0;
        trailColors.length = 0;
        trailOriginalIndices.length = 0;
        trailToroidalAngles.length = 0;
        if (trailPoints.length > 1) {
            trailGeometry.setFromPoints(trailPoints);
        }
    }

    // Helper function to update the appropriate geometry based on path mode
    function updateGeometry() {
        if (pathMode === 'lemniscate-c') {
            updateSpheroid();
        } else if (pathMode === 'lemniscate-s') {
            updateSSpheroids();
        } else {
            updateTorus();
        }
    }

    // Helper function to update visibility of torus vs spheroid based on path mode
    function updateGeometryVisibility() {
        if (pathMode === 'lemniscate-c') {
            // Show single spheroid for C-type, hide torus and S-type spheroids
            torus.visible = false;
            wireframe.visible = false;
            spheroid.visible = true;
            spheroidWireframe.visible = controls.showWireframe ? controls.showWireframe.checked : false;
            spheroidS1.visible = false;
            spheroidS1Wireframe.visible = false;
            spheroidS2.visible = false;
            spheroidS2Wireframe.visible = false;
            // Show only first trail, photon, and vectors for C-type
            trail.visible = true;
            trail2.visible = false;
            photon.visible = true; // Ensure photon is visible when switching from S-type
            photon2.visible = false;
            // E/M arrows visibility controlled by checkbox
            const showVectors = controls.showFieldAndMomentumVectors ? controls.showFieldAndMomentumVectors.checked : true;
            electricFieldArrow.visible = showVectors;
            magneticFieldArrow.visible = showVectors;
            electricFieldArrow2.visible = false;
            magneticFieldArrow2.visible = false;
        } else if (pathMode === 'lemniscate-s') {
            // Show two spheroids for S-type, hide torus and C-type spheroid
            torus.visible = false;
            wireframe.visible = false;
            spheroid.visible = false;
            spheroidWireframe.visible = false;
            spheroidS1.visible = true;
            spheroidS1Wireframe.visible = controls.showWireframe ? controls.showWireframe.checked : false;
            spheroidS2.visible = true;
            spheroidS2Wireframe.visible = controls.showWireframe ? controls.showWireframe.checked : false;
            // Show both trails, photons, and vectors for S-type
            trail.visible = true;
            trail2.visible = true;
            photon2.visible = true;
            // E/M arrows visibility controlled by checkbox
            const showVectors = controls.showFieldAndMomentumVectors ? controls.showFieldAndMomentumVectors.checked : true;
            electricFieldArrow.visible = showVectors;
            magneticFieldArrow.visible = showVectors;
            electricFieldArrow2.visible = showVectors;
            magneticFieldArrow2.visible = showVectors;
        } else {
            // Show torus, hide all spheroids
            torus.visible = true;
            wireframe.visible = controls.showWireframe ? controls.showWireframe.checked : false;
            spheroid.visible = false;
            spheroidWireframe.visible = false;
            spheroidS1.visible = false;
            spheroidS1Wireframe.visible = false;
            spheroidS2.visible = false;
            spheroidS2Wireframe.visible = false;
            // Show only first trail for torus mode
            trail.visible = true;
            trail2.visible = false;
            // Ensure photon is visible when switching from S-type
            photon.visible = true;
            // E/M arrows visibility controlled by checkbox
            const showVectors = controls.showFieldAndMomentumVectors ? controls.showFieldAndMomentumVectors.checked : true;
            electricFieldArrow.visible = showVectors;
            magneticFieldArrow.visible = showVectors;
            electricFieldArrow2.visible = false;
            magneticFieldArrow2.visible = false;
        }
    }

    // Field vector arrows - size will be scaled based on torus size
    let arrowBaseLength = 0.8;
    let arrowBaseHeadLength = 0.3;
    let arrowBaseHeadWidth = 0.2;
    const electricFieldColor = 0x00ff00; // Green
    const magneticFieldColor = 0x0088ff; // Blue
    
    // Calculate scale factor based on torus size (use a reference major radius of ~2.25 for default)
    function getScaleFactor(majorRadius) {
        const referenceMajorRadius = 2.25; // Approximate default major radius
        return Math.max(0.5, Math.min(10, majorRadius / referenceMajorRadius));
    }
    
    let electricFieldArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        arrowBaseLength,
        electricFieldColor,
        arrowBaseHeadLength,
        arrowBaseHeadWidth
    );
    let magneticFieldArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        arrowBaseLength,
        magneticFieldColor,
        arrowBaseHeadLength,
        arrowBaseHeadWidth
    );
    scene.add(electricFieldArrow);
    scene.add(magneticFieldArrow);
    
    // Second set of field arrows for S-type right track
    let electricFieldArrow2 = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        arrowBaseLength,
        electricFieldColor,
        arrowBaseHeadLength,
        arrowBaseHeadWidth
    );
    electricFieldArrow2.visible = false; // Hidden by default, shown only for S-type
    scene.add(electricFieldArrow2);
    
    let magneticFieldArrow2 = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        arrowBaseLength,
        magneticFieldColor,
        arrowBaseHeadLength,
        arrowBaseHeadWidth
    );
    magneticFieldArrow2.visible = false; // Hidden by default, shown only for S-type
    scene.add(magneticFieldArrow2);
    
    // Function to update arrow direction and position
    function updateArrow(arrow, direction, position, color, scaleFactor = 1) {
        // Remove old arrow from scene
        scene.remove(arrow);
        // Dispose of geometry and materials
        arrow.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        
        // Create new arrow with scaled size
        arrow = new THREE.ArrowHelper(
            direction,
            position,
            arrowBaseLength * scaleFactor,
            color,
            arrowBaseHeadLength * scaleFactor,
            arrowBaseHeadWidth * scaleFactor
        );
        scene.add(arrow);
        
        return arrow;
    }
    

    // Control handlers
    const controls = {
        transparency: document.getElementById('transparency'),
        innerRadius: document.getElementById('innerRadius'),
        outerRadius: document.getElementById('outerRadius'),
        photonSpeed: document.getElementById('photonSpeed'),
        trailLength: document.getElementById('trailLength'),
        precession: document.getElementById('precession'),
        cameraDistance: document.getElementById('cameraDistance'),
        cameraRotationX: document.getElementById('cameraRotationX'),
        cameraRotationY: document.getElementById('cameraRotationY'),
        resetCamera: document.getElementById('resetCamera'),
        resetFields: document.getElementById('resetFields'),
        clearTrack: document.getElementById('clearTrack'),
        pausePlay: document.getElementById('pausePlay'),
        pathMode: document.getElementById('pathMode'),
        particleType: document.getElementById('particleType'),
        windingRatio: document.getElementById('windingRatio'),
        spinDirection: document.getElementById('spinDirection'),
        setFineStructure: document.getElementById('setFineStructure'),
        showWireframe: document.getElementById('showWireframe'),
        showAxes: document.getElementById('showAxes'),
        showFieldAndMomentumVectors: document.getElementById('showFieldAndMomentumVectors')
    };

    // Check if controls exist
    if (!controls.transparency || !controls.innerRadius) {
        console.error('Control elements not found!');
        return;
    }

    // Update value displays
    function updateValueDisplay(id, value) {
        const display = document.getElementById(id + '-value');
        if (display) {
            display.textContent = value.toFixed(2);
        }
    }

    // Control event listeners
    // Function to update trail colors based on current transparency
    function updateTrailColorsForTransparency() {
        // Recalculate obstruction for all trail points and update colors
        for (let i = 0; i < trailPoints.length; i++) {
            const isTrailPointObstructed = isPhotonObstructed(trailPoints[i]);
            
            if (isTrailPointObstructed) {
                if (transparency === 0) {
                    // At transparency = 0, use very dark color for obstructed segments
                    trailColors[i] = new THREE.Color(0x000000); // Black (essentially invisible)
                } else {
                    trailColors[i] = new THREE.Color(0xaa8800); // Darker yellow-brown for obstructed segments (brighter than before but still less intense)
                }
            } else {
                trailColors[i] = new THREE.Color(0xffdd00); // Bright yellow for unobstructed
            }
        }
        
        // Rebuild geometry with updated colors (show all points, dark color for obstructed when transparency = 0)
        if (trailPoints.length > 1) {
            updateTrailGeometry(trailPoints, trailColors);
        }
    }

    controls.transparency.addEventListener('input', (e) => {
        transparency = parseFloat(e.target.value);
        updateValueDisplay('transparency', transparency);
        // Update opacity directly without recreating geometry
        torusMaterial.opacity = 1 - transparency;
        spheroidMaterial.opacity = 1 - transparency;
        spheroidS1Material.opacity = 1 - transparency;
        spheroidS2Material.opacity = 1 - transparency;
        // Wireframe disappears at transparency = 0, becomes more visible as transparency increases
        wireframeMaterial.opacity = transparency > 0 ? 0.2 * (1 - transparency) : 0;
        spheroidWireframeMaterial.opacity = transparency > 0 ? 0.2 * (1 - transparency) : 0;
        spheroidS1WireframeMaterial.opacity = transparency > 0 ? 0.2 * (1 - transparency) : 0;
        spheroidS2WireframeMaterial.opacity = transparency > 0 ? 0.2 * (1 - transparency) : 0;
        
        // Update trail colors based on new transparency value
        updateTrailColorsForTransparency();
    });

    controls.showWireframe.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        wireframe.visible = isChecked;
        spheroidWireframe.visible = isChecked;
        // Update visibility based on current mode
        updateGeometryVisibility();
    });
    
    // Axes visibility toggle
    if (controls.showAxes) {
        controls.showAxes.addEventListener('change', (e) => {
            axesGroup.visible = e.target.checked;
        });
        // Hide axes by default
        axesGroup.visible = false;
        controls.showAxes.checked = false;
    }
    
    // Field and Momentum vectors visibility toggle (controls field values, momentum display, and E/M arrows)
    if (controls.showFieldAndMomentumVectors) {
        const legend = document.getElementById('legend');
        const momentumDisplay = document.getElementById('momentumDisplay');
        
        controls.showFieldAndMomentumVectors.addEventListener('change', (e) => {
            const isVisible = e.target.checked;
            if (legend) {
                legend.style.display = isVisible ? 'block' : 'none';
            }
            if (momentumDisplay) {
                momentumDisplay.style.display = isVisible ? 'block' : 'none';
            }
            // Also control E/M arrows visibility - respect path mode
            if (!isVisible) {
                // Hide all arrows when unchecked
                electricFieldArrow.visible = false;
                magneticFieldArrow.visible = false;
                electricFieldArrow2.visible = false;
                magneticFieldArrow2.visible = false;
            } else {
                // When rechecked, update geometry to properly set arrow visibility based on path mode
                updateGeometry();
            }
        });
        
        // Show both displays and arrows by default (checkbox is checked in HTML)
        if (legend) {
            legend.style.display = 'block';
        }
        if (momentumDisplay) {
            momentumDisplay.style.display = 'block';
        }
        electricFieldArrow.visible = true;
        magneticFieldArrow.visible = true;
        // electricFieldArrow2 and magneticFieldArrow2 visibility is controlled by path mode
    }

    // Function to update button text based on path mode
    function updateFineStructureButtonText() {
        const button = controls.setFineStructure;
        if (button) {
            const isLemniscate = pathMode === 'lemniscate-s' || pathMode === 'lemniscate-c';
            if (isLemniscate) {
                button.textContent = 'Set major and minor axes to 1';
            } else {
                button.textContent = 'Set r/R to fine structure constant';
            }
        }
    }

    // Function to update slider labels and constraints based on path mode
    function updateRadiusLabelsAndConstraints() {
        const innerRadiusLabel = document.getElementById('innerRadiusLabel');
        const outerRadiusLabel = document.getElementById('outerRadiusLabel');
        const isLemniscate = pathMode === 'lemniscate-s' || pathMode === 'lemniscate-c';
        
        if (innerRadiusLabel && outerRadiusLabel) {
            if (isLemniscate) {
                innerRadiusLabel.textContent = 'Minor Axis (relative)';
                outerRadiusLabel.textContent = 'Major Axis (relative)';
            } else {
                innerRadiusLabel.textContent = 'Inner Radius (relative)';
                outerRadiusLabel.textContent = 'Outer Radius (relative)';
            }
        }
        
        // Update slider constraints: for lemniscates, allow r > R (no min constraint on outerRadius)
        // For torus, maintain outerRadius > innerRadius constraint
        if (isLemniscate) {
            // For lemniscates, allow wider range and no constraint that outerRadius > innerRadius
            controls.innerRadius.min = 0.1; // Minor axis must be positive
            controls.outerRadius.min = 0.1; // Keep minimum reasonable value
        } else {
            // For torus, ensure outerRadius > innerRadius
            controls.innerRadius.min = -2; // Original min value (can be negative for inverted shapes)
            controls.outerRadius.min = 1; // Original min value
        }
    }

    controls.innerRadius.addEventListener('input', (e) => {
        innerRadius = parseFloat(e.target.value);
        // Only ensure outerRadius is greater than innerRadius for torus mode
        const isLemniscate = pathMode === 'lemniscate-s' || pathMode === 'lemniscate-c';
        if (!isLemniscate && outerRadius <= innerRadius) {
            outerRadius = innerRadius + 0.1;
            controls.outerRadius.value = outerRadius;
            updateValueDisplay('outerRadius', outerRadius);
        }
        updateValueDisplay('innerRadius', innerRadius);
        updateGeometry();
    });

    controls.outerRadius.addEventListener('input', (e) => {
        outerRadius = parseFloat(e.target.value);
        // Only ensure outerRadius is greater than innerRadius for torus mode
        const isLemniscate = pathMode === 'lemniscate-s' || pathMode === 'lemniscate-c';
        if (!isLemniscate && outerRadius <= innerRadius) {
            innerRadius = outerRadius - 0.1;
            controls.innerRadius.value = innerRadius;
            updateValueDisplay('innerRadius', innerRadius);
        }
        updateValueDisplay('outerRadius', outerRadius);
        updateGeometry();
    });

    controls.photonSpeed.addEventListener('input', (e) => {
        // Logarithmic scale: slider 0 -> 0.1, slider 0.5 -> 1.0, slider 1.0 -> 10.0
        // Formula: speed = 10^(-1 + 2*slider)
        const sliderValue = parseFloat(e.target.value);
        photonSpeed = Math.pow(10, -1 + 2 * sliderValue);
        updateValueDisplay('photonSpeed', photonSpeed);
    });

    controls.trailLength.addEventListener('input', (e) => {
        // Logarithmic scale: slider 0 -> 0.1, slider 0.5 -> 1.0, slider 1.0 -> 100
        // Formula: rotations = 0.1 * 10^(2*slider)
        const sliderValue = parseFloat(e.target.value);
        if (sliderValue >= 1.0) {
            trailLengthRotations = 100; // Maximum means no limit
        } else {
            trailLengthRotations = 0.1 * Math.pow(10, 2 * sliderValue);
        }
        const displayValue = trailLengthRotations >= 100 ? '∞' : trailLengthRotations.toFixed(2);
        const display = document.getElementById('trailLength-value');
        if (display) {
            display.textContent = displayValue;
        }
    });

    controls.precession.addEventListener('input', (e) => {
        // Clear trail when changing precession to avoid confusion
        trailPoints.length = 0;
        trailColors.length = 0;
        trailToroidalAngles.length = 0;
        if (trailPoints.length > 1) {
            trailGeometry.setFromPoints(trailPoints);
        }
        precession = parseFloat(e.target.value) || 0;
    });
    
    controls.precession.addEventListener('change', (e) => {
        precession = parseFloat(e.target.value) || 0;
        // Clear trail when changing precession to avoid confusion
        trailPoints.length = 0;
        trailColors.length = 0;
        trailToroidalAngles.length = 0;
        if (trailPoints.length > 1) {
            trailGeometry.setFromPoints(trailPoints);
        }
    });

    // Flag to prevent event handlers from running when we programmatically set slider values
    let isProgrammaticUpdate = false;

    controls.cameraDistance.addEventListener('input', (e) => {
        if (isProgrammaticUpdate) return;
        cameraDistance = parseFloat(e.target.value);
        updateValueDisplay('cameraDistance', cameraDistance);
        updateCamera();
    });

    controls.cameraRotationX.addEventListener('input', (e) => {
        if (isProgrammaticUpdate) return;
        cameraRotationX = Math.max(-10, Math.min(10, parseFloat(e.target.value)));
        controls.cameraRotationX.value = cameraRotationX;
        updateValueDisplay('cameraRotationX', cameraRotationX);
        updateCamera();
    });

    controls.cameraRotationY.addEventListener('input', (e) => {
        if (isProgrammaticUpdate) return;
        cameraRotationY = Math.max(-10, Math.min(10, parseFloat(e.target.value)));
        controls.cameraRotationY.value = cameraRotationY;
        updateValueDisplay('cameraRotationY', cameraRotationY);
        updateCamera();
    });

    controls.resetCamera.addEventListener('click', () => {
        cameraDistance = 12;
        cameraRotationX = 1.57; // π/2
        cameraRotationY = 1.57; // π/2
        screenOffsetX = 0;
        screenOffsetY = 0;
        
        // Reset CSS transform
        canvasContainer.style.transform = 'translate(0px, 0px)';
        
        // Set flag to prevent 'input' event handlers from running
        isProgrammaticUpdate = true;
        controls.cameraDistance.value = cameraDistance;
        controls.cameraRotationX.value = cameraRotationX;
        controls.cameraRotationY.value = cameraRotationY;
        isProgrammaticUpdate = false;
        
        updateValueDisplay('cameraDistance', cameraDistance);
        updateValueDisplay('cameraRotationX', cameraRotationX);
        updateValueDisplay('cameraRotationY', cameraRotationY);
        updateCamera();
    });

    controls.pausePlay.addEventListener('click', () => {
        isPaused = !isPaused;
        controls.pausePlay.textContent = isPaused ? 'Play' : 'Pause';
    });

    controls.setFineStructure.addEventListener('click', () => {
        // Clear trail when setting values to avoid confusion
        trailPoints.length = 0;
        trailColors.length = 0;
        trailToroidalAngles.length = 0;
        if (trailPoints.length > 1) {
            trailGeometry.setFromPoints(trailPoints);
        }
        
        // For S-type: also clear the second trail
        if (pathMode === 'lemniscate-s') {
            trailPoints2.length = 0;
            trailColors2.length = 0;
            trailToroidalAngles2.length = 0;
            trailOriginalIndices2.length = 0;
            // Always update geometry, even when empty, to ensure visual clearing
            trailGeometry2.setFromPoints([]);
        }
        
        // Check path mode to determine button behavior
        const isLemniscate = pathMode === 'lemniscate-s' || pathMode === 'lemniscate-c';
        
        if (isLemniscate) {
            // For lemniscates: Set major and minor axes to 1
            innerRadius = 1.0;
            outerRadius = 1.0;
            cameraDistance = 4.0; // Set camera distance to 4.0 for lemniscates
        } else {
            // For torus: Set values for fine structure constant ratio (r/R ≈ α)
            // Using FINE_STRUCTURE_CONSTANT for consistency
            // Outer radius = 13.7, Inner radius = 0.1, Camera distance = 60
            innerRadius = 0.1;
            outerRadius = 13.7;
            cameraDistance = 60;
        }
        
        // Update sliders
        controls.innerRadius.value = innerRadius;
        controls.outerRadius.value = outerRadius;
        controls.cameraDistance.value = cameraDistance;
        
        // Update displays
        updateValueDisplay('innerRadius', innerRadius);
        updateValueDisplay('outerRadius', outerRadius);
        updateValueDisplay('cameraDistance', cameraDistance);
        
        // Reset accumulated fields and momentum when setting fine structure constant
        accumulatedElectricField.set(0, 0, 0);
        accumulatedMagneticField.set(0, 0, 0);
        fieldSampleCount = 0;
        lastCompletedAvgElectricField.set(0, 0, 0);
        lastCompletedAvgMagneticField.set(0, 0, 0);
        accumulatedLinearMomentum.set(0, 0, 0);
        accumulatedToroidalAngularMomentum.set(0, 0, 0);
        accumulatedPoloidalAngularMomentum.set(0, 0, 0);
        accumulatedTotalAngularMomentum.set(0, 0, 0);
        momentumSampleCount = 0;
        lastToroidalAngle = 0;
        angleAtCycleStart = 0;
        lastCompletedAvgLinearMomentum.set(0, 0, 0);
        lastCompletedAvgToroidalAngularMomentum.set(0, 0, 0);
        lastCompletedAvgPoloidalAngularMomentum.set(0, 0, 0);
        lastCompletedAvgTotalAngularMomentum.set(0, 0, 0);
        updateFieldVectorsDisplay(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        );
        updateMomentumDisplay(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        );
        
        // Update geometry and camera
        updateGeometry();
        updateCamera();
    });

    // Path mode event listener
    if (controls.pathMode) {
        controls.pathMode.addEventListener('change', (e) => {
            pathMode = e.target.value;
            
            // When switching to torus mode, ensure valid torus geometry
            // A torus requires outerRadius > innerRadius (r/R < 1)
            // If r/R >= 1, adjust to r/R = 0.9
            if (pathMode === 'torus') {
                if (outerRadius <= innerRadius || Math.abs(outerRadius - innerRadius) < 0.01) {
                    // Set r/R = 0.9 by keeping outerRadius and adjusting innerRadius
                    innerRadius = outerRadius * 0.9;
                    // Ensure minimum value
                    if (innerRadius < 0.1) {
                        innerRadius = 0.1;
                        outerRadius = innerRadius / 0.9;
                    }
                    // Update sliders and displays
                    controls.innerRadius.value = innerRadius;
                    controls.outerRadius.value = outerRadius;
                    updateValueDisplay('innerRadius', innerRadius);
                    updateValueDisplay('outerRadius', outerRadius);
                }
            }
            
            // Clear trail when switching modes
            trailPoints.length = 0;
            trailColors.length = 0;
            trailToroidalAngles.length = 0;
            if (trailPoints.length > 1) {
                trailGeometry.setFromPoints(trailPoints);
            }
            
            // Reset accumulated fields and momentum when changing path mode
            accumulatedElectricField.set(0, 0, 0);
            accumulatedMagneticField.set(0, 0, 0);
            fieldSampleCount = 0;
            lastCompletedAvgElectricField.set(0, 0, 0);
            lastCompletedAvgMagneticField.set(0, 0, 0);
            accumulatedLinearMomentum.set(0, 0, 0);
            accumulatedToroidalAngularMomentum.set(0, 0, 0);
            accumulatedPoloidalAngularMomentum.set(0, 0, 0);
            accumulatedTotalAngularMomentum.set(0, 0, 0);
            momentumSampleCount = 0;
            lastToroidalAngle = 0;
            angleAtCycleStart = 0;
            lastCompletedAvgLinearMomentum.set(0, 0, 0);
            lastCompletedAvgToroidalAngularMomentum.set(0, 0, 0);
            lastCompletedAvgPoloidalAngularMomentum.set(0, 0, 0);
            lastCompletedAvgTotalAngularMomentum.set(0, 0, 0);
            updateFieldVectorsDisplay(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0)
            );
            updateMomentumDisplay(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0)
            );
            
            // Update geometry and visibility based on mode
            updateGeometry();
            updateGeometryVisibility();
            
            // Update radius labels and constraints based on path mode
            updateRadiusLabelsAndConstraints();
            
            // Update button text based on path mode
            updateFineStructureButtonText();
            
            // Disable/enable winding ratio control based on mode
            const windingRatioGroup = document.getElementById('windingRatioGroup');
            const windingRatioSelect = document.getElementById('windingRatio');
            if (pathMode === 'lemniscate-s' || pathMode === 'lemniscate-c') {
                // Figure-8 mode: disable winding ratio (only 2:1 equivalent)
                if (windingRatioGroup) {
                    windingRatioGroup.style.opacity = '0.5';
                    windingRatioGroup.style.pointerEvents = 'none';
                }
                if (windingRatioSelect) {
                    windingRatioSelect.disabled = true;
                }
            } else {
                // Torus mode: enable winding ratio
                if (windingRatioGroup) {
                    windingRatioGroup.style.opacity = '1';
                    windingRatioGroup.style.pointerEvents = 'auto';
                }
                if (windingRatioSelect) {
                    windingRatioSelect.disabled = false;
                }
            }
            
            // Update momentum labels based on mode
            updateMomentumLabels();
            
            // Set camera perspective for C-type lemniscate to show elongated dimension
            // C curve preserves current camera orientation (no automatic reset)
            // This matches the behavior of Torus mode
        });
    }
    
    // Initialize radius labels and constraints based on current path mode
    updateRadiusLabelsAndConstraints();
    
    // Initialize path mode state (winding ratio visibility and labels)
    if (controls.pathMode) {
        updateMomentumLabels(); // Set initial labels
        updateFineStructureButtonText(); // Set initial button text
        const event = new Event('change');
        controls.pathMode.dispatchEvent(event);
    }
    
    // Controls panel toggle
    const controlsToggle = document.getElementById('controlsToggle');
    const controlsPanel = document.getElementById('controls');
    if (controlsToggle && controlsPanel) {
        controlsToggle.addEventListener('click', () => {
            controlsPanel.classList.toggle('visible');
        });
    }
    
    controls.particleType.addEventListener('change', (e) => {
        particleType = e.target.value;
        // Reset accumulated fields when changing particle type
        accumulatedElectricField.set(0, 0, 0);
        accumulatedMagneticField.set(0, 0, 0);
        fieldSampleCount = 0;
        lastCompletedAvgElectricField.set(0, 0, 0);
        lastCompletedAvgMagneticField.set(0, 0, 0);
        accumulatedLinearMomentum.set(0, 0, 0);
        accumulatedToroidalAngularMomentum.set(0, 0, 0);
        accumulatedPoloidalAngularMomentum.set(0, 0, 0);
        accumulatedTotalAngularMomentum.set(0, 0, 0);
        momentumSampleCount = 0;
        lastToroidalAngle = 0;
        angleAtCycleStart = 0;
        lastCompletedAvgLinearMomentum.set(0, 0, 0);
        lastCompletedAvgToroidalAngularMomentum.set(0, 0, 0);
        lastCompletedAvgPoloidalAngularMomentum.set(0, 0, 0);
        lastCompletedAvgTotalAngularMomentum.set(0, 0, 0);
        updateFieldVectorsDisplay(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        );
        updateMomentumDisplay(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        );
    });

    controls.windingRatio.addEventListener('change', (e) => {
        windingRatio = e.target.value;
        // Clear trail when changing winding ratio to avoid confusion
        trailPoints.length = 0;
        trailColors.length = 0;
        trailOriginalIndices.length = 0;
        trailToroidalAngles.length = 0;
        if (trailPoints.length > 1) {
            trailGeometry.setFromPoints(trailPoints);
        }
        
        // Reset accumulated fields and momentum when changing winding ratio
        accumulatedElectricField.set(0, 0, 0);
        accumulatedMagneticField.set(0, 0, 0);
        fieldSampleCount = 0;
        lastCompletedAvgElectricField.set(0, 0, 0);
        lastCompletedAvgMagneticField.set(0, 0, 0);
        accumulatedLinearMomentum.set(0, 0, 0);
        accumulatedToroidalAngularMomentum.set(0, 0, 0);
        accumulatedPoloidalAngularMomentum.set(0, 0, 0);
        accumulatedTotalAngularMomentum.set(0, 0, 0);
        momentumSampleCount = 0;
        lastToroidalAngle = 0;
        angleAtCycleStart = 0;
        lastCompletedAvgLinearMomentum.set(0, 0, 0);
        lastCompletedAvgToroidalAngularMomentum.set(0, 0, 0);
        lastCompletedAvgPoloidalAngularMomentum.set(0, 0, 0);
        lastCompletedAvgTotalAngularMomentum.set(0, 0, 0);
        updateFieldVectorsDisplay(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        );
        updateMomentumDisplay(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        );
    });

    controls.spinDirection.addEventListener('change', (e) => {
        spinDirection = parseInt(e.target.value);
        // Clear trail when changing spin direction
        trailPoints.length = 0;
        trailColors.length = 0;
        trailToroidalAngles.length = 0;
        if (trailPoints.length > 1) {
            trailGeometry.setFromPoints(trailPoints);
        }
        
        // Reset accumulated fields and momentum when changing spin direction
        accumulatedElectricField.set(0, 0, 0);
        accumulatedMagneticField.set(0, 0, 0);
        fieldSampleCount = 0;
        lastCompletedAvgElectricField.set(0, 0, 0);
        lastCompletedAvgMagneticField.set(0, 0, 0);
        accumulatedLinearMomentum.set(0, 0, 0);
        accumulatedToroidalAngularMomentum.set(0, 0, 0);
        accumulatedPoloidalAngularMomentum.set(0, 0, 0);
        accumulatedTotalAngularMomentum.set(0, 0, 0);
        momentumSampleCount = 0;
        lastToroidalAngle = 0;
        angleAtCycleStart = 0;
        lastCompletedAvgLinearMomentum.set(0, 0, 0);
        lastCompletedAvgToroidalAngularMomentum.set(0, 0, 0);
        lastCompletedAvgPoloidalAngularMomentum.set(0, 0, 0);
        lastCompletedAvgTotalAngularMomentum.set(0, 0, 0);
        updateFieldVectorsDisplay(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        );
        updateMomentumDisplay(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        );
    });

    controls.resetFields.addEventListener('click', () => {
        accumulatedElectricField.set(0, 0, 0);
        accumulatedMagneticField.set(0, 0, 0);
        fieldSampleCount = 0;
        lastCompletedAvgElectricField.set(0, 0, 0);
        lastCompletedAvgMagneticField.set(0, 0, 0);
        accumulatedLinearMomentum.set(0, 0, 0);
        accumulatedToroidalAngularMomentum.set(0, 0, 0);
        accumulatedPoloidalAngularMomentum.set(0, 0, 0);
        accumulatedTotalAngularMomentum.set(0, 0, 0);
        momentumSampleCount = 0;
        lastToroidalAngle = 0;
        angleAtCycleStart = 0;
        lastCompletedAvgLinearMomentum.set(0, 0, 0);
        lastCompletedAvgToroidalAngularMomentum.set(0, 0, 0);
        lastCompletedAvgPoloidalAngularMomentum.set(0, 0, 0);
        lastCompletedAvgTotalAngularMomentum.set(0, 0, 0);
        updateFieldVectorsDisplay(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        );
        updateMomentumDisplay(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        );
    });

    const resetMomentumButton = document.getElementById('resetMomentum');
    if (resetMomentumButton) {
        resetMomentumButton.addEventListener('click', () => {
            accumulatedLinearMomentum.set(0, 0, 0);
            accumulatedToroidalAngularMomentum.set(0, 0, 0);
            accumulatedPoloidalAngularMomentum.set(0, 0, 0);
            accumulatedTotalAngularMomentum.set(0, 0, 0);
            momentumSampleCount = 0;
            lastToroidalAngle = 0;
            lastCompletedAvgLinearMomentum.set(0, 0, 0);
            lastCompletedAvgToroidalAngularMomentum.set(0, 0, 0);
            lastCompletedAvgPoloidalAngularMomentum.set(0, 0, 0);
            lastCompletedAvgTotalAngularMomentum.set(0, 0, 0);
            updateMomentumDisplay(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0)
            );
        });
    }

    controls.clearTrack.addEventListener('click', () => {
        trailPoints.length = 0;
        trailColors.length = 0;
        trailOriginalIndices.length = 0;
        trailToroidalAngles.length = 0;
        if (trailPoints.length > 1) {
            trailGeometry.setFromPoints(trailPoints);
        }
        
        // For S-type: also clear the second trail
        if (pathMode === 'lemniscate-s') {
            trailPoints2.length = 0;
            trailColors2.length = 0;
            trailOriginalIndices2.length = 0;
            trailToroidalAngles2.length = 0;
            if (trailPoints2.length > 1) {
                trailGeometry2.setFromPoints(trailPoints2);
            } else {
                trailGeometry2.setFromPoints([]);
            }
        }
    });
    
    // Function to update field vectors display
    function updateFieldVectorsDisplay(
        instantElectric,
        instantMagnetic,
        avgElectric,
        avgMagnetic
    ) {
        const instantElectricDisplay = document.getElementById('instantElectricField');
        const instantMagneticDisplay = document.getElementById('instantMagneticField');
        const avgElectricDisplay = document.getElementById('avgElectricField');
        const avgMagneticDisplay = document.getElementById('avgMagneticField');
        
        if (instantElectricDisplay && instantElectric) {
            instantElectricDisplay.textContent = formatVector(instantElectric);
        }
        if (instantMagneticDisplay && instantMagnetic) {
            instantMagneticDisplay.textContent = formatVector(instantMagnetic);
        }
        if (avgElectricDisplay && avgElectric) {
            avgElectricDisplay.textContent = formatVector(avgElectric);
        }
        if (avgMagneticDisplay && avgMagnetic) {
            avgMagneticDisplay.textContent = formatVector(avgMagnetic);
        }
    }

    // Mouse controls for camera rotation and screen translation
    let isLeftMouseDown = false;
    let isRightMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    renderer.domElement.addEventListener('mousedown', (e) => {
        // Prevent right-click context menu
        if (e.button === 2) {
            e.preventDefault();
        }
        
        if (e.button === 0) { // Left button
            isLeftMouseDown = true;
        } else if (e.button === 2) { // Right button
            isRightMouseDown = true;
        }
        
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        const deltaX = e.clientX - mouseX;
        const deltaY = e.clientY - mouseY;
        
        if (isLeftMouseDown) {
            // Left button: Rotate camera
            cameraRotationY += deltaX * 0.01;
            cameraRotationX += deltaY * 0.01;
            
            // Clamp both rotations to allowed range (-10 to 10 radians)
            cameraRotationX = Math.max(-10, Math.min(10, cameraRotationX));
            cameraRotationY = Math.max(-10, Math.min(10, cameraRotationY));
            
            // Set flag to prevent 'input' event handlers from running
            isProgrammaticUpdate = true;
            controls.cameraRotationX.value = cameraRotationX;
            controls.cameraRotationY.value = cameraRotationY;
            isProgrammaticUpdate = false;
            
            updateValueDisplay('cameraRotationX', cameraRotationX);
            updateValueDisplay('cameraRotationY', cameraRotationY);
            updateCamera();
        } else if (isRightMouseDown) {
            // Right button: Translate screen (CSS transform)
            screenOffsetX += deltaX;
            screenOffsetY += deltaY;
            
            // Apply CSS transform to canvas container
            canvasContainer.style.transform = `translate(${screenOffsetX}px, ${screenOffsetY}px)`;
        }
        
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    renderer.domElement.addEventListener('mouseup', (e) => {
        if (e.button === 0) { // Left button
            isLeftMouseDown = false;
        } else if (e.button === 2) { // Right button
            isRightMouseDown = false;
        }
    });

    renderer.domElement.addEventListener('mouseleave', () => {
        isLeftMouseDown = false;
        isRightMouseDown = false;
    });
    
    // Prevent right-click context menu
    renderer.domElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Wheel for zoom
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        cameraDistance += e.deltaY * 0.01;
        cameraDistance = Math.max(1, Math.min(60, cameraDistance));
        controls.cameraDistance.value = cameraDistance;
        updateValueDisplay('cameraDistance', cameraDistance);
        updateCamera();
    }, { passive: false }); // Explicitly non-passive since we call preventDefault()

    // Check if photon is obstructed by torus
    function isPhotonObstructed(photonPos) {
        // Get direction from camera to photon
        const direction = new THREE.Vector3()
            .subVectors(photonPos, camera.position)
            .normalize();
        
        // Cast ray from camera toward photon
        raycaster.set(camera.position, direction);
        
        // Check intersection with the appropriate geometry based on path mode
        let intersects = [];
        if (pathMode === 'lemniscate-c') {
            // C-type: check spheroid (solid geometry only - wireframe doesn't obstruct)
            intersects = raycaster.intersectObject(spheroid, false);
        } else if (pathMode === 'lemniscate-s') {
            // S-type: check both spheroids
            const intersects1 = raycaster.intersectObject(spheroidS1, false);
            const intersects2 = raycaster.intersectObject(spheroidS2, false);
            // Combine and sort by distance
            intersects = [...intersects1, ...intersects2].sort((a, b) => a.distance - b.distance);
        } else {
            // Torus: check torus (solid geometry only - wireframe doesn't obstruct)
            intersects = raycaster.intersectObject(torus, false);
        }
        
        if (intersects.length > 0) {
            const distanceToPhoton = photonPos.distanceTo(camera.position);
            const distanceToGeometry = intersects[0].distance;
            // If geometry intersection is closer than photon (with small threshold), photon is obstructed
            return distanceToGeometry < distanceToPhoton - 0.2;
        }
        
        return false;
    }

    // Calculate field vectors (works for both torus and figure-8 modes)
    function calculateFieldVectors(position, t, majorRadius, minorRadius) {
        // Calculate velocity using numerical differentiation (works for both modes)
        const velocity = calculateVelocity(position, majorRadius, minorRadius).normalize();
        
        if (pathMode === 'lemniscate-s') {
            // S-type: use spheroid-based calculation
            // Calculate spheroid parameters
            // Use innerRadius and outerRadius directly to avoid conversion errors when r > R
            const R = outerRadius; // Outer radius (may be smaller than innerRadius when oblate)
            const r = Math.max(0.1, innerRadius); // Inner radius (may be larger than outerRadius when oblate)
            const safer = Math.max(0.1, r);
            const safeR = Math.max(0.1, R);
            const a = safer; // Equatorial radius (x-z plane) - minor axis
            const c = safeR; // Polar radius (y-axis, vertical) - major axis
            
            // Decide which lobe we are on
            const onLeft = (position.x < 0);
            const cx = onLeft ? -safer : safer; // spheroid center x
            
            // Position relative to spheroid center
            const dx = position.x - cx;
            const dy = position.y;
            const dz = position.z;
            
            // Gradient of spheroid equation: ∇F = (2(x-xc)/a², 2y/c², 2z/a²)
            let nx = 2 * dx / (a * a);
            let ny = 2 * dy / (c * c);
            let nz = 2 * dz / (a * a);
            
            // Inward electric direction = minus normal
            let Ex = -nx;
            let Ey = -ny;
            let Ez = -nz;
            
            // Normalize E
            const Enorm = Math.hypot(Ex, Ey, Ez) || 1.0;
            Ex /= Enorm;
            Ey /= Enorm;
            Ez /= Enorm;
            
            // Handle numerical spike at cusp (touchpoint)
            const epsilon = 0.01;
            if (Math.hypot(dx, dy, dz) < epsilon) {
                // Reuse previous E vector if available, otherwise keep current
                // (In practice, this will be handled by the continuous nature of the calculation)
            }
            
            const electricField = new THREE.Vector3(Ex, Ey, Ez);
            
            // For electron: already inward (negative normal), for positron: flip
            if (particleType === 'positron') {
                electricField.negate();
            }
            
            // Get tangent = normalized velocity
            const Tx = velocity.x;
            const Ty = velocity.y;
            const Tz = velocity.z;
            
            // B = T × E for electron, E × T for positron
            let Bx, By, Bz;
            if (particleType === 'electron') {
                Bx = Ty * Ez - Tz * Ey;
                By = Tz * Ex - Tx * Ez;
                Bz = Tx * Ey - Ty * Ex;
            } else {
                // positron: B = E × T
                Bx = Ey * Tz - Ez * Ty;
                By = Ez * Tx - Ex * Tz;
                Bz = Ex * Ty - Ey * Tx;
            }
            
            // Normalize B
            const Bnorm = Math.hypot(Bx, By, Bz) || 1.0;
            Bx /= Bnorm;
            By /= Bnorm;
            Bz /= Bnorm;
            
            const magneticField = new THREE.Vector3(Bx, By, Bz);
            
            return { electricField, magneticField };
        } else if (pathMode === 'lemniscate-c') {
            // C-type: rotating E/M field with transverse polarization
            // E rotates in the plane perpendicular to the tangent (velocity direction)
            
            // Get tangent = normalized velocity
            const Tx = velocity.x;
            const Ty = velocity.y;
            const Tz = velocity.z;
            
            // Reference "inward" direction (toward spheroid center at origin)
            let Ix = -position.x;
            let Iy = -position.y;
            let Iz = -position.z;
            
            // Project I into the plane perpendicular to T (remove component along T)
            const IdotT = Ix * Tx + Iy * Ty + Iz * Tz;
            Ix -= IdotT * Tx;
            Iy -= IdotT * Ty;
            Iz -= IdotT * Tz;
            
            // Normalize to get a reference in the transverse plane
            let Inorm = Math.hypot(Ix, Iy, Iz);
            if (Inorm < 1e-6) {
                // If I is parallel to T, use a default direction
                // Try (1, 0, 0) first
                Ix = 1; Iy = 0; Iz = 0;
                const IdotT2 = Ix * Tx + Iy * Ty + Iz * Tz;
                Ix -= IdotT2 * Tx;
                Iy -= IdotT2 * Ty;
                Iz -= IdotT2 * Tz;
                Inorm = Math.hypot(Ix, Iy, Iz);
                if (Inorm < 1e-6) {
                    // Try (0, 1, 0)
                    Ix = 0; Iy = 1; Iz = 0;
                    const IdotT3 = Ix * Tx + Iy * Ty + Iz * Tz;
                    Ix -= IdotT3 * Tx;
                    Iy -= IdotT3 * Ty;
                    Iz -= IdotT3 * Tz;
                    Inorm = Math.hypot(Ix, Iy, Iz);
                }
            }
            Ix /= Inorm;
            Iy /= Inorm;
            Iz /= Inorm;
            
            // Second transverse basis vector: J = T × I
            let Jx = Ty * Iz - Tz * Iy;
            let Jy = Tz * Ix - Tx * Iz;
            let Jz = Tx * Iy - Ty * Ix;
            const Jnorm = Math.hypot(Jx, Jy, Jz) || 1.0;
            Jx /= Jnorm;
            Jy /= Jnorm;
            Jz /= Jnorm;
            
            // Phase function: rotate E by 2π over one full circuit
            // The parameter t passed to this function is animationTime
            // For C-type, the curve parameter u goes from 0 to 4π for one full cycle
            // We use the same parameter calculation as in getFigure8Position
            const tParam = t * 2 * 4 * Math.PI * spinDirection;
            const u = ((tParam % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
            const phi = u; // Phase rotates by 2π over one full circuit (u ∈ [0, 4π])
            
            // E rotates in the I–J plane
            const cosPhi = Math.cos(phi);
            const sinPhi = Math.sin(phi);
            let Ex = cosPhi * Ix + sinPhi * Jx;
            let Ey = cosPhi * Iy + sinPhi * Jy;
            let Ez = cosPhi * Iz + sinPhi * Jz;
            
            // For electron: already inward on average (I points inward), for positron: flip
            if (particleType === 'positron') {
                Ex = -Ex;
                Ey = -Ey;
                Ez = -Ez;
            }
            
            const electricField = new THREE.Vector3(Ex, Ey, Ez);
            
            // B from right-hand rule: B = T × E (electron) or E × T (positron)
            let Bx, By, Bz;
            if (particleType === 'electron') {
                Bx = Ty * Ez - Tz * Ey;
                By = Tz * Ex - Tx * Ez;
                Bz = Tx * Ey - Ty * Ex;
            } else {
                // positron: B = E × T
                Bx = Ey * Tz - Ez * Ty;
                By = Ez * Tx - Ex * Tz;
                Bz = Ex * Ty - Ey * Tx;
            }
            
            // Normalize B
            const Bnorm = Math.hypot(Bx, By, Bz) || 1.0;
            Bx /= Bnorm;
            By /= Bnorm;
            Bz /= Bnorm;
            
            const magneticField = new THREE.Vector3(Bx, By, Bz);
            
            return { electricField, magneticField };
        } else {
            // Torus mode: use existing torus-specific calculation
            // Apply same precession and winding ratio as in getPhotonPosition
            let uToroidal, vPoloidal;
            if (windingRatio === '1:2') {
                uToroidal = 4 * Math.PI;
                vPoloidal = 2 * Math.PI;
            } else {
                uToroidal = 2 * Math.PI;
                vPoloidal = 4 * Math.PI;
            }
            const u = animationTime * uToroidal * (1 + precession) * spinDirection;
            const v = animationTime * vPoloidal * (1 + precession * 2) * spinDirection;
            
            // Calculate partial derivatives for surface tangent vectors
            const dx_du = -(majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
            const dy_du = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
            const dz_du = 0;
            
            const dx_dv = -minorRadius * Math.sin(v) * Math.cos(u);
            const dy_dv = -minorRadius * Math.sin(v) * Math.sin(u);
            const dz_dv = minorRadius * Math.cos(v);
            
            // Tangent vectors to the torus surface
            const tangentU = new THREE.Vector3(dx_du, dy_du, dz_du);
            const tangentV = new THREE.Vector3(dx_dv, dy_dv, dz_dv);
            
            // Electric field: orthogonal to torus surface (surface normal)
            const electricField = new THREE.Vector3()
                .crossVectors(tangentU, tangentV)
                .normalize();
            
            // For electron: point inward (negate normal)
            if (particleType === 'electron') {
                electricField.negate();
            }
            
            // For torus mode, calculate velocity direction from tangent vectors
            // The velocity is a combination of tangentU and tangentV based on the parameter rates
            const du_dt = uToroidal * (1 + precession) * spinDirection;
            const dv_dt = vPoloidal * (1 + precession * 2) * spinDirection;
            const velocityDirection = new THREE.Vector3()
                .addScaledVector(tangentU, du_dt)
                .addScaledVector(tangentV, dv_dt)
                .normalize();
            
            // Magnetic field: perpendicular to velocity and tangent to torus surface
            // The magnetic field must be in the tangent plane (spanned by tangentU and tangentV)
            // and perpendicular to velocity direction
            // Use right-hand rule: electricField × velocityDirection gives magnetic field direction
            const magneticField = new THREE.Vector3()
                .crossVectors(electricField, velocityDirection);
            
            // Ensure magnetic field is in the tangent plane by projecting out any normal component
            const normalComponent = magneticField.clone().dot(electricField);
            magneticField.sub(electricField.clone().multiplyScalar(normalComponent));
            
            // Handle case where velocity and normal are parallel (shouldn't happen, but safety check)
            const magLength = magneticField.length();
            if (magLength > 1e-6) {
                magneticField.normalize();
            } else {
                // If velocity is parallel to normal (edge case), construct perpendicular vector in tangent plane
                // Find a vector in the tangent plane perpendicular to velocity
                // Try using tangentU first
                const tangentUNorm = tangentU.clone().normalize();
                magneticField.copy(tangentUNorm);
                const velDotU = magneticField.dot(velocityDirection);
                magneticField.sub(velocityDirection.clone().multiplyScalar(velDotU));
                
                if (magneticField.length() < 1e-6) {
                    // If that didn't work, try tangentV
                    const tangentVNorm = tangentV.clone().normalize();
                    magneticField.copy(tangentVNorm);
                    const velDotV = magneticField.dot(velocityDirection);
                    magneticField.sub(velocityDirection.clone().multiplyScalar(velDotV));
                }
                
                if (magneticField.length() > 1e-6) {
                    magneticField.normalize();
                } else {
                    // Last resort: use a default direction
                    magneticField.set(1, 0, 0).normalize();
                }
            }
            
            return { electricField, magneticField };
        }
    }

    // Calculate velocity vector (derivative of position)
    // Works for both torus and figure-8 modes by using numerical differentiation
    function calculateVelocity(position, majorRadius, minorRadius) {
        // For C-type curve, calculate velocity analytically for better accuracy
        if (pathMode === 'lemniscate-c') {
            // Calculate velocity analytically from Viviani curve equations
            // Use innerRadius and outerRadius directly to avoid conversion errors when r > R
            const R = outerRadius; // Outer radius (may be smaller than innerRadius when oblate)
            const r = Math.max(0.1, innerRadius); // Inner radius (may be larger than outerRadius when oblate)
            
            // Match updateSpheroid() to ensure consistency
            // Allow r to be any value >= 0.1, and allow r > R for oblate spheroids
            const safeR = Math.max(0.1, R);
            const safer = Math.max(0.1, r);
            const a = safer; // Equatorial radius (x-z plane) - minor axis
            const c = safeR; // Polar radius (y-axis, vertical) - major axis
            
            // Get current parameter value
            // For C-type, we use 2x speed to match visual appearance with torus
            // Parameter t can grow beyond 4π to trace multiple laps
            const t = animationTime * 2 * 4 * Math.PI * spinDirection; // Unbounded parameter
            // Lemniscate phase: normalize t to [0, 4π) for curve parameterization
            const u = ((t % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
            // Precession angle: grows linearly with t
            const theta = spinDirection * (precession / 2) * t;
            
            // Calculate dt/dt (rate of change of parameter t with respect to time)
            const dt_dt = 2 * 4 * Math.PI * spinDirection;
            // du/dt: since u = t % (4π), du/dt = dt/dt (within the normalized range)
            const du_dt = dt_dt;
            // dTheta/dt: derivative of theta = spinDirection * (precession / 2) * t
            const dTheta_dt = spinDirection * (precession / 2) * dt_dt;
            
            // Calculate derivatives analytically using normalized parameter u
            const cosU = Math.cos(u);
            const sinU = Math.sin(u);
            const halfU = 0.5 * u;
            
            // Body frame derivatives with respect to u
            const dx0_du = -a * sinU / 2;
            const dz0_du = a * cosU / 2;
            const dy0_du = c * Math.cos(halfU) / 2;
            
            // Body frame derivatives with respect to time (multiply by du/dt)
            const dx0_dt = dx0_du * du_dt;
            const dz0_dt = dz0_du * du_dt;
            const dy0_dt = dy0_du * du_dt;
            
            // Current body frame position (needed for rotation terms)
            const x0 = a * (1 + cosU) / 2;
            const z0 = a * sinU / 2;
            const y0 = c * Math.sin(halfU);
            
            // Rotate velocity about Y-axis (matching the position rotation)
            // x = x0 * cos(theta) + z0 * sin(theta)
            // dx/dt = (dx0/dt) * cos(theta) - x0 * sin(theta) * dtheta/dt + (dz0/dt) * sin(theta) + z0 * cos(theta) * dtheta/dt
            const cosTheta = Math.cos(theta);
            const sinTheta = Math.sin(theta);
            const dx_dt = dx0_dt * cosTheta - x0 * sinTheta * dTheta_dt + dz0_dt * sinTheta + z0 * cosTheta * dTheta_dt;
            const dy_dt = dy0_dt; // Y stays the same (rotation axis)
            const dz_dt = -dx0_dt * sinTheta - x0 * cosTheta * dTheta_dt + dz0_dt * cosTheta - z0 * sinTheta * dTheta_dt;
            
            return new THREE.Vector3(dx_dt, dy_dt, dz_dt);
        } else if (pathMode === 'lemniscate-s') {
            // For S-type: need to handle left and right tracks separately
            // Determine which track we're on by checking position
            const R = outerRadius;
            const r = Math.max(0.1, innerRadius);
            
            // Check if we're on the left track (x < 0) or right track (x > 0)
            const onLeft = position.x < 0;
            
            // Calculate position at current time
            let posCurrentVec;
            if (onLeft) {
                // Left track: use new precession functions
                if (precession === 0) {
                    const leftBase = getSLeftBase(animationTime, spinDirection, r, R);
                    posCurrentVec = new THREE.Vector3(leftBase.x0, leftBase.y0, leftBase.z0);
                } else {
                    const leftPrecessed = getSLeftPrecessed(animationTime, spinDirection, r, R, precession);
                    posCurrentVec = new THREE.Vector3(leftPrecessed.x, leftPrecessed.y, leftPrecessed.z);
                }
            } else {
                // Right track: use new precession functions
                if (precession === 0) {
                    const rightBase = getSRightBase(animationTime, spinDirection, r, R);
                    posCurrentVec = new THREE.Vector3(rightBase.x0, rightBase.y0, rightBase.z0);
                } else {
                    const rightPrecessed = getSRightPrecessed(animationTime, spinDirection, r, R, precession);
                    posCurrentVec = new THREE.Vector3(rightPrecessed.x, rightPrecessed.y, rightPrecessed.z);
                }
            }
            
            // Calculate position at next time step
            const dt = 0.0001;
            let posNextVec;
            if (onLeft) {
                // Left track: use new precession functions
                if (precession === 0) {
                    const leftBaseNext = getSLeftBase(animationTime + dt, spinDirection, r, R);
                    posNextVec = new THREE.Vector3(leftBaseNext.x0, leftBaseNext.y0, leftBaseNext.z0);
                } else {
                    const leftPrecessedNext = getSLeftPrecessed(animationTime + dt, spinDirection, r, R, precession);
                    posNextVec = new THREE.Vector3(leftPrecessedNext.x, leftPrecessedNext.y, leftPrecessedNext.z);
                }
            } else {
                // Right track: use new precession functions
                if (precession === 0) {
                    const rightBaseNext = getSRightBase(animationTime + dt, spinDirection, r, R);
                    posNextVec = new THREE.Vector3(rightBaseNext.x0, rightBaseNext.y0, rightBaseNext.z0);
                } else {
                    const rightPrecessedNext = getSRightPrecessed(animationTime + dt, spinDirection, r, R, precession);
                    posNextVec = new THREE.Vector3(rightPrecessedNext.x, rightPrecessedNext.y, rightPrecessedNext.z);
                }
            }
            
            // Calculate velocity
            const velocity = new THREE.Vector3()
                .subVectors(posNextVec, posCurrentVec)
                .divideScalar(dt);
            return velocity;
        } else {
            // For other modes (torus), use numerical differentiation
            const dt = 0.0001; // Small time step for numerical differentiation
            const positionNext = getPhotonPosition(animationTime + dt, majorRadius, minorRadius, true);
            const velocity = new THREE.Vector3()
                .subVectors(positionNext, position)
                .divideScalar(dt);
            return velocity;
        }
    }

    // Calculate momentum vectors (in normalized model units)
    // Works for both torus and figure-8 modes
    function calculateMomentum(position, majorRadius, minorRadius) {
        // Calculate velocity using numerical differentiation
        const velocity = calculateVelocity(position, majorRadius, minorRadius);
        
        // Calculate appropriate normalization factor based on path mode
        let normalizationFactor;
        if (pathMode === 'lemniscate-s' || pathMode === 'lemniscate-c') {
            // For lemniscates: reconstruct r and R from majorRadius and minorRadius
            // majorRadius = (innerRadius + outerRadius) / 2
            // minorRadius = (outerRadius - innerRadius) / 2
            // So: innerRadius = majorRadius - minorRadius, outerRadius = majorRadius + minorRadius
            const r = Math.max(0.1, majorRadius - minorRadius); // Minor axis (equatorial radius)
            const R = Math.max(0.1, majorRadius + minorRadius); // Major axis (polar radius)
            
            // For S curve: use characteristic length that represents the curve scale
            // The curve spans approximately 2*r in width and R in height
            // The parameter rate is 4π per unit time, which contributes to higher velocity magnitudes
            // Use normalization that accounts for both the curve size and parameter rate
            const characteristicLength = Math.max(2 * r, R);
            // The velocity scales with the parameter rate (4π) and the curve size
            // Multiply by 10 to adjust normalization factor gradually
            normalizationFactor = 10.0 / Math.max(0.1, characteristicLength * 4 * Math.PI);
        } else {
            // For torus: normalize by major radius (existing behavior)
            normalizationFactor = 1.0 / Math.max(0.1, majorRadius);
        }
        
        // Normalize velocity for momentum
        const v_normalized = velocity.clone().multiplyScalar(normalizationFactor);
        
        if (pathMode === 'lemniscate-s' || pathMode === 'lemniscate-c') {
            // Figure-8 mode: lemniscate/poloidal decomposition
            // Lemniscate direction is rotation around z-axis
            const x = position.x;
            const y = position.y;
            const z = position.z;
            
            // Check if at exact center (x and y both zero)
            if (Math.abs(x) < 1e-10 && Math.abs(y) < 1e-10) {
                // At center, set lemniscate component to zero
                const p_lem = new THREE.Vector3(0, 0, 0);
                const p_pol = v_normalized.clone();
                
                const normalizedPosition = position.clone().multiplyScalar(normalizationFactor);
                const L_lem = new THREE.Vector3(0, 0, 0);
                const L_pol = new THREE.Vector3().crossVectors(normalizedPosition, p_pol);
                const L_tot = L_pol.clone();
                
                return {
                    linearMomentum: v_normalized,
                    toroidalAngularMomentum: L_lem,
                    poloidalAngularMomentum: L_pol,
                    totalAngularMomentum: L_tot
                };
            }
            
            // Unit vector tangential to circle around z-axis: e_tor = normalize(-y, x, 0)
            const e_lem = new THREE.Vector3(-y, x, 0).normalize();
            
            // Project velocity onto lemniscate direction
            const v_lem_mag = v_normalized.dot(e_lem);
            const v_lem = e_lem.clone().multiplyScalar(v_lem_mag);
            const v_pol = v_normalized.clone().sub(v_lem);
            
            // Momentum components
            const p_lem = v_lem.clone();
            const p_pol = v_pol.clone();
            
            // Angular momentum components: L = r × p
            const normalizedPosition = position.clone().multiplyScalar(normalizationFactor);
            const L_lem = new THREE.Vector3().crossVectors(normalizedPosition, p_lem);
            const L_pol = new THREE.Vector3().crossVectors(normalizedPosition, p_pol);
            const L_tot = L_lem.clone().add(L_pol);
            
            return {
                linearMomentum: v_normalized,
                toroidalAngularMomentum: L_lem,
                poloidalAngularMomentum: L_pol,
                totalAngularMomentum: L_tot
            };
        } else {
            // Torus mode: use existing toroidal/poloidal decomposition
            // Get current φ and θ from animation time
            let uToroidal, vPoloidal;
            if (windingRatio === '1:2') {
                uToroidal = 4 * Math.PI;
                vPoloidal = 2 * Math.PI;
            } else {
                uToroidal = 2 * Math.PI;
                vPoloidal = 4 * Math.PI;
            }
            const u = animationTime * uToroidal * (1 + precession) * spinDirection;
            const v = animationTime * vPoloidal * (1 + precession * 2) * spinDirection;
            
            // Calculate tangent vectors
            // r_φ = ∂r/∂φ = (-(R+r cos θ) sin φ, (R+r cos θ) cos φ, 0)
            const r_phi = new THREE.Vector3(
                -(majorRadius + minorRadius * Math.cos(v)) * Math.sin(u),
                (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u),
                0
            );
            
            // r_θ = ∂r/∂θ = (-r sin θ cos φ, -r sin θ sin φ, r cos θ)
            const r_theta = new THREE.Vector3(
                -minorRadius * Math.sin(v) * Math.cos(u),
                -minorRadius * Math.sin(v) * Math.sin(u),
                minorRadius * Math.cos(v)
            );
            
            // Time derivatives (angular velocities)
            let phi_dot, theta_dot;
            if (windingRatio === '1:2') {
                phi_dot = 1.0 * (1 + precession) * spinDirection;
                theta_dot = 0.5 * (1 + precession * 2) * spinDirection;
            } else {
                phi_dot = 1.0 * (1 + precession) * spinDirection;
                theta_dot = 2.0 * (1 + precession * 2) * spinDirection;
            }
            
            // Velocities in model units
            const v_tor = r_phi.clone().multiplyScalar(phi_dot);
            const v_pol = r_theta.clone().multiplyScalar(theta_dot);
            
            // Momentum components
            const p_tor = v_tor.clone().multiplyScalar(normalizationFactor);
            const p_pol = v_pol.clone().multiplyScalar(normalizationFactor);
            
            // Total linear momentum
            const linearMomentum = p_tor.clone().add(p_pol);
            
            // Angular momentum components: L = r × p
            const normalizedPosition = position.clone().multiplyScalar(normalizationFactor);
            const L_tor = new THREE.Vector3().crossVectors(normalizedPosition, p_tor);
            const L_pol = new THREE.Vector3().crossVectors(normalizedPosition, p_pol);
            const L_tot = L_tor.clone().add(L_pol);
            
            return {
                linearMomentum,
                toroidalAngularMomentum: L_tor,
                poloidalAngularMomentum: L_pol,
                totalAngularMomentum: L_tot
            };
        }
    }

    // Format number in scientific notation if needed
    function formatScientific(value) {
        // If value is between -0.001 and 0.001, display as 0.000 or -0.000
        // This prevents scientific notation for very small values
        if (Math.abs(value) < 0.001) {
            return value >= 0 ? '0.000' : '-0.000';
        } else if (Math.abs(value) >= 1000) {
            return value.toExponential(3);
        } else {
            return value.toFixed(3);
        }
    }
    
    // Format vector as |magnitude|: (x, y, z)
    function formatVector(vec) {
        const magnitude = vec.length();
        return `|${formatScientific(magnitude)}|: (${formatScientific(vec.x)}, ${formatScientific(vec.y)}, ${formatScientific(vec.z)})`;
    }
    
    // Update momentum labels based on current path mode
    function updateMomentumLabels() {
        // Find the table header for the third column (Toroidal/Lemniscate Angular)
        const momentumTable = document.querySelector('#momentumDisplay table');
        if (momentumTable) {
            const headerRow = momentumTable.querySelector('thead tr');
            if (headerRow) {
                const toroidalHeader = headerRow.children[2]; // Third column (index 2)
                if (toroidalHeader) {
                    if (pathMode === 'lemniscate-s' || pathMode === 'lemniscate-c') {
                        toroidalHeader.textContent = 'Lemniscate Angular';
                    } else {
                        toroidalHeader.textContent = 'Toroidal Angular';
                    }
                }
            }
        }
    }
    
    // Update momentum display
    function updateMomentumDisplay(
        instantLinear, 
        instantToroidalAngular, 
        instantPoloidalAngular, 
        instantTotalAngular,
        avgLinear, 
        avgToroidalAngular, 
        avgPoloidalAngular, 
        avgTotalAngular
    ) {
        const instantLinearDisplay = document.getElementById('instantLinearMomentum');
        const instantToroidalDisplay = document.getElementById('instantToroidalAngularMomentum');
        const instantPoloidalDisplay = document.getElementById('instantPoloidalAngularMomentum');
        const instantTotalDisplay = document.getElementById('instantTotalAngularMomentum');
        const avgLinearDisplay = document.getElementById('avgLinearMomentum');
        const avgToroidalDisplay = document.getElementById('avgToroidalAngularMomentum');
        const avgPoloidalDisplay = document.getElementById('avgPoloidalAngularMomentum');
        const avgTotalDisplay = document.getElementById('avgTotalAngularMomentum');
        
        if (instantLinearDisplay && instantLinear) {
            instantLinearDisplay.textContent = formatVector(instantLinear);
        }
        if (instantToroidalDisplay && instantToroidalAngular) {
            instantToroidalDisplay.textContent = formatVector(instantToroidalAngular);
        }
        if (instantPoloidalDisplay && instantPoloidalAngular) {
            instantPoloidalDisplay.textContent = formatVector(instantPoloidalAngular);
        }
        if (instantTotalDisplay && instantTotalAngular) {
            instantTotalDisplay.textContent = formatVector(instantTotalAngular);
        }
        if (avgLinearDisplay && avgLinear) {
            avgLinearDisplay.textContent = formatVector(avgLinear);
        }
        if (avgToroidalDisplay && avgToroidalAngular) {
            avgToroidalDisplay.textContent = formatVector(avgToroidalAngular);
        }
        if (avgPoloidalDisplay && avgPoloidalAngular) {
            avgPoloidalDisplay.textContent = formatVector(avgPoloidalAngular);
        }
        if (avgTotalDisplay && avgTotalAngular) {
            avgTotalDisplay.textContent = formatVector(avgTotalAngular);
        }
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        if (!isPaused) {
            // Slow down animation by factor of 10
            animationTime += 0.001 * photonSpeed;
            
            // Update photon position
            // For torus: use constraint to ensure valid geometry
            // For lemniscates: allow r to be any value >= 0.1, including r > R
            let effectiveInnerRadius;
            if (pathMode === 'lemniscate-s' || pathMode === 'lemniscate-c') {
                // For lemniscates, don't constrain r relative to R
                effectiveInnerRadius = Math.max(0.1, innerRadius);
            } else {
                // For torus, ensure outerRadius > innerRadius
                effectiveInnerRadius = Math.min(innerRadius, outerRadius - 0.1);
            }
            const majorRadius = Math.max(0.1, (effectiveInnerRadius + outerRadius) / 2);
            const minorRadius = Math.max(0.1, (outerRadius - effectiveInnerRadius) / 2);
            const t = (animationTime % 1);
            // Use animationTime directly for precession to accumulate continuously
            let position = getPhotonPosition(animationTime, majorRadius, minorRadius, true);
            
            // Declare field variables for use in accumulation (after if/else block)
            let electricField, magneticField;
            
            // For S-type: update both photons and vectors
            if (pathMode === 'lemniscate-s') {
                // Calculate the offset (r value)
                // Use innerRadius and outerRadius directly to avoid conversion errors when r > R
                const R = outerRadius; // Outer radius (may be smaller than innerRadius when oblate)
                const r = Math.max(0.1, innerRadius); // Inner radius (may be larger than outerRadius when oblate)
                const safer = Math.max(0.1, r);
                
                // Calculate left track position with precession (if enabled)
                let leftPosition;
                let showLeftTrack;
                let uNormalized; // For right track calculation
                if (precession === 0) {
                    // No precession: use base left curve
                    const leftBase = getSLeftBase(animationTime, spinDirection, r, R);
                    uNormalized = leftBase.uNormalized;
                    showLeftTrack = uNormalized >= 2 * Math.PI;
                    leftPosition = new THREE.Vector3(leftBase.x0, leftBase.y0, leftBase.z0);
                } else {
                    // With precession: use precessed left curve
                    const leftPrecessed = getSLeftPrecessed(animationTime, spinDirection, r, R, precession);
                    // Only draw left loop when uNormalized in [2π, 4π)
                    uNormalized = leftPrecessed.multiPhase % (4 * Math.PI);
                    showLeftTrack = uNormalized >= 2 * Math.PI;
                    leftPosition = new THREE.Vector3(leftPrecessed.x, leftPrecessed.y, leftPrecessed.z);
                }
                
                if (showLeftTrack) {
                    photon.position.copy(leftPosition);
                    photon.visible = true;
                } else {
                    photon.visible = false;
                }
                
                // Second photon (right track) - use new precession functions
                let rightPosition;
                let showRightTrack;
                if (precession === 0) {
                    // No precession: use base right curve
                    const rightBase = getSRightBase(animationTime, spinDirection, r, R);
                    // Right visible when uS < 2π (complement of left's range)
                    const uS = rightBase.uNormalized;
                    showRightTrack = uS < 2 * Math.PI;
                    rightPosition = new THREE.Vector3(rightBase.x0, rightBase.y0, rightBase.z0);
                } else {
                    // With precession: use precessed right curve
                    const rightPrecessed = getSRightPrecessed(animationTime, spinDirection, r, R, precession);
                    // Right visible when uS < 2π (complement of left's range)
                    const uS = rightPrecessed.multiPhase % (4 * Math.PI);
                    showRightTrack = uS < 2 * Math.PI;
                    rightPosition = new THREE.Vector3(rightPrecessed.x, rightPrecessed.y, rightPrecessed.z);
                }
                
                if (showRightTrack) {
                    photon2.position.copy(rightPosition);
                    photon2.visible = true;
                } else {
                    photon2.visible = false;
                }
                
                // Update field vectors for left track
                const { electricField: electricFieldLeft, magneticField: magneticFieldLeft } = calculateFieldVectors(leftPosition, animationTime, majorRadius, minorRadius);
                const scaleFactor = getScaleFactor(majorRadius);
                const showVectors = controls.showFieldAndMomentumVectors ? controls.showFieldAndMomentumVectors.checked : true;
                if (showLeftTrack && showVectors) {
                    electricFieldArrow = updateArrow(electricFieldArrow, electricFieldLeft, leftPosition, electricFieldColor, scaleFactor);
                    magneticFieldArrow = updateArrow(magneticFieldArrow, magneticFieldLeft, leftPosition, magneticFieldColor, scaleFactor);
                    electricFieldArrow.visible = true;
                    magneticFieldArrow.visible = true;
                } else {
                    electricFieldArrow.visible = false;
                    magneticFieldArrow.visible = false;
                }
                
                // Update field vectors for right track
                const { electricField: electricFieldRight, magneticField: magneticFieldRight } = calculateFieldVectors(rightPosition, animationTime, majorRadius, minorRadius);
                if (showRightTrack && showVectors) {
                    electricFieldArrow2 = updateArrow(electricFieldArrow2, electricFieldRight, rightPosition, electricFieldColor, scaleFactor);
                    magneticFieldArrow2 = updateArrow(magneticFieldArrow2, magneticFieldRight, rightPosition, magneticFieldColor, scaleFactor);
                    electricFieldArrow2.visible = true;
                    magneticFieldArrow2.visible = true;
                } else {
                    electricFieldArrow2.visible = false;
                    magneticFieldArrow2.visible = false;
                }
                
                // Update photon scales
                const photonScale = scaleFactor;
                photon.scale.set(photonScale, photonScale, photonScale);
                photon2.scale.set(photonScale, photonScale, photonScale);
                
                // Check if photons are obstructed and change colors
                const isLeftObstructed = isPhotonObstructed(leftPosition);
                const leftColor = isLeftObstructed ? photonColorObstructed : photonColorVisible;
                photonMaterial.color.setHex(leftColor);
                photonMaterial.emissive.setHex(leftColor);
                photonGlowMaterial.color.setHex(leftColor);
                
                const isRightObstructed = isPhotonObstructed(rightPosition);
                const rightColor = isRightObstructed ? photonColorObstructed : photonColorVisible;
                photon2Material.color.setHex(rightColor);
                photon2Material.emissive.setHex(rightColor);
                photon2GlowMaterial.color.setHex(rightColor);
                
                // Use the currently visible track's position and fields for accumulation and momentum
                // If left track is visible, use it; otherwise use right track
                if (showLeftTrack) {
                    position = leftPosition;
                    electricField = electricFieldLeft;
                    magneticField = magneticFieldLeft;
                } else if (showRightTrack) {
                    position = rightPosition;
                    electricField = electricFieldRight;
                    magneticField = magneticFieldRight;
                } else {
                    // Neither track visible (shouldn't happen, but fallback to left)
                    position = leftPosition;
                    electricField = electricFieldLeft;
                    magneticField = magneticFieldLeft;
                }
            } else {
                // For other modes: single photon and vectors as before
                photon.position.copy(position);
                
                // Check if photon is obstructed and change color
                const isObstructed = isPhotonObstructed(position);
                const currentColor = isObstructed ? photonColorObstructed : photonColorVisible;
                photonMaterial.color.setHex(currentColor);
                photonMaterial.emissive.setHex(currentColor);
                photonGlowMaterial.color.setHex(currentColor);
                
                // Update field vectors (assign to outer variables, not const)
                const fieldResult = calculateFieldVectors(position, animationTime, majorRadius, minorRadius);
                electricField = fieldResult.electricField;
                magneticField = fieldResult.magneticField;
                const scaleFactor = getScaleFactor(majorRadius);
                const showVectors = controls.showFieldAndMomentumVectors ? controls.showFieldAndMomentumVectors.checked : true;
                if (showVectors) {
                    electricFieldArrow = updateArrow(electricFieldArrow, electricField, position, electricFieldColor, scaleFactor);
                    magneticFieldArrow = updateArrow(magneticFieldArrow, magneticField, position, magneticFieldColor, scaleFactor);
                    electricFieldArrow.visible = true;
                    magneticFieldArrow.visible = true;
                } else {
                    electricFieldArrow.visible = false;
                    magneticFieldArrow.visible = false;
                }
                
                // Update photon scale
                const photonScale = scaleFactor;
                photon.scale.set(photonScale, photonScale, photonScale);
            }
            
            // Store these values for trail point calculation to ensure consistency
            const trailMajorRadius = majorRadius;
            const trailMinorRadius = minorRadius;
            
            // Accumulate field vectors for cycle averaging (similar to momentum)
            // Only accumulate if fields are valid (not NaN or Infinity)
            if (isFinite(electricField.x) && isFinite(electricField.y) && isFinite(electricField.z)) {
                accumulatedElectricField.add(electricField);
                fieldSampleCount++;
            }
            if (isFinite(magneticField.x) && isFinite(magneticField.y) && isFinite(magneticField.z)) {
                accumulatedMagneticField.add(magneticField);
            }
            
            // Calculate momentum vectors
            const { linearMomentum, toroidalAngularMomentum, poloidalAngularMomentum, totalAngularMomentum } = calculateMomentum(position, majorRadius, minorRadius);
            
            // Determine toroidal angle per rotation based on path mode and winding ratio (for loop detection)
            let uToroidalPerRotationLoop;
            if (pathMode === 'lemniscate-s') {
                // S-type: uses 4π for the major path
                uToroidalPerRotationLoop = 4 * Math.PI;
            } else if (pathMode === 'lemniscate-c') {
                // C-type: uses 2x speed, so effective angle per rotation is 2 * 4π = 8π
                // But for loop detection, we still track one cycle as 4π (the base cycle)
                uToroidalPerRotationLoop = 4 * Math.PI;
            } else {
                // Torus mode: depends on winding ratio
                if (windingRatio === '1:2') {
                    uToroidalPerRotationLoop = 4 * Math.PI; // 1:2 winding: 4π toroidal per rotation
                } else {
                    uToroidalPerRotationLoop = 2 * Math.PI; // 2:1 winding: 2π toroidal per rotation
                }
            }
            
            // Calculate current toroidal angle WITH precession (matches actual path calculation)
            // This must match how the position is calculated in getTorusPosition/getPhotonPosition
            const currentToroidalAngleLoop = animationTime * uToroidalPerRotationLoop * (1 + precession) * spinDirection;
            
            // Initialize angleAtCycleStart on first frame if needed
            if (momentumSampleCount === 0 && angleAtCycleStart === 0 && currentToroidalAngleLoop !== 0) {
                angleAtCycleStart = currentToroidalAngleLoop;
            }
            
            // Detect loop completion: when toroidal angle has increased by one full base cycle
            // A full cycle is uToroidalPerRotationLoop radians (the base cycle length, without precession factor)
            // We track the angle WITH precession, but detect completion when it has increased by the base cycle length
            const angleDelta = spinDirection > 0 ? 
                (currentToroidalAngleLoop - angleAtCycleStart) : 
                (angleAtCycleStart - currentToroidalAngleLoop);
            
            // Detect loop completion: when we've traveled a full base cycle's worth of angle
            const loopJustCompleted = angleDelta >= uToroidalPerRotationLoop;
            
            if (loopJustCompleted) {
                // Cycle just completed - calculate and store the averages from the completed cycle
                if (momentumSampleCount > 0) {
                    lastCompletedAvgLinearMomentum = accumulatedLinearMomentum.clone().divideScalar(momentumSampleCount);
                    lastCompletedAvgToroidalAngularMomentum = accumulatedToroidalAngularMomentum.clone().divideScalar(momentumSampleCount);
                    lastCompletedAvgPoloidalAngularMomentum = accumulatedPoloidalAngularMomentum.clone().divideScalar(momentumSampleCount);
                    lastCompletedAvgTotalAngularMomentum = accumulatedTotalAngularMomentum.clone().divideScalar(momentumSampleCount);
                }
                if (fieldSampleCount > 0) {
                    lastCompletedAvgElectricField = accumulatedElectricField.clone().divideScalar(fieldSampleCount);
                    lastCompletedAvgMagneticField = accumulatedMagneticField.clone().divideScalar(fieldSampleCount);
                }
                
                // Reset accumulation for the new cycle
                accumulatedLinearMomentum.set(0, 0, 0);
                accumulatedToroidalAngularMomentum.set(0, 0, 0);
                accumulatedPoloidalAngularMomentum.set(0, 0, 0);
                accumulatedTotalAngularMomentum.set(0, 0, 0);
                momentumSampleCount = 0;
                accumulatedElectricField.set(0, 0, 0);
                accumulatedMagneticField.set(0, 0, 0);
                fieldSampleCount = 0;
                angleAtCycleStart = currentToroidalAngleLoop; // Start tracking from current angle
            }
            
            lastToroidalAngle = currentToroidalAngleLoop;
            
            // Accumulate momentum for the current cycle
            accumulatedLinearMomentum.add(linearMomentum.clone());
            accumulatedToroidalAngularMomentum.add(toroidalAngularMomentum.clone());
            accumulatedPoloidalAngularMomentum.add(poloidalAngularMomentum.clone());
            accumulatedTotalAngularMomentum.add(totalAngularMomentum.clone());
            momentumSampleCount++;
            
            // Update display at consistent intervals (twice per second)
            // Use stored averages from last completed cycle (only updates when cycle completes)
            const currentTime = Date.now();
            if (currentTime - lastDisplayUpdateTime >= displayUpdateInterval) {
                updateFieldVectorsDisplay(
                    electricField,
                    magneticField,
                    lastCompletedAvgElectricField,
                    lastCompletedAvgMagneticField
                );
                updateMomentumDisplay(
                    linearMomentum, 
                    toroidalAngularMomentum, 
                    poloidalAngularMomentum, 
                    totalAngularMomentum,
                    lastCompletedAvgLinearMomentum, 
                    lastCompletedAvgToroidalAngularMomentum, 
                    lastCompletedAvgPoloidalAngularMomentum, 
                    lastCompletedAvgTotalAngularMomentum
                );
                lastDisplayUpdateTime = currentTime;
            }
            
            // Update trail every frame for smoothness
            // Track trail length based on actual toroidal angle (ignoring precession)
            // Determine toroidal angle per rotation based on path mode and winding ratio
            let uToroidalPerRotation;
            if (pathMode === 'lemniscate-s' || pathMode === 'lemniscate-c') {
                // Figure-8 mode: uses 4π for the major path
                uToroidalPerRotation = 4 * Math.PI;
            } else {
                // Torus mode: depends on winding ratio
                if (windingRatio === '1:2') {
                    uToroidalPerRotation = 4 * Math.PI; // 1:2 winding: 4π toroidal per rotation
                } else {
                    uToroidalPerRotation = 2 * Math.PI; // 2:1 winding: 2π toroidal per rotation
                }
            }
            
            // Calculate maximum toroidal angle for trail (ignoring precession)
            const maxToroidalAngle = trailLengthRotations >= 100 ? 
                Number.MAX_SAFE_INTEGER : 
                trailLengthRotations * uToroidalPerRotation;
            
            // Calculate current toroidal angle (base angle without precession for trail length tracking)
            // This is the angle that would be used if precession = 0, for trail length purposes only
            // For lemniscate mode, we need to track the actual parameter u (0 to 4π per cycle)
            // For torus mode, we track the toroidal angle
            let currentToroidalAngle;
            if (pathMode === 'lemniscate-s' || pathMode === 'lemniscate-c') {
                // For lemniscate: track the parameter u directly (0 to 4π per cycle)
                // u = animationTime * 4π * (1 + precession) * spinDirection
                // For trail length (ignoring precession): u = animationTime * 4π * spinDirection
                currentToroidalAngle = animationTime * 4 * Math.PI * spinDirection;
            } else {
                // For torus: use the standard calculation
                currentToroidalAngle = animationTime * uToroidalPerRotation * spinDirection;
            }
            
            // Ensure trail points stay within bounds (only for torus mode)
            let constrainedPosition = position.clone();
            if (pathMode === 'torus') {
                // Torus mode: constrain points to torus surface
                const distanceFromCenter = Math.sqrt(constrainedPosition.x * constrainedPosition.x + constrainedPosition.y * constrainedPosition.y);
                const maxDistance = majorRadius + minorRadius;
                const minDistance = Math.max(0, majorRadius - minorRadius);
                const maxZ = minorRadius;
                
                // Strictly enforce bounds - if outside, project back onto torus surface
                if (distanceFromCenter > maxDistance || distanceFromCenter < minDistance || Math.abs(constrainedPosition.z) > maxZ) {
                    // Clamp distance in xy-plane to torus bounds
                    const clampedDistance = Math.max(minDistance, Math.min(maxDistance, distanceFromCenter));
                    const angle = Math.atan2(constrainedPosition.y, constrainedPosition.x);
                    constrainedPosition.x = clampedDistance * Math.cos(angle);
                    constrainedPosition.y = clampedDistance * Math.sin(angle);
                    
                    // For z, ensure it satisfies torus equation: (distance - majorRadius)^2 + z^2 = minorRadius^2
                    const distFromMajor = Math.abs(clampedDistance - majorRadius);
                    const validZ = Math.sqrt(Math.max(0, minorRadius * minorRadius - distFromMajor * distFromMajor));
                    // Clamp z to valid range while preserving sign
                    if (Math.abs(constrainedPosition.z) > validZ) {
                        constrainedPosition.z = Math.sign(constrainedPosition.z) * validZ;
                    }
                }
            }
            // Figure-8 mode: no constraint needed, position is already on the figure-8 curve
            
            // For S-type: add points to both trails for full 4π range
            if (pathMode === 'lemniscate-s') {
                // Calculate the offset (r value)
                // Use innerRadius and outerRadius directly to avoid conversion errors when r > R
                const R = outerRadius; // Outer radius (may be smaller than innerRadius when oblate)
                const r = Math.max(0.1, innerRadius); // Inner radius (may be larger than outerRadius when oblate)
                const safer = Math.max(0.1, r);
                const offset2r = 2 * safer; // Offset for second trail (+2r from first)
                
                const unobstructedColor = new THREE.Color(0xffdd00); // Bright yellow for unobstructed
                const obstructedColor = new THREE.Color(0xaa8800); // Darker yellow-brown for obstructed segments
                
                // Calculate left track position with precession (if enabled)
                let leftPoint;
                let showLeftTrail;
                if (precession === 0) {
                    // No precession: use base left curve
                    const leftBase = getSLeftBase(animationTime, spinDirection, r, R);
                    showLeftTrail = leftBase.uNormalized >= 2 * Math.PI;
                    if (showLeftTrail) {
                        leftPoint = new THREE.Vector3(leftBase.x0, leftBase.y0, leftBase.z0);
                    }
                } else {
                    // With precession: use precessed left curve
                    const leftPrecessed = getSLeftPrecessed(animationTime, spinDirection, r, R, precession);
                    // Only draw left loop when uNormalized in [2π, 4π)
                    const uNormalized = leftPrecessed.multiPhase % (4 * Math.PI);
                    showLeftTrail = uNormalized >= 2 * Math.PI;
                    if (showLeftTrail) {
                        leftPoint = new THREE.Vector3(leftPrecessed.x, leftPrecessed.y, leftPrecessed.z);
                    }
                }
                
                // First trail (left spheroid) - only add points when u is between 4π and 2π
                if (showLeftTrail) {
                    const isLeftObstructed = isPhotonObstructed(leftPoint);
                    
                    trailPoints.push(leftPoint);
                    trailColors.push(isLeftObstructed ? obstructedColor : unobstructedColor);
                    trailToroidalAngles.push(currentToroidalAngle);
                }
                
                // Second trail (right spheroid) - use new precession functions
                let rightPoint;
                let showRightTrail;
                if (precession === 0) {
                    // No precession: use base right curve
                    const rightBase = getSRightBase(animationTime, spinDirection, r, R);
                    // Right visible when uS < 2π (complement of left's range)
                    const uS = rightBase.uNormalized;
                    showRightTrail = uS < 2 * Math.PI;
                    if (showRightTrail) {
                        rightPoint = new THREE.Vector3(rightBase.x0, rightBase.y0, rightBase.z0);
                    }
                } else {
                    // With precession: use precessed right curve
                    const rightPrecessed = getSRightPrecessed(animationTime, spinDirection, r, R, precession);
                    // Right visible when uS < 2π (complement of left's range)
                    const uS = rightPrecessed.multiPhase % (4 * Math.PI);
                    showRightTrail = uS < 2 * Math.PI;
                    if (showRightTrail) {
                        rightPoint = new THREE.Vector3(rightPrecessed.x, rightPrecessed.y, rightPrecessed.z);
                    }
                }
                
                // Only add points when right track should be visible
                if (showRightTrail) {
                    const isRightObstructed = isPhotonObstructed(rightPoint);
                    
                    trailPoints2.push(rightPoint);
                    trailColors2.push(isRightObstructed ? obstructedColor : unobstructedColor);
                    trailToroidalAngles2.push(currentToroidalAngle);
                }
                
                // Track original sequential index for both trails
                if (trailOriginalIndices.length === 0) {
                    trailOriginalIndices.push(0);
                    trailOriginalIndices2.push(0);
                } else {
                    const lastIndex = trailOriginalIndices[trailOriginalIndices.length - 1];
                    trailOriginalIndices.push(lastIndex + 1);
                    const lastIndex2 = trailOriginalIndices2[trailOriginalIndices2.length - 1];
                    trailOriginalIndices2.push(lastIndex2 + 1);
                }
            } else {
                // For other modes: single trail as before
                // Check if this trail point is obstructed (similar to photon obstruction check)
                const isTrailPointObstructed = isPhotonObstructed(constrainedPosition);
                
                // Always add all points to trailPoints to track original sequence
                // This allows us to detect gaps even when transparency = 0
                const unobstructedColor = new THREE.Color(0xffdd00); // Bright yellow for unobstructed
                const obstructedColor = new THREE.Color(0xaa8800); // Darker yellow-brown for obstructed segments (brighter than before but still less intense)
                
                trailPoints.push(constrainedPosition);
                trailColors.push(isTrailPointObstructed ? obstructedColor : unobstructedColor);
                trailToroidalAngles.push(currentToroidalAngle);
                
                // Track original sequential index (increments for every point added, creating gaps when points are filtered out)
                if (trailOriginalIndices.length === 0) {
                    trailOriginalIndices.push(0);
                } else {
                    const lastIndex = trailOriginalIndices[trailOriginalIndices.length - 1];
                    trailOriginalIndices.push(lastIndex + 1);
                }
            }
            
            // Remove old points when toroidal angle span exceeds maxToroidalAngle
            // currentToroidalAngle is a continuous, unbounded value that increases with time
            // So we can simply calculate the absolute difference
            // Also limit maximum trail points to prevent performance issues (even when unlimited)
            const maxTrailPoints = 5000; // Maximum points to prevent performance degradation
            let trailChanged = false;
            let trailChanged2 = false;
            
            if (pathMode === 'lemniscate-s') {
                // For S-type: update both trails
                if (trailLengthRotations < 100 && trailToroidalAngles.length > 1) {
                    while (trailToroidalAngles.length > 1) {
                        const oldestAngle = trailToroidalAngles[0];
                        const totalAngleSpan = Math.abs(currentToroidalAngle - oldestAngle);
                        
                        if (totalAngleSpan <= maxToroidalAngle) {
                            break;
                        }
                        
                        trailPoints.shift();
                        trailColors.shift();
                        trailOriginalIndices.shift();
                        trailToroidalAngles.shift();
                        trailChanged = true;
                    }
                }
                
                // Same for trail2
                if (trailLengthRotations < 100 && trailToroidalAngles2.length > 1) {
                    while (trailToroidalAngles2.length > 1) {
                        const oldestAngle = trailToroidalAngles2[0];
                        const totalAngleSpan = Math.abs(currentToroidalAngle - oldestAngle);
                        
                        if (totalAngleSpan <= maxToroidalAngle) {
                            break;
                        }
                        
                        trailPoints2.shift();
                        trailColors2.shift();
                        trailOriginalIndices2.shift();
                        trailToroidalAngles2.shift();
                        trailChanged2 = true;
                    }
                }
            } else {
                // For other modes: single trail
                if (trailLengthRotations < 100 && trailToroidalAngles.length > 1) {
                    while (trailToroidalAngles.length > 1) {
                        const oldestAngle = trailToroidalAngles[0];
                        // Calculate total angular distance traveled (simple difference since angles are continuous)
                        const totalAngleSpan = Math.abs(currentToroidalAngle - oldestAngle);
                        
                        if (totalAngleSpan <= maxToroidalAngle) {
                            break; // Angle span is within limit, stop removing points
                        }
                        
                        // Remove oldest point
                        trailPoints.shift();
                        trailColors.shift();
                        trailOriginalIndices.shift();
                        trailToroidalAngles.shift();
                        trailChanged = true;
                    }
                }
            }
            
            // Limit trail points even when "unlimited" to prevent performance issues
            if (pathMode === 'lemniscate-s') {
                // For S-type: limit both trails
                if (trailPoints.length > maxTrailPoints) {
                    const removeCount = trailPoints.length - maxTrailPoints;
                    trailPoints.splice(0, removeCount);
                    trailColors.splice(0, removeCount);
                    trailOriginalIndices.splice(0, removeCount);
                    trailToroidalAngles.splice(0, removeCount);
                    trailChanged = true;
                }
                if (trailPoints2.length > maxTrailPoints) {
                    const removeCount = trailPoints2.length - maxTrailPoints;
                    trailPoints2.splice(0, removeCount);
                    trailColors2.splice(0, removeCount);
                    trailOriginalIndices2.splice(0, removeCount);
                    trailToroidalAngles2.splice(0, removeCount);
                    trailChanged2 = true;
                }
            } else {
                // For other modes: single trail
                if (trailPoints.length > maxTrailPoints) {
                    const removeCount = trailPoints.length - maxTrailPoints;
                    trailPoints.splice(0, removeCount);
                    trailColors.splice(0, removeCount);
                    trailOriginalIndices.splice(0, removeCount);
                    trailToroidalAngles.splice(0, removeCount);
                    trailChanged = true;
                }
            }
            
            // Only update trail geometry
            if (pathMode === 'lemniscate-s') {
                // For S-type: update both trails
                const shouldUpdateTrail = trailChanged || (Math.floor(animationTime * 60) % 3 === 0);
                const shouldUpdateTrail2 = trailChanged2 || (Math.floor(animationTime * 60) % 3 === 0);
                
                // Update first trail (left spheroid)
                if (trailPoints.length > 1 && shouldUpdateTrail) {
                    let pointsToRender = trailPoints;
                    let colorsToRender = trailColors;
                    
                    if (transparency === 0) {
                        const updatedColors = [];
                        const checkInterval = Math.max(1, Math.floor(trailPoints.length / 300));
                        let lastColor = new THREE.Color(0xffdd00);
                        
                        for (let i = 0; i < trailPoints.length; i++) {
                            if (i % checkInterval === 0 || i === trailPoints.length - 1) {
                                const isObstructed = isPhotonObstructed(trailPoints[i]);
                                lastColor = isObstructed ? new THREE.Color(0x000000) : new THREE.Color(0xffdd00);
                            }
                            updatedColors.push(lastColor.clone());
                        }
                        colorsToRender = updatedColors;
                    }
                    
                    if (pointsToRender.length > 1) {
                        updateTrailGeometry(pointsToRender, colorsToRender);
                    } else {
                        updateTrailGeometry([], []);
                    }
                }
                
                // Update second trail (right spheroid)
                if (trailPoints2.length > 1 && shouldUpdateTrail2) {
                    let pointsToRender2 = trailPoints2;
                    let colorsToRender2 = trailColors2;
                    
                    if (transparency === 0) {
                        const updatedColors2 = [];
                        const checkInterval = Math.max(1, Math.floor(trailPoints2.length / 300));
                        let lastColor2 = new THREE.Color(0xffdd00);
                        
                        for (let i = 0; i < trailPoints2.length; i++) {
                            if (i % checkInterval === 0 || i === trailPoints2.length - 1) {
                                const isObstructed = isPhotonObstructed(trailPoints2[i]);
                                lastColor2 = isObstructed ? new THREE.Color(0x000000) : new THREE.Color(0xffdd00);
                            }
                            updatedColors2.push(lastColor2.clone());
                        }
                        colorsToRender2 = updatedColors2;
                    }
                    
                    if (pointsToRender2.length > 1) {
                        updateTrailGeometry2(pointsToRender2, colorsToRender2);
                    } else {
                        updateTrailGeometry2([], []);
                    }
                }
            } else {
                // For other modes: single trail
                const shouldUpdateTrail = trailChanged || (Math.floor(animationTime * 60) % 3 === 0);
                
                if (trailPoints.length > 1 && shouldUpdateTrail) {
                    // When transparency = 0, filter out obstructed points and create separate line segments
                    let pointsToRender = trailPoints;
                    let colorsToRender = trailColors;
                    let indicesToUse = null;
                    
                    if (transparency === 0) {
                        // At transparency = 0, show all points but use dark color for obstructed segments
                        // Throttle obstruction recalculation - only check every Nth point to reduce raycasting
                        const updatedColors = [];
                        const checkInterval = Math.max(1, Math.floor(trailPoints.length / 300)); // Check at most 300 points
                        let lastColor = new THREE.Color(0xffdd00); // Bright yellow
                        
                        for (let i = 0; i < trailPoints.length; i++) {
                            if (i % checkInterval === 0 || i === trailPoints.length - 1) {
                                // Recalculate obstruction for sampled points
                                const isObstructed = isPhotonObstructed(trailPoints[i]);
                                lastColor = isObstructed ? new THREE.Color(0x000000) : new THREE.Color(0xffdd00); // Bright yellow
                            }
                            updatedColors.push(lastColor.clone());
                        }
                        
                        pointsToRender = trailPoints;
                        colorsToRender = updatedColors;
                        // No need for custom indices - use default line connectivity
                    }
                    
                    if (pointsToRender.length > 1) {
                        updateTrailGeometry(pointsToRender, colorsToRender);
                    } else {
                        // Not enough points, clear geometry
                        updateTrailGeometry([], []);
                    }
                }
            }
            
            // Rotate photon for visual effect
            photon.rotation.x += 0.1;
            photon.rotation.y += 0.1;
        }
        
        renderer.render(scene, camera);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        // Make renderer wider to account for left shift, ensuring dark background extends to right edge
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Initialize
    updateCamera();
    updateGeometry();
    updateGeometryVisibility();
    updateFieldVectorsDisplay(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0)
    ); // Initialize field vectors display
    
    updateMomentumDisplay(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0)
    ); // Initialize momentum display
    
    // Help modal functionality
    const helpButton = document.getElementById('helpButton');
    const helpModal = document.getElementById('helpModal');
    const closeHelp = document.getElementById('closeHelp');
    
    if (helpButton && helpModal) {
        helpButton.addEventListener('click', () => {
            helpModal.style.display = 'block';
        });
    }
    
    if (closeHelp && helpModal) {
        closeHelp.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });
    }
    
    // Expose debug variables to console for troubleshooting
    window.debugWVdM = {
        get trailLengthRotations() { return trailLengthRotations; },
        get precession() { return precession; },
        get animationTime() { return animationTime; },
        get windingRatio() { return windingRatio; },
        get trailPointsCount() { return trailPoints.length; },
        get maxTrailPoints() {
            const uToroidalForTrail = windingRatio === '1:2' ? 4 * Math.PI : 2 * Math.PI;
            const cyclesForTrail = trailLengthRotations;
            const pointsPerFullCycle = 4000;
            return trailLengthRotations >= 100 ? 
                Number.MAX_SAFE_INTEGER : 
                Math.max(5, Math.min(8000, Math.round(cyclesForTrail * pointsPerFullCycle)));
        },
        get photonSpeed() { return photonSpeed; },
        // Calculate expected cycles for current trail length
        get expectedCycles() {
            return trailLengthRotations;
        },
        // Calculate actual toroidal angle covered by current trail
        get actualToroidalAngle() {
            if (trailPoints.length === 0) return 0;
            // This is approximate - would need to track actual angles
            return animationTime * (windingRatio === '1:2' ? 4 * Math.PI : 2 * Math.PI) * (1 + precession);
        }
    };
    
    animate();
}

// Start initialization
init();

