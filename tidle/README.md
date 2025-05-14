# Tidle 🐬

A retro PSX-style third-person game where you play as a dolphin performing jumps and tricks to score points in a vibrant tropical environment.


## 🎮 Game Overview

In Tidle, you control a playful dolphin navigating through crystal clear tropical waters. Perform aerial tricks, jumps, and flips to earn points while exploring a nostalgic low-poly world inspired by PSX-era graphics.

### Features

- **Trick System**: Master various dolphin acrobatics to score points
- **Retro Aesthetics**: Experience the charm of PSX-era graphics with modern gameplay
- **Custom Soundtrack**: Enjoy a relaxing yet energetic tropical soundtrack that complements gameplay

## 🕹️ How to Play

1. Use ZQSD or arrow keys to swim through the water
2. Press SPACE to go forward
3. Land tricks successfully to bank points

## 🛠️ Technical Implementation

### Technology Stack

- Built with BabylonJS for 3D rendering
- Web-based implementation using JavaScript/TypeScript
- HTML5 Canvas for rendering

### Architecture

The game is structured using a component-based architecture:

### Key Technical Features

#### PSX-Style Rendering

The retro aesthetic is achieved through:
- Vertex snapping to create the characteristic "jittery" PSX look
- Limited texture resolution and affine texture mapping
- Custom fragment shaders that simulate CRT scanlines and color depth limitations

#### Dolphin Physics

The dolphin's movement system features:
- Realistic water buoyancy and resistance
- Momentum-based jumping mechanics
- Trick detection system that analyzes rotation and position
- Simulated gravity and air resistance during jumps

#### Water Simulation

The tropical environment includes:
- Semi-realistic water surface using vertex displacement
- Dynamic wave patterns based on player movement
- Reflection and refraction effects for underwater scenery
- Particle systems for splashes and foam

Made by @Mathieudvv