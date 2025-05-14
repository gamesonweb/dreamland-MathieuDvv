/**
 * Classe principale du jeu pour initialiser et exécuter le jeu
 */
class Game {
    constructor() {
        // Initialiser les propriétés du jeu
        this.canvas = null;
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.light = null;
        this.player = null;
        this.environment = null;
        this.ui = null;
        this.inputManager = null;
        this.seaCreatures = null;
        this.assetsLoaded = false;
        this.lastFrameTime = 0;
        this.initialLoadingText = null;
        this.musicPlayer = null;
        this.score = 0;
        this.underwaterIntensity = 0.0;
        this._hasLoggedLargeMeshes = false;
        this._frameCounter = 0;
        this.isPaused = false;
        
        // Initialiser le jeu
        this.initialize();
    }
    
    /**
     * Initialiser le jeu
     */
    initialize() {
        console.log("Initialisation du jeu...");
        
        try {
            // Créer l'élément de texte de chargement avant tout
            this.createInitialLoadingText();
            
            // Créer le canvas
            this.canvas = document.getElementById("renderCanvas");
            if (!this.canvas) {
                console.error("Canvas avec id 'renderCanvas' non trouvé, création d'un nouveau");
                this.canvas = document.createElement("canvas");
                this.canvas.id = "renderCanvas";
                document.body.appendChild(this.canvas);
            }
            console.log("Canvas trouvé/créé:", this.canvas);
            
            // Créer le moteur
            try {
                this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
                console.log("Moteur créé avec succès");
            } catch (engineError) {
                console.error("Échec de création du moteur:", engineError);
                alert("Échec de création du moteur Babylon.js. Veuillez vérifier la compatibilité de votre navigateur.");
                return;
            }
            
            // Créer la scène
            try {
                this.createScene();
                console.log("Scène créée avec succès:", this.scene);
            } catch (sceneError) {
                console.error("Échec de création de la scène:", sceneError);
                return;
            }
            
            // Créer l'interface utilisateur
            try {
                this.ui = new UIManager(this.scene);
                this.scene.game = this; // Ajouter une référence au jeu dans la scène
                this.ui.game = this; // Ajouter une référence au jeu dans le gestionnaire d'UI
                this.ui.showLoadingScreen("Chargement des ressources du jeu...");
                console.log("Interface utilisateur initialisée avec succès");
            } catch (uiError) {
                console.error("Échec de création de l'interface utilisateur:", uiError);
                // Continuer sans interface utilisateur
            }
            
            // Suivre le temps pour le calcul de deltaTime
            this.lastFrameTime = Date.now();
            
            // Démarrer la boucle de rendu (une seule fois)
            console.log("Démarrage de la boucle de rendu...");
            let assetsLoadedLogged = false;
            this.engine.runRenderLoop(() => {
                try {
                    if (this.scene) {
                        // Calculer deltaTime en secondes
                        const currentTime = Date.now();
                        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
                        this.lastFrameTime = currentTime;
                        
                        // Mettre à jour la logique du jeu seulement si les ressources sont chargées et le joueur existe
                        if (this.assetsLoaded) {
                            if (!assetsLoadedLogged) {
                                console.log("Ressources chargées, mise à jour du jeu...");
                                assetsLoadedLogged = true;
                            }
                            if (this.player) {
                                this.update(deltaTime);
                            } else {
                                if (!assetsLoadedLogged) {
                                    console.warn("Joueur pas encore créé, ignorer la mise à jour");
                                }
                            }
                        }
                        
                        // Toujours rendre la scène
                        this.scene.render();
                    } else {
                        console.warn("Scène non disponible pour le rendu");
                    }
                } catch (renderError) {
                    console.error("Erreur dans la boucle de rendu:", renderError);
                    // Continuer le rendu même s'il y a une erreur
                }
            });
            console.log("Boucle de rendu démarrée");
            
            // Gérer le redimensionnement de la fenêtre
            window.addEventListener("resize", () => {
                this.engine.resize();
            });
            
            // Gérer la visibilité du document
            document.addEventListener("visibilitychange", () => {
                if (document.hidden) {
                    this.pauseGame();
                } else {
                    this.resumeGame();
                }
            });
            
            // Charger les ressources
            console.log("Démarrage du chargement des ressources...");
            this.loadAssetsAsync()
                .then(() => {
                    console.log("Ressources chargées avec succès");
                    this.startGame();
                })
                .catch(error => {
                    console.error("Erreur lors du chargement des ressources:", error);
                    // Afficher l'erreur dans l'interface utilisateur
                    alert("Échec du chargement des ressources du jeu. Veuillez rafraîchir la page et réessayer.");
                });
                
        } catch (error) {
            console.error("Erreur fatale pendant l'initialisation du jeu:", error);
            alert("Une erreur est survenue pendant l'initialisation du jeu. Veuillez rafraîchir la page et réessayer.");
        }
    }
    
    /**
     * Créer le texte de chargement initial avant l'initialisation des éléments du jeu
     */
    createInitialLoadingText() {
        // Créer un div simple pour afficher la progression du chargement
        const loadingDiv = document.createElement("div");
        loadingDiv.id = "initialLoadingText";
        loadingDiv.style.position = "absolute";
        loadingDiv.style.top = "50%";
        loadingDiv.style.left = "50%";
        loadingDiv.style.transform = "translate(-50%, -50%)";
        loadingDiv.style.color = "white";
        loadingDiv.style.fontFamily = "Arial, sans-serif";
        loadingDiv.style.fontSize = "36px"; // Taille de police augmentée
        loadingDiv.style.fontWeight = "bold"; // Texte en gras
        loadingDiv.style.textAlign = "center";
        loadingDiv.style.zIndex = "1000";
        loadingDiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)"; // Fond semi-transparent
        loadingDiv.style.padding = "20px 40px"; // Ajout de marge intérieure
        loadingDiv.style.borderRadius = "10px"; // Coins arrondis
        loadingDiv.style.boxShadow = "0 0 20px rgba(0, 0, 255, 0.5)"; // Effet de lueur
        loadingDiv.innerHTML = "Chargement du jeu: 0%";
        
        // Ajouter au document
        document.body.appendChild(loadingDiv);
        
        // Définir la couleur de fond en noir pour rendre le texte plus visible
        document.body.style.backgroundColor = "black";
        
        // Stocker la référence
        this.initialLoadingText = loadingDiv;
    }
    
    /**
     * Mettre à jour le texte de chargement initial
     * @param {number} progress - Valeur de progression (0-1)
     */
    updateInitialLoadingText(progress) {
        if (this.initialLoadingText) {
            const percentage = Math.floor(progress * 100);
            this.initialLoadingText.innerHTML = `Chargement du jeu: ${percentage}%`;
        }
    }
    
    /**
     * Charger les ressources de manière asynchrone
     * @returns {Promise} Promesse résolue lorsque les ressources sont chargées
     */
    loadAssetsAsync() {
        return new Promise((resolve, reject) => {
            let progress = 0;
            const assetCount = 10; // Nombre d'étapes augmenté pour une progression plus fluide
            
            // Fonction pour mettre à jour la progression
            const updateProgress = (increment) => {
                progress += increment;
                const progressValue = progress / assetCount;
                
                // Mettre à jour les deux indicateurs de chargement
                this.updateInitialLoadingText(progressValue);
                if (this.ui) {
                    this.ui.updateLoadingProgress(progressValue);
                }
                
                // Afficher un conseil aléatoire pendant le chargement
                if (this.worldSettings) {
                    const tooltip = this.worldSettings.getRandomTooltip();
                    if (this.ui && this.ui.tooltipText) {
                        this.ui.tooltipText.text = tooltip;
                    }
                }
                
                console.log(`Progression du chargement: ${Math.floor(progressValue * 100)}%`);
            };
            
            // S'assurer que l'écran de chargement est visible
            if (this.ui) {
            this.ui.loadingScreen.isVisible = true;
            }
            
            // Utiliser des incréments plus petits pour des mises à jour plus fréquentes
            const loadStep = () => {
                if (progress >= assetCount) {
                    // Ne pas supprimer le texte de chargement initial tout de suite - sera supprimé après le démarrage du jeu
                                resolve();
                    return;
                }
                
                updateProgress(1);
                setTimeout(loadStep, 300); // Délai plus court pour des mises à jour plus fréquentes
            };
            
            // Démarrer le processus de chargement
            loadStep();
        });
    }
    
    /**
     * Démarrer le jeu après le chargement des ressources
     */
    startGame() {
        console.log("Démarrage du jeu...");
        
        try {
            // Initialiser le Time Tracker avec l'ID du jeu
            if (window.initGameTracker) {
                window.initGameTracker('tidle');
                console.log("Time Tracker initialisé pour le jeu Tidle");
            }
            
            // Supprimer le texte de chargement initial
            if (this.initialLoadingText) {
                document.body.removeChild(this.initialLoadingText);
                this.initialLoadingText = null;
            }
            
            // Masquer l'écran de chargement
            if (this.ui) {
                this.ui.hideLoadingScreen();
            }
            
            // Créer l'environnement
            this.environment = new Environment(this.scene);
            this.environment.createUnderwater();
            console.log("Environnement créé avec succès");
            
            // Créer l'île de départ
            this.environment.createStartIsland();
            console.log("Île de départ créée avec succès");
            
            // Créer les îles jumelles
            this.environment.createTwinIslands();
            console.log("Îles jumelles créées avec succès");
            
            // Créer le joueur
            this.player = new Player(this.scene, this.environment);
            console.log("Joueur créé avec succès");
            
            // Créer le gestionnaire d'entrées
            this.inputManager = new InputManager(this);
            console.log("Gestionnaire d'entrées créé avec succès");
            
            // Initialiser les paramètres du monde et le score
            this.worldSettings = this.createWorldSettings();
            this.worldSettings.game = this; // Ajouter une référence au jeu dans les paramètres du monde
            console.log("Paramètres du monde créés avec succès");

            // Créer un alias worldManager qui pointe vers worldSettings pour la compatibilité
            this.worldManager = this.worldSettings;
            
            // Initialiser le système de gates
            if (this.worldSettings.settings.hasGates) {
                try {
                    console.log("Initialisation du système de gates...");
                    this.gates = new GateManager(this);
                    console.log("Système de gates initialisé avec succès");
                } catch (error) {
                    console.error("Erreur lors de l'initialisation des gates:", error);
                    // Désactiver les gates en cas d'erreur pour éviter de bloquer le jeu
                    this.worldSettings.settings.hasGates = false;
                }
            }
            
            // Créer les créatures marines
            this.seaCreatures = new SeaCreatures(this.scene, this.environment);
            console.log("Instance des créatures marines créée");

            // Créer les bancs de poissons et les mouettes
            this.seaCreatures.createFishSchoolsWithInstances();
            this.seaCreatures.createSeagulls();
            
            // Créer le lecteur de musique
            this.initializeMusicPlayer();
            
            // Créer le menu BeachTV
            try {
                this.beachTVMenu = new BeachTVMenu(this.scene, this);
                console.log("Menu BeachTV créé avec succès");
            } catch (menuError) {
                console.error("Échec de création du menu BeachTV:", menuError);
            }
            
            // Mettre à jour l'interface utilisateur avec la référence au joueur
            if (this.ui) {
                this.ui.setPlayer(this.player);
                
                // Initialiser le score à 0
                this.ui.updateScore(0);
            }
            
            // Connecter le joueur à l'interface utilisateur pour les notifications de figures
            if (this.player) {
                this.player.setUIManager(this.ui);
            }
            
            // Définir le drapeau de ressources chargées
            this.assetsLoaded = true;
            
            // Nettoyer les éléments de limite sous-marine
            if (this.environment) {
                console.log("Nettoyage des éléments de limite sous-marine");
                this.environment.clearUnderwaterBoundary();
            }
            
            // Créer les gates si activées
            if (this.worldSettings.settings.hasGates && this.gates) {
                console.log("Création des gates...");
                this.gates.createGates();
            }
            
            console.log("Jeu démarré avec succès");
        } catch (error) {
            console.error("Erreur lors du démarrage du jeu:", error);
            alert("Une erreur est survenue lors du démarrage du jeu. Veuillez rafraîchir la page et réessayer.");
        }
    }
    
    /**
     * Créer la scène
     */
    createScene() {
        // Créer un objet Scene BabylonJS basique
        this.scene = new BABYLON.Scene(this.engine);
        
        // Attacher l'objet jeu à la scène pour un accès facile
        this.scene.game = this;
        
        // Définir une couleur bleu ciel plus claire pour l'arrière-plan
        this.scene.clearColor = new BABYLON.Color4(0.7, 0.85, 1.0, 1);
        
        // Créer et positionner une caméra libre
        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 5, -10), this.scene);
        
        // Créer une lumière hémisphérique plus lumineuse
        this.light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.light.intensity = 1.2; // Augmenté par rapport à la valeur par défaut 1.0
        this.light.diffuse = new BABYLON.Color3(1, 1, 1);
        this.light.specular = new BABYLON.Color3(1, 1, 1);
        
        // Ajouter une lumière directionnelle pour un meilleur éclairage
        this.directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-0.5, -1, -0.5), this.scene);
        this.directionalLight.intensity = 0.7;
        this.directionalLight.diffuse = new BABYLON.Color3(1, 1, 0.9);
        
        // Initialiser l'Inspecteur (il ne s'affichera pas avant d'être activé)
        if (BABYLON.Inspector) {
            this.scene.debugLayer._bootstrapOptions = {};
        }
    }
    
    /**
     * Créer un effet de post-traitement sous-marin (simplifié sans shaders WebGL)
     */
    createUnderwaterEffect() {
        console.log("Configuration de l'effet sous-marin simplifié...");
        // Créer un effet sous-marin simple sans shaders personnalisés
        // Cette méthode est intentionnellement vide pour éviter les erreurs WebGL
    }
    
    /**
     * Créer un effet de post-traitement de lignes de balayage (simplifié sans shaders WebGL)
     */
    createScanlinesEffect() {
        console.log("Configuration de l'effet de lignes de balayage simplifié...");
        // Créer un effet de lignes de balayage simple sans shaders personnalisés
        // Cette méthode est intentionnellement vide pour éviter les erreurs WebGL
    }
    
    /**
     * Mettre à jour la logique du jeu
     * @param {number} deltaTime - Temps écoulé depuis la dernière image en secondes
     */
    update(deltaTime) {
        // Mettre à jour le joueur seulement s'il existe
        if (this.player) {
            this.player.update(deltaTime);
            
            // Simplified underwater effect without post-processing
            this.underwaterIntensity = this.player.isUnderwater ? 1.0 : 0.0;
            
            // Handle island collisions - optimization: only if player is near islands
            if (this.environment && this.environment.startIsland && this.environment.isNearIslands(this.player.mesh.position)) {
                const showDebug = false; // Désactiver les hitboxes de débogage pour améliorer les performances
                this.environment.handleStartIslandCollision(this.player.mesh, this.player.velocity, showDebug);
                
                // Handle twin islands collisions if they exist and player is near
                if (this.environment.twinIslands) {
                    this.environment.handleTwinIslandsCollision(this.player.mesh, this.player.velocity, showDebug);
                }
            }
            
            // Handle rock collisions only if player is underwater and below a certain depth
            if (this.environment && this.environment.seaFloorRocks && 
                this.player.isUnderwater && this.player.mesh.position.y < -8) {
                this.environment.handleRockCollisions(this.player.mesh, this.player.velocity, false);
            }
        }
        
        // Update environment if it exists
        if (this.environment) {
            this.environment.animateSeaLevel();
            
            // Update boundary visibility and light position based on player position
            if (this.player && this.player.mesh) {
                this.environment.updateBoundaryVisibility(this.player.mesh.position);
                this.environment.updatePlayAreaLight(this.player.mesh.position);
                
                // Check BeachTV interaction only if player is near the TV
                if (this.inputManager && this.environment.beachTV && 
                    BABYLON.Vector3.Distance(this.player.mesh.position, this.environment.beachTV.position) < 15) {
                    this.environment.checkBeachTVInteraction(
                        this.player.mesh,
                        this.inputManager.keys,
                        this.ui
                    );
                }
            }
        }
        
        // Update gates system - but only every other frame to improve performance
        if (this.gates && this.worldSettings.settings.hasGates && 
            this._frameCounter % 2 === 0) { // Only update every other frame
            this.gates.update();
        }
        
        // Update sea creatures but with reduced frequency
        if (this.seaCreatures && this._frameCounter % 3 === 0) { // Only update every third frame
            this.seaCreatures.update(deltaTime);
        }
        
        // Increment frame counter for optimizations
        this._frameCounter = (this._frameCounter || 0) + 1;
    }
    
    /**
     * Initialize the music player
     */
    initializeMusicPlayer() {
        try {
            console.log("Creating music player...");
            this.musicPlayer = new MusicPlayer(this.scene, this.ui);
            
            // Load and start the playlist
            this.musicPlayer.loadPlaylist();
            
            // Ensure volume is set to a default value (not muted)
            this.musicPlayer.setVolume(0.5);
            
            // Initialize ambient sounds
            this.initializeAmbientSounds();
            
            console.log("Music player initialized successfully");
        } catch (error) {
            console.warn("Could not initialize music player:", error);
            // Still try to initialize ambient sounds
            this.initializeAmbientSounds();
        }
    }
    
    /**
     * Initialize ambient sounds
     */
    initializeAmbientSounds() {
        try {
            console.log("Initializing ambient sounds...");
            
            // Create ambient ocean sound
            this.ambientSound = new BABYLON.Sound(
                "ambient",
                "assets/Sounds/Ambiance.wav",
                this.scene,
                () => {
                    this.ambientSound.play();
                    this.ambientSound.setVolume(this.musicPlayer ? this.musicPlayer.volume * 0.3 : 0.15);
                    this.ambientSound.loop = true;
                },
                { spatialSound: false }
            );
            
            // Create wave sounds for the start island
            this.wavesSounds = [];
            const wavesFiles = ["Wave1.wav", "Wave2.wav", "Wave3.wav", "Wave4.wav"];
            
            wavesFiles.forEach(file => {
                const waveSound = new BABYLON.Sound(
                    `wave_${file}`,
                    `assets/Sounds/Waves/${file}`,
                    this.scene,
                    null,
                    {
                        spatialSound: true,
                        distanceModel: "exponential",
                        rolloffFactor: 2,
                        maxDistance: 50
                    }
                );
                this.wavesSounds.push(waveSound);
            });
            
            // Set up wave sounds interval
            this.setupWaveSoundsInterval();
            
            console.log("Ambient sounds initialized successfully");
        } catch (error) {
            console.warn("Could not initialize ambient sounds:", error);
        }
    }
    
    /**
     * Set up wave sounds interval
     */
    setupWaveSoundsInterval() {
        if (!this.wavesSounds || !this.wavesSounds.length) return;
        
        // Play wave sounds at random intervals
        setInterval(() => {
            if (this.environment && this.environment.startIsland) {
                // Get a random wave sound
                const randomWave = this.wavesSounds[Math.floor(Math.random() * this.wavesSounds.length)];
                
                // Get a random position around the start island
                const angle = Math.random() * Math.PI * 2;
                const radius = 10 + Math.random() * 10; // Random radius between 10 and 20 units
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                
                // Set the position of the wave sound
                randomWave.setPosition(new BABYLON.Vector3(x, 0, z));
                
                // Play the sound
                randomWave.play();
            }
        }, 5000 + Math.random() * 5000); // Random interval between 5-10 seconds
    }
    
    /**
     * Create world settings - simplified
     */
    createWorldSettings() {
        const worldSettings = {
            // Game settings
            settings: {
                playAreaRadius: 100,
                waterColor: new BABYLON.Color3(0.0, 0.6, 0.9),
                skyColor: new BABYLON.Color3(0.7, 0.85, 1.0),
                weedColor: new BABYLON.Color3(0.2, 0.8, 0.2),
                hasWhale: true,
                hasGates: true,
                hasSeagulls: true,
                islandCount: 8,
                gateSpacing: 40,
                baseRadius: 50, // Base play area radius
                radiusIncrements: [0, 25, 50, 75], // Additional radius for each extension
                gateConfig: {
                    surfaceHeight: 5, // Height above water
                    underwaterHeight: -8, // Depth underwater
                    gatesPerRing: 12, // Number of gates in each ring
                    gateScale: new BABYLON.Vector3(1.2, 1.2, 1.2)
                }
            },
            
            // Score tracking
            score: 0,
            
            // Get current play area radius
            getPlayAreaRadius: function() {
                return this.settings.playAreaRadius;
            },
            
            // Set play area radius
            setPlayAreaRadius: function(radius) {
                this.settings.playAreaRadius = radius;
            },
            
            // Add score points (replacement for WorldManager's addScore)
            addScore: function(points, type = 'default', showPoints = false) {
                this.score += points;
                console.log(`Score ${points} points added (${type}). Total: ${this.score}`);
                
                // Update the UI to display the new score
                if (this.game && this.game.ui) {
                    this.game.ui.updateScore(this.score);
                }
                
                return this.score;
            },
            
            // Get current score (replacement for WorldManager's getScore)
            getScore: function() {
                return this.score;
            },
            
            // Create gates in the world
            createGates: function() { 
                // Redirect to the real gate creation if available
                if (this.game && this.game.gates) {
                    return this.game.gates.createGates();
                }
                
                console.log("Gates creation attempted, but gate system not initialized"); 
                return null; 
            },
            
            // Dummy functions to prevent errors from calls to WorldManager's methods
            createObstacles: function() { 
                console.log("Obstacles feature is disabled"); 
                return null; 
            },
            
            clearObstacles: function() { 
                console.log("No obstacles to clear"); 
                return null; 
            },
            
            clear: function() { 
                console.log("WorldManager clear function called (no-op)"); 
                return null; 
            },
            
            update: function() {
                // No-op function
                return null;
            },
            
            // Get random tooltip
            getRandomTooltip: function() {
                const tooltips = [
                    "Swim through gates to score points!",
                    "Press SPACE to jump out of the water!",
                    "Explore the ocean to find secrets!",
                    "Try to find the friendly whale!"
                ];
                return tooltips[Math.floor(Math.random() * tooltips.length)];
            }
        };
        
        return worldSettings;
    }
    
    /**
     * Apply performance settings based on world settings
     */
    applyPerformanceSettings() {
        // Apply performance settings based on quality level
        const quality = this.worldSettings.quality;
        
        // Engine settings
        this.engine.setHardwareScalingLevel(quality === 'low' ? 1.5 : 1.0);
        
        // Scene settings
        this.scene.particlesEnabled = quality !== 'low';
        this.scene.postProcessesEnabled = quality !== 'low';
        this.scene.shadowsEnabled = quality === 'high';
        
        // Reduce draw calls by freezing static meshes
        if (this.environment) {
            // Freeze water and sky meshes
            if (this.environment.water) {
                this.environment.water.freezeWorldMatrix();
            }
            if (this.environment.skybox) {
                this.environment.skybox.freezeWorldMatrix();
            }
            if (this.environment.oceanFloor) {
                this.environment.oceanFloor.freezeWorldMatrix();
            }
        }
        
        // Optimize physics
        this.scene.getPhysicsEngine()?.setTimeStep(1/30); // Lower physics timestep
        
        // Optimize rendering
        this.scene.skipFrustumClipping = true;
        this.scene.skipPointerMovePicking = true;
        this.scene.skipPointerDownPicking = true;
        this.scene.skipPointerUpPicking = true;
        
        // Optimize textures
        this.scene.textures.forEach(texture => {
            if (texture.anisotropicFilteringLevel) {
                texture.anisotropicFilteringLevel = quality === 'high' ? 4 : 1;
            }
        });
        
        console.log(`Applied ${quality} performance settings`);
    }
    
    /**
     * Mettre le jeu en pause
     */
    pauseGame() {
        console.log("Jeu en pause");
        this.isPaused = true;
        
        // Set game paused flag in UI
        if (this.ui) {
            this.ui.isGamePaused = true;
        }
        
        // Suspendre la musique et les sons ambiants si nécessaire
        if (this.musicPlayer) this.musicPlayer.pause();
        
        // Pause le Time Tracker
        if (window.timeTracker && window.timeTracker.pauseTracking) {
            window.timeTracker.pauseTracking();
        }
    }
    
    /**
     * Reprendre le jeu
     */
    resumeGame() {
        console.log("Reprise du jeu");
        this.isPaused = false;
        
        // Clear game paused flag in UI
        if (this.ui) {
            this.ui.isGamePaused = false;
        }
        
        // Reprendre la musique et les sons ambiants si nécessaire
        if (this.musicPlayer) this.musicPlayer.play();
        
        // Reprend le Time Tracker
        if (window.timeTracker && window.timeTracker.resumeTracking) {
            window.timeTracker.resumeTracking();
        }
    }
}

// Create game instance when the page loads
window.addEventListener("DOMContentLoaded", () => {
    new Game();
}); 