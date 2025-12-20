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
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
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

    // Photon particle - size will be scaled based on torus size
    let photonBaseSize = 0.15;
    let photonGlowBaseSize = 0.25;
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

    // Trail for photon path - visible even behind torus
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
        vertexColors: true, // Enable vertex colors for per-segment coloring
        transparent: true,
        opacity: 0.9,
        linewidth: 4, // Make line wider for better visibility
        depthTest: false, // Make visible even when behind objects
        depthWrite: false
    });
    const trailPoints = [];
    const trailColors = []; // Store colors for each point
    const trailOriginalIndices = []; // Track original sequential index for each point in trailPoints (to detect gaps)
    const trailToroidalAngles = []; // Store toroidal angle for each point (without precession, for trail length tracking)
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    scene.add(trail);
    
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
    
    // Accumulated field vectors
    let accumulatedElectricField = new THREE.Vector3(0, 0, 0);
    let accumulatedMagneticField = new THREE.Vector3(0, 0, 0);
    
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

    // Calculate photon position on torus
    function getPhotonPosition(t, majorRadius, minorRadius, useAnimationTime = false) {
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

    // Update camera position
    // Simple spherical coordinate conversion
    // Camera Rotation Y: azimuth angle (works perfectly)
    // Camera Rotation X: polar angle from +Y axis
    function updateCamera() {
        // Standard spherical to Cartesian conversion
        // This is the mathematically correct formula
        const x = cameraDistance * Math.sin(cameraRotationX) * Math.cos(cameraRotationY);
        const y = cameraDistance * Math.cos(cameraRotationX);
        const z = cameraDistance * Math.sin(cameraRotationX) * Math.sin(cameraRotationY);
        
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
        
        // Clear trail when torus geometry changes to avoid old points extending beyond new bounds
        trailPoints.length = 0;
        trailColors.length = 0;
        trailOriginalIndices.length = 0;
        trailToroidalAngles.length = 0;
        if (trailPoints.length > 1) {
            trailGeometry.setFromPoints(trailPoints);
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
        particleType: document.getElementById('particleType'),
        windingRatio: document.getElementById('windingRatio'),
        spinDirection: document.getElementById('spinDirection'),
        setFineStructure: document.getElementById('setFineStructure'),
        showWireframe: document.getElementById('showWireframe')
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
                    trailColors[i] = new THREE.Color(0x663333); // Darker red-brown for obstructed segments
                }
            } else {
                trailColors[i] = new THREE.Color(0xff8888); // Brighter, more saturated red-orange
            }
        }
        
        // Rebuild geometry with updated colors (show all points, dark color for obstructed when transparency = 0)
        if (trailPoints.length > 1) {
            trailGeometry.setFromPoints(trailPoints);
            
            // Set vertex colors for the trail
            const colors = new Float32Array(trailPoints.length * 3);
            for (let i = 0; i < trailPoints.length; i++) {
                const color = trailColors[i];
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            }
            trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            trailGeometry.setIndex(null); // Use default line connectivity
        }
    }

    controls.transparency.addEventListener('input', (e) => {
        transparency = parseFloat(e.target.value);
        updateValueDisplay('transparency', transparency);
        // Update opacity directly without recreating geometry
        torusMaterial.opacity = 1 - transparency;
        // Wireframe disappears at transparency = 0, becomes more visible as transparency increases
        wireframeMaterial.opacity = transparency > 0 ? 0.2 * (1 - transparency) : 0;
        
        // Update trail colors based on new transparency value
        updateTrailColorsForTransparency();
    });

    controls.showWireframe.addEventListener('change', (e) => {
        wireframe.visible = e.target.checked;
    });

    controls.innerRadius.addEventListener('input', (e) => {
        innerRadius = parseFloat(e.target.value);
        // Ensure outerRadius is always greater than innerRadius
        if (outerRadius <= innerRadius) {
            outerRadius = innerRadius + 0.1;
            controls.outerRadius.value = outerRadius;
            updateValueDisplay('outerRadius', outerRadius);
        }
        updateValueDisplay('innerRadius', innerRadius);
        updateTorus();
    });

    controls.outerRadius.addEventListener('input', (e) => {
        outerRadius = parseFloat(e.target.value);
        // Ensure outerRadius is always greater than innerRadius
        if (outerRadius <= innerRadius) {
            innerRadius = outerRadius - 0.1;
            controls.innerRadius.value = innerRadius;
            updateValueDisplay('innerRadius', innerRadius);
        }
        updateValueDisplay('outerRadius', outerRadius);
        updateTorus();
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

    controls.cameraDistance.addEventListener('input', (e) => {
        cameraDistance = parseFloat(e.target.value);
        updateValueDisplay('cameraDistance', cameraDistance);
        updateCamera();
    });

    controls.cameraRotationX.addEventListener('input', (e) => {
        cameraRotationX = Math.max(-10, Math.min(10, parseFloat(e.target.value)));
        controls.cameraRotationX.value = cameraRotationX;
        updateValueDisplay('cameraRotationX', cameraRotationX);
        updateCamera();
    });

    controls.cameraRotationY.addEventListener('input', (e) => {
        cameraRotationY = Math.max(-10, Math.min(10, parseFloat(e.target.value)));
        controls.cameraRotationY.value = cameraRotationY;
        updateValueDisplay('cameraRotationY', cameraRotationY);
        updateCamera();
    });

    controls.resetCamera.addEventListener('click', () => {
        cameraDistance = 12;
        cameraRotationX = 1.57; // π/2
        cameraRotationY = 1.57; // π/2
        controls.cameraDistance.value = cameraDistance;
        controls.cameraRotationX.value = cameraRotationX;
        controls.cameraRotationY.value = cameraRotationY;
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
        // Clear trail when setting fine structure constant to avoid confusion
        trailPoints.length = 0;
        trailColors.length = 0;
        trailToroidalAngles.length = 0;
        if (trailPoints.length > 1) {
            trailGeometry.setFromPoints(trailPoints);
        }
        
        // Set values for fine structure constant ratio (r/R ≈ 1/137.036)
        // Outer radius = 13.7, Inner radius = 0.1, Camera distance = 60
        innerRadius = 0.1;
        outerRadius = 13.7;
        cameraDistance = 60;
        
        // Update sliders
        controls.innerRadius.value = innerRadius;
        controls.outerRadius.value = outerRadius;
        controls.cameraDistance.value = cameraDistance;
        
        // Update displays
        updateValueDisplay('innerRadius', innerRadius);
        updateValueDisplay('outerRadius', outerRadius);
        updateValueDisplay('cameraDistance', cameraDistance);
        
        // Update geometry and camera
        updateTorus();
        updateCamera();
    });

    controls.particleType.addEventListener('change', (e) => {
        particleType = e.target.value;
        // Reset accumulated fields when changing particle type
        accumulatedElectricField.set(0, 0, 0);
        accumulatedMagneticField.set(0, 0, 0);
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
        updateAccumulatedFieldsDisplay();
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
    });

    controls.resetFields.addEventListener('click', () => {
        accumulatedElectricField.set(0, 0, 0);
        accumulatedMagneticField.set(0, 0, 0);
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
        updateAccumulatedFieldsDisplay();
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
    });
    
    // Function to update accumulated fields display
    function updateAccumulatedFieldsDisplay() {
        const eDisplay = document.getElementById('accumulatedE');
        const bDisplay = document.getElementById('accumulatedB');
        if (eDisplay) {
            eDisplay.textContent = `(${accumulatedElectricField.x.toFixed(3)}, ${accumulatedElectricField.y.toFixed(3)}, ${accumulatedElectricField.z.toFixed(3)})`;
        }
        if (bDisplay) {
            bDisplay.textContent = `(${accumulatedMagneticField.x.toFixed(3)}, ${accumulatedMagneticField.y.toFixed(3)}, ${accumulatedMagneticField.z.toFixed(3)})`;
        }
    }

    // Mouse controls for camera rotation
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    renderer.domElement.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isMouseDown) {
            const deltaX = e.clientX - mouseX;
            const deltaY = e.clientY - mouseY;
            
            cameraRotationY += deltaX * 0.01;
            cameraRotationX += deltaY * 0.01;
            
            // Clamp both rotations to allowed range (-10 to 10 radians)
            cameraRotationX = Math.max(-10, Math.min(10, cameraRotationX));
            cameraRotationY = Math.max(-10, Math.min(10, cameraRotationY));
            
            controls.cameraRotationX.value = cameraRotationX;
            controls.cameraRotationY.value = cameraRotationY;
            updateValueDisplay('cameraRotationX', cameraRotationX);
            updateValueDisplay('cameraRotationY', cameraRotationY);
            updateCamera();
            
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    renderer.domElement.addEventListener('mouseleave', () => {
        isMouseDown = false;
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
        
        // Check intersection with torus
        const intersects = raycaster.intersectObject(torus, false);
        
        if (intersects.length > 0) {
            const distanceToPhoton = photonPos.distanceTo(camera.position);
            const distanceToTorus = intersects[0].distance;
            // If torus intersection is closer than photon (with small threshold), photon is obstructed
            return distanceToTorus < distanceToPhoton - 0.2;
        }
        
        return false;
    }

    // Calculate field vectors (uses same majorRadius and minorRadius as photon position)
    function calculateFieldVectors(position, t, majorRadius, minorRadius) {
        // Apply same precession and winding ratio as in getPhotonPosition
        // Use animationTime directly (not wrapped t) so precession accumulates continuously
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
        const u = animationTime * uToroidal * (1 + precession) * spinDirection;
        const v = animationTime * vPoloidal * (1 + precession * 2) * spinDirection;
        
        // Calculate partial derivatives for surface normal and velocity
        const dx_du = -(majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
        const dy_du = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
        const dz_du = 0;
        
        const dx_dv = -minorRadius * Math.sin(v) * Math.cos(u);
        const dy_dv = -minorRadius * Math.sin(v) * Math.sin(u);
        const dz_dv = minorRadius * Math.cos(v);
        
        // Electric field: orthogonal to torus surface (surface normal)
        // Surface normal = cross product of partial derivatives (tangentU × tangentV)
        const tangentU = new THREE.Vector3(dx_du, dy_du, dz_du);
        const tangentV = new THREE.Vector3(dx_dv, dy_dv, dz_dv);
        const electricField = new THREE.Vector3()
            .crossVectors(tangentU, tangentV)
            .normalize();
        
        // For electron: point inward (negate normal)
        // For positron: point outward (keep normal as is)
        if (particleType === 'electron') {
            electricField.negate(); // Point inward for electron
        }
        
        // Magnetic field: perpendicular to motion (tangent to torus)
        // Calculate velocity vector (derivative of position with precession)
        // Use same winding ratio values already calculated above
        const du_dt = uToroidal * (1 + precession) * spinDirection;
        const dv_dt = vPoloidal * (1 + precession * 2) * spinDirection;
        
        // Velocity vector (tangent to path)
        const velocity = new THREE.Vector3(
            dx_du * du_dt + dx_dv * dv_dt,
            dy_du * du_dt + dy_dv * dv_dt,
            dz_du * du_dt + dz_dv * dv_dt
        ).normalize();
        
        // Magnetic field is perpendicular to both velocity and electric field (surface normal)
        const magneticField = new THREE.Vector3()
            .crossVectors(velocity, electricField)
            .normalize();
        
        return { electricField, magneticField };
    }

    // Calculate velocity vector (derivative of position)
    function calculateVelocity(position, majorRadius, minorRadius) {
        // Get the same u and v parameters used for position
        let uToroidal, vPoloidal;
        if (windingRatio === '1:2') {
            uToroidal = 4 * Math.PI;
            vPoloidal = 2 * Math.PI;
        } else {
            uToroidal = 2 * Math.PI;
            vPoloidal = 4 * Math.PI;
        }
        const u = animationTime * uToroidal * (1 + precession);
        const v = animationTime * vPoloidal * (1 + precession * 2);
        
        // Calculate partial derivatives
        const dx_du = -(majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
        const dy_du = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
        const dz_du = 0;
        
        const dx_dv = -minorRadius * Math.sin(v) * Math.cos(u);
        const dy_dv = -minorRadius * Math.sin(v) * Math.sin(u);
        const dz_dv = minorRadius * Math.cos(v);
        
        // Time derivatives (include spin direction)
        const du_dt = uToroidal * (1 + precession) * spinDirection;
        const dv_dt = vPoloidal * (1 + precession * 2) * spinDirection;
        
        // Velocity vector (derivative of position with respect to time)
        const velocity = new THREE.Vector3(
            dx_du * du_dt + dx_dv * dv_dt,
            dy_du * du_dt + dy_dv * dv_dt,
            dz_du * du_dt + dz_dv * dv_dt
        );
        
        return velocity;
    }

    // Calculate momentum vectors (in normalized model units)
    // Based on torus parameterization: r(φ,θ) = ((R+r cos θ) cos φ, (R+r cos θ) sin φ, r sin θ)
    function calculateMomentum(position, majorRadius, minorRadius) {
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
        // For 1:2 winding: φ̇ = 1, θ̇ = 0.5
        // For 2:1 winding: φ̇ = 1, θ̇ = 2
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
        
        // Normalize by major radius to make values dimensionless/model units
        const normalizationFactor = 1.0 / Math.max(0.1, majorRadius);
        
        // Momentum components (using actual magnitudes from velocities)
        // p_tor = v_tor * normalization, p_pol = v_pol * normalization
        const p_tor = v_tor.clone().multiplyScalar(normalizationFactor);
        const p_pol = v_pol.clone().multiplyScalar(normalizationFactor);
        
        // Total linear momentum
        const linearMomentum = p_tor.clone().add(p_pol);
        
        // Angular momentum components: L = r × p
        // Normalize position for dimensionless result
        const normalizedPosition = position.clone().multiplyScalar(normalizationFactor);
        
        // L_tor = r × p_tor
        const L_tor = new THREE.Vector3().crossVectors(normalizedPosition, p_tor);
        
        // L_pol = r × p_pol
        const L_pol = new THREE.Vector3().crossVectors(normalizedPosition, p_pol);
        
        // L_tot = L_tor + L_pol
        const L_tot = L_tor.clone().add(L_pol);
        
        return { 
            linearMomentum, 
            toroidalAngularMomentum: L_tor, 
            poloidalAngularMomentum: L_pol, 
            totalAngularMomentum: L_tot 
        };
    }

    // Format number in scientific notation if needed
    function formatScientific(value) {
        if (Math.abs(value) < 0.001 && value !== 0) {
            return value.toExponential(3);
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
            // Use the EXACT same calculation as the torus geometry to ensure photon stays on torus
            const effectiveInnerRadius = Math.min(innerRadius, outerRadius - 0.1);
            const majorRadius = Math.max(0.1, (effectiveInnerRadius + outerRadius) / 2);
            const minorRadius = Math.max(0.1, (outerRadius - effectiveInnerRadius) / 2);
            const t = (animationTime % 1);
            // Use animationTime directly for precession to accumulate continuously
            const position = getPhotonPosition(animationTime, majorRadius, minorRadius, true);
            photon.position.copy(position);
            
            // Store these values for trail point calculation to ensure consistency
            const trailMajorRadius = majorRadius;
            const trailMinorRadius = minorRadius;
            
            // Check if photon is obstructed and change color
            const isObstructed = isPhotonObstructed(position);
            const currentColor = isObstructed ? photonColorObstructed : photonColorVisible;
            photonMaterial.color.setHex(currentColor);
            photonMaterial.emissive.setHex(currentColor);
            photonGlowMaterial.color.setHex(currentColor);
            
            // Update field vectors
            const { electricField, magneticField } = calculateFieldVectors(position, animationTime, majorRadius, minorRadius);
            const scaleFactor = getScaleFactor(majorRadius);
            electricFieldArrow = updateArrow(electricFieldArrow, electricField, position, electricFieldColor, scaleFactor);
            magneticFieldArrow = updateArrow(magneticFieldArrow, magneticField, position, magneticFieldColor, scaleFactor);
            
            // Update photon scale
            const photonScale = scaleFactor;
            photon.scale.set(photonScale, photonScale, photonScale);
            
            // Accumulate field vectors (add small increments as photon moves)
            // Scale by a small factor to accumulate over time
            const accumulationFactor = 0.001 * photonSpeed; // Small factor to accumulate gradually
            accumulatedElectricField.add(electricField.clone().multiplyScalar(accumulationFactor));
            accumulatedMagneticField.add(magneticField.clone().multiplyScalar(accumulationFactor));
            
            // Calculate momentum vectors
            const { linearMomentum, toroidalAngularMomentum, poloidalAngularMomentum, totalAngularMomentum } = calculateMomentum(position, majorRadius, minorRadius);
            
            // Determine toroidal angle per rotation based on winding ratio (for loop detection)
            let uToroidalPerRotationLoop;
            if (windingRatio === '1:2') {
                uToroidalPerRotationLoop = 4 * Math.PI; // 1:2 winding: 4π toroidal per rotation
            } else {
                uToroidalPerRotationLoop = 2 * Math.PI; // 2:1 winding: 2π toroidal per rotation
            }
            
            // Calculate current toroidal angle (base angle without precession for loop detection)
            const currentToroidalAngleLoop = animationTime * uToroidalPerRotationLoop * spinDirection;
            
            // Initialize angleAtCycleStart on first frame if needed
            if (momentumSampleCount === 0 && angleAtCycleStart === 0 && currentToroidalAngleLoop !== 0) {
                angleAtCycleStart = currentToroidalAngleLoop;
            }
            
            // Detect loop completion: when toroidal angle wraps (crosses a full rotation boundary)
            // Account for precession: full loop = uToroidalPerRotationLoop * (1 + precession)
            const fullLoopAngle = uToroidalPerRotationLoop * (1 + precession);
            
            // Calculate total angle traveled since cycle start
            const angleTraveled = Math.abs(currentToroidalAngleLoop - angleAtCycleStart);
            
            // Detect loop completion: when we've traveled a full loop's worth of angle
            const loopJustCompleted = angleTraveled >= fullLoopAngle;
            
            if (loopJustCompleted) {
                // Cycle just completed - calculate and store the averages from the completed cycle
                if (momentumSampleCount > 0) {
                    lastCompletedAvgLinearMomentum = accumulatedLinearMomentum.clone().divideScalar(momentumSampleCount);
                    lastCompletedAvgToroidalAngularMomentum = accumulatedToroidalAngularMomentum.clone().divideScalar(momentumSampleCount);
                    lastCompletedAvgPoloidalAngularMomentum = accumulatedPoloidalAngularMomentum.clone().divideScalar(momentumSampleCount);
                    lastCompletedAvgTotalAngularMomentum = accumulatedTotalAngularMomentum.clone().divideScalar(momentumSampleCount);
                }
                
                // Reset accumulation for the new cycle
                accumulatedLinearMomentum.set(0, 0, 0);
                accumulatedToroidalAngularMomentum.set(0, 0, 0);
                accumulatedPoloidalAngularMomentum.set(0, 0, 0);
                accumulatedTotalAngularMomentum.set(0, 0, 0);
                momentumSampleCount = 0;
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
                updateAccumulatedFieldsDisplay();
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
            // Determine toroidal angle per rotation based on winding ratio
            let uToroidalPerRotation;
            if (windingRatio === '1:2') {
                uToroidalPerRotation = 4 * Math.PI; // 1:2 winding: 4π toroidal per rotation
            } else {
                uToroidalPerRotation = 2 * Math.PI; // 2:1 winding: 2π toroidal per rotation
            }
            
            // Calculate maximum toroidal angle for trail (ignoring precession)
            const maxToroidalAngle = trailLengthRotations >= 100 ? 
                Number.MAX_SAFE_INTEGER : 
                trailLengthRotations * uToroidalPerRotation;
            
            // Calculate current toroidal angle (base angle without precession for trail length tracking)
            // This is the angle that would be used if precession = 0, for trail length purposes only
            const currentToroidalAngle = animationTime * uToroidalPerRotation * spinDirection;
            
            // Ensure trail points stay within torus bounds
            // Use the exact same majorRadius and minorRadius values as calculated above
            // The parametric equations should keep points on the surface, but verify strictly
            const constrainedPosition = position.clone();
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
            
            // Check if this trail point is obstructed (similar to photon obstruction check)
            const isTrailPointObstructed = isPhotonObstructed(constrainedPosition);
            
            // Always add all points to trailPoints to track original sequence
            // This allows us to detect gaps even when transparency = 0
            const unobstructedColor = new THREE.Color(0xff8888); // Brighter, more saturated red-orange
            const obstructedColor = new THREE.Color(0x663333); // Darker red-brown for obstructed segments
            
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
            
            // Remove old points when toroidal angle span exceeds maxToroidalAngle
            // currentToroidalAngle is a continuous, unbounded value that increases with time
            // So we can simply calculate the absolute difference
            // Also limit maximum trail points to prevent performance issues (even when unlimited)
            const maxTrailPoints = 5000; // Maximum points to prevent performance degradation
            let trailChanged = false;
            
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
            
            // Limit trail points even when "unlimited" to prevent performance issues
            if (trailPoints.length > maxTrailPoints) {
                const removeCount = trailPoints.length - maxTrailPoints;
                trailPoints.splice(0, removeCount);
                trailColors.splice(0, removeCount);
                trailOriginalIndices.splice(0, removeCount);
                trailToroidalAngles.splice(0, removeCount);
                trailChanged = true;
            }
            
            // Only update trail geometry when points change or periodically (not every frame)
            // Throttle updates to every 2-3 frames for better performance
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
                    let lastColor = new THREE.Color(0xff8888);
                    
                    for (let i = 0; i < trailPoints.length; i++) {
                        if (i % checkInterval === 0 || i === trailPoints.length - 1) {
                            // Recalculate obstruction for sampled points
                            const isObstructed = isPhotonObstructed(trailPoints[i]);
                            lastColor = isObstructed ? new THREE.Color(0x000000) : new THREE.Color(0xff8888);
                        }
                        updatedColors.push(lastColor.clone());
                    }
                    
                    pointsToRender = trailPoints;
                    colorsToRender = updatedColors;
                    // No need for custom indices - use default line connectivity
                }
                
                if (pointsToRender.length > 1) {
                    trailGeometry.setFromPoints(pointsToRender);
                    
                    // Set vertex colors for the trail
                    const colors = new Float32Array(pointsToRender.length * 3);
                    for (let i = 0; i < pointsToRender.length; i++) {
                        const color = colorsToRender[i];
                        colors[i * 3] = color.r;
                        colors[i * 3 + 1] = color.g;
                        colors[i * 3 + 2] = color.b;
                    }
                    trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                    
                    // Use custom index buffer if we have one (for transparency = 0 with gaps)
                    if (indicesToUse && indicesToUse.length > 0) {
                        trailGeometry.setIndex(indicesToUse);
                    } else {
                        // Use default line connectivity (all consecutive points connected)
                        trailGeometry.setIndex(null);
                    }
                } else {
                    // Not enough points, clear geometry
                    trailGeometry.setFromPoints([]);
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
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Initialize
    updateCamera();
    updateTorus();
    updateAccumulatedFieldsDisplay(); // Initialize accumulated fields display
    updateMomentumDisplay(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        0, 0
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

