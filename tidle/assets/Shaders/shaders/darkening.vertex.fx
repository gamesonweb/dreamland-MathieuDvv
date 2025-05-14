// Shader de vertex pour l'effet d'assombrissement
precision highp float;

// Attributs
attribute vec2 position;

// Variable
varying vec2 vUV;

void main(void) {
    // Définir la position
    gl_Position = vec4(position, 0.0, 1.0);
    
    // Définir les coordonnées UV (transformer de [-1,1] à [0,1])
    vUV = position * 0.5 + 0.5;
} 