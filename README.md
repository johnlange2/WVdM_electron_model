# Williamson Van der Mark Electron/Positron Model Visualization

An interactive 3D visualization of the Williamson Van der Mark (WVdM) electron/positron model, showing a photon moving along either a torus (donut) or a lemniscate (figure-8) path. The model demonstrates how electrons and positrons can be visualized as photons moving along these geometric paths.

## Features

- **Path modes**: Choose between Torus (Donut) and two Lemniscate (Figure-8) geometries:
  - **Torus (Donut)**: Original WVdM style helix on a torus surface
  - **Viviani Lemniscate 'C' curve**: Single spheroid with figure-8 path
  - **Viviani Lemniscate 'S' curve**: Two side-by-side spheroids with alternating left/right tracks
- **Semi-transparent torus**: Adjustable transparency (0 = solid, 1 = invisible) with optional wireframe display (torus mode only)
- **Parameterized dimensions**: Control inner and outer radius independently (relative units)
- **Photon animation**: Visual representation of the photon moving along the selected path
- **Photon Speed control**: Logarithmic scale from 0.1 to 10 (default 1.0)
- **Trail visualization**: Configurable trail length in toroidal rotations (0.1 to unlimited)
- **Precession effect**: Spirograph-like precession pattern for both C and S curves:
  - **C curve**: Rotating E/M fields create spirograph patterns
  - **S curve**: Both left and right loops rotate independently, creating interleaved patterns
  - Examples: p=0.5 → 2 interleaved loops (180° apart), p=0.25 → 4 loops (90° apart), p=0.125 → 8 loops (45° apart)
  - Pattern closes after total length L = 4π/p
- **Particle type selection**: Switch between Electron and Positron (affects electric field direction)
- **Winding ratio modes**: Choose between 1:2 (4π toroidal, 2π poloidal) and 2:1 (2π toroidal, 4π poloidal) winding (torus mode only; figure-8 mode uses 4π path equivalent to 2:1)
- **Spin direction**: Forward (clockwise) or Reverse (counter-clockwise)
- **Interactive camera**: Real-time 3D perspective adjustment with mouse controls
- **Field vectors**: Visual display of Electric (green) and Magnetic (blue) field vectors at the photon position
- **Field vectors display**: Shows instantaneous and average (per cycle) electric and magnetic field vectors with reset capability
- **Momentum vectors**: Display of instantaneous and average momentum vectors including linear, toroidal/lemniscate angular, poloidal angular, and total angular momentum (in model units, updated per cycle). Labels change dynamically: "Toroidal Angular" in torus mode, "Lemniscate Angular" in figure-8 mode.
- **Fine structure constant preset**: Quick button to set parameters approximating the fine structure constant ratio (~1/137.036)

## How to Use

### Running the Visualization

**Option 1: Direct Open (Recommended)**
1. Open `index.html` in a modern web browser (Chrome, Firefox, Edge, or Safari)
2. The visualization will load automatically

**Option 2: Local Server (if direct open doesn't work)**
If you encounter CORS errors when opening directly, use a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have http-server installed)
npx http-server
```

Then open `http://localhost:8000` in your browser.

### Controls

#### Buttons (Top of Controls Panel)

- **Reset Camera**: Return camera to default position (distance, rotation, and screen translation)
- **Clear Track**: Clear the photon's trail
- **Pause/Play**: Pause or resume the photon animation
- **Set r/R to fine structure constant** / **Set minor and major axes to 1**: 
  - **Torus mode**: Sets inner radius to 0.1, outer radius to 13.7, and camera distance to 60 (clears track)
  - **Lemniscate modes**: Sets minor and major axes to 1.0, and camera distance to 4.0 (clears track)
  - Button text changes automatically based on selected path mode

#### Parameter Controls

- **Path Mode**: Select between three path geometries (clears track when changed):
  - **Torus (Donut)**: Original WVdM style helix on a torus surface
  - **Viviani Lemniscate 'C' curve**: Single spheroid with figure-8 path, precessed in 3D with rotating E/M fields
  - **Viviani Lemniscate 'S' curve**: Two side-by-side spheroids with alternating left/right tracks that meet at a touchpoint
- **Particle Type**: Select between Electron and Positron (affects electric field direction)
- **Winding Ratio**: (Only available in Torus mode)
  - **1:2** (default): 4π toroidal, 2π poloidal (clears track when changed)
  - **2:1**: 2π toroidal, 4π poloidal (clears track when changed)
- **Spin Direction**: Forward (clockwise) or Reverse (counter-clockwise) (clears track when changed)
- **Transparency**: Adjust the opacity of the torus (0 = solid, 1 = invisible)
- **Show Wireframe**: Toggle wireframe mesh visibility
- **Inner Radius (relative)** / **Minor Axis (relative)**: 
  - **Torus mode**: Control the inner radius (can be 0 or negative for inverted shapes)
  - **Lemniscate modes**: Control the minor axis (must be > 0, can be greater than major axis for oblate spheroids)
  - Label changes automatically based on selected path mode
- **Outer Radius (relative)** / **Major Axis (relative)**:
  - **Torus mode**: Control the outer radius
  - **Lemniscate modes**: Control the major axis (can be less than minor axis for oblate spheroids)
  - Label changes automatically based on selected path mode
- **Photon Speed (Multiplier)**: Logarithmic scale from 0.1 (left) to 1.0 (middle) to 10.0 (right)
- **Trail Length (toroidal rotations)**: Length of the photon's trail in toroidal rotations
  - 1 = one full track (4π for 1:2 winding, 2π for 2:1 winding)
  - Logarithmic scale from 0.1 (left) to 1.0 (middle) to 100 (right, unlimited)
- **Precession (try values <= 0.5, e.g. 0.1)**: Adds a spirograph-like precession effect
  - **C curve**: Rotating E/M fields create continuous spirograph patterns
  - **S curve**: Both left and right loops rotate independently around Y-axis
  - Examples: p=0.5 → 2 interleaved loops (180° apart), p=0.25 → 4 loops (90° apart), p=0.125 → 8 loops (45° apart)
  - Pattern closes after total length L = 4π/p (e.g., p=0.1 → 40π total length)
  - Set trail length to (1/precession) to see the full repeating pattern
  - Changing precession clears the track
- **Camera Distance (relative)**: Zoom in/out (1.0 to 60.0)
- **Camera Rotation X**: Rotate camera vertically (-10 to 10 radians, default 1.57)
- **Camera Rotation Y**: Rotate camera horizontally (-10 to 10 radians, default 1.57)

#### Mouse Controls

- **Left Button + Drag**: Rotate the camera around the torus
- **Right Button + Drag**: Translate the view (pan) - moves the center point on screen without distortion
- **Mouse Wheel**: Zoom in/out

#### Display Panels

- **Field Vectors Legend** (bottom left): Shows instantaneous and average (per cycle) Electric and Magnetic field vectors with reset button
  - Displays in format: |magnitude|: (x, y, z)
  - Averages update only when a complete cycle finishes
- **Momentum Vectors** (bottom left, next to Field Vectors): 
  - Table format with 4 columns: Linear | Toroidal Angular | Poloidal Angular | Total Angular
  - Two rows: Instantaneous | Avg, Last Cycle
  - All vectors displayed as |magnitude|: (x, y, z) format
  - Linear momentum shown in yellow, angular momentum components in orange
  - Averages update only when a complete cycle finishes (not continuously)
  - Reset button to clear accumulated values

## Technical Details

The visualization uses:
- **Three.js**: 3D graphics library for WebGL rendering (CDN)
- **Parametric equations**: The photon follows a torus path using parametric equations
- **Real-time updates**: All parameters update the visualization instantly
- **Raycasting**: Detects when the photon is obstructed by the torus for visual feedback
- **Vector calculations**: Computes electric and magnetic field vectors, velocity, and momentum in real-time

### Trail Length Calculation

The trail length is specified in rotations:
- **Torus mode**:
  - For 1:2 winding: 1 rotation = 4π toroidal
  - For 2:1 winding: 1 rotation = 2π toroidal
- **Lemniscate modes**: 1 rotation = 4π (equivalent to 2:1 winding in torus mode)
  - **C curve**: Single continuous track
  - **S curve**: Two alternating tracks (left visible u ∈ [2π, 4π], right visible u ∈ [0, 2π])
- Precession does not affect the trail length calculation
- Trail length of 1 always shows one complete track

### Momentum and Field Units

All momentum and field values are displayed in "model units" (normalized by torus size) rather than physical units, since the model uses relative dimensions without absolute scale assumptions.

### Momentum Calculation

The momentum vectors are calculated differently depending on the path mode:

**Torus Mode:**
- **Toroidal momentum**: Component along the major radius direction (around the big circle)
- **Poloidal momentum**: Component along the minor radius direction (around the tube)
- **Angular momentum**: Calculated as L = r × p for each component (toroidal, poloidal, and total)

**Lemniscate Modes:**
- **Lemniscate momentum**: Component of rotation around the z-axis (tangential to circle in xy-plane)
- **Poloidal momentum**: Remaining component (radial + vertical)
- **Angular momentum**: Calculated as L = r × p for each component (lemniscate, poloidal, and total)
- **S curve**: Momentum calculated separately for left and right tracks based on which track is currently visible

**Averaging**: Averages are computed over complete cycles and only update when a cycle completes, making them more stable and readable

## Model Description

The Williamson Van der Mark electron model proposes that electrons and positrons can be visualized as photons moving in closed paths around a torus. This visualization demonstrates:

1. The toroidal or lemniscate structure of the particle's path
2. The continuous motion of the photon
3. The relationship between inner and outer dimensions (or minor and major axes for lemniscates)
4. Electric and magnetic field vectors at the photon position
5. Momentum vectors (linear and angular) along the path
6. Precession effects creating spirograph-like patterns on both C and S curves
7. Different winding ratios (1:2 and 2:1 modes in torus mode)
8. Alternative figure-8 geometries (C and S curves) that may provide insights into electron/positron substructure
9. S curve with two side-by-side spheroids and alternating track visibility

Note: The "photon speed" parameter in this visualization controls the animation rate for better visualization, not the actual speed of light. In the physical model, the photon would be moving at the speed of light (c).

## Browser Compatibility

This visualization requires a modern browser with WebGL support:
- Chrome 51+
- Firefox 51+
- Safari 10+
- Edge 79+

## Help

Click the "Help" button in the Controls panel for detailed information about all features and parameters.

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
