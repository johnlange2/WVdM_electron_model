# Williamson Van der Mark Electron/Positron Model Visualization

An interactive 3D visualization of the Williamson Van der Mark (WVdM) electron/positron model, showing a photon moving around a torus. The model demonstrates how electrons and positrons can be visualized as photons moving along toroidal paths.

## Features

- **Semi-transparent torus**: Adjustable transparency (0 = solid, 1 = invisible) with optional wireframe display
- **Parameterized dimensions**: Control inner and outer radius independently (relative units)
- **Photon animation**: Visual representation of the photon moving along the torus path
- **Photon Speed control**: Logarithmic scale from 0.1 to 10 (default 1.0)
- **Trail visualization**: Configurable trail length in toroidal rotations (0.1 to unlimited)
- **Precession effect**: Spirograph-like precession pattern (try values like 0.1)
- **Particle type selection**: Switch between Electron and Positron (affects electric field direction)
- **Winding ratio modes**: Choose between 1:2 (4π toroidal, 2π poloidal) and 2:1 (2π toroidal, 4π poloidal) winding
- **Spin direction**: Forward (clockwise) or Reverse (counter-clockwise)
- **Interactive camera**: Real-time 3D perspective adjustment with mouse controls
- **Field vectors**: Visual display of Electric (green) and Magnetic (blue) field vectors at the photon position
- **Accumulated fields**: Running sum of electric and magnetic field vectors with reset capability
- **Momentum vectors**: Display of instantaneous and average linear and angular momentum (in model units)
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

- **Reset Camera**: Return camera to default position (distance and rotation)
- **Clear Track**: Clear the photon's trail
- **Pause/Play**: Pause or resume the photon animation
- **Set r/R to fine structure constant**: Sets inner radius to 0.1, outer radius to 13.7, and camera distance to 60

#### Parameter Controls

- **Particle Type**: Select between Electron and Positron (affects electric field direction)
- **Winding Ratio**: 
  - **1:2** (default): 4π toroidal, 2π poloidal
  - **2:1**: 2π toroidal, 4π poloidal
- **Spin Direction**: Forward (clockwise) or Reverse (counter-clockwise)
- **Transparency**: Adjust the opacity of the torus (0 = solid, 1 = invisible)
- **Show Wireframe**: Toggle wireframe mesh visibility
- **Inner Radius (relative)**: Control the inner radius of the torus (can be 0 or negative for inverted shapes)
- **Outer Radius (relative)**: Control the outer radius of the torus
- **Photon Speed (Multiplier)**: Logarithmic scale from 0.1 (left) to 1.0 (middle) to 10.0 (right)
- **Trail Length (toroidal rotations)**: Length of the photon's trail in toroidal rotations
  - 1 = one full track (4π for 1:2 winding, 2π for 2:1 winding)
  - Logarithmic scale from 0.1 (left) to 1.0 (middle) to 100 (right, unlimited)
- **Precession (try values like 0.1)**: Adds a spirograph-like precession effect
  - With precession 0.1, the pattern repeats after 10 rotations
  - Set trail length to (1/precession) to see the full repeating pattern
- **Camera Distance (relative)**: Zoom in/out (1.0 to 60.0)
- **Camera Rotation X**: Rotate camera vertically (-3.14 to 3.14, default 1.57)
- **Camera Rotation Y**: Rotate camera horizontally (-3.14 to 3.14, default 1.57)

#### Mouse Controls

- **Click and Drag**: Rotate the camera around the torus
- **Mouse Wheel**: Zoom in/out

#### Display Panels

- **Field Vectors Legend** (bottom left): Shows accumulated Electric and Magnetic field vectors with reset button
- **Momentum Vectors** (bottom left, next to Field Vectors): 
  - Instantaneous and average linear momentum (yellow, model units)
  - Instantaneous and average angular momentum (orange, model units)
  - Reset button to clear accumulated values

## Technical Details

The visualization uses:
- **Three.js**: 3D graphics library for WebGL rendering (CDN)
- **Parametric equations**: The photon follows a torus path using parametric equations
- **Real-time updates**: All parameters update the visualization instantly
- **Raycasting**: Detects when the photon is obstructed by the torus for visual feedback
- **Vector calculations**: Computes electric and magnetic field vectors, velocity, and momentum in real-time

### Trail Length Calculation

The trail length is specified in toroidal rotations:
- For 1:2 winding: 1 rotation = 4π toroidal
- For 2:1 winding: 1 rotation = 2π toroidal
- Precession does not affect the trail length calculation
- Trail length of 1 always shows one complete track

### Momentum and Field Units

All momentum and field values are displayed in "model units" (normalized by torus size) rather than physical units, since the model uses relative dimensions without absolute scale assumptions.

## Model Description

The Williamson Van der Mark electron model proposes that electrons and positrons can be visualized as photons moving in closed paths around a torus. This visualization demonstrates:

1. The toroidal structure of the particle's path
2. The continuous motion of the photon
3. The relationship between inner and outer dimensions
4. Electric and magnetic field vectors at the photon position
5. Momentum vectors (linear and angular) along the path
6. Precession effects creating spirograph-like patterns
7. Different winding ratios (1:2 and 2:1 modes)

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

Copyright (c) 2024

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
