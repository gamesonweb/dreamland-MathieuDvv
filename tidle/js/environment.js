/**
 * Classe Environment pour gérer l'océan et la configuration de l'environnement
 */
class Environment {
    constructor(scene) {
        this.scene = scene;
        this.visualWaterLevel = 1.5; // Où le joueur voit la surface de l'eau
        this.waterLevel = this.visualWaterLevel + 0.5;
        this.oceanDepth = 20;
        this.oceanFloorLevel = -this.oceanDepth;
        this.playAreaRadius = 100;
        this.oceanSize = 500;
        this.maxReachableRadius = 250;
        this.boundary = null;
        this.underwaterBoundary = [];
        this.weedInstances = [];
        
        // Paramètres physiques
        this.underwaterResistance = 0.995;
        this.aboveWaterResistance = 0.999;
        this.gravity = 0.008;
        this.boundarySoftness = 0.05;
        this.waterSurfaceBoost = 0.05;
        this.maxJumpHeight = 40;
        
        // Propriétés physiques de plongée
        this.diveMomentumFactor = 1.2;
        this.diveDepth = 4;
        this.diveThreshold = 0.15;
        
        // Éléments du monde
        this.waterMaterial = null;
        this.skybox = null;
        
        // Propriétés additionnelles
        this.ground = null;
        this.water = null;
        this.underwaterFog = null;
        this.underwaterParticles = null;
        this.seaweed = [];
        this.rocks = [];
        
        // Paramètres d'animation des vagues
        this.seaWaveAmplitude = 1.5;
        this.seaWaveSpeed = 0.005;
        this.seaWaveTime = 0;
        this.applyVertexWaves = true;
        
        // Île de départ
        this.startIsland = null;
        this.startIslandCollider = null;
        
        // Lier les méthodes
        if (typeof this.createUnderwater === 'function') this.createUnderwater = this.createUnderwater.bind(this);
        if (typeof this.createBoundary === 'function') this.createBoundary = this.createBoundary.bind(this);
        if (typeof this.createUnderwaterBoundary === 'function') this.createUnderwaterBoundary = this.createUnderwaterBoundary.bind(this);
        if (typeof this.createSeaweed === 'function') this.createSeaweed = this.createSeaweed.bind(this);
        if (typeof this.createRocks === 'function') this.createRocks = this.createRocks.bind(this);
        if (typeof this.update === 'function') this.update = this.update.bind(this);
    }
    
    /**
     * Définir la taille de la zone de jeu
     * @param {number} size - La nouvelle taille de la zone de jeu
     */
    setPlayAreaSize(size) {
        console.log(`Changement de la taille de la zone de jeu de ${this.playAreaRadius} à ${size}`);
        this.playAreaRadius = size;
        
        // Mettre à jour les zones de jeu étendues si elles existent
        if (this.maxReachableRadius) {
            this.maxReachableRadius = size * 2.5;
        }
    }

    /**
     * Crée l'environnement sous-marin
     */
    createUnderwater() {
        try {
            console.log("Création de l'environnement sous-marin...");
            
            // Créer le fond océanique
            this.createOceanFloor();
            console.log("Fond océanique créé avec succès");
            
            // Créer la surface de l'eau
            this.createWater();
            console.log("Eau créée avec succès");
            
            // Créer le ciel
            this.createSky();
            console.log("Ciel créé avec succès");
            
            // Créer la limite
            this.createBoundary();
            console.log("Limite créée avec succès");
            
            // Créer la limite sous-marine
            this.createUnderwaterBoundary();
            
            // Créer les algues sous-marines
            this.createOptimizedUnderwaterWeeds();
            
            // Créer les rochers du fond marin
            this.createSeaFloorRocks();
            
            // Créer le brouillard sous-marin
            this.createUnderwaterFog();
            
            // Créer une lumière au-dessus de la zone de jeu
            this.createPlayAreaLight();
            console.log("Lumière de la zone de jeu créée avec succès");
            
            console.log("Environnement sous-marin créé avec succès");
        } catch (error) {
            console.error("Erreur lors de la création de l'environnement sous-marin:", error);
        }
    }
    
    /**
     * Effacer l'environnement
     */
    clear() {
        // Supprimer et disposer des maillages
        if (this.skybox) {
            this.skybox.dispose();
            this.skybox = null;
        }
        
        if (this.waterMaterial) {
            this.waterMaterial.dispose();
            this.waterMaterial = null;
        }
        
        if (this.boundary) {
            this.boundary.dispose();
            this.boundary = null;
        }
        
        // Supprimer la lumière de la zone de jeu
        if (this.playAreaLight) {
            this.playAreaLight.dispose();
            this.playAreaLight = null;
        }
        
        // Supprimer le générateur d'ombres si présent
        if (this.shadowGenerator) {
            // Pas besoin de dispose explicitement, il sera nettoyé avec la lumière
            this.shadowGenerator = null;
        }
        
        // Effacer les algues sous-marines
        this.clearUnderwaterWeeds();
        
        // Effacer la limite sous-marine
        this.clearUnderwaterBoundary();
    }
    
    /**
     * Créer le fond océanique
     */
    createOceanFloor() {
        // Créer le fond océanique
        const ground = BABYLON.MeshBuilder.CreateGround(
            "oceanFloor", 
            { width: this.oceanSize, height: this.oceanSize }, 
            this.scene
        );
        ground.position.y = -this.oceanDepth;
        this.oceanFloorLevel = -this.oceanDepth;
        
        // Créer le matériau du fond océanique avec une texture de sable
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        
        // Créer une texture procédurale de sable (puisque nous n'avons pas de fichiers d'images externes)
        const sandTexture = new BABYLON.ProceduralTexture("sandTexture", 512, "sandProceduralTexture", this.scene);
        
        // Définir la texture procédurale de sable
        BABYLON.Effect.ShadersStore["sandProceduralTexturePixelShader"] = `
            precision highp float;
            varying vec2 vUV;
            
            float rand(vec2 n) { 
                return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
            }
            
            float noise(vec2 p){
                vec2 ip = floor(p);
                vec2 u = fract(p);
                u = u*u*(3.0-2.0*u);
                
                float res = mix(
                    mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x),
                    mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y);
                return res*res;
            }
            
            void main(void) {
                // Couleur de base du sable
                vec3 baseColor = vec3(0.95, 0.85, 0.65);
                
                // Créer des grains de sable en utilisant plusieurs fonctions de bruit
                float grainPattern1 = noise(vUV * 30.0);
                float grainPattern2 = noise(vUV * 60.0);
                float grainPattern3 = noise(vUV * 90.0);
                
                // Créer quelques structures de sable plus grandes
                float largePattern = noise(vUV * 8.0);
                
                // Combiner les motifs
                float pattern = 
                    grainPattern1 * 0.5 + 
                    grainPattern2 * 0.3 + 
                    grainPattern3 * 0.2 +
                    largePattern * 0.4;
                
                // Ajuster la couleur basée sur le motif
                vec3 finalColor = mix(
                    baseColor * 0.9,  // Zones plus sombres
                    baseColor * 1.1,  // Zones plus claires
                    pattern
                );
                
                // Sortir la couleur
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        // Appliquer la texture de sable
        groundMaterial.diffuseTexture = sandTexture;
        
        // Ajouter un effet de déformation pour une meilleure réalisme
        groundMaterial.bumpTexture = sandTexture;
        groundMaterial.bumpTexture.level = 0.6; // Augmentation de l'effet de déformation
        
        // Slightly reflective wet sand
        groundMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        groundMaterial.specularPower = 32;
        
        // Scale the texture to look like small sand grains
        sandTexture.uScale = 10;
        sandTexture.vScale = 10;
        
        ground.material = groundMaterial;
        this.ground = ground; // Store for later reference
        
        console.log("Ocean floor created with sand texture");
        
        // Create water surface with improved visibility
        this.createWaterSurface();
    }
    
    /**
     * Créer la surface d'eau avec effet Wind Waker
     */
    createWater() {
        console.log("Création de l'eau avec effet de mousse style Wind Waker");
        
        // Créer le maillage d'eau
        this.water = BABYLON.MeshBuilder.CreateGround("water", {
            width: this.playAreaRadius * 4,
            height: this.playAreaRadius * 4,
            subdivisions: 128
        }, this.scene);
        
        // Positionner l'eau au niveau souhaité
        this.water.position.y = this.waterLevel;
        
        // Créer le matériau d'eau
        const waterMaterial = new BABYLON.StandardMaterial("waterMaterial", this.scene);
        
        // Couleur bleu tropical
        waterMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.8, 1.0);
        
        // Ajouter texture procédurale pour l'eau
        let waterTexture = new BABYLON.ProceduralTexture("waterTexture", 512, "waterProceduralTexture", this.scene);
        
        // Définir le shader de la texture procédurale
        BABYLON.Effect.ShadersStore["waterProceduralTexturePixelShader"] = `
            precision highp float;
            varying vec2 vUV;
            uniform float time;
            uniform float islandPositions[20];
            uniform int islandCount;
            
            float noise(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            float improvedNoise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                
                float a = noise(i);
                float b = noise(i + vec2(1.0, 0.0));
                float c = noise(i + vec2(0.0, 1.0));
                float d = noise(i + vec2(1.0, 1.0));
                
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            
            void main(void) {
                vec3 baseColor = vec3(0.2, 0.8, 1.0);
                
                vec2 uv = vUV;
                
                float gridSize = 40.0;
                vec2 grid = floor(uv * gridSize) / gridSize;
                
                float largeWave = sin(grid.x * 5.0 + time * 0.4) * 0.5 + 0.5;
                
                uv.y += sin(grid.x * 10.0 + time * 0.5) * 0.05;
                uv.x += sin(grid.y * 8.0 + time * 0.3) * 0.05;
                
                float waves1 = improvedNoise(uv * 15.0 + time * 0.1);
                float waves2 = improvedNoise(uv * 30.0 - time * 0.15);
                
                float waterPattern = max(
                    step(0.5, waves1),
                    step(0.7, waves2)
                ) * 0.3 + largeWave * 0.2;
                
                float linePattern = step(0.95, fract(uv.y * 20.0 + sin(uv.x * 30.0) * 0.05));
                
                float cellSize = 30.0;
                vec2 cellPos = floor(uv * 800.0 / cellSize) * cellSize;
                float cellNoise = step(0.6, noise(cellPos * 0.03 + time * 0.05));
                
                float islandOutline = 0.0;
                float foamRings = 0.0;
                
                for (int i = 0; i < 10; i++) {
                    if (i >= islandCount) break;
                    
                    vec2 worldPosition = (vUV - 0.5) * 800.0;
                    
                    vec2 islandPos = vec2(islandPositions[i*2], islandPositions[i*2+1]);
                    
                    float distanceToIsland = distance(worldPosition, islandPos);
                    
                    float outlineWidth = 6.0;
                    float innerRadius = 30.0;
                    float outerRadius = innerRadius + outlineWidth;
                    
                    float normalizedDist = clamp((distanceToIsland - innerRadius) / outlineWidth, 0.0, 1.0);
                    
                    if (distanceToIsland > innerRadius - 2.0 && distanceToIsland < outerRadius) {
                        islandOutline = 1.0 - normalizedDist;
                    }
                    
                    float ringCount = 5.0;
                    float ringPhase = fract(normalizedDist * ringCount - time * 0.2);
                    float ringPattern = 1.0 - smoothstep(0.0, 0.3, ringPhase);
                    
                    float ringStrength = (1.0 - normalizedDist) * ringPattern * 0.8;
                    
                    foamRings = max(foamRings, ringStrength);
                }
                
                float foamPattern = max(linePattern * 0.7, cellNoise * 0.3);
                
                float waveFoam = step(0.7, largeWave) * 0.5;
                
                float foamFactor = max(max(foamPattern, foamRings), waveFoam);
                
                vec3 finalColor;
                
                vec3 foamColor = vec3(1.0, 1.0, 1.0);
                
                if (islandOutline > 0.5) {
                    finalColor = foamColor;
                } else if (foamFactor > 0.1) {
                    finalColor = mix(
                        baseColor,
                        foamColor,
                        step(0.3, foamFactor)
                    );
                } else {
                    vec3 lighterBlue = vec3(0.4, 0.9, 1.0);
                    vec3 darkerBlue = vec3(0.2, 0.7, 1.0);
                    
                    finalColor = mix(
                        darkerBlue,
                        lighterBlue,
                        step(0.4, waterPattern)
                    );
                }
                
                gl_FragColor = vec4(finalColor, 0.7);
            }
        `;
        
        // Configuration pour l'animation et les îles
        let time = 0;
        const islandPositions = new Float32Array(20);
        let islandCount = 0;
        
        try {
            // Créer la texture avec paramètres
            waterTexture = new BABYLON.ProceduralTexture(
                "waterTexture", 
                512, 
                "waterProceduralTexture", 
                this.scene, 
                null, 
                true, 
                false
            );
            
            // Paramètres initiaux
            waterTexture.setFloat("time", 0);
            waterTexture.setInt("islandCount", 0);
            waterTexture.setFloats("islandPositions", islandPositions);
            
            console.log("Texture procédurale d'eau créée avec succès");
        } catch (error) {
            console.error("Échec de création de la texture procédurale d'eau:", error);
            
            waterTexture = new BABYLON.Texture("assets/textures/Water.jpg", this.scene);
            console.log("Utilisation d'une texture d'eau de secours");
        }
        
        // Mise à jour de la texture d'eau
        this.scene.registerBeforeRender(() => {
            time += 0.02;
            
            if (waterTexture && waterTexture.setFloat) {
                waterTexture.setFloat("time", time);
                
                if (this.startIsland) {
                    islandCount = 1;
                    islandPositions[0] = this.startIsland.position.x;
                    islandPositions[1] = this.startIsland.position.z;
                    
                    waterTexture.setInt("islandCount", islandCount);
                    waterTexture.setFloats("islandPositions", islandPositions);
                }
                
                if (this.twinIslands) {
                    islandPositions[islandCount*2] = this.twinIslands.position.x - 20;
                    islandPositions[islandCount*2+1] = this.twinIslands.position.z;
                    islandCount++;
                    
                    islandPositions[islandCount*2] = this.twinIslands.position.x + 20;
                    islandPositions[islandCount*2+1] = this.twinIslands.position.z;
                    islandCount++;
                    
                    waterTexture.setInt("islandCount", islandCount);
                    waterTexture.setFloats("islandPositions", islandPositions);
                }
            }
        });
        
        // Application des propriétés au matériau d'eau
        waterMaterial.diffuseTexture = waterTexture;
        waterMaterial.specularTexture = waterTexture;
        waterMaterial.specularPower = 96;
        waterMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
        waterMaterial.alpha = 0.9; 
        waterMaterial.backFaceCulling = false;
        waterMaterial.useSpecularOverAlpha = true;
        waterMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.5);
        waterMaterial.disableLighting = true;
        
        this.water.material = waterMaterial;
        this.waterMaterial = waterMaterial;
        
        // Créer post-processus pour l'assombrissement
        this.createDarkeningPostProcess();
        
        console.log("Eau créée avec 50% de transparence et mousse de style Wind Waker");
    }
    
    /**
     * Créer un post-processus pour l'assombrissement
     */
    createDarkeningPostProcess() {
        try {
            // Enregistrer les shaders
            BABYLON.Effect.ShadersStore["darkeningVertexShader"] = `
                precision highp float;
                attribute vec2 position;
                varying vec2 vUV;
                void main(void) {
                    gl_Position = vec4(position, 0.0, 1.0);
                    vUV = position * 0.5 + 0.5;
                }
            `;

            BABYLON.Effect.ShadersStore["darkeningPixelShader"] = `
                precision highp float;
                varying vec2 vUV;
                uniform sampler2D textureSampler;
                uniform float darkeningFactor;
                uniform vec2 screenSize;
                uniform vec2 playerPos;
                void main(void) {
                    vec4 originalColor = texture2D(textureSampler, vUV);
                    
                    vec4 darkenedColor = originalColor * (1.0 - darkeningFactor);
                    
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(vUV, center) * 1.5;
                    float vignette = 1.0 - dist * 0.8;
                    vignette = clamp(vignette, 0.5, 1.0);
                    
                    gl_FragColor = darkenedColor * vignette;
                }
            `;
            
            // Créer le post-processus
            this.darkeningPostProcess = new BABYLON.PostProcess(
                "darkening",
                "darkening",
                [],
                ["textureSampler", "darkeningFactor", "screenSize", "playerPos"],
                1.0,
                null,
                BABYLON.Texture.BILINEAR_SAMPLINGMODE,
                this.scene.getEngine(),
                false,
                "#define CUSTOM"
            );
            
            // Initialiser les paramètres
            this.darkeningPostProcess.onApply = (effect) => {
                effect.setFloat("darkeningFactor", 0.0);
                effect.setFloat2("screenSize", this.scene.getEngine().getRenderWidth(), this.scene.getEngine().getRenderHeight());
                effect.setFloat2("playerPos", 0, 0);
            };
            
            console.log("Post-processus d'assombrissement créé avec succès");
        } catch (error) {
            console.error("Échec de création du post-processus d'assombrissement:", error);
            
            // Créer un post-processus de secours
            console.log("Utilisation de l'enregistrement de shader de secours");
            
            this.darkeningPostProcess = new BABYLON.PostProcess(
                "simpleDarkening",
                "standard",
                [],
                [],
                1.0,
                null,
                BABYLON.Texture.BILINEAR_SAMPLINGMODE,
                this.scene.getEngine()
            );
            
            this.darkeningPostProcess.onApply = (effect) => {};
            
            console.log("Post-processus d'assombrissement de secours créé avec succès");
        }
    }
    
    /**
     * Créer des particules de mousse de style cartoon à la surface de l'eau
     */
    createCartoonWaterFoam() {
        // Cette méthode n'est plus utilisée
        console.log("createCartoonWaterFoam est obsolète");
    }
    
    /**
     * Créer le ciel
     */
    createSky() {
        // Obtenir les paramètres du monde
        const worldSettings = this.scene.game?.worldSettings?.settings || this.scene.game?.worldManager?.settings;
        
        // Déterminer la couleur du ciel
        let skyColor;
        if (worldSettings && worldSettings.skyColor) {
            skyColor = worldSettings.skyColor;
        } else {
            skyColor = new BABYLON.Color3(0.5, 0.8, 1.0); // Ciel bleu plus lumineux pour une ambiance tropicale
        }
        
        // Créer la skybox
        this.skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, this.scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = this.createProceduralSkyTexture(skyColor);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        this.skybox.material = skyboxMaterial;
        
        // Faire suivre la skybox à la caméra
        this.scene.registerBeforeRender(() => {
            if (this.skybox && this.scene.activeCamera) {
                this.skybox.position = this.scene.activeCamera.position;
            }
        });
    }
    
    /**
     * Créer une texture de ciel procédurale basée sur la couleur
     * @param {BABYLON.Color3} baseColor - Couleur de base du ciel
     * @returns {BABYLON.Texture} - Texture du ciel
     */
    createProceduralSkyTexture(baseColor) {
        // Créer une texture dynamique pour le ciel
        const size = 1024;
        const skyTexture = new BABYLON.DynamicTexture("skyTexture", { width: size, height: size }, this.scene);
        const ctx = skyTexture.getContext();
        
        // Créer un dégradé pour chaque côté de la skybox
        const createGradient = (ctx, startColor, endColor, direction) => {
            const gradient = direction === 'vertical' 
                ? ctx.createLinearGradient(0, 0, 0, size)
                : ctx.createLinearGradient(0, 0, size, 0);
            
            gradient.addColorStop(0, startColor);
            gradient.addColorStop(1, endColor);
            return gradient;
        };
        
        // Convertir la couleur en chaîne de style
        const colorToStyle = (color, alpha = 1) => {
            return `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${alpha})`;
        };
        
        // Dessus - ciel plus clair
        const topColor = colorToStyle(baseColor);
        ctx.fillStyle = topColor;
        ctx.fillRect(0, 0, size, size);
        
        // Mettre à jour la texture
        skyTexture.update();
        
        return skyTexture;
    }
    
    /**
     * Créer une bordure autour de la zone de jeu
     */
    createBoundary() {
        // Créer un cercle invisible autour de la zone de jeu
        const points = [];
        const segments = 36; // Nombre de segments dans le cercle
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = this.playAreaRadius * Math.cos(angle);
            const z = this.playAreaRadius * Math.sin(angle);
            points.push(new BABYLON.Vector3(x, 0, z));
        }
        
        // Créer le tube
        this.boundary = BABYLON.MeshBuilder.CreateTube(
            "boundary",
            { path: points, radius: 1.0, cap: BABYLON.Mesh.CAP_ALL },
            this.scene
        );
        
        // Configurer les propriétés du maillage
        this.boundary.position.y = this.waterLevel;
        this.boundary.isVisible = false; // Invisible par défaut
        
        // Créer un matériau totalement transparent pour la bordure
        const boundaryMaterial = new BABYLON.StandardMaterial("boundaryMaterial", this.scene);
        boundaryMaterial.alpha = 0; // Transparence totale
        boundaryMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        boundaryMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0);
        boundaryMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        
        // Appliquer le matériau
        this.boundary.material = boundaryMaterial;
    }
    
    /**
     * Mettre à jour la visibilité de la bordure en fonction de la distance du joueur
     * @param {BABYLON.Vector3} playerPosition - La position du joueur
     */
    updateBoundaryVisibility(playerPosition) {
        // La bordure reste toujours invisible
        if (this.boundary) {
            this.boundary.isVisible = false;
            
            // Garder l'opacité à 0
            if (this.boundary.material) {
                this.boundary.material.alpha = 0;
            }
        }
    }
    
    /**
     * Créer un chemin circulaire pour la bordure
     * @returns {Array} Tableau de points Vector3 formant un cercle
     */
    createCirclePath() {
        const points = [];
        const segments = 36; // Nombre de segments dans le cercle
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = this.playAreaRadius * Math.cos(angle);
            const z = this.playAreaRadius * Math.sin(angle);
            points.push(new BABYLON.Vector3(x, 0, z));
        }
        
        return points;
    }
    
    /**
     * Créer des éléments de bordure sous-marine (désactivé)
     */
    createUnderwaterBoundary() {
        // Cette méthode est maintenant désactivée pour éviter les grands objets bleus
        console.log("Création de bordure sous-marine désactivée");
        
        // Effacer tous les éléments de bordure sous-marine existants
        this.clearUnderwaterBoundary();
        
        // Ne créer aucun nouvel élément de bordure
        return;
    }
    
    /**
     * Effacer les éléments de bordure sous-marine
     */
    clearUnderwaterBoundary() {
        if (this.underwaterBoundary && this.underwaterBoundary.length > 0) {
            // Supprimer chaque maillage dans la bordure sous-marine
            this.underwaterBoundary.forEach(mesh => {
                if (mesh) {
                    mesh.dispose();
                }
            });
            
            // Réinitialiser le tableau
            this.underwaterBoundary = [];
        }
    }
    
    /**
     * Vérifier si une position est sous l'eau
     * @param {BABYLON.Vector3} position - La position à vérifier
     * @returns {boolean} - Vrai si sous l'eau, faux sinon
     */
    isUnderwater(position) {
        // Vérifier si la position est définie
        if (!position) return true; // Par défaut sous l'eau si la position est indéfinie
        
        // Utiliser le niveau d'eau physique pour les mécaniques de jeu
        return position.y < this.waterLevel;
    }
    
    /**
     * Vérifier si une position est en dehors de la zone de jeu
     * @param {BABYLON.Vector3} position - La position à vérifier
     * @returns {boolean} - Vrai si à l'extérieur, faux si à l'intérieur
     */
    isOutsidePlayArea(position) {
        // Désactivation complète de la limite de la zone de jeu
        return false;
    }
    
    /**
     * Appliquer la physique de l'eau à la vélocité d'un objet
     */
    applyWaterPhysics(object, velocity, deltaTime = 1/60) {
        // S'assurer que deltaTime est raisonnable
        deltaTime = Math.min(deltaTime, 0.1);
        
        // Vérifier si la vélocité est valide
        if (!velocity) {
            console.warn("Vélocité invalide passée à applyWaterPhysics");
            return new BABYLON.Vector3(0, 0, 0);
        }
        
        if (!object) {
            console.warn("Objet invalide passé à applyWaterPhysics");
            return velocity;
        }
        
        // Obtenir la position
        let position;
        if (object.position) {
            position = object.position;
        } else if (object.mesh && object.mesh.position) {
            position = object.mesh.position;
        } else {
            console.warn("L'objet dans applyWaterPhysics n'a pas de position valide");
            return velocity;
        }
        
        // Facteur d'échelle pour les calculs physiques
        const physicsFactor = 60;
        
        // Vérifier l'état sous-marin
        const isUnder = this.isUnderwater(position);
        
        // Obtenir la position précédente
        let prevPosition;
        try {
            if (velocity && velocity.subtract) {
                prevPosition = position.subtract(velocity);
            } else {
                prevPosition = position.clone();
            }
        } catch (e) {
            console.warn("Error calculating previous position:", e);
            prevPosition = position.clone(); // Fallback to current position
        }
        
        const wasUnder = this.isUnderwater(prevPosition);
        const crossingSurface = isUnder !== wasUnder;
        
        // Apply water resistance with smoother values
        const resistance = isUnder ? this.underwaterResistance : this.aboveWaterResistance;
        velocity.scaleInPlace(resistance);
        
        // Apply special physics when crossing the water surface
        if (crossingSurface) {
            // Going from underwater to above water (jumping out)
            if (wasUnder && !isUnder && velocity.y > 0) {
                // Add extra boost when breaking the surface
                velocity.y += this.waterSurfaceBoost * velocity.length() * 2; // Doubled for more dramatic jumps
                
                // Preserve more horizontal momentum
                velocity.x *= 1.2; // Increased from 1.1
                velocity.z *= 1.2; // Increased from 1.1
            }
            // Going from above water to underwater (diving in)
            else if (!wasUnder && isUnder) {
                // Calculate dive angle and speed
                const verticalSpeed = Math.abs(velocity.y);
                const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
                const totalSpeed = velocity.length();
                
                // Debug log to help diagnose diving issues
                console.log(`Entering water: vertSpeed=${verticalSpeed.toFixed(2)}, horizSpeed=${horizontalSpeed.toFixed(2)}, totalSpeed=${totalSpeed.toFixed(2)}`);
                
                // Always apply diving physics when entering water from above, with stronger effect based on speed
                console.log("Dive detected! Applying dive physics");
                
                // Apply more gentle downward momentum for a proper dive - preserve more of the original direction
                velocity.y *= this.diveMomentumFactor;
                
                // Calculate dive force based on entry speed and angle - more gentle
                const diveForce = Math.max(
                    this.diveDepth * 0.3, // Reduced minimum dive depth
                    Math.min(verticalSpeed * 1.5, 2.0) * this.diveDepth // Reduced scaling
                );
                
                // Apply an impulse in the direction of movement but with less downward angle
                if (horizontalSpeed > 0.05) {
                    // Normalize horizontal direction
                    const dirX = velocity.x / horizontalSpeed;
                    const dirZ = velocity.z / horizontalSpeed;
                    
                    // Add a gentler downward-angled impulse
                    velocity.x += dirX * diveForce * 0.3;
                    velocity.z += dirZ * diveForce * 0.3;
                }
                
                // Add a smaller direct downward impulse
                velocity.y -= diveForce * 0.2;
                
                // Preserve more of the original momentum and orientation
                velocity.scaleInPlace(0.99); // Less resistance for diving
                
                // Add a shorter "dive lock" to prevent bouncing back to surface
                object.diveLockTimer = 15; // About 0.25 seconds at 60fps
            }
        }
        
        // Handle dive lock timer to keep dolphin underwater after diving
        if (object.diveLockTimer > 0) {
            object.diveLockTimer--;
            
            // Apply gentler downward force during dive lock - safely access position
            if (position && position.y > -2) { // Only if not already deep
                velocity.y -= 0.005 * deltaTime * physicsFactor;
            }
            
            // Gradually reduce upward velocity during dive lock, but less aggressively
            if (velocity.y > 0) {
                velocity.y *= 0.95;
            }
        }
        
        // Apply gravity if above water with gentler force
        if (!isUnder) {
            // Safely access position
            if (position) {
                // Apply gravity with a smooth transition near the water surface
                const distanceAboveSurface = position.y - this.waterLevel;
                
                // Gradually increase gravity with height to create a nice arc
                let gravityFactor;
                if (distanceAboveSurface < 2) {
                    gravityFactor = 0.5 * (distanceAboveSurface / 2); // Very low gravity near surface
                } else if (distanceAboveSurface > this.maxJumpHeight * 0.7) {
                    gravityFactor = 1.5; // Higher gravity near peak to create better arc
                } else {
                    gravityFactor = Math.min(1, distanceAboveSurface / 5); // Normal gravity in middle range
                }
                
                velocity.y -= this.gravity * gravityFactor * deltaTime * physicsFactor;
                
                // Add a small upward boost when near the surface to help with jumping
                if (distanceAboveSurface < 0.5 && velocity.y < 0) {
                    velocity.y *= 0.8; // Reduce downward velocity near surface
                }
            }
        } else {
            // Add slight buoyancy when underwater, but not during dive lock
            if (position && velocity && velocity.y < 0 && position.y < -5 && (!object.diveLockTimer || object.diveLockTimer <= 0)) {
                velocity.y *= 0.95; // Slow down sinking
            }
            
            // Add upward force when moving fast near the surface (to help with jumps)
            // But not during dive lock
            if (position && velocity && velocity.length && isUnder) {
                const distanceFromSurface = this.waterLevel - position.y;
                if (distanceFromSurface < 3 && velocity.length() > 0.8 && (!object.diveLockTimer || object.diveLockTimer <= 0)) {
                    // Add upward tendency proportional to forward speed
                    const upwardForce = 0.003 * velocity.length() * deltaTime * physicsFactor * 2; // Doubled for better jumps
                    velocity.y += upwardForce;
                }
            }
        }
        
        // Prevent going below ocean floor with a softer bounce - safely access position
        if (position && position.y < -this.oceanDepth + 2) {
            position.y = -this.oceanDepth + 2;
            
            // Soft bounce off the floor
            if (velocity.y < 0) {
                velocity.y = -velocity.y * 0.3; // Bounce with 30% of impact velocity
            }
        }
        
        // Check if outside play area and push back if so (with smoother force) - safely access position
        if (position && this.isOutsidePlayArea && this.isOutsidePlayArea(position)) {
            // Calculate how far outside the boundary
            const distanceFromCenter = Math.sqrt(
                position.x * position.x + 
                position.z * position.z
            );
            const overshoot = distanceFromCenter - (this.playAreaRadius - 2);
            
            // Disable darkening effect (always set to 0)
            if (this.darkeningPostProcess) {
                this.darkeningPostProcess.onApply = (effect) => {
                    effect.setFloat("darkeningFactor", 0);
                    effect.setFloat2("screenSize", this.scene.getEngine().getRenderWidth(), this.scene.getEngine().getRenderHeight());
                    effect.setFloat2("playerPos", position.x, position.z);
                };
            }
            
            // Tolérer toutes les positions, pas de téléportation, pas de message d'avertissement
        } else {
            // Reset darkening effect when inside play area
            if (this.darkeningPostProcess) {
                this.darkeningPostProcess.onApply = (effect) => {
                    effect.setFloat("darkeningFactor", 0.0);
                    effect.setFloat2("screenSize", this.scene.getEngine().getRenderWidth(), this.scene.getEngine().getRenderHeight());
                    effect.setFloat2("playerPos", position.x, position.z);
                };
            }
        }
        
        return velocity;
    }

    /**
     * Creates optimized underwater weeds using instances
     */
    createOptimizedUnderwaterWeeds() {
        try {
            console.log("Creating optimized underwater weeds...");
            
            // Create source meshes for instancing
            const tallWeedSource = BABYLON.MeshBuilder.CreatePlane("tallWeedSource", {
                width: 1.5,
                height: 10 // Taller weeds
            }, this.scene);
            
            // Create material for tall weeds
            const tallWeedMaterial = new BABYLON.StandardMaterial("tallWeedMaterial", this.scene);
            tallWeedMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.3);
            tallWeedMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.05); // Slight glow
            tallWeedMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            tallWeedMaterial.backFaceCulling = false; // Show both sides
            
            tallWeedSource.material = tallWeedMaterial;
            tallWeedSource.isVisible = false;
            
            const mediumWeedSource = BABYLON.MeshBuilder.CreatePlane("mediumWeedSource", {
                width: 1.2,
                height: 7 // Medium weeds
            }, this.scene);
            
            // Create material for medium weeds
            const mediumWeedMaterial = new BABYLON.StandardMaterial("mediumWeedMaterial", this.scene);
            mediumWeedMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.65, 0.25);
            mediumWeedMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.12, 0.05); // Slight glow
            mediumWeedMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            mediumWeedMaterial.backFaceCulling = false; // Show both sides
            
            mediumWeedSource.material = mediumWeedMaterial;
            mediumWeedSource.isVisible = false;
            
            const smallWeedSource = BABYLON.MeshBuilder.CreatePlane("smallWeedSource", {
                width: 0.8,
                height: 5 // Smaller weeds
            }, this.scene);
            
            // Create material for smaller weeds - slightly different color
            const smallWeedMaterial = new BABYLON.StandardMaterial("smallWeedMaterial", this.scene);
            smallWeedMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.7, 0.2); // Different green
            smallWeedMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.15, 0.05); // Slight glow
            smallWeedMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            smallWeedMaterial.backFaceCulling = false; // Show both sides
            
            smallWeedSource.material = smallWeedMaterial;
            smallWeedSource.isVisible = false;
            
            // Store instances for cleanup
            this.weedInstances = [];
            
            // Simplified: Use fewer clusters for better performance
            const innerClusterCount = 60; // Reduced from 120
            const outerClusterCount = 100; // Reduced from 200
            
            // Create clusters in the play area (inner area)
            this.createWeedClusters(
                tallWeedSource, 
                mediumWeedSource, 
                smallWeedSource, 
                0, 
                this.playAreaRadius, 
                innerClusterCount
            );
            
            // Create clusters in the extended area (outer area)
            this.createWeedClusters(
                tallWeedSource, 
                mediumWeedSource, 
                smallWeedSource, 
                this.playAreaRadius, 
                this.maxReachableRadius || this.playAreaRadius * 2.5, 
                outerClusterCount
            );
            
            // Store source meshes for cleanup
            this.tallWeedSource = tallWeedSource;
            this.mediumWeedSource = mediumWeedSource;
            this.smallWeedSource = smallWeedSource;
            
            console.log(`Created ${this.weedInstances.length} weed instances in ${innerClusterCount + outerClusterCount} clusters`);
        } catch (error) {
            console.error("Failed to create optimized underwater weeds:", error);
        }
    }
    
    /**
     * Create clusters of weeds in a ring
     * @param {BABYLON.Mesh} tallWeedSource - Source mesh for tall weeds
     * @param {BABYLON.Mesh} mediumWeedSource - Source mesh for medium weeds
     * @param {BABYLON.Mesh} smallWeedSource - Source mesh for small weeds
     * @param {number} innerRadius - Inner radius of the ring
     * @param {number} outerRadius - Outer radius of the ring
     * @param {number} clusterCount - Number of clusters to create
     */
    createWeedClusters(tallWeedSource, mediumWeedSource, smallWeedSource, innerRadius, outerRadius, clusterCount) {
        for (let c = 0; c < clusterCount; c++) {
            // Get random position in the ring
            const angle = Math.random() * Math.PI * 2;
            const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
            
            const clusterPosition = new BABYLON.Vector3(
                Math.cos(angle) * radius,
                -this.oceanDepth + 0.1, // Just above the ocean floor
                Math.sin(angle) * radius
            );
            
            // 1. Create tall weeds in the center (1-2 tall weeds)
            const tallWeedCount = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < tallWeedCount; i++) {
                const tallWeed = tallWeedSource.createInstance("tallWeed_" + c + "_" + i);
                tallWeed.position = new BABYLON.Vector3(
                    clusterPosition.x + (Math.random() - 0.5) * 2,
                    clusterPosition.y + 5, // Position at base + half height
                    clusterPosition.z + (Math.random() - 0.5) * 2
                );
                tallWeed.rotation.y = Math.random() * Math.PI * 2;
                tallWeed.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
                this.weedInstances.push(tallWeed);
            }
            
            // 2. Create medium weeds in the middle ring (3-5 medium weeds)
            const mediumWeedCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < mediumWeedCount; i++) {
                const angle = (i / mediumWeedCount) * Math.PI * 2;
                const radius = 2 + Math.random() * 2; // 2-4 units from center
                
                const mediumWeed = mediumWeedSource.createInstance("mediumWeed_" + c + "_" + i);
                mediumWeed.position = new BABYLON.Vector3(
                    clusterPosition.x + Math.cos(angle) * radius,
                    clusterPosition.y + 3.5, // Position at base + half height
                    clusterPosition.z + Math.sin(angle) * radius
                );
                mediumWeed.rotation.y = Math.random() * Math.PI * 2;
                mediumWeed.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
                this.weedInstances.push(mediumWeed);
            }
            
            // 3. Create small weeds in the outer ring (3-5 small weeds)
            const smallWeedCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < smallWeedCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 4 + Math.random() * 2; // 4-6 units from center
                
                const smallWeed = smallWeedSource.createInstance("smallWeed_" + c + "_" + i);
                smallWeed.position = new BABYLON.Vector3(
                    clusterPosition.x + Math.cos(angle) * radius,
                    clusterPosition.y + 2.5, // Position at base + half height
                    clusterPosition.z + Math.sin(angle) * radius
                );
                smallWeed.rotation.y = Math.random() * Math.PI * 2;
                smallWeed.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
                this.weedInstances.push(smallWeed);
            }
        }
    }
    
    /**
     * Clear underwater weeds
     */
    clearUnderwaterWeeds() {
        // Dispose of all weed instances
        if (this.weedInstances && this.weedInstances.length > 0) {
            for (const weed of this.weedInstances) {
                if (weed) {
                    weed.dispose();
                }
            }
            this.weedInstances = [];
        }
        
        // Dispose of source meshes
        if (this.tallWeedSource) {
            this.tallWeedSource.dispose();
            this.tallWeedSource = null;
        }
        
        if (this.mediumWeedSource) {
            this.mediumWeedSource.dispose();
            this.mediumWeedSource = null;
        }
        
        if (this.smallWeedSource) {
            this.smallWeedSource.dispose();
            this.smallWeedSource = null;
        }
    }

    /**
     * Create underwater fog effect
     * @param {BABYLON.Color3} fogColor - Color for the fog (optional)
     * @param {number} fogDensity - Density of the fog (optional)
     */
    createUnderwaterFog(fogColor = null, fogDensity = 0.01) {
        // Set scene fog for underwater effect - lighter fog for better visibility
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        this.scene.fogDensity = 0.01; // Reduced from 0.02 for better visibility
        this.scene.fogColor = new BABYLON.Color3(0.2, 0.6, 0.9); // Lighter blue for better visibility
    }

    /**
     * Create an island at a specific angle and distance
     * @param {number} index - Index of the island
     * @param {number} distanceFactor - Distance from center as a factor of play area radius
     * @param {number} angle - Angle in radians (optional, random if not provided)
     * @returns {BABYLON.Mesh} - The created island mesh
     */
    createIsland(index = 0, distanceFactor = 1.5, angle = null) {
        // Create island base (cone shape)
        const island = BABYLON.MeshBuilder.CreateCylinder("island" + index, {
            height: 30 + (Math.random() * 30), // Vary height between 30 and 60
            diameterTop: 0,
            diameterBottom: 60 + (Math.random() * 100), // Vary size between 60 and 160
            tessellation: 24
        }, this.scene);

        console.log("Creating island " + index);
        
        // Position the island away from the play area
        const distanceFromCenter = this.playAreaRadius * distanceFactor;
        if (angle === null) {
            angle = Math.random() * Math.PI * 2;
        }
        
        island.position = new BABYLON.Vector3(
            Math.sin(angle) * distanceFromCenter,
            -40, // Base is underwater
            Math.cos(angle) * distanceFromCenter
        );
        
        // Create materials - simplified to use StandardMaterial
        const islandMaterial = new BABYLON.StandardMaterial("islandMaterial" + index, this.scene);
        islandMaterial.diffuseColor = new BABYLON.Color3(
            0.7 + (Math.random() * 0.2), // Vary sand color
            0.6 + (Math.random() * 0.2),
            0.4 + (Math.random() * 0.2)
        );
        
        island.material = islandMaterial;
        
        // Add palm trees
        this.addPalmTrees(island);
        
        return island;
    }
    
    /**
     * Ajoute des palmiers a l'ile
     * @param {BABYLON.Mesh} island - The island mesh
     */
    addPalmTrees(island) {
        console.log("Adding palm trees");
        
        // Plutot que de mettre des modeles 3D, on va mettre une image de palmier
        const palmTree = BABYLON.MeshBuilder.CreatePlane("palmTree", {
            width: 10,
            height: 20
        }, this.scene);

        palmTree.material = new BABYLON.StandardMaterial("palmTreeMaterial", this.scene);
        palmTree.material.diffuseTexture = new BABYLON.Texture("assets/textures/palm.png", this.scene);
        palmTree.material.diffuseTexture.hasAlpha = true;
        palmTree.material.backFaceCulling = false;

        // Position du palmier (x, y, z) sachant que l'image est centrée est à un vide en bas + au dessus l'ile
        palmTree.position = new BABYLON.Vector3(0, 10, 0);
        palmTree.rotation.y = Math.PI / 2;

        // Ajouter le palmier a l'ile
        island.addChild(palmTree);
    }

    /**
     * Animate the sea level to create a Wind Waker-style wave effect
     */
    animateSeaLevel() {
        if (!this.water) return;
        
        // Increment wave time
        this.seaWaveTime += this.seaWaveSpeed;
        
        // Calculate new water level using multiple sine waves for Wind Waker style
        // Use primary wave for overall up/down movement
        const primaryWave = Math.sin(this.seaWaveTime) * this.seaWaveAmplitude;
        
        // Add secondary wave for more character
        const secondaryWave = Math.sin(this.seaWaveTime * 0.7) * (this.seaWaveAmplitude * 0.3);
        
        // Combine for Wind Waker style motion
        const waveHeight = primaryWave + secondaryWave;
        
        // Apply vertical position offset for tide effect
        this.water.position.y = this.waterLevel + waveHeight;
        
        // Adjust the visual water level for physics calculations
        this.visualWaterLevel = this.water.position.y - 0.5;
        
        // Also update boundary positions to match water level
        if (this.underwaterBoundary && this.underwaterBoundary.length > 0) {
            for (const boundary of this.underwaterBoundary) {
                if (boundary) {
                    boundary.position.y = this.water.position.y;
                }
            }
        }
        
        // Use vertex morphing for more detailed wave effect (only if vertices are accessible)
        if (this.water.getVerticesData && this.applyVertexWaves) {
            try {
                // Only update vertices occasionally to avoid performance issues
                // Create a counter to limit updates
                if (!this.vertexUpdateCounter) {
                    this.vertexUpdateCounter = 0;
                }
                
                this.vertexUpdateCounter++;
                
                // Only update every 10 frames to reduce performance impact
                if (this.vertexUpdateCounter % 10 === 0) {
                    // Get vertex positions
                    const positions = this.water.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                    
                    if (positions && positions.length > 0) {
                        // Apply small ripples to each vertex for Wind Waker style
                        // Only process a subset of vertices to improve performance
                        const stride = 9; // Only process every 9th vertex (3 coordinates per vertex)
                        
                        for (let i = 0; i < positions.length; i += stride) {
                            if (i + 1 >= positions.length) continue;
                            
                            // Keep x and z positions
                            const x = positions[i];
                            const z = positions[i + 2];
                            
                            // Calculate cell-based height variations (Wind Waker style)
                            const cellSize = 40; // Larger cells for better performance
                            const cellX = Math.floor(x / cellSize);
                            const cellZ = Math.floor(z / cellSize);
                            
                            // Deterministic "random" height per cell
                            const cellHeight = Math.sin(cellX * 0.3 + cellZ * 0.5 + this.seaWaveTime * 0.8) * 0.3;
                            
                            // Apply height offset to y coordinate
                            positions[i + 1] = waveHeight + cellHeight;
                        }
                        
                        // Update vertex data
                        this.water.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
                    }
                }
            } catch (e) {
                // Vertex manipulation failed - only do this once
                this.applyVertexWaves = false;
                console.log("Vertex wave animation disabled - using simpler animation");
            }
        }
    }

    /**
     * Creates the main starting island
     */
    createStartIsland() {
        console.log("Creating start island at chunk 0,-1");
        
        // Calculate position based on chunk coordinates (0,-1)
        // Assuming chunks are 16x16 units
        const chunkSize = 16;
        const position = new BABYLON.Vector3(
            0 * chunkSize, // x = 0
            0, // y will be adjusted
            -1 * chunkSize // z = -1
        );
        
        // Create island base (cone shape with flat top)
        const startIsland = BABYLON.MeshBuilder.CreateCylinder("startIsland", {
            height: 40, // 5 above water + 20 below
            diameterTop: 20, // Flat top
            diameterBottom: 80, // Wider base
            tessellation: 12 // Low poly for PSX look
        }, this.scene);
        
        // Position the island at chunk 0,-1 with top at 5 units above water
        // Lowered by 10 points as requested
        startIsland.position = new BABYLON.Vector3(
            position.x,
            this.visualWaterLevel + 5 - 25/2, // Lowered by 10 points (from +5 to -5)
            position.z
        );
        
        // Create sand material with texture
        const sandMaterial = new BABYLON.StandardMaterial("startIslandMaterial", this.scene);
        // Create texture with NEAREST_SAMPLINGMODE for PSX-style pixelation
        sandMaterial.diffuseTexture = new BABYLON.Texture(
            "assets/textures/sand.png", 
            this.scene, 
            false, 
            false, 
            BABYLON.Texture.NEAREST_SAMPLINGMODE
        );
        sandMaterial.diffuseTexture.uScale = 3;
        sandMaterial.diffuseTexture.vScale = 3;
        sandMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        
        startIsland.material = sandMaterial;
        
        // Create invisible collision mesh for the island
        // This will be used for collision detection both above and below water
        const colliderSize = 1.0; // Slightly larger than the island for better collision
        const startIslandCollider = BABYLON.MeshBuilder.CreateCylinder("startIslandCollider", {
            height: 25 * colliderSize,
            diameterTop: 20 * colliderSize,
            diameterBottom: 80 * colliderSize,
            tessellation: 12
        }, this.scene);
        
        // Position the collider at the same position as the island
        startIslandCollider.position = startIsland.position.clone();
        
        // Make the collider invisible
        startIslandCollider.isVisible = false;
        
        // Make the collider checkable with debug mode
        startIslandCollider.showBoundingBox = true;
        startIslandCollider.visibility = 0;
        
        // Store reference to the collider
        this.startIslandCollider = startIslandCollider;
        
        // Add palm trees to the island
        this.addPalmTreesToStartIsland(startIsland);
        
        // Add BeachTV to the island
        this.addBeachTVToStartIsland(startIsland);
        
        // Store reference to the start island
        this.startIsland = startIsland;
        
        return startIsland;
    }
    
    /**
     * Add palm trees to the start island
     * @param {BABYLON.Mesh} island - The island mesh
     */
    addPalmTreesToStartIsland(island) {
        console.log("Adding palm trees to start island");
        
        // Get the island top position
        const islandTopY = island.position.y + 20; // Island top is 20 units above center
        
        // Create 5 palm trees on the island
        const palmCount = 5;
        
        for (let i = 0; i < palmCount; i++) {
            // Create billboard plane for palm tree
            const palmTree = BABYLON.MeshBuilder.CreatePlane("palm_" + i, {
                width: 8,
                height: 12
            }, this.scene);
            
            // Create material with palm texture
            const palmMaterial = new BABYLON.StandardMaterial("palmMaterial_" + i, this.scene);
            // Create texture with NEAREST_SAMPLINGMODE for PSX-style pixelation
            palmMaterial.diffuseTexture = new BABYLON.Texture(
                "assets/textures/palm.png", 
                this.scene, 
                false, 
                false, 
                BABYLON.Texture.NEAREST_SAMPLINGMODE
            );
            palmMaterial.diffuseTexture.hasAlpha = true;
            
            // Disable backface culling so palm is visible from both sides
            palmMaterial.backFaceCulling = false;
            
            palmTree.material = palmMaterial;
            
            // Position palm tree with slight random offset
            const angle = (i / palmCount) * Math.PI * 2;
            const radius = 7; // Smaller radius to be closer to center
            
            palmTree.position = new BABYLON.Vector3(
                Math.sin(angle) * radius,
                islandTopY + 8, // Position higher above island top
                Math.cos(angle) * radius
            );
            
            // Fix palm tree orientation - rotate 180 degrees to fix upside-down issue
            palmTree.rotation.z = Math.PI;
            
            // Make palm tree always face the camera (billboard)
            palmTree.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
            
            // Make palm tree a child of the island
            palmTree.parent = island;
        }
        
        console.log("Palm trees added successfully");
    }
    
    /**
     * Check if player is colliding with start island and push them away
     * @param {BABYLON.Mesh} playerMesh - The player's mesh
     * @param {Object} velocity - The player's velocity object
     * @param {boolean} showDebug - Whether to show debug information
     */
    handleStartIslandCollision(playerMesh, velocity, showDebug) {
        if (!this.startIsland || !playerMesh) return;
        
        // Update collider visibility based on debug mode
        if (this.startIslandCollider) {
            this.startIslandCollider.showBoundingBox = showDebug;
        }
        
        // Calculate distance from player to island center (XZ plane only)
        const dx = playerMesh.position.x - this.startIsland.position.x;
        const dz = playerMesh.position.z - this.startIsland.position.z;
        const distanceXZ = Math.sqrt(dx * dx + dz * dz);
        
        // Get player's height relative to island top
        const islandTopY = this.startIsland.position.y + 25/2; // Island center + half height
        const playerY = playerMesh.position.y;
        
        // Check if player is within island radius
        // For above water, use a smaller radius (just the top part)
        // For underwater, use the full island shape
        const isAboveWater = playerY > this.waterLevel;
        const collisionRadius = isAboveWater ? 10 : 20 + (20 - 10) * ((islandTopY - playerY) / 25);
        
        if (distanceXZ < collisionRadius) {
            // Calculate push direction (away from island center)
            const pushDirection = new BABYLON.Vector3(dx, 0, dz).normalize();
            
            // Apply push force - stronger above water
            const pushStrength = isAboveWater ? 0.5 : 0.3;
            velocity.x += pushDirection.x * pushStrength;
            velocity.z += pushDirection.z * pushStrength;
            
            // Add slight upward boost to help player move away
            velocity.y += 0.05;
        }
    }

    /**
     * Add the BeachTV to the start island
     * @param {BABYLON.Mesh} island - The island mesh
     */
    addBeachTVToStartIsland(island) {
        console.log("Adding BeachTV to start island...");
        
        // Create a simple TV cube
        const beachTVCube = BABYLON.MeshBuilder.CreateBox("beachTVCube", {
            size: 4
        }, this.scene);
        
        // Create material for the TV
        const tvMaterial = new BABYLON.StandardMaterial("tvMaterial", this.scene);
        tvMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        tvMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        tvMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.3);
        beachTVCube.material = tvMaterial;
        
        // Position the TV on the island
        beachTVCube.position = new BABYLON.Vector3(0, 25, 0);
        beachTVCube.rotation = new BABYLON.Vector3(0, -Math.PI/2, 0);
        beachTVCube.parent = island;
        
        // Store reference to the TV
        this.beachTV = beachTVCube;
        
        // Create interaction zone
        this.createBeachTVInteractionZone(beachTVCube);
        
        console.log("BeachTV added successfully");
    }

    /**
     * Create an interaction zone around the BeachTV
     * @param {BABYLON.Mesh} beachTV - The BeachTV mesh
     */
    createBeachTVInteractionZone(beachTV) {
        // Create hitbox for interaction
        const hitbox = BABYLON.MeshBuilder.CreateBox("beachTVHitbox", {
            width: 8,
            height: 8,
            depth: 8
        }, this.scene);
        
        // Position the hitbox in front of the TV
        hitbox.position = new BABYLON.Vector3(0, 0, 4);
        
        // Make the hitbox invisible
        hitbox.isVisible = false;
        
        // Make the hitbox a child of the BeachTV
        hitbox.parent = beachTV;
        
        // Store reference to the hitbox
        this.beachTVHitbox = hitbox;
        
        // Initialize interaction state
        this.beachTVState = {
            isInRange: false,
            isMenuOpen: false,
            lastInteractionTime: 0
        };
    }

    /**
     * Check for BeachTV interaction
     * @param {BABYLON.Mesh} playerMesh - The player's mesh
     * @param {Object} input - Player input state
     * @param {Object} uiManager - UI manager for showing menu
     */
    checkBeachTVInteraction(playerMesh, input, uiManager) {
        if (!this.beachTV || !playerMesh || !uiManager) return;
        
        // Get TV position in world space
        const tvPosition = this.beachTV.getAbsolutePosition();
        
        // Get island position (assuming TV is on the start island)
        const islandPosition = this.startIsland ? this.startIsland.position.clone() : new BABYLON.Vector3(0, 0, 0);
        
        // Calculate distance to player from island center (horizontal distance only)
        const dx = playerMesh.position.x - islandPosition.x;
        const dz = playerMesh.position.z - islandPosition.z;
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
        
        // Check if player is near the island (larger radius)
        const isInRange = horizontalDistance < 30; // Much larger radius around the island
        
        // Initialize beachTVState if it doesn't exist
        if (!this.beachTVState) {
            this.beachTVState = {
                isInRange: false,
                isMenuOpen: false,
                lastInteractionTime: 0
            };
        }
        
        // Handle entering/leaving range
        if (isInRange !== this.beachTVState.isInRange) {
            this.beachTVState.isInRange = isInRange;
            if (isInRange) {
                uiManager.showNotification("Press E to interact with TV", 2000);
            } else if (this.beachTVState.isMenuOpen) {
                if (uiManager.game && uiManager.game.beachTVMenu) {
                    uiManager.game.beachTVMenu.close();
                }
                this.beachTVState.isMenuOpen = false;
            }
        }
        
        // Handle interaction with debounce
        const now = Date.now();
        if (isInRange && input && input.e && !this.beachTVState.isMenuOpen && 
            now - this.beachTVState.lastInteractionTime > 500) { // Debounce 500ms
            
            this.beachTVState.lastInteractionTime = now;
            
            if (uiManager.game && uiManager.game.beachTVMenu) {
                uiManager.game.beachTVMenu.open();
                this.beachTVState.isMenuOpen = true;
                console.log("Opening Beach TV Menu");
            } else {
                console.warn("Beach TV Menu not found");
            }
        }
    }

    /**
     * Creates twin islands (two start islands next to each other)
     */
    createTwinIslands() {
        console.log("Creating twin islands...");
        
        // Create parent mesh for the twin islands
        const twinIslands = new BABYLON.Mesh("twinIslands", this.scene);
        
        // Position the twin islands
        twinIslands.position = new BABYLON.Vector3(
            100, // X position
            0, // Y position at origin, we'll adjust parts individually
            100 // Z position
        );
        
        // Create the first island
        const island1 = this.createIslandMesh("twinIsland1", -20, 0);
        island1.parent = twinIslands;
        
        // Create the second island
        const island2 = this.createIslandMesh("twinIsland2", 20, 0);
        island2.parent = twinIslands;
        
        // Store reference to the twin islands
        this.twinIslands = twinIslands;
        
        // Create collision meshes for both islands
        this.createTwinIslandsColliders(island1, island2, twinIslands);
        
        // Calculate the correct Y position for palm trees (top of the islands)
        // Island top is at visualWaterLevel + 5, and we want trees on top
        const palmTreeY = 5; // Relative to island top
        
        // Add palm trees to both islands
        this.addPalmTreesToPosition(new BABYLON.Vector3(-20, palmTreeY, 0), twinIslands);
        this.addPalmTreesToPosition(new BABYLON.Vector3(20, palmTreeY, 0), twinIslands);
        
        return twinIslands;
    }
    
    /**
     * Creates a single island mesh based on the start island design
     * @param {string} name - Name for the island mesh
     * @param {number} offsetX - X offset from center
     * @param {number} offsetZ - Z offset from center
     * @returns {BABYLON.Mesh} - The created island mesh
     */
    createIslandMesh(name, offsetX, offsetZ) {
        // Create island base (cone shape with flat top)
        const island = BABYLON.MeshBuilder.CreateCylinder(name, {
            height: 40, // 5 above water + 35 below
            diameterTop: 20, // Flat top
            diameterBottom: 60, // Wider base
            tessellation: 12 // Low poly for PSX look
        }, this.scene);
        
        // Position the island with top at 5 units above water
        island.position = new BABYLON.Vector3(
            offsetX,
            this.visualWaterLevel + 5 - 20, // Center of height
            offsetZ
        );
        
        // Create sand material with texture
        const sandMaterial = new BABYLON.StandardMaterial(name + "Material", this.scene);
        // Create texture with NEAREST_SAMPLINGMODE for PSX-style pixelation
        sandMaterial.diffuseTexture = new BABYLON.Texture(
            "assets/textures/sand.png", 
            this.scene, 
            false, 
            false, 
            BABYLON.Texture.NEAREST_SAMPLINGMODE
        );
        sandMaterial.diffuseTexture.uScale = 3;
        sandMaterial.diffuseTexture.vScale = 3;
        sandMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        
        island.material = sandMaterial;
        
        return island;
    }
    
    /**
     * Creates collision meshes for the twin islands
     * @param {BABYLON.Mesh} island1 - The first island mesh
     * @param {BABYLON.Mesh} island2 - The second island mesh
     * @param {BABYLON.Mesh} parent - The parent mesh
     */
    createTwinIslandsColliders(island1, island2, parent) {
        console.log("Creating twin islands colliders...");
        
        // Create invisible collision mesh for the first island
        const colliderSize = 1.1; // Slightly larger for better collision detection
        const island1Collider = BABYLON.MeshBuilder.CreateCylinder("twinIsland1Collider", {
            height: 40 * colliderSize,
            diameterTop: 20 * colliderSize, 
            diameterBottom: 60 * colliderSize,
            tessellation: 12
        }, this.scene);
        
        // Position the collider at the same position as the first island
        island1Collider.position = island1.position.clone();
        island1Collider.parent = parent;
        
        // Make the collider invisible but maintain bounding box
        island1Collider.isVisible = false;
        island1Collider.visibility = 0;
        island1Collider.showBoundingBox = false;
        
        // Create invisible collision mesh for the second island
        const island2Collider = BABYLON.MeshBuilder.CreateCylinder("twinIsland2Collider", {
            height: 40 * colliderSize,
            diameterTop: 20 * colliderSize,
            diameterBottom: 60 * colliderSize,
            tessellation: 12
        }, this.scene);
        
        // Position the collider at the same position as the second island
        island2Collider.position = island2.position.clone();
        island2Collider.parent = parent;
        
        // Make the collider invisible but maintain bounding box
        island2Collider.isVisible = false;
        island2Collider.visibility = 0;
        island2Collider.showBoundingBox = false;
        
        // Enable collision checking and pickability for both colliders
        island1Collider.checkCollisions = true;
        island1Collider.isPickable = true;
        island2Collider.checkCollisions = true;
        island2Collider.isPickable = true;
        
        // Make sure bounding info is properly computed
        island1Collider.computeWorldMatrix(true);
        island1Collider.refreshBoundingInfo();
        island2Collider.computeWorldMatrix(true);
        island2Collider.refreshBoundingInfo();
        
        // Store references to the colliders
        this.twinIslandsCollider1 = island1Collider;
        this.twinIslandsCollider2 = island2Collider;
        
        console.log("Twin islands colliders created successfully");
    }
    
    /**
     * Handle collision with twin islands
     * @param {BABYLON.Mesh} playerMesh - The player's mesh
     * @param {Object} velocity - The player's velocity object
     * @param {boolean} showDebug - Whether to show debug information
     */
    handleTwinIslandsCollision(playerMesh, velocity, showDebug) {
        if (!this.twinIslands || !playerMesh) {
            console.log("Missing twin islands or player mesh");
            return;
        }
        
        // Debug logging
        if (showDebug) {
            console.log("Checking collision with twin islands at", this.twinIslands.position);
        }
        
        // Update collider visibility based on debug mode
        if (this.twinIslandsCollider1) {
            this.twinIslandsCollider1.showBoundingBox = showDebug;
        }
        if (this.twinIslandsCollider2) {
            this.twinIslandsCollider2.showBoundingBox = showDebug;
        }
        
        // Check collision with first island
        this.handleSingleIslandCollision(
            playerMesh, 
            velocity, 
            this.twinIslands.position.x - 20, 
            this.twinIslands.position.z,
            showDebug
        );
        
        // Check collision with second island
        this.handleSingleIslandCollision(
            playerMesh, 
            velocity, 
            this.twinIslands.position.x + 20, 
            this.twinIslands.position.z,
            showDebug
        );
    }
    
    /**
     * Handle collision with a single island
     * @param {BABYLON.Mesh} playerMesh - The player's mesh
     * @param {Object} velocity - The player's velocity object
     * @param {number} islandX - X position of the island
     * @param {number} islandZ - Z position of the island
     * @param {boolean} showDebug - Whether to show debug information
     */
    handleSingleIslandCollision(playerMesh, velocity, islandX, islandZ, showDebug = false) {
        // Calculate distance from player to island center (XZ plane only)
        const dx = playerMesh.position.x - islandX;
        const dz = playerMesh.position.z - islandZ;
        const distanceXZ = Math.sqrt(dx * dx + dz * dz);
        
        // Get player's height relative to water level
        const playerY = playerMesh.position.y;
        
        // Check if player is within island radius
        // For above water, use a smaller radius (just the top part)
        // For underwater, use the full island shape with smooth transition
        const isAboveWater = playerY > this.waterLevel;
        
        // Larger collision radius for more reliable detection
        const collisionRadius = isAboveWater ? 15 : 40;
        
        // Debug information
        if (showDebug) {
            console.log(`Island collision check: distance=${distanceXZ.toFixed(2)}, radius=${collisionRadius}, playerPos=(${playerMesh.position.x.toFixed(2)}, ${playerMesh.position.y.toFixed(2)}, ${playerMesh.position.z.toFixed(2)}), islandPos=(${islandX.toFixed(2)}, ${islandZ.toFixed(2)})`);
        }
        
        if (distanceXZ < collisionRadius) {
            // Calculate push direction (away from island center)
            const pushDirection = new BABYLON.Vector3(dx, 0, dz).normalize();
            
            // Apply push force - stronger above water
            const pushStrength = isAboveWater ? 0.6 : 0.4;
            velocity.x += pushDirection.x * pushStrength;
            velocity.z += pushDirection.z * pushStrength;
            
            // Add slight upward boost to help player move away
            velocity.y += 0.07;
            
            if (showDebug) {
                console.log(`Island collision detected! Applied push: (${(pushDirection.x * pushStrength).toFixed(2)}, ${(pushDirection.z * pushStrength).toFixed(2)})`);
            }
        }
    }

    /**
     * Creates a natural-looking rock
     * @param {string} name - Name for the rock mesh
     * @param {number} size - Base size of the rock
     * @param {BABYLON.Scene} scene - The scene to add the rock to
     * @returns {BABYLON.Mesh} - The created rock mesh
     */
    createRock(name, size, scene) {
        // Create a rock using a low-poly sphere with random vertex displacement
        const segments = 6; // Very low-poly for PSX look
        const rock = BABYLON.MeshBuilder.CreateSphere(name, {
            diameter: size,
            segments: segments
        }, scene);
        
        // Get the vertex data to modify it
        let vertexData = BABYLON.VertexData.ExtractFromMesh(rock);
        let positions = vertexData.positions;
        
        // Apply random displacement to each vertex
        for (let i = 0; i < positions.length; i += 3) {
            // Skip vertices at the bottom to keep it flat
            const y = positions[i + 1];
            if (y < -size/4) continue;
            
            // Apply random displacement
            const displacement = (Math.random() - 0.5) * size * 0.3;
            positions[i] += displacement; // x
            positions[i + 1] += displacement * 0.8; // y (less displacement)
            positions[i + 2] += displacement; // z
        }
        
        // Apply the modified vertex data back to the mesh
        vertexData.applyToMesh(rock);
        
        // Apply random scaling to make it look more natural
        const xScale = 0.8 + Math.random() * 0.4;
        const yScale = 0.6 + Math.random() * 0.4; // Flatter
        const zScale = 0.8 + Math.random() * 0.4;
        rock.scaling = new BABYLON.Vector3(xScale, yScale, zScale);
        
        // Create rock material
        const rockMaterial = new BABYLON.StandardMaterial(name + "Material", scene);
        
        // Random rock color with darker tint for rocks
        const colorVariation = Math.random() * 0.1;
        rockMaterial.diffuseColor = new BABYLON.Color3(
            0.3 + colorVariation,
            0.3 + colorVariation,
            0.3 + colorVariation
        );
        rockMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        
        // Use sand texture with different scaling for rocks
        rockMaterial.diffuseTexture = new BABYLON.Texture(
            "assets/textures/sand.png", 
            scene,
            false,
            false,
            BABYLON.Texture.NEAREST_SAMPLINGMODE
        );
        
        rockMaterial.diffuseTexture.uScale = 0.5;
        rockMaterial.diffuseTexture.vScale = 0.5;
        
        rock.material = rockMaterial;
        
        // Add collision properties
        rock.checkCollisions = true;
        rock.isPickable = true;
        
        // Create a proper bounding box for collision detection
        rock.computeWorldMatrix(true);
        rock.refreshBoundingInfo();
        
        // Add metadata for identification
        rock.metadata = {
            type: 'rock',
            size: size
        };
        
        return rock;
    }
    
    /**
     * Create rocks across the sea floor
     */
    createSeaFloorRocks() {
        try {
            console.log("Création des rochers sur le fond marin...");
            
            // Créer un maillage parent pour tous les rochers
            const rocksParent = new BABYLON.Mesh("seaFloorRocks", this.scene);
            
            // Paramètres pour la distribution des rochers
            const gridSize = 60; // Taille de chaque cellule de grille
            const rocksPerCell = 2; // Nombre de rochers par cellule de grille
            const maxRadius = this.maxReachableRadius || this.playAreaRadius * 2.5;
            const gridCells = Math.ceil(maxRadius * 2 / gridSize);
            
            // Créer des rochers selon un motif de grille
            for (let x = -gridCells/2; x < gridCells/2; x++) {
                for (let z = -gridCells/2; z < gridCells/2; z++) {
                    const cellX = x * gridSize;
                    const cellZ = z * gridSize;
                    
                    // Calculer la distance depuis le centre
                    const distanceFromCenter = Math.sqrt(cellX * cellX + cellZ * cellZ);
                    if (distanceFromCenter > maxRadius) continue;
                    
                    // Créer des rochers dans cette cellule
                    for (let i = 0; i < rocksPerCell; i++) {
                        // Position aléatoire dans la cellule
                        const rockX = cellX + (Math.random() - 0.5) * gridSize;
                        const rockZ = cellZ + (Math.random() - 0.5) * gridSize;
                        
                        // Ignorer si trop proche des îles
                        if (this.isTooCloseToIslands(rockX, rockZ)) continue;
                        
                        // Créer un rocher de taille aléatoire
                        const size = 5 + Math.random() * 10;
                        const rock = this.createRock("seaFloorRock", size, this.scene);
                        
                        // Positionner le rocher sur le fond marin
                        rock.position = new BABYLON.Vector3(
                            rockX,
                            -this.oceanDepth + size/4, // Partiellement encastré dans le fond marin
                            rockZ
                        );
                        
                        // Rotation aléatoire
                        rock.rotation.y = Math.random() * Math.PI * 2;
                        
                        // Faire du rocher un enfant du parent
                        rock.parent = rocksParent;
                    }
                }
            }
            
            // Stocker la référence aux rochers du fond marin
            this.seaFloorRocks = rocksParent;
            console.log("Rochers du fond marin créés avec succès");
        } catch (error) {
            console.error("Erreur lors de la création des rochers du fond marin:", error);
        }
    }
    
    /**
     * Check if a position is too close to any islands
     * @param {number} x - X coordinate to check
     * @param {number} z - Z coordinate to check
     * @returns {boolean} - True if too close to islands
     */
    isTooCloseToIslands(x, z) {
        const minDistanceFromIslands = 30;
        
        // Vérifier la distance par rapport à l'île de départ
        if (this.startIsland) {
            const dx = x - this.startIsland.position.x;
            const dz = z - this.startIsland.position.z;
            if (Math.sqrt(dx * dx + dz * dz) < minDistanceFromIslands) {
                return true;
            }
        }
        
        // Vérifier la distance par rapport aux îles jumelles
        if (this.twinIslands) {
            // Première île
            const dx1 = x - (this.twinIslands.position.x - 20);
            const dz1 = z - this.twinIslands.position.z;
            if (Math.sqrt(dx1 * dx1 + dz1 * dz1) < minDistanceFromIslands) {
                return true;
            }
            
            // Seconde île
            const dx2 = x - (this.twinIslands.position.x + 20);
            const dz2 = z - this.twinIslands.position.z;
            if (Math.sqrt(dx2 * dx2 + dz2 * dz2) < minDistanceFromIslands) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Ajouter des palmiers à une position spécifique
     */
    addPalmTreesToPosition(position, parentMesh) {
        const palmCount = 3;
        const palmHeight = 10;
        
        for (let i = 0; i < palmCount; i++) {
            const palmTree = BABYLON.MeshBuilder.CreatePlane("palm_" + i, {
                width: 8,
                height: 12
            }, this.scene);
            
            const palmMaterial = new BABYLON.StandardMaterial("palmMaterial_" + i, this.scene);
            palmMaterial.diffuseTexture = new BABYLON.Texture(
                "assets/textures/palm.png", 
                this.scene, 
                false, 
                false, 
                BABYLON.Texture.NEAREST_SAMPLINGMODE
            );
            palmMaterial.diffuseTexture.hasAlpha = true;
            palmMaterial.backFaceCulling = false;
            
            palmTree.material = palmMaterial;
            
            const angle = (i / palmCount) * Math.PI * 2;
            const radius = 2;
            
            palmTree.position = new BABYLON.Vector3(
                position.x + Math.sin(angle) * radius,
                position.y + palmHeight/2,
                position.z + Math.cos(angle) * radius
            );
            
            palmTree.rotation.z = Math.PI;
            palmTree.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
            
            palmTree.parent = parentMesh;
        }
    }

    /**
     * Gérer les collisions entre le joueur et les rochers
     * @param {BABYLON.Mesh} playerMesh - Le maillage du joueur
     * @param {Object} velocity - L'objet de vélocité du joueur
     * @param {boolean} showDebug - Afficher ou non les informations de débogage
     */
    handleRockCollisions(playerMesh, velocity, showDebug) {
        if (!this.seaFloorRocks || !playerMesh) return;
        
        // Obtenir tous les maillages de rochers
        const rockMeshes = this.seaFloorRocks.getChildMeshes();
        if (!rockMeshes || rockMeshes.length === 0) return;
        
        // Position du joueur
        const playerPosition = playerMesh.position.clone();
        
        // Vérifier chaque rocher pour une collision
        for (const rockMesh of rockMeshes) {
            if (!rockMesh || rockMesh.isDisposed()) continue;
            
            // Ignorer si le rocher n'a pas d'info de délimitation
            if (!rockMesh.getBoundingInfo) continue;
            
            // Mettre à jour la visualisation de débogage
            if (showDebug && rockMesh.showBoundingBox !== showDebug) {
                rockMesh.showBoundingBox = showDebug;
            }
            
            // Obtenir la position et la taille du rocher
            const rockPosition = rockMesh.getAbsolutePosition();
            const rockBoundingInfo = rockMesh.getBoundingInfo();
            
            // Utiliser un rayon de collision beaucoup plus petit (30% du rayon réel)
            const rockRadius = rockBoundingInfo.boundingSphere.radius * 0.3;
            
            // Calculer la distance entre le joueur et le rocher
            const dx = playerPosition.x - rockPosition.x;
            const dy = playerPosition.y - rockPosition.y;
            const dz = playerPosition.z - rockPosition.z;
            const distanceSquared = dx * dx + dy * dy + dz * dz;
            
            // Vérifier si le joueur est dans le rayon de collision
            if (distanceSquared < rockRadius * rockRadius) {
                // Calculer la direction de poussée (loin du centre du rocher)
                const pushDirection = new BABYLON.Vector3(dx, dy, dz).normalize();
                
                // Appliquer une force de poussée (puissance réduite)
                const pushStrength = 0.2;
                velocity.x += pushDirection.x * pushStrength;
                velocity.y += pushDirection.y * pushStrength * 0.5; // Moins de poussée verticale
                velocity.z += pushDirection.z * pushStrength;
                
                // Ajouter un léger élan vers le haut pour aider le joueur à s'éloigner
                velocity.y += 0.03;
                
                // Journaliser la collision pour le débogage
                if (showDebug) {
                    console.log("Collision avec un rocher détectée !");
                }
            }
        }
    }

    /**
     * Créer une surface d'eau (méthode de compatibilité)
     */
    createWaterSurface() {
        // Si cette méthode est appelée, créer simplement l'eau en utilisant notre méthode mise à jour
        if (!this.water) {
            console.log("Création de la surface d'eau avec une visibilité améliorée");
            this.createWater();
        } else {
            console.log("La surface d'eau existe déjà");
        }
    }

    /**
     * Créer une lumière au-dessus de la zone de jeu
     */
    createPlayAreaLight() {
        // Créer une lumière ponctuelle au-dessus de la zone de jeu
        this.playAreaLight = new BABYLON.PointLight(
            "playAreaLight",
            new BABYLON.Vector3(0, 50, 0), // Position élevée au-dessus du centre
            this.scene
        );
        
        // Configurer les propriétés de la lumière
        this.playAreaLight.intensity = 0.8;
        this.playAreaLight.diffuse = new BABYLON.Color3(1, 0.95, 0.8); // Lumière légèrement chaude (soleil)
        this.playAreaLight.specular = new BABYLON.Color3(0.9, 0.9, 1);
        
        // Configurer les propriétés d'atténuation pour un effet plus réaliste
        this.playAreaLight.range = this.playAreaRadius * 3; // Portée plus grande que la zone de jeu
        
        // Ajouter une ombre pour la lumière (désactivé par défaut pour les performances)
        if (this.scene.game?.worldSettings?.settings?.enableShadows) {
            const shadowGenerator = new BABYLON.ShadowGenerator(1024, this.playAreaLight);
            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.blurScale = 2;
            shadowGenerator.setDarkness(0.3);
            
            // Ajouter les maillages pertinents à la génération d'ombre
            if (this.startIsland) {
                shadowGenerator.addShadowCaster(this.startIsland);
            }
            if (this.twinIslands) {
                shadowGenerator.addShadowCaster(this.twinIslands);
            }
            
            // Stocker le générateur d'ombres pour référence future
            this.shadowGenerator = shadowGenerator;
        }
    }

    /**
     * Mettre à jour la lumière de la zone de jeu en fonction de la position du joueur
     * @param {BABYLON.Vector3} playerPosition - Position du joueur
     */
    updatePlayAreaLight(playerPosition) {
        if (this.playAreaLight && playerPosition) {
            // Limiter le déplacement de la lumière pour qu'elle suive le joueur mais reste élevée
            this.playAreaLight.position.x = playerPosition.x;
            this.playAreaLight.position.z = playerPosition.z;
            this.playAreaLight.position.y = 50; // Maintenir la hauteur constante
        }
    }

    /**
     * Vérifie si une position est proche des îles pour optimiser les tests de collision
     * @param {BABYLON.Vector3} position - La position à vérifier
     * @returns {boolean} - Vrai si la position est proche des îles
     */
    isNearIslands(position) {
        // Distance maximale pour les vérifications d'îles (optimisation)
        const maxDistance = 30;
        
        // Vérifier l'île de départ si elle existe
        if (this.startIsland && this.startIsland.position) {
            if (BABYLON.Vector3.Distance(position, this.startIsland.position) < maxDistance) {
                return true;
            }
        }
        
        // Vérifier les îles jumelles si elles existent
        if (this.twinIslands && this.twinIslands.position) {
            // Vérifier la distance au centre des îles jumelles
            const twinCenterDistance = BABYLON.Vector3.Distance(position, this.twinIslands.position);
            
            // Si proche du centre général des îles jumelles
            if (twinCenterDistance < maxDistance + 25) { // Ajout d'une marge pour tenir compte de la double île
                // Vérifier la distance à la première île
                const island1X = this.twinIslands.position.x - 20;
                const island1Z = this.twinIslands.position.z;
                const island1Pos = new BABYLON.Vector3(island1X, position.y, island1Z);
                
                if (BABYLON.Vector3.Distance(position, island1Pos) < maxDistance) {
                    return true;
                }
                
                // Vérifier la distance à la deuxième île
                const island2X = this.twinIslands.position.x + 20;
                const island2Z = this.twinIslands.position.z;
                const island2Pos = new BABYLON.Vector3(island2X, position.y, island2Z);
                
                if (BABYLON.Vector3.Distance(position, island2Pos) < maxDistance) {
                    return true;
                }
            }
        }
        
        // Pas près d'une île
        return false;
    }
} 