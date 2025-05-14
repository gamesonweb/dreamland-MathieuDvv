// Shader de fragment pour l'effet d'assombrissement des bords de l'eau
precision highp float;

// Uniformes
uniform sampler2D textureSampler; // Texture d'entrée
uniform float darkeningFactor; // Facteur d'assombrissement (0-1)
uniform vec2 screenSize; // Taille de l'écran

// Variable
varying vec2 vUV; // Coordonnées de texture

void main(void) {
    // Échantillonner la texture
    vec4 color = texture2D(textureSampler, vUV);
    
    // Appliquer l'assombrissement basé sur le facteur
    vec4 darkenedColor = vec4(color.rgb * (1.0 - darkeningFactor), color.a);
    
    // Effet de vignette pour assombrir les bords
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUV, center);
    float vignette = smoothstep(0.5, 0.2, dist) * 0.8 + 0.2;
    
    // Combiner l'assombrissement et la vignette
    vec4 finalColor = vec4(darkenedColor.rgb * vignette, color.a);
    
    // Sortir la couleur finale
    gl_FragColor = finalColor;
} 