/**
 * Créer des textures par programmation pour le jeu
 */
function createWaterTexture() {
    // Créer un élément canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    
    // Créer un dégradé pour l'eau
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#33A2EC');
    gradient.addColorStop(0.5, '#0099dd');
    gradient.addColorStop(1, '#00ccff');
    
    // Remplir l'arrière-plan
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Ajouter des motifs de vagues
    ctx.strokeStyle = 'rgb(255, 255, 255)';
    ctx.lineWidth = 5;
    
    
    // Convertir le canvas en URL de données
    return canvas.toDataURL();
}

function createWaterParticleTexture() {
    // Créer un élément canvas
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Créer un dégradé radial pour la particule
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(200, 240, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(200, 240, 255, 0)');
    
    // Dessiner la particule
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Convertir le canvas en URL de données
    return canvas.toDataURL();
}

function createCloudTexture() {
    // Créer un élément canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Définir la couleur du nuage
    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner les formes de nuages
    const numCircles = 25;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = canvas.width / 2.5;
    
    // Créer un nuage en dessinant plusieurs cercles qui se chevauchent
    for (let i = 0; i < numCircles; i++) {
        // Calculer une position aléatoire autour du centre
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * maxRadius * 0.8;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        // Rayon aléatoire pour chaque cercle
        const radius = 60 + Math.random() * 120;
        
        // Créer un dégradé pour des bords doux
        const gradient = ctx.createRadialGradient(
            x, y, 0,
            x, y, radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        // Dessiner le cercle
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Convertir le canvas en URL de données
    return canvas.toDataURL();
}

// Exporter les fonctions
window.createWaterTexture = createWaterTexture;
window.createWaterParticleTexture = createWaterParticleTexture;
window.createCloudTexture = createCloudTexture; 