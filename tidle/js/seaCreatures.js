/**
 * Classe SeaCreatures pour gérer les poissons et autres créatures marines dans l'océan
 */
class SeaCreatures {
    constructor(scene, environment) {
        this.scene = scene;
        this.environment = environment;
        this.fishes = [];
        this.fishInstances = []; // Stocker les instances
        this.fishSourceMesh = null; // Maillage source pour les instances
        this.fishGeometryMesh = null; // Maillage avec géométrie pour les instances
        this.seagulls = [];
        this.weedInstances = []; // Stocker les instances d'algues
        
        // Obtenir le rayon de la zone de jeu depuis l'environnement
        const playAreaRadius = environment.playAreaRadius || 100;
        const maxReachableRadius = environment.maxReachableRadius || 250;
        
        // Calculer les zones pour la distribution des poissons
        const innerArea = Math.PI * playAreaRadius * playAreaRadius;
        const outerArea = Math.PI * maxReachableRadius * maxReachableRadius - innerArea;
        
        // Calculer le ratio de la zone extérieure par rapport à la zone intérieure
        const areaRatio = outerArea / innerArea;
        
        // Paramètres des poissons - Nombre augmenté depuis que nous avons supprimé la baleine
        this.fishCount = 100; // Augmenté de 50
        this.extendedAreaFishCount = Math.floor(this.fishCount * areaRatio * 0.7);
        this.fishMinDepth = -30; // Profondeur minimale pour les poissons (près du fond)
        this.fishMaxDepth = -2; // Profondeur maximale pour les poissons (près de la surface)
        this.fishMinSpeed = 0.05; // Vitesse minimale des poissons
        this.fishMaxSpeed = 0.15; // Vitesse maximale des poissons
        this.fishMinScale = 1; // Échelle minimale des poissons
        this.fishMaxScale = 1.5; // Échelle maximale des poissons
        this.fishJumpProbability = 0.001; // Probabilité qu'un poisson saute
        
        // Optimisation des performances
        this.updateInterval = 2;
        this.currentFrame = 0;
        
        // Paramètres des mouettes
        this.seagullCount = 10;
        this.seagullMinHeight = 10;
        this.seagullMaxHeight = 50;
        this.seagullMinSpeed = 0.1;
        this.seagullMaxSpeed = 0.3;
        this.seagullMinScale = 1.5;
        this.seagullMaxScale = 2;
        
        // Initialisation
        this.createFishSchoolsWithInstances();
        this.createSeagulls();
    }
    
    /**
     * Créer des bancs de poissons en utilisant des instances pour de meilleures performances
     */
    createFishSchoolsWithInstances() {
        console.log("Création de bancs de poissons avec instances");
        
        // Créer un maillage source pour les poissons
        this.createFishSourceMesh();
    }
    
    /**
     * Créer le maillage source pour les instances de poissons
     */
    createFishSourceMesh() {
        // Charger le modèle de poisson
        BABYLON.SceneLoader.ImportMeshAsync("", "assets/Models/", "Fish.glb", this.scene).then(result => {
            // Créer un maillage parent pour le poisson
            const fishParent = new BABYLON.Mesh("fishParent", this.scene);
            
            // Trouver le premier maillage avec géométrie à utiliser pour l'instanciation
            let sourceMeshWithGeometry = null;
            
            // Ajouter tous les maillages chargés comme enfants du parent
            for (const mesh of result.meshes) {
                if (mesh.id !== "fishParent") {
                    mesh.parent = fishParent;
                    
                    // Trouver un maillage avec géométrie pour l'instanciation
                    if (!sourceMeshWithGeometry && mesh.geometry) {
                        sourceMeshWithGeometry = mesh;
                    }
                }
            }
            
            // Stocker le maillage source et le cacher
            this.fishSourceMesh = fishParent;
            this.fishSourceMesh.isVisible = false;
            
            // Si nous avons trouvé un maillage avec géométrie, l'utiliser pour les instances au lieu du parent
            if (sourceMeshWithGeometry) {
                console.log("Utilisation du maillage avec géométrie pour les instances de poissons:", sourceMeshWithGeometry.id);
                this.fishGeometryMesh = sourceMeshWithGeometry;
                // Conserver les matériaux d'origine pour les textures appropriées
                this.fishGeometryMesh.material.needDepthPrePass = true;
            } else {
                console.warn("Aucun maillage avec géométrie trouvé pour les instances de poissons, utilisation de la méthode de secours");
                this.fishGeometryMesh = this.fishSourceMesh;
            }
            
            // Créer des instances de poissons avec des nombres réduits pour de meilleures performances
            const innerCount = Math.floor(this.fishCount * 0.7); // 70% des poissons dans la zone intérieure
            const outerCount = Math.floor(this.fishCount * 0.3); // 30% dans la zone extérieure
            
            this.createFishInstancesInArea(
                innerCount,
                0,
                this.environment.playAreaRadius
            );
            
            this.createFishInstancesInArea(
                outerCount,
                this.environment.playAreaRadius,
                this.environment.maxReachableRadius
            );
            
            // Enregistrer la fonction de mise à jour avec un intervalle optimisé
            let frameCount = 0;
            this.scene.registerBeforeRender(() => {
                frameCount++;
                if (frameCount % 2 === 0) { // Mise à jour toutes les deux images
                    this.updateFish();
                }
            });
        }).catch(error => {
            console.error("Échec de chargement du modèle de poisson:", error);
            this.createSimpleFish();
        });
    }
    
    /**
     * Créer des instances de poissons dans une zone spécifique
     * @param {number} count - Nombre de poissons à créer
     * @param {number} innerRadius - Rayon intérieur de la zone
     * @param {number} outerRadius - Rayon extérieur de la zone
     */
    createFishInstancesInArea(count, innerRadius, outerRadius) {
        console.log(`Création de ${count} poissons dans la zone de ${innerRadius} à ${outerRadius}`);
        
        // Obtenir le niveau d'eau de l'environnement
        const waterLevel = this.environment.waterLevel;
        
        // Créer des poissons en bancs (groupes)
        const schoolSize = 15; // 15 poissons par banc
        const schoolCount = Math.ceil(count / schoolSize);
        
        for (let s = 0; s < schoolCount; s++) {
            // Position aléatoire dans la zone spécifiée
            const angle = Math.random() * Math.PI * 2;
            const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Profondeur aléatoire SOUS le niveau de l'eau (y négatif est sous l'eau)
            const depth = Math.random() * 20 + 5; // 5-25 unités sous l'eau
            const y = waterLevel - depth; // S'assurer que les poissons sont sous le niveau de l'eau
            
            // Créer un banc de poissons à cet emplacement
            const fishCount = Math.min(schoolSize, count - s * schoolSize);
            const schoolRadius = 3 + Math.random() * 2; // Rayon de banc réduit (3-5 unités)
            
            for (let i = 0; i < fishCount; i++) {
                // Position aléatoire dans le banc
                const fishAngle = Math.random() * Math.PI * 2;
                const fishRadius = Math.random() * schoolRadius;
                const fishX = x + Math.cos(fishAngle) * fishRadius;
                const fishZ = z + Math.sin(fishAngle) * fishRadius;
                
                // Variation de profondeur aléatoire dans le banc
                const fishY = y + (Math.random() - 0.5) * 2; // Répartition verticale réduite
                
                // Créer une instance de poisson
                const fish = this.fishGeometryMesh.createInstance("fish_" + this.fishInstances.length);
                
                // Positionner le poisson
                fish.position.x = fishX;
                fish.position.y = fishY;
                fish.position.z = fishZ;
                
                // Rotation aléatoire (mais garder le poisson à niveau)
                fish.rotation.y = Math.random() * Math.PI * 2;
                
                // Variation d'échelle aléatoire
                const scale = 0.8 + Math.random() * 0.2; // Variation d'échelle réduite
                fish.scaling = new BABYLON.Vector3(scale, scale, scale);
                
                // Stocker les données du poisson avec les propriétés de mouvement
                this.fishInstances.push({
                    instance: fish,
                    speed: 0.01 + Math.random() * 0.01, // Vitesse beaucoup plus lente
                    rotationSpeed: 0.01 + Math.random() * 0.01,
                    centerX: x, // Centre du banc fixe
                    centerZ: z, // Centre du banc fixe
                    radius: fishRadius,
                    angle: fishAngle,
                    depth: fishY - waterLevel,
                    verticalSpeed: 0.005 + Math.random() * 0.005, // Slower vertical movement
                    verticalOffset: Math.random() * Math.PI * 2,
                    schoolRadius: schoolRadius,
                    lastX: fishX,
                    lastZ: fishZ
                });
            }
        }
    }
    
    /**
     * Create underwater weeds using instances for better performance
     */
    createUnderwaterWeedsWithInstances() {
        console.log("Using environment's optimized weeds instead of animated weeds");
        // Skip creating weeds here - they're now handled by the Environment class
        return;
    }
    
    /**
     * Animate the weeds to sway in the water
     */
    animateWeeds() {
        // No animation needed - using static weeds for better performance
        return;
    }
    
    /**
     * Create seagulls flying above the water
     */
    createSeagulls() {
        console.log("Creating seagulls");
        
            // Create a parent mesh for the seagull
            const seagullParent = new BABYLON.Mesh("seagullParent", this.scene);
            
        // Load the seagull model
        BABYLON.SceneLoader.ImportMeshAsync("", "assets/Models/", "Seagull.glb", this.scene).then(result => {
            // Add all loaded meshes as children to the parent
            for (const mesh of result.meshes) {
                if (mesh.id !== seagullParent.id) {
                    mesh.parent = seagullParent;
                    
                    // Apply standard material to each seagull mesh
                    if (mesh.material) {
                        const originalMaterial = mesh.material;
                        const standardMaterial = new BABYLON.StandardMaterial("seagullMaterial_" + mesh.id, this.scene);
                        
                        // Copy properties from original material
                        if (originalMaterial.diffuseColor) {
                            standardMaterial.diffuseColor = originalMaterial.diffuseColor.clone();
                        } else {
                            standardMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9); // White
                        }
                        
                        // Apply standard material
                        mesh.material = standardMaterial;
                    }
                }
            }
            
            // Hide the parent so it won't be rendered
            seagullParent.isVisible = false;
            
            // Create multiple seagull instances
            for (let i = 0; i < this.seagullCount; i++) {
                // Clone the seagull model
                const seagull = seagullParent.clone("seagull_" + i);
                seagull.isVisible = true;
                
                // Set random position above water
                const angle = Math.random() * Math.PI * 2;
                const playAreaRadius = this.environment?.playAreaRadius || 100;
                const distance = Math.random() * playAreaRadius * 0.8;
                const height = this.seagullMinHeight + Math.random() * (this.seagullMaxHeight - this.seagullMinHeight);
                
                seagull.position = new BABYLON.Vector3(
                    Math.sin(angle) * distance,
                    this.environment.waterLevel + height,
                    Math.cos(angle) * distance
                );
        
                // Set random rotation
                seagull.rotation.y = Math.random() * Math.PI * 2;
                
                // Add animation properties - extremely slow speed
                seagull.speed = 0.001 + Math.random() * 0.002; // Extremely slow speed
                seagull.circleRadius = 30 + Math.random() * 40; // Larger circles
                seagull.circleCenter = seagull.position.clone();
                seagull.angle = Math.random() * Math.PI * 2;
                seagull.verticalSpeed = 0.0005 + Math.random() * 0.001; // Extremely slow vertical movement
                seagull.verticalDirection = Math.random() > 0.5 ? 1 : -1;
                seagull.verticalDistance = 0.5 + Math.random() * 1; // Minimal vertical movement
                seagull.baseHeight = seagull.position.y;
                seagull.wingAngle = 0;
                seagull.wingSpeed = 0.02 + Math.random() * 0.03; // Slower wing flapping
                
                // Scale the seagull
                seagull.scaling = new BABYLON.Vector3(2, 2, 2);
                
                // Add to seagulls array
                this.seagulls.push(seagull);
            }
            
            console.log(`Created ${this.seagulls.length} seagulls`);
        }).catch(error => {
            console.error("Failed to load seagull model:", error);
            this.createSimpleSeagulls();
        });
    }
    
    /**
     * Create simple seagulls if the model fails to load
     */
    createSimpleSeagulls() {
        console.log("Creating simple seagulls fallback");
        
        // Create a simple seagull mesh (box with wings)
        const seagullBody = BABYLON.MeshBuilder.CreateBox("seagullTemplate", {
            width: 0.5,
            height: 0.3,
            depth: 1
        }, this.scene);
        
        // Create wings
        const leftWing = BABYLON.MeshBuilder.CreateBox("leftWing", {
            width: 1.5,
            height: 0.1,
            depth: 0.5
        }, this.scene);
        leftWing.position.x = -0.8;
        leftWing.position.y = 0.1;
        leftWing.parent = seagullBody;
        
        const rightWing = BABYLON.MeshBuilder.CreateBox("rightWing", {
            width: 1.5,
            height: 0.1,
            depth: 0.5
        }, this.scene);
        rightWing.position.x = 0.8;
        rightWing.position.y = 0.1;
        rightWing.parent = seagullBody;
        
        // Create material for seagull
        const seagullMaterial = new BABYLON.StandardMaterial("seagullMaterial", this.scene);
        seagullMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9); // White
        seagullBody.material = seagullMaterial;
        leftWing.material = seagullMaterial;
        rightWing.material = seagullMaterial;
        
        // Hide the template
        seagullBody.isVisible = false;
        
        // Create multiple seagull instances
        for (let i = 0; i < this.seagullCount; i++) {
            // Clone the seagull
            const seagull = seagullBody.clone("seagull_" + i);
            seagull.isVisible = true;
            
            // Set random position above water
            const angle = Math.random() * Math.PI * 2;
            const playAreaRadius = this.environment?.playAreaRadius || 100;
            const distance = Math.random() * playAreaRadius * 0.8;
            const height = this.seagullMinHeight + Math.random() * (this.seagullMaxHeight - this.seagullMinHeight);
            
            seagull.position = new BABYLON.Vector3(
                Math.sin(angle) * distance,
                this.environment.waterLevel + height,
                Math.cos(angle) * distance
            );
            
            // Set random rotation
            seagull.rotation.y = Math.random() * Math.PI * 2;
            
            // Add animation properties - extremely slow speed
            seagull.speed = 0.001 + Math.random() * 0.002; // Extremely slow speed
            seagull.circleRadius = 30 + Math.random() * 40; // Larger circles
            seagull.circleCenter = seagull.position.clone();
            seagull.angle = Math.random() * Math.PI * 2;
            seagull.verticalSpeed = 0.0005 + Math.random() * 0.001; // Extremely slow vertical movement
            seagull.verticalDirection = Math.random() > 0.5 ? 1 : -1;
            seagull.verticalDistance = 0.5 + Math.random() * 1; // Minimal vertical movement
            seagull.baseHeight = seagull.position.y;
            
            // Store left and right wings for animation
            seagull.leftWing = seagull.getChildMeshes()[0];
            seagull.rightWing = seagull.getChildMeshes()[1];
            
            // Add to seagulls array
            this.seagulls.push(seagull);
        }
        
        console.log(`Created ${this.seagulls.length} simple seagulls`);
    }
    
    /**
     * Update fish positions and animations
     */
    updateFish() {
        // Get water level from environment
        const waterLevel = this.environment.waterLevel;
        
        // Update all fish every frame for smoother movement
        for (const fish of this.fishInstances) {
            if (!fish || !fish.instance) continue;
            
            // Store old position for rotation calculation
            fish.lastX = fish.instance.position.x;
            fish.lastZ = fish.instance.position.z;
            
            // Update fish position within school (circular movement)
            fish.angle += fish.speed;
            const newX = fish.centerX + Math.cos(fish.angle) * fish.radius;
            const newZ = fish.centerZ + Math.sin(fish.angle) * fish.radius;
            
            // Ajouter un mouvement vertical doux
            fish.verticalOffset += fish.verticalSpeed;
            const verticalMovement = Math.sin(fish.verticalOffset) * 0.5; // Mouvement vertical réduit
            
            // Mettre à jour la position du poisson
            fish.instance.position.x = newX;
            fish.instance.position.y = waterLevel + fish.depth + verticalMovement;
            fish.instance.position.z = newZ;
            
            // Calculer la direction du mouvement pour la rotation
            const dx = newX - fish.lastX;
            const dz = newZ - fish.lastZ;
            
            // Mettre à jour la rotation seulement s'il y a un mouvement significatif
            if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
                const targetRotation = Math.atan2(dx, dz);
                
                // Rotation douce
                let currentRotation = fish.instance.rotation.y;
                let rotationDiff = targetRotation - currentRotation;
                
                // Normaliser la différence de rotation entre -PI et PI
                while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
                while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
                
                // Appliquer une rotation très douce
                fish.instance.rotation.y += rotationDiff * 0.1; // Rotation plus lente
            }
        }
    }
    
    /**
     * Update seagull positions
     */
    updateSeagulls() {
        if (!this.seagulls || this.seagulls.length === 0) return;
        
        for (const seagull of this.seagulls) {
            if (!seagull.isDisposed()) {
                // Mettre à jour l'angle pour le mouvement circulaire
                seagull.angle += seagull.speed;
                
                // Calculer la nouvelle position basée sur le chemin circulaire
                const newX = seagull.circleCenter.x + Math.sin(seagull.angle) * seagull.circleRadius;
                const newZ = seagull.circleCenter.z + Math.cos(seagull.angle) * seagull.circleRadius;
                
                // Mettre à jour la position verticale avec un léger balancement
                seagull.verticalDirection = this.updateVerticalMovement(seagull);
                
                // Calculer la nouvelle hauteur
                const newY = seagull.baseHeight + 
                    Math.sin(seagull.angle * 5) * seagull.verticalDistance * 0.3 + // Balancement doux
                    seagull.verticalDirection * seagull.verticalDistance; // Changement de hauteur global
                
                // Définir la nouvelle position
                seagull.position = new BABYLON.Vector3(newX, newY, newZ);
                
                // Faire face à la direction du mouvement
                const direction = seagull.position.subtract(seagull.previousPosition || seagull.position.clone());
                if (direction.length() > 0.01) {
                    const targetRotationY = Math.atan2(direction.x, direction.z);
                    
                    // Rotation douce
                    let rotationDiff = targetRotationY - seagull.rotation.y;
                    
                    // Normaliser la différence de rotation entre -PI et PI
                    while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
                    while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
                    
                    // Appliquer une rotation douce
                    seagull.rotation.y += rotationDiff * 0.05;
                }
                
                // Stocker la position actuelle pour la prochaine image
                seagull.previousPosition = seagull.position.clone();
                
                // Animer les ailes si c'est une mouette simple avec ailes
                if (seagull.leftWing && seagull.rightWing) {
                    // Animation simple de battement d'ailes
                    const wingAngle = Math.sin(Date.now() * 0.005) * 0.3; // Battement d'ailes plus lent
                    seagull.leftWing.rotation.z = -Math.abs(wingAngle);
                    seagull.rightWing.rotation.z = Math.abs(wingAngle);
                } else if (seagull.wingAngle !== undefined) {
                    // Pour les modèles de mouettes, animer légèrement le modèle entier
                    seagull.wingAngle += seagull.wingSpeed;
                    seagull.rotation.z = Math.sin(seagull.wingAngle) * 0.1;
                }
            }
        }
    }
    
    /**
     * Méthode auxiliaire pour mettre à jour la direction du mouvement vertical
     */
    updateVerticalMovement(seagull) {
        // Changer occasionnellement la direction verticale
        if (Math.random() < 0.005) {
            return -seagull.verticalDirection;
        }
        
        // Rester dans les limites de hauteur
        const minHeight = this.environment.waterLevel + this.seagullMinHeight;
        const maxHeight = this.environment.waterLevel + this.seagullMaxHeight;
        
        if (seagull.position.y > maxHeight && seagull.verticalDirection > 0) {
            return -1; // Descendre si trop haut
        } else if (seagull.position.y < minHeight && seagull.verticalDirection < 0) {
            return 1; // Monter si trop bas
        }
        
        return seagull.verticalDirection;
    }
    
    /**
     * Mettre à jour toutes les créatures marines
     */
    update() {
        // Mettre à jour les poissons
        this.updateFish();
        
        // Mettre à jour les mouettes
        this.updateSeagulls();
    }
    
    /**
     * Supprimer toutes les créatures marines de la scène
     */
    removeAll() {
        // Effacer les instances de poissons
        this.clearFishInstances();
        
        // Effacer les mouettes
        for (const seagull of this.seagulls) {
            if (seagull) {
                seagull.dispose();
            }
        }
        this.seagulls = [];
    }
    
    /**
     * Ajouter plus de poissons à la scène
     * @param {number} count - Nombre de poissons à ajouter à la zone de jeu
     */
    addFish(count = 10) {
        // Définir le nombre de poissons pour la zone de jeu
        this.fishCount = count;
        
        // Calculer les zones des régions intérieure et extérieure
        const innerArea = Math.PI * this.environment.playAreaRadius * this.environment.playAreaRadius;
        const outerArea = Math.PI * this.environment.maxReachableRadius * this.environment.maxReachableRadius - innerArea;
        
        // Calculer le rapport de la zone extérieure à la zone intérieure
        const areaRatio = outerArea / innerArea;
        
        // Calculer le nombre de poissons en zone étendue basé sur le rapport de zones (70% de la densité de la zone intérieure)
        this.extendedAreaFishCount = Math.floor(count * areaRatio * 0.7);
        
        console.log(`Distribution de poissons: ${count} dans la zone intérieure, ${this.extendedAreaFishCount} dans la zone extérieure`);
        
        // Effacer les instances de poissons existantes
        this.clearFishInstances();
        
        // Si le maillage source est déjà chargé, créer de nouvelles instances
        if (this.fishGeometryMesh) {
            // Créer des instances de poissons dans la zone de jeu
            this.createFishInstancesInArea(this.fishCount, 0, this.environment.playAreaRadius);
            
            // Créer des instances de poissons dans la zone étendue
            this.createFishInstancesInArea(
                this.extendedAreaFishCount,
                this.environment.playAreaRadius, 
                this.environment.maxReachableRadius
            );
        } else {
            // Si le maillage source n'est pas encore chargé, il créera des instances lors du chargement
            this.createFishSchoolsWithInstances();
        }
    }
    
    /**
     * Clear fish instances
     */
    clearFishInstances() {
        // Dispose of all fish instances
        for (const fish of this.fishInstances) {
            if (fish.instance) {
                fish.instance.dispose();
            }
        }
        
        // Clear the array
        this.fishInstances = [];
    }
    
    /**
     * Add more weeds to the scene
     * @param {number} count - Number of weed clusters to add to the play area
     */
    addWeeds(count = 5) {
        console.log("Using environment's optimized weeds instead of adding more weeds");
        // Skip adding weeds - using optimized static approach
        return;
    }
} 