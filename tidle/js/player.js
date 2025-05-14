/**
 * Classe Player qui gère le personnage du dauphin dans le jeu.
 * 
 * Cette classe gère :
 * - Le mouvement et la physique du joueur (nage, sauts, accélération)
 * - Les contrôles de caméra et les effets visuels
 * - La détection des figures et le système de score
 * - Les éléments d'interface utilisateur liés au joueur
 * 
 * Le joueur se comporte différemment sous l'eau et au-dessus de l'eau,
 * avec une physique spéciale lors du franchissement de la surface de l'eau.
 * L'accélération ne fonctionne que sous l'eau, et la seule façon de monter
 * est d'accélérer dans l'eau et d'émerger à la surface.
 */
class Player {
    constructor(scene, environment) {
        this.scene = scene;
        this.environment = environment;
        this.mesh = null;
        this.camera = null;
        this.input = {
            forward: 0,
            turn: 0,
            boost: false,
            prevBoost: false // Suivre l'état précédent de l'accélération
        };
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.rotation = new BABYLON.Vector3(0, 0, 0);
        this.isUnderwater = true;
        this.wasUnderwater = true; // Suivre l'état précédent sous l'eau
        this.waterSplashParticles = null; // Système de particules pour les éclaboussures d'eau
        this.cameraMode = "fixed"; // Mode de caméra par défaut : fixed, follow, top
        
        // Système de figures
        this.tricks = {
            inAir: false,
            startTime: 0,
            airTime: 0,
            startRotation: new BABYLON.Vector3(0, 0, 0),
            rotationDelta: new BABYLON.Vector3(0, 0, 0)
        };
        
        // Créer le maillage du dauphin
        this.createMesh();
        
        // Créer le notificateur de figures
        try {
            this.trickNotifier = new TrickNotifier(scene);
            console.log("Notificateur de figures créé:", this.trickNotifier);
        } catch (error) {
            console.error("Échec de création du notificateur de figures:", error);
            // Continuer sans notificateur de figures
        }
        
        // Créer les particules d'éclaboussures d'eau
        try {
            this.createWaterSplashParticles();
        } catch (error) {
            console.error("Échec de création des particules d'éclaboussures d'eau:", error);
            // Continuer sans particules d'éclaboussures d'eau
        }
        
        // Enregistrer la boucle de rendu
        scene.registerBeforeRender(() => {
            this.update();
        });
    }
    
    /**
     * Créer le maillage du joueur et la caméra
     */
    createMesh() {
        console.log("Création du maillage du joueur...");
        
        // Créer un maillage parent pour le dauphin
        this.mesh = new BABYLON.Mesh("dolphinParent", this.scene);
        
        // Définir la position initiale sous l'eau
        this.mesh.position = new BABYLON.Vector3(0, -10, 0);
        
        // Créer la caméra d'abord pour avoir quelque chose à voir même si le chargement du modèle échoue
        this.createCamera();
        
        // Charger le modèle de dauphin
        try {
            console.log("Chargement du modèle de dauphin...");
            BABYLON.SceneLoader.ImportMeshAsync("", "assets/Models/", "Player.glb", this.scene).then((result) => {
                try {
                    // Obtenir la racine du modèle chargé
                    const importedMeshes = result.meshes;
                    
                    // Trouver le nœud racine (habituellement le premier)
                    if (importedMeshes.length > 0) {
                        const rootNode = importedMeshes[0];
                        
                        // Faire du nœud racine un enfant de notre maillage parent
                        rootNode.parent = this.mesh;
                        
                        // Appliquer une rotation de 180 degrés au nœud racine pour faire face vers l'avant
                        rootNode.rotate(BABYLON.Axis.Y, Math.PI+1.5, BABYLON.Space.LOCAL);
                        
                        // Mettre à l'échelle le modèle de manière appropriée
                        this.mesh.scaling = new BABYLON.Vector3(4, 4, 4);
                        
                        console.log("Modèle de dauphin chargé avec succès");
                    } else {
                        console.error("Aucun maillage trouvé dans le modèle chargé");
                        this.createFallbackMesh();
                    }
                } catch (error) {
                    console.error("Erreur lors du traitement du modèle de dauphin chargé:", error);
                    this.createFallbackMesh();
                }
            }).catch((error) => {
                console.error("Erreur lors du chargement du modèle de dauphin:", error);
                
                // Recours à un maillage simple si le chargement du modèle échoue
                this.createFallbackMesh();
            });
        } catch (error) {
            console.error("Erreur lors de l'initiation du chargement du modèle de dauphin:", error);
            this.createFallbackMesh();
        }
    }
    
    /**
     * Créer un maillage de secours si le modèle ne parvient pas à se charger
     */
    createFallbackMesh() {
        console.log("Création d'un maillage de dauphin de secours");
        
        try {
            // Créer un maillage simple de type dauphin
            const capsule = BABYLON.MeshBuilder.CreateCapsule(
                "playerCapsule",
                { radius: 1, height: 4, orientation: BABYLON.Vector3.Forward() },
                this.scene
            );
            
            // Parenter la capsule à notre maillage parent
            capsule.parent = this.mesh;
            
            // Créer un matériau pour le joueur
            const playerMaterial = new BABYLON.StandardMaterial("playerMaterial", this.scene);
            playerMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.7, 0.9);
            playerMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            
            capsule.material = playerMaterial;
            
            // Créer un nez (petite boîte) à l'avant du joueur
            const nose = BABYLON.MeshBuilder.CreateBox(
                "playerNose",
                { width: 0.5, height: 0.5, depth: 0.5 },
                this.scene
            );
            
            // Positionner le nez à l'avant du joueur
            nose.position = new BABYLON.Vector3(0, 0, 2.5);
            
            // Créer un matériau pour le nez
            const noseMaterial = new BABYLON.StandardMaterial("noseMaterial", this.scene);
            noseMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.3, 0.5);
            
            nose.material = noseMaterial;
            
            // Parenter le nez à la capsule
            nose.parent = capsule;
            
            console.log("Maillage de secours créé avec succès");
        } catch (error) {
            console.error("Échec de création du maillage de secours:", error);
        }
    }
    
    /**
     * Créer la caméra
     */
    createCamera() {
        // Créer une caméra de suivi pour sous l'eau
        this.followCamera = new BABYLON.FollowCamera("followCamera", 
            new BABYLON.Vector3(0, 0, -25),
            this.scene
        );
        
        // Définir les paramètres de la caméra de suivi
        this.followCamera.radius = 25;
        this.followCamera.heightOffset = 3;
        this.followCamera.rotationOffset = 180;
        this.followCamera.cameraAcceleration = 0.05;
        this.followCamera.maxCameraSpeed = 10;
        this.followCamera.lockedTarget = this.mesh;
        
        // Caméra aérienne pour au-dessus de l'eau
        this.aerialCamera = new BABYLON.ArcRotateCamera(
            "aerialCamera",
            -Math.PI / 2,
            Math.PI / 3,
            80,
            new BABYLON.Vector3(0, 0, 0),
            this.scene
        );
        
        // Désactiver le contrôle utilisateur de la caméra aérienne
        this.aerialCamera.inputs.clear();
        
        // Définir la caméra de suivi comme active initialement
        this.scene.activeCamera = this.followCamera;
    }
    
    /**
     * Créer des particules d'éclaboussures d'eau pour l'entrée/sortie de l'eau
     */
    createWaterSplashParticles() {
        // Créer le système de particules
        this.waterSplashParticles = new BABYLON.ParticleSystem("waterSplash", 2000, this.scene);
        
        // Générer la texture de particule par programmation
        const particleTextureUrl = window.createWaterParticleTexture();
        
        // Définir la texture des particules
        this.waterSplashParticles.particleTexture = new BABYLON.Texture(particleTextureUrl, this.scene);
        
        // Définir l'émetteur à la position du joueur (sera mis à jour en temps réel)
        this.waterSplashParticles.emitter = this.mesh;
        this.waterSplashParticles.minEmitBox = new BABYLON.Vector3(-1, 0, -1);
        this.waterSplashParticles.maxEmitBox = new BABYLON.Vector3(1, 0, 1);
        
        // Définir les couleurs des particules
        this.waterSplashParticles.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
        this.waterSplashParticles.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
        
        // Définir les tailles et durées de vie des particules
        this.waterSplashParticles.minSize = 0.1;
        this.waterSplashParticles.maxSize = 0.5;
        this.waterSplashParticles.minLifeTime = 0.5;
        this.waterSplashParticles.maxLifeTime = 1.5;
        
        // Définir le taux d'émission et la puissance
        this.waterSplashParticles.emitRate = 500;
        this.waterSplashParticles.minEmitPower = 1;
        this.waterSplashParticles.maxEmitPower = 3;
        this.waterSplashParticles.updateSpeed = 0.01;
        
        // Définir la gravité
        this.waterSplashParticles.gravity = new BABYLON.Vector3(0, -9.81, 0);
        
        // Ne pas commencer l'émission tout de suite
        this.waterSplashParticles.stop();
    }
    
    /**
     * Créer un effet d'éclaboussure d'eau lors de l'entrée/sortie de l'eau
     * @param {boolean} isEntering - Vrai si entrée dans l'eau, faux si sortie
     */
    createWaterSplash(isEntering) {
        // Ignorer si l'environnement n'est pas disponible
        if (!this.environment) return;
        
        // Définir la position de l'émetteur au niveau de l'eau
        const splashPosition = this.mesh.position.clone();
        splashPosition.y = this.environment.waterLevel || 0;
        this.waterSplashParticles.emitter = splashPosition;
        
        // Définir la direction en fonction de l'entrée ou de la sortie
        if (isEntering) {
            // Éclaboussure vers le haut lors de l'entrée dans l'eau
            this.waterSplashParticles.direction1 = new BABYLON.Vector3(-2, 5, -2);
            this.waterSplashParticles.direction2 = new BABYLON.Vector3(2, 10, 2);
            
            // Ajuster les propriétés des particules pour l'entrée dans l'eau
            this.waterSplashParticles.minEmitPower = 1;
            this.waterSplashParticles.maxEmitPower = 5;
            
            // Plus de particules pour les impacts à haute vitesse
            const impactSpeed = Math.abs(this.velocity.y);
            this.waterSplashParticles.emitRate = 300 + impactSpeed * 200;
        } else {
            // Éclaboussure dans toutes les directions lors de la sortie de l'eau
            this.waterSplashParticles.direction1 = new BABYLON.Vector3(-3, 1, -3);
            this.waterSplashParticles.direction2 = new BABYLON.Vector3(3, 8, 3);
            
            // Ajuster les propriétés des particules pour la sortie de l'eau
            this.waterSplashParticles.minEmitPower = 1;
            this.waterSplashParticles.maxEmitPower = 3;
            this.waterSplashParticles.emitRate = 500;
        }
        
        // Commencer l'émission de particules
        this.waterSplashParticles.start();
        
        // Arrêter après une courte durée
        setTimeout(() => {
            this.waterSplashParticles.stop();
        }, 500);
        
        // Jouer le son d'éclaboussure
        this.playSplashSound();
    }
    
    /**
     * Jouer l'effet sonore d'éclaboussure
     */
    playSplashSound() {
        // Créer le son d'éclaboussure s'il n'existe pas
        if (!this.splashSound) {
            try {
                this.splashSound = new BABYLON.Sound("splashSound", "assets/Sounds/splash.wav", this.scene, null, {
                    volume: 0.5,
                    playbackRate: 1.0,
                    loop: false,
                });
            } catch (error) {
                console.warn("Impossible de charger le son d'éclaboussure, création d'un son de secours");
                // Créer un son de secours en utilisant l'API Web Audio
                this.createFallbackSplashSound();
            }
        }
        
        // Jouer le son
        if (this.splashSound && this.splashSound.isReady) {
            // Randomiser légèrement la hauteur pour plus de variété
            this.splashSound.playbackRate = 0.8 + Math.random() * 0.4;
            this.splashSound.play();
            this.splashSound.loop = false;
            // Arrêter le son après sa lecture
            this.splashSound.stop();
        }
    }
    
    /**
     * Créer un son d'éclaboussure de secours en utilisant l'API Web Audio
     */
    createFallbackSplashSound() {
        try {
            // Créer un contexte audio
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContext();
            
            // Créer un objet sonore qui peut être joué
            this.splashSound = {
                isReady: true,
                playbackRate: 1.0,
                play: () => {
                    // Créer un oscillateur pour le son d'éclaboussure
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    
                    // Connecter les nœuds
                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    
                    // Définir les paramètres
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
                    
                    // Définir l'enveloppe de volume
                    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.5 * this.playbackRate, audioCtx.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                    
                    // Démarrer et arrêter
                    oscillator.start();
                    oscillator.stop(audioCtx.currentTime + 0.3);
                }
            };
        } catch (error) {
            console.error("Impossible de créer le son de secours:", error);
            this.splashSound = null;
        }
    }
    
    /**
     * Mettre à jour la position, la rotation et la physique du joueur
     * @param {number} deltaTime - Temps écoulé depuis la dernière mise à jour
     */
    update(deltaTime = 1/60) {
        if (!this.mesh) return;
        
        // Vérifier si nous sommes sous l'eau (avec vérification de sécurité pour l'environnement)
        let isUnderwater = false;
        if (this.environment && typeof this.environment.isUnderwater === 'function') {
            isUnderwater = this.environment.isUnderwater(this.mesh.position);
        }
        
        // Vérifier l'entrée/sortie de l'eau
        if (isUnderwater !== this.wasUnderwater) {
            // Créer effet d'éclaboussure
            this.createWaterSplash(isUnderwater);
            console.log(isUnderwater ? "Entrée dans l'eau" : "Sortie de l'eau");
            
            // Jouer le son d'accélération pendant 1 seconde lors de l'entrée/sortie de l'eau
            this.playWaterTransitionSound();
        }
        
        // Stocker l'état sous l'eau actuel pour la prochaine image
        this.wasUnderwater = isUnderwater;
        
        // Mettre à jour la propriété isUnderwater
        this.isUnderwater = isUnderwater;
        
        // Gérer l'entrée clavier
        this.handleKeyboardInput(isUnderwater);
        
        // Appliquer la physique de l'eau (avec vérification de sécurité)
        if (this.environment && typeof this.environment.applyWaterPhysics === 'function') {
            this.environment.applyWaterPhysics(this, this.velocity, deltaTime);
        }
        
        // Mettre à jour la position
        this.mesh.position.addInPlace(this.velocity);
        
        // Mettre à jour la rotation en utilisant nos valeurs de rotation (sans appeler une méthode séparée)
        // Appliquer la rotation depuis l'entrée
        this.mesh.rotation.x += this.rotation.x;
        this.mesh.rotation.y += this.rotation.y;
        this.mesh.rotation.z += this.rotation.z;
        
        // Appliquer un amortissement naturel à la rotation
        this.rotation.scaleInPlace(isUnderwater ? 0.9 : 0.95);
        
        // Vérifier les collisions avec les mouettes
        this.checkSeagullCollisions();
        
        if (isUnderwater) {
            // Limiter le tangage sous l'eau
            const maxPitch = Math.PI / 3;
            this.mesh.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, this.mesh.rotation.x));
            
            // Appliquer un roulis naturel lors des virages sous l'eau
            const targetRoll = -this.rotation.y * 2;
            this.mesh.rotation.z = this.mesh.rotation.z * 0.9 + targetRoll * 0.1;
            
            // Auto-stabiliser le tangage lorsqu'il n'y a pas d'action active de tangage
            if (Math.abs(this.rotation.x) < 0.001) {
                this.mesh.rotation.x *= 0.95;
            }
            
            // Lorsqu'on est profondément sous l'eau, revenir progressivement à la flottabilité neutre
            if (this.mesh.position.y < -5) {
                // Appliquer une force douce vers la flottabilité neutre
                this.velocity.y += 0.0005;
            }
        } else {
            // Pas de limites au-dessus de l'eau pour les figures
            // Ajouter un léger auto-roulis pour des figures plus dynamiques
            if (this.input.turn === 0) {
                this.rotation.z += Math.sin(this.mesh.rotation.x) * 0.001;
            }
            
            // Lorsqu'on retombe dans l'eau, incliner le dauphin pour un plongeon approprié
            const waterLevel = this.environment?.waterLevel || 0;
            if (this.velocity.y < -0.1 && this.mesh.position.y < 5 && this.mesh.position.y > waterLevel) {
                // Calculer la distance à la surface de l'eau
                const distanceToWater = this.mesh.position.y - waterLevel;
                
                // Calculer la vitesse verticale - les chutes plus rapides devraient entraîner des plongeons plus inclinés
                const fallSpeed = Math.abs(this.velocity.y);
                
                // Incliner progressivement le nez vers le bas pour un plongeon approprié - ajustement plus doux
                // Appliquer seulement si le nez n'est pas déjà significativement pointé vers le bas
                if (this.mesh.rotation.x < 0.3) {
                    const diveAngle = Math.min(0.03, 0.01 * fallSpeed * (5 - distanceToWater) / 5);
                    this.mesh.rotation.x += diveAngle;
                }
                
                // Ajouter un léger élan vers l'avant pour un plongeon plus naturel - plus doux
                const forwardDir = new BABYLON.Vector3(
                    Math.sin(this.mesh.rotation.y) * Math.cos(this.mesh.rotation.x),
                    -Math.sin(this.mesh.rotation.x),
                    Math.cos(this.mesh.rotation.y) * Math.cos(this.mesh.rotation.x)
                );
                
                // Ajouter une impulsion vers l'avant plus petite proportionnelle à la vitesse de chute
                this.velocity.addInPlace(forwardDir.scale(0.0005 * fallSpeed));
                
                // Journal de débogage pour l'angle de plongée
                if (distanceToWater < 1) {
                    console.log(`Entrée en plongée: angle=${(this.mesh.rotation.x * 180 / Math.PI).toFixed(1)}°, vitesse=${fallSpeed.toFixed(2)}`);
                }
            }
        }
        
        // Mettre à jour la caméra
        this.updateCamera(isUnderwater);
        
        // Mettre à jour les figures
        this.updateTricks(isUnderwater);
        
        // Vérifier si nous sommes en dehors de la zone de jeu
        if (this.environment && this.environment.isOutsidePlayArea && this.environment.isOutsidePlayArea(this.mesh.position)) {
            // Pousser le joueur vers le centre
            const dirToCenter = new BABYLON.Vector3(0, this.mesh.position.y, 0).subtract(this.mesh.position);
            dirToCenter.y = 0; // Garder la composante y inchangée
            dirToCenter.normalize();
            
            // Ajouter de la vitesse vers le centre
            this.velocity.addInPlace(dirToCenter.scale(0.01));
        }
        
        // Suivre les changements d'état d'accélération
        if (this.input.prevBoost && !this.input.boost) {
            this.stopBoostSound();
        }
        this.input.prevBoost = this.input.boost;
    }
    
    /**
     * Handle keyboard input for player movement
     */
    handleKeyboardInput(isUnderwater) {
        // Apply appropriate damping for smoother movement
        this.velocity.scaleInPlace(isUnderwater ? 0.95 : 0.96); // Increased damping to reduce speed
        
        // Reset rotation
        this.rotation.setAll(0);
        
        // Use appropriate rotation speed based on environment
        const currentRotationSpeed = isUnderwater ? 0.015 : 0.02; // Reduced rotation speed
        
        // Handle rotation (Q/D keys) - INVERTED: Q now turns RIGHT, D turns LEFT
        if (this.input.turn < 0) this.rotation.y = -currentRotationSpeed; // Inverted
        if (this.input.turn > 0) this.rotation.y = currentRotationSpeed;  // Inverted
        
        // Handle pitch (Z/S keys) - Z now makes nose go down, S makes nose go up
        if (this.input.forward < 0) this.rotation.x = -currentRotationSpeed; // S - nose up
        if (this.input.forward > 0) this.rotation.x = currentRotationSpeed;  // Z - nose down
        
        // Check if we're near the water surface (within 2 units above or below)
        const waterLevel = this.environment?.waterLevel || 0;
        const nearSurface = Math.abs(this.mesh.position.y - waterLevel) < 2;
        
        // Apply boost (Space key) - when underwater OR slightly above water surface
        if ((isUnderwater || (this.mesh.position.y < waterLevel + 3)) && this.input.boost) {
            // Get the direction the nose is pointing
            const direction = new BABYLON.Vector3(
                Math.sin(this.mesh.rotation.y) * Math.cos(this.mesh.rotation.x),
                -Math.sin(this.mesh.rotation.x),
                Math.cos(this.mesh.rotation.y) * Math.cos(this.mesh.rotation.x)
            );
            
            // Apply acceleration in that direction - REDUCED boost power
            const boostPower = 0.02; // Reduced from 0.045
            this.velocity.addInPlace(direction.scale(boostPower));
            
            // Add a small component of the existing velocity to maintain momentum and direction
            const currentDirection = this.velocity.clone().normalize();
            this.velocity.addInPlace(currentDirection.scale(0.008)); // Reduced from 0.015
            
            // Limit speed but preserve direction better
            const currentSpeed = this.velocity.length();
            const maxSpeed = isUnderwater ? 3 : 2; // Increased from 1.2/1.0
            
            if (currentSpeed > maxSpeed) {
                // Scale down but preserve direction better
                this.velocity.scaleInPlace(maxSpeed / currentSpeed);
            }
            
            // Play boost sound
            this.playBoostSound();

            // Create bubbles when boosting underwater
            if (isUnderwater && this.scene && typeof this.createBubbles === 'function') {
                this.createBubbles(3); // Reduced from 5 for more subtle effect
            }
        } else if (!isUnderwater && !nearSurface) {
            // In air (and not near surface), apply a small constant forward momentum for better trick control
            const forwardDir = new BABYLON.Vector3(
                Math.sin(this.mesh.rotation.y),
                0,
                Math.cos(this.mesh.rotation.y)
            );
            this.velocity.addInPlace(forwardDir.scale(0.001));
            
            // Limit air speed
            const currentSpeed = this.velocity.length();
            const maxAirSpeed = 2; // Increased from 1.2
            if (currentSpeed > maxAirSpeed) {
                this.velocity.scaleInPlace(maxAirSpeed / currentSpeed);
            }
        }
        
        // Apply jumping when near surface - use S key (now positive forward value) for jumping
        if (isUnderwater && this.input.forward < 0 && this.mesh.position.y > -2) {
            // Increased jump power for higher jumps
            const jumpPower = 0.03; // Increased from 0.02
            
            // Apply more jump power when closer to the surface
            const waterLevel = this.environment?.waterLevel || 0;
            const depthFactor = 1.0 + Math.max(0, (waterLevel - this.mesh.position.y) / 2);
            
            // Apply jump force
            this.velocity.y += jumpPower * depthFactor;
            
            // Add a small forward component to the jump for more dynamic movement
            const forwardDir = new BABYLON.Vector3(
                Math.sin(this.mesh.rotation.y),
                0,
                Math.cos(this.mesh.rotation.y)
            );
            this.velocity.addInPlace(forwardDir.scale(0.005));
            
            // If boosting while jumping, add extra vertical velocity for super jumps
            if (this.input.boost) {
                this.velocity.y += 0.04; // Significant boost to jump height
                
                // Play a special sound for super jumps
                this.playBoostSound();
            }
        }
        
        // Update rotation
        this.mesh.rotation.x += this.rotation.x;
        this.mesh.rotation.y += this.rotation.y;
        this.mesh.rotation.z += this.rotation.z;
        
        // Apply appropriate damping
        this.rotation.scaleInPlace(isUnderwater ? 0.9 : 0.95);
    }

    /**
     * Update camera based on environment
     */
    updateCamera(isUnderwater) {
        // Switch camera based on environment
        if (isUnderwater && this.scene.activeCamera !== this.followCamera) {
            this.scene.activeCamera = this.followCamera;
            console.log("Switched to underwater camera");
        } else if (!isUnderwater && this.scene.activeCamera !== this.aerialCamera) {
            this.scene.activeCamera = this.aerialCamera;
            console.log("Switched to aerial camera");
        }
        
        // Update aerial camera position when in air
        if (!isUnderwater) {
            // Update camera based on current mode
            this.updateCameraMode();
        }
    }
    
    /**
     * Update camera based on current camera mode
     */
    updateCameraMode() {
        if (this.scene.activeCamera !== this.aerialCamera || !this.mesh) return;
        
        // Position the aerial camera based on mode
        const cameraDistance = 60;
        const cameraHeight = 40;
        
        switch (this.cameraMode) {
            case "fixed":
                // Fixed position behind the player
                const fixedAngle = Math.PI; // Fixed angle (directly behind)
                const x = this.mesh.position.x - Math.sin(fixedAngle) * cameraDistance;
                const z = this.mesh.position.z - Math.cos(fixedAngle) * cameraDistance;
                
                // Set camera position
                this.aerialCamera.position.x = x;
                this.aerialCamera.position.y = this.mesh.position.y + cameraHeight;
                this.aerialCamera.position.z = z;
                break;
                
            case "follow":
                // Follow position behind the player based on rotation
                const followAngle = this.mesh.rotation.y + Math.PI; // Behind based on rotation
                const followX = this.mesh.position.x - Math.sin(followAngle) * cameraDistance;
                const followZ = this.mesh.position.z - Math.cos(followAngle) * cameraDistance;
                
                // Set camera position
                this.aerialCamera.position.x = followX;
                this.aerialCamera.position.y = this.mesh.position.y + cameraHeight;
                this.aerialCamera.position.z = followZ;
                break;
                
            case "top":
                // Top-down view
                this.aerialCamera.position.x = this.mesh.position.x;
                this.aerialCamera.position.y = this.mesh.position.y + cameraHeight * 2;
                this.aerialCamera.position.z = this.mesh.position.z;
                break;
        }
        
        // Look at the player
        this.aerialCamera.setTarget(this.mesh.position);
    }
    
    /**
     * Update trick detection
     */
    updateTricks(isUnderwater) {
        // Skip if environment is not available
        if (!this.environment || typeof this.environment.isUnderwater !== 'function') return;
        
        // Check if we're underwater or in the air
        const currentIsUnderwater = this.environment.isUnderwater(this.mesh.position);
        
        // Debug
        if (this.tricks.inAir !== !currentIsUnderwater) {
            const waterLevel = this.environment?.waterLevel || 0;
            console.log(`Trick state change: inAir=${!currentIsUnderwater}, position.y=${this.mesh.position.y.toFixed(2)}, waterLevel=${waterLevel}`);
        }
        
        // If we were in the air and now underwater, evaluate tricks
        if (this.tricks.inAir && currentIsUnderwater) {
            console.log("Landed in water - evaluating tricks");
            this.evaluateTricks();
            this.tricks.inAir = false;
        }
        
        // If we were underwater and now in the air, start tracking tricks
        if (!this.tricks.inAir && !currentIsUnderwater) {
            console.log("Jumped out of water - starting trick tracking");
            this.tricks.inAir = true;
            this.tricks.startTime = Date.now();
            this.tricks.startRotation = new BABYLON.Vector3(
                this.mesh.rotation.x,
                this.mesh.rotation.y,
                this.mesh.rotation.z
            );
            this.tricks.rotationDelta = new BABYLON.Vector3(0, 0, 0);
        }
        
        // If we're in the air, track rotation
        if (this.tricks.inAir) {
            // Track air time
            this.tricks.airTime = (Date.now() - this.tricks.startTime) / 1000; // in seconds
            
            // Calculate rotation delta since jump
            let deltaX = this.mesh.rotation.x - this.tricks.startRotation.x;
            let deltaY = this.mesh.rotation.y - this.tricks.startRotation.y;
            let deltaZ = this.mesh.rotation.z - this.tricks.startRotation.z;
            
            // Normalize to [-PI, PI]
            deltaX = ((deltaX + Math.PI) % (2 * Math.PI)) - Math.PI;
            deltaY = ((deltaY + Math.PI) % (2 * Math.PI)) - Math.PI;
            deltaZ = ((deltaZ + Math.PI) % (2 * Math.PI)) - Math.PI;
            
            // Update total rotation
            this.tricks.rotationDelta.x += Math.abs(deltaX);
            this.tricks.rotationDelta.y += Math.abs(deltaY);
            this.tricks.rotationDelta.z += Math.abs(deltaZ);
            
            // Update start rotation for next frame
            this.tricks.startRotation = new BABYLON.Vector3(
                this.mesh.rotation.x,
                this.mesh.rotation.y,
                this.mesh.rotation.z
            );
            
            // Debug every 0.5 seconds
            if (Math.floor(this.tricks.airTime * 2) > Math.floor((this.tricks.airTime - 0.01) * 2)) {
                console.log(`Air time: ${this.tricks.airTime.toFixed(2)}s, Rotation: X=${(this.tricks.rotationDelta.x / Math.PI).toFixed(2)}π, Y=${(this.tricks.rotationDelta.y / Math.PI).toFixed(2)}π, Z=${(this.tricks.rotationDelta.z / Math.PI).toFixed(2)}π`);
            }
        }
    }
    
    /**
     * Set the UI manager
     * @param {UIManager} uiManager - The UI manager
     */
    setUIManager(uiManager) {
        this.uiManager = uiManager;
    }

    /**
     * Evaluate tricks and add score
     */
    evaluateTricks() {
        // Skip if not in air
        if (!this.tricks.inAir) return;
        
        console.log("Evaluating tricks:", this.tricks);
        
        // Calculate total rotation (sum of all axes)
        this.totalRotation = this.tricks.rotationDelta.x + 
                            this.tricks.rotationDelta.y + 
                            this.tricks.rotationDelta.z;
        
        // Track maximum height during jump
        this.maxJumpHeight = Math.max(this.maxJumpHeight, this.mesh.position.y);
        
        // Calculate trick score based on height and rotation
        const waterLevel = this.environment?.waterLevel || 0;
        const heightFactor = Math.min(1, (this.maxJumpHeight - waterLevel) / 10);
        const rotationFactor = Math.abs(this.totalRotation) / (Math.PI * 2);
        
        // Calculate trick score
        const trickScore = Math.floor((heightFactor * 100) + (rotationFactor * 200));
        
        console.log(`Trick evaluation - Height: ${heightFactor.toFixed(2)}, Rotation: ${rotationFactor.toFixed(2)}, Score: ${trickScore}`);
        
        // Only count tricks with a minimum score
        if (trickScore >= 50) {
            // Determine trick name based on rotation
            let trickName = "";
            
            if (this.totalRotation > Math.PI * 1.5) {
                trickName = "Double Flip";
            } else if (this.totalRotation > Math.PI * 0.75) {
                trickName = "Flip";
            } else if (this.environment && Math.abs(this.maxJumpHeight - this.environment.waterLevel) > 15) {
            } else if (this.totalRotation > Math.PI * 0.25) {
                trickName = "Half Flip";
            } else if (Math.abs(this.maxJumpHeight - this.environment.waterLevel) > 15) {
                trickName = "High Jump";
            } else {
                trickName = "Jump";
            }
            
            console.log(`Performing trick: ${trickName}`);
            
            // Add score to world manager with a special flag to prevent double notifications
            if (this.scene.game && this.scene.game.worldManager) {
                // Ensure correct reference to worldManager
                this.scene.game.worldManager.addScore(trickScore, 'tricks', true);
                console.log(`Added score: ${trickScore}`);
            }
            
            // Show trick notification with score
            if (this.uiManager) {
                console.log(`Adding trick to UI: ${trickName} +${trickScore}`);
                this.uiManager.addTrick(`${trickName} +${trickScore}`);
            } else {
                console.warn("No UI manager available to display trick");
            }
        }
        
        // Reset trick tracking
        this.tricks.inAir = false;
        this.tricks.rotationDelta = new BABYLON.Vector3(0, 0, 0);
        this.totalRotation = 0;
        this.maxJumpHeight = 0;
    }

    /**
     * Créer des bulles lors de l'accélération sous l'eau
     * @param {number} count - Nombre de bulles à créer
     */
    createBubbles(count) {
        // Créer un système de particules simple pour les bulles
        const bubbles = new BABYLON.ParticleSystem("bubbles", count, this.scene);
        
        // Utiliser une texture de cercle simple pour les bulles
        bubbles.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", this.scene);
        
        // Définir l'émetteur à la position du joueur
        bubbles.emitter = this.mesh.position.clone();
        
        // Émettre dans la direction opposée à celle vers laquelle le joueur fait face
        const direction = new BABYLON.Vector3(
            -Math.sin(this.mesh.rotation.y) * Math.cos(this.mesh.rotation.x),
            Math.sin(this.mesh.rotation.x),
            -Math.cos(this.mesh.rotation.y) * Math.cos(this.mesh.rotation.x)
        );
        
        // Ajuster la position de l'émetteur pour qu'elle soit derrière le joueur
        bubbles.emitter.addInPlace(direction.scale(2));
        
        // Définir les propriétés des bulles
        bubbles.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        bubbles.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);
        
        // Couleur des bulles - bleu clair/blanc
        bubbles.color1 = new BABYLON.Color4(0.8, 0.9, 1.0, 0.8);
        bubbles.color2 = new BABYLON.Color4(0.9, 0.95, 1.0, 0.9);
        bubbles.colorDead = new BABYLON.Color4(0.9, 0.9, 1.0, 0.0);
        
        // Taille des bulles
        bubbles.minSize = 0.1;
        bubbles.maxSize = 0.3;
        
        // Durée de vie des bulles
        bubbles.minLifeTime = 0.5;
        bubbles.maxLifeTime = 1.5;
        
        // Taux d'émission et vitesse
        bubbles.emitRate = count * 5;
        bubbles.minEmitPower = 0.5;
        bubbles.maxEmitPower = 1.5;
        
        // Direction - légèrement vers le haut et derrière
        bubbles.direction1 = direction.scale(-1);
        bubbles.direction2 = new BABYLON.Vector3(
            direction.x * -1,
            direction.y * -1 + 0.5, // Ajouter une composante vers le haut
            direction.z * -1
        );
        
        // Ajouter un peu d'aléatoire au mouvement des bulles
        bubbles.minAngularSpeed = 0;
        bubbles.maxAngularSpeed = Math.PI;
        
        // Légère gravité pour l'effet de montée
        bubbles.gravity = new BABYLON.Vector3(0, 0.05, 0);
        
        // Mode de fusion pour l'effet sous-marin
        bubbles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        
        // Démarrer le système de particules
        bubbles.targetStopDuration = 0.2;
        bubbles.disposeOnStop = true;
        bubbles.start();
    }

    /**
     * Jouer l'effet sonore d'accélération
     */
    playBoostSound() {
        // Créer un nouveau son s'il n'existe pas
        if (!this.boostSound) {
            try {
                // Obtenir le volume sonore du jeu
                const volume = this.scene.game ? this.scene.game.soundVolume : 0.5;
                
                this.boostSound = new BABYLON.Sound("boostSound", "assets/Sounds/Boost.wav", this.scene, null, {
                    loop: false,
                    autoplay: false,
                    volume: volume
                });
            } catch (error) {
                console.warn("Impossible de créer le son d'accélération:", error);
                return;
            }
        } else {
            // Mettre à jour le volume si le jeu existe
            if (this.scene.game) {
                this.boostSound.volume = this.scene.game.soundVolume;
            }
        }
        
        // Si le son existe mais n'est pas en cours de lecture, le jouer
        if (this.boostSound && !this.boostSound.isPlaying) {
            try {
                this.boostSound.play();
            } catch (error) {
                console.warn("Impossible de jouer le son d'accélération:", error);
            }
        }
    }
    
    /**
     * Stop boost sound effect
     */
    stopBoostSound() {
        if (this.boostSound && this.boostSound.isPlaying) {
            try {
                this.boostSound.stop();
            } catch (error) {
                console.warn("Could not stop boost sound:", error);
            }
        }
    }

    /**
     * Play a short boost sound when entering or exiting water
     */
    playWaterTransitionSound() {
        // Create a new sound if it doesn't exist
        if (!this.waterTransitionSound) {
            try {
                // Get the game's sound volume
                const volume = this.scene.game ? this.scene.game.soundVolume : 0.5;
                
                // Use the boost sound for water transitions
                this.waterTransitionSound = new BABYLON.Sound("waterTransitionSound", "assets/Sounds/Boost.wav", this.scene, null, {
                    loop: false,
                    autoplay: false,
                    volume: volume
                });
                
                // Set a timeout to stop the sound after 1 second
                this.waterTransitionSound.onEndedObservable.add(() => {
                    if (this.waterTransitionSoundTimeout) {
                        clearTimeout(this.waterTransitionSoundTimeout);
                    }
                });
            } catch (error) {
                console.warn("Could not create water transition sound:", error);
                return;
            }
        } else {
            // Update volume if game exists
            if (this.scene.game) {
                this.waterTransitionSound.volume = this.scene.game.soundVolume;
            }
        }
        
        // If the sound exists, play it
        if (this.waterTransitionSound) {
            try {
                // Stop any previous playing instance
                if (this.waterTransitionSound.isPlaying) {
                    this.waterTransitionSound.stop();
                }
                
                // Play the sound
                this.waterTransitionSound.play();
                
                // Set a timeout to stop the sound after 1 second
                if (this.waterTransitionSoundTimeout) {
                    clearTimeout(this.waterTransitionSoundTimeout);
                }
                
                this.waterTransitionSoundTimeout = setTimeout(() => {
                    if (this.waterTransitionSound && this.waterTransitionSound.isPlaying) {
                        this.waterTransitionSound.stop();
                    }
                }, 1000); // Stop after 1 second
            } catch (error) {
                console.warn("Could not play water transition sound:", error);
            }
        }
    }
    
    /**
     * Check for collisions with seagulls
     */
    checkSeagullCollisions() {
        // Make sure we have access to seagulls
        if (!this.scene.game || !this.scene.game.seaCreatures || !this.scene.game.seaCreatures.seagulls) {
            return;
        }
        
        // Get player position and create a simple bounding box
        const playerPos = this.mesh.position;
        const playerBox = {
            min: new BABYLON.Vector3(
                playerPos.x - 1.5,
                playerPos.y - 0.8, // Lower the bottom of the hitbox
                playerPos.z - 1.5
            ),
            max: new BABYLON.Vector3(
                playerPos.x + 1.5,
                playerPos.y + 0.8 * 0.8, // Lower the top of the hitbox (0.8 of original height)
                playerPos.z + 1.5
            )
        };
        
        // Check each seagull
        for (const seagull of this.scene.game.seaCreatures.seagulls) {
            // Skip if no hitbox
            if (!seagull.hitbox) continue;
            
            // Get seagull hitbox position in world space
            const hitboxPos = seagull.hitbox.getAbsolutePosition();
            
            // Create seagull bounding box
            const seagullBox = {
                min: new BABYLON.Vector3(
                    hitboxPos.x - seagull.hitbox.scaling.x / 2,
                    hitboxPos.y - seagull.hitbox.scaling.y / 2,
                    hitboxPos.z - seagull.hitbox.scaling.z / 2
                ),
                max: new BABYLON.Vector3(
                    hitboxPos.x + seagull.hitbox.scaling.x / 2,
                    hitboxPos.y + seagull.hitbox.scaling.y / 2,
                    hitboxPos.z + seagull.hitbox.scaling.z / 2
                )
            };
            
            // Check for intersection
            if (this.boxIntersects(playerBox, seagullBox)) {
                // Only trigger if we haven't hit this seagull recently
                if (!seagull.lastHitTime || Date.now() - seagull.lastHitTime > 5000) {
                    console.log("Seagull hit!");
                    
                    // Mark this seagull as hit
                    seagull.lastHitTime = Date.now();
                    
                    // Trigger the secret trick
                    this.triggerSeagullTrick();
                    
                    // Add some bounce to the player
                    this.velocity.y += 0.2;
                    
                    // Add some random horizontal movement
                    this.velocity.x += (Math.random() - 0.5) * 0.2;
                    this.velocity.z += (Math.random() - 0.5) * 0.2;
                    
                    // Break after first collision
                    break;
                }
            }
        }
    }
    
    /**
     * Check if two bounding boxes intersect
     */
    boxIntersects(box1, box2) {
        return (box1.min.x <= box2.max.x && box1.max.x >= box2.min.x) &&
               (box1.min.y <= box2.max.y && box1.max.y >= box2.min.y) &&
               (box1.min.z <= box2.max.z && box1.max.z >= box2.min.z);
    }
    
    /**
     * Trigger a seagull trick
     */
    triggerSeagullTrick() {
        // Only trigger once per seagull
        if (this.lastSeagullTrickTime && (Date.now() - this.lastSeagullTrickTime < 2000)) {
            return;
        }
        
        // Add score
        if (this.scene.game && this.scene.game.worldManager) {
            this.scene.game.worldManager.addScore(300, 'seagulls', true);
        }
        
        // Show trick notification
        if (this.uiManager) {
            this.uiManager.addTrick("Seagull Trick: +300");
        }
        
        // Play trick sound
        this.playTrickSound();
        
        // Set last trick time
        this.lastSeagullTrickTime = Date.now();
    }
}

/**
 * Classe TrickNotifier pour afficher le nom de la figure à l'écran
 */
class TrickNotifier {
    constructor(scene) {
        this.scene = scene;
        this.notifications = []; // Initialiser le tableau de notifications
        
        // Attendre que le document soit prêt avant de créer des éléments DOM
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            // Le document est déjà prêt
            this.createNotificationContainer();
        } else {
            // Attendre que le document soit prêt
            window.addEventListener('DOMContentLoaded', () => {
                this.createNotificationContainer();
            });
        }
    }
    
    /**
     * Créer un conteneur pour les notifications de figures
     */
    createNotificationContainer() {
        try {
            // Vérifier si le conteneur existe déjà
            let container = document.getElementById('trickNotificationContainer');
            
            if (!container && document.body) {
                container = document.createElement('div');
                container.id = 'trickNotificationContainer';
                container.style.position = 'absolute';
                container.style.top = '20%';
                container.style.left = '0';
                container.style.width = '100%';
                container.style.textAlign = 'center';
                container.style.zIndex = '1000';
                container.style.pointerEvents = 'none'; // Ne pas bloquer les clics
                document.body.appendChild(container);
                console.log("Conteneur de notification de figure créé");
            }
        } catch (error) {
            console.warn("Erreur lors de la création du conteneur de notification de figure:", error);
        }
    }
    
    /**
     * Afficher une notification de figure à l'écran
     * @param {string} trickName - Nom de la figure
     * @param {string} color - Couleur de la notification
     */
    showTrick(trickName, color = "white") {
        try {
            if (!document || !document.body) {
                console.warn("Document non prêt pour la notification de figure");
                return;
            }
            
            // S'assurer que le conteneur existe
            this.createNotificationContainer();
            
            const container = document.getElementById('trickNotificationContainer');
            
            if (!container) {
                console.warn("Conteneur de notification de figure non trouvé");
                return;
            }

            if(!color) {
                switch(trickName) {
                    case "Full Spin":
                        color = "purple";
                        break;
                    case "Full Flip":
                        color = "purple";
                        break;
                    case "Spin":
                        color = "red";
                        break;
                    case "Flip":
                        color = "red";
                        break;
                    case "Flying":
                        color = "white";
                        break;
                    case "Air Time":
                        color = "white";
                        break;
                }
            }
            
            // Créer l'élément de notification
            const notification = document.createElement('div');
            if (!notification) {
                console.warn("Échec de création de l'élément de notification");
                return;
            }

            notification.textContent = trickName;
            notification.style.color = color;
            notification.style.fontSize = '48px';
            notification.style.fontFamily = 'Arial, sans-serif';
            notification.style.fontWeight = 'bold';
            notification.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
            notification.style.margin = '10px';
            notification.style.transition = 'all 0.5s ease-out';
            notification.style.opacity = '0';
            notification.style.transform = 'scale(0.5)';
            
            // Ajouter au conteneur
            container.appendChild(notification);
            
            // Stocker la référence
            this.notifications.push(notification);
            
            // Animation d'entrée
            setTimeout(() => {
                if (notification && notification.style) {
                    notification.style.opacity = '1';
                    notification.style.transform = 'scale(1)';
                }
            }, 10);
            
            // Animation de sortie et suppression
            setTimeout(() => {
                if (notification && notification.style) {
                    notification.style.opacity = '0';
                    notification.style.transform = 'scale(1.5)';
                }
                
                setTimeout(() => {
                    if (container && notification && container.contains(notification)) {
                        container.removeChild(notification);
                    }
                    
                    // Supprimer de notre tableau de suivi
                    const index = this.notifications.indexOf(notification);
                    if (index > -1) {
                        this.notifications.splice(index, 1);
                    }
                }, 500);
            }, 2000);
        } catch (error) {
            console.warn("Erreur lors de l'affichage de la notification de figure:", error);
        }
    }
} 