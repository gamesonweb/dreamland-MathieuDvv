/**
 * Classe InputManager pour gérer les entrées clavier du jeu
 */
class InputManager {
    /**
     * Constructeur
     * @param {Game} game - L'instance du jeu
     */
    constructor(game) {
        this.game = game;
        this.player = game.player;
        
        // Detect keyboard layout
        this.isQWERTY = this.detectKeyboardLayout();
        
        // Initialiser les états des touches
        this.keys = {
            forward: false,  // Z or W
            backward: false, // S
            left: false,     // Q or A
            right: false,    // D
            space: false,
            e: false, // Ajouter la touche E pour l'interaction
            arrowup: false,
            arrowdown: false,
            arrowleft: false,
            arrowright: false,
            shift: false
        };
        
        // Variables d'état du jeu
        this.mapMode = 'whale'; // whale, gates, both
        this.playAreaSize = 100; // 100, 150, 200
        this.freeCamMode = false; // Mode caméra libre
        
        // Configurer les écouteurs d'événements
        this.setupEventListeners();
        
        console.log("Gestionnaire d'entrées initialisé");
        console.log("Keyboard layout detected:", this.isQWERTY ? "QWERTY" : "AZERTY");
    }
    
    /**
     * Detect keyboard layout based on key positions
     * @returns {boolean} true if QWERTY, false if AZERTY
     */
    detectKeyboardLayout() {
        // Create a temporary input element
        const input = document.createElement('input');
        input.style.position = 'absolute';
        input.style.opacity = 0;
        document.body.appendChild(input);
        
        // Focus the input
        input.focus();
        
        // Create a keydown event
        const event = new KeyboardEvent('keydown', {
            key: 'z',
            code: 'KeyZ'
        });
        
        // Dispatch the event
        input.dispatchEvent(event);
        
        // Check if the key is 'z' (AZERTY) or 'w' (QWERTY)
        const isQWERTY = event.key === 'w';
        
        // Clean up
        document.body.removeChild(input);
        
        return isQWERTY;
    }
    
    /**
     * Get the appropriate key for a given action based on keyboard layout
     * @param {string} action - The action to get the key for ('forward', 'backward', 'left', 'right')
     * @returns {string} The key to use for the action
     */
    getKeyForAction(action) {
        if (this.isQWERTY) {
            switch (action) {
                case 'forward': return 'w';
                case 'backward': return 's';
                case 'left': return 'a';
                case 'right': return 'd';
            }
        } else {
            switch (action) {
                case 'forward': return 'z';
                case 'backward': return 's';
                case 'left': return 'q';
                case 'right': return 'd';
            }
        }
    }
    
    /**
     * Configurer les écouteurs d'événements clavier
     */
    setupEventListeners() {
        // Ajouter un écouteur d'événement keydown
        window.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        // Ajouter un écouteur d'événement keyup
        window.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
    }
    
    /**
     * Gérer les événements de touche enfoncée
     * @param {KeyboardEvent} event - L'événement clavier
     */
    handleKeyDown(event) {
        // Ignorer si le jeu est en pause (sauf pour la touche P pour reprendre)
        if (this.game.ui && this.game.ui.isGamePaused && event.key !== 'p' && event.key !== 'P') {
            return;
        }
        
        const key = event.key.toLowerCase();
        
        // Gérer les pressions de touches
        if (key === this.getKeyForAction('forward')) {
            if (this.freeCamMode) {
                // Mouvement de caméra libre géré séparément
            } else {
                this.game.player.input.forward = -1;
            }
        } else if (key === this.getKeyForAction('backward')) {
            if (this.freeCamMode) {
                // Mouvement de caméra libre géré séparément
            } else {
                this.game.player.input.forward = 1;
            }
        } else if (key === this.getKeyForAction('left')) {
            if (this.freeCamMode) {
                // Mouvement de caméra libre géré séparément
            } else {
                this.game.player.input.turn = -1;
            }
        } else if (key === this.getKeyForAction('right')) {
            if (this.freeCamMode) {
                // Mouvement de caméra libre géré séparément
            } else {
                this.game.player.input.turn = 1;
            }
        } else if (key === ' ') {
            this.game.player.input.boost = true;
        } else if (key === 'e') {
            this.keys.e = true;
        } else {
            // Handle other controls
            switch (key) {
                case 'p': this.toggleInspector(); break;
                case 'f': this.toggleFpsCounter(); break;
                case 'o': this.cycleMapMode(); break;
                case 'm': this.toggleMusic(); break;
                case 'c': this.toggleFreeCameraMode(); break;
                case 'l': this.cycleCameraMode(); break;
                case 'i': this.cyclePlayAreaSize(); break;
                case 'y': this.toggleChunkDebugMode(); break;
            }
        }
    }
    
    /**
     * Basculer la visibilité du compteur FPS
     */
    toggleFpsCounter() {
        console.log("Basculement du compteur FPS");
        if (this.game.ui) {
            this.game.ui.toggleFpsCounter();
        }
    }
    
    /**
     * Basculer l'Inspecteur BabylonJS
     */
    toggleInspector() {
        console.log("Basculement de l'Inspecteur BabylonJS");
        if (this.game.scene) {
            if (this.game.scene.debugLayer.isVisible()) {
                this.game.scene.debugLayer.hide();
            } else {
                this.game.scene.debugLayer.show();
            }
        }
    }
    
    /**
     * Gérer les événements de touche relâchée
     * @param {KeyboardEvent} event - L'événement clavier
     */
    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        
        // Gérer le relâchement de touche
        if (key === this.getKeyForAction('forward') || key === this.getKeyForAction('backward')) {
            this.game.player.input.forward = 0;
        } else if (key === this.getKeyForAction('left') || key === this.getKeyForAction('right')) {
            this.game.player.input.turn = 0;
        } else if (key === ' ') {
            this.game.player.input.boost = false;
        } else if (key === 'e') {
            this.keys.e = false;
        }
    }
    
    /**
     * Cycle between map modes: whale, gates, both
     */
    cycleMapMode() {
        if (!this.game) return;
        
        // Skip if game is paused
        if (this.game.ui && this.game.ui.isGamePaused) return;
        
        switch (this.mapMode) {
            case 'whale':
                this.mapMode = 'gates';
                this.reloadMap(false, true);
                break;
                
            case 'gates':
                this.mapMode = 'both';
                this.reloadMap(true, true);
                break;
                
            case 'both':
                this.mapMode = 'whale';
                this.reloadMap(true, false);
                break;
        }
    }
    
    /**
     * Reload the map with selected options
     */
    reloadMap(includeWhale, includeGates) {
        if (!this.game) return;
        
        // First, clear existing obstacles
        if (this.game.worldManager) {
            this.game.worldManager.clearObstacles();
        }
        
        // Clear existing sea creatures
        if (this.game.seaCreatures) {
            this.game.seaCreatures.clear();
        }
        
        // Recreate with selected options
        if (includeWhale && this.game.seaCreatures) {
            this.game.seaCreatures.addWhale();
            if (this.game.worldManager) {
                this.game.worldManager.settings.hasWhale = true;
            }
        } else if (this.game.worldManager) {
            this.game.worldManager.settings.hasWhale = false;
        }
        
        if (includeGates && this.game.worldManager) {
            this.game.worldManager.createObstacles();
            this.game.worldManager.settings.hasGates = true;
        } else if (this.game.worldManager) {
            this.game.worldManager.settings.hasGates = false;
        }
    }
    
    /**
     * Cycle play area size
     */
    cyclePlayAreaSize() {
        console.log("I key pressed - cycling play area size");
        
        // Get current play area size
        const currentSize = this.playAreaSize;
        
        // Cycle through sizes
        if (currentSize === 100) {
            this.playAreaSize = 150;
        } else if (currentSize === 150) {
            this.playAreaSize = 200;
        } else {
            this.playAreaSize = 100;
        }
        
        // Update environment
        if (this.game.environment) {
            this.game.environment.setPlayAreaSize(this.playAreaSize);
        }
        
        // Update gates
        if (this.game.worldManager) {
            // Clear existing gates
            this.game.worldManager.clear();
            
            // Create new gates
            const gateCount = Math.floor(this.playAreaSize / 10); // 10, 15, or 20 gates
            this.game.worldManager.createGates(gateCount);
        }
        
        console.log(`Play area size set to ${this.playAreaSize}`);
    }
    
    /**
     * Toggle music on/off
     */
    toggleMusic() {
        if (!this.game) return;
        
        // Skip if game is paused
        if (this.game.ui && this.game.ui.isGamePaused) return;
        
        // Toggle music through the music player
        if (this.game.musicPlayer) {
            console.log("Toggling music...");
            const currentVolume = this.game.musicPlayer.volume;
            if (currentVolume > 0) {
                // Store volume before muting
                this.game.musicPlayer._previousVolume = currentVolume;
                this.game.musicPlayer.setVolume(0);
                console.log("Music muted");
            } else {
                // Restore previous volume or use default
                const volumeToSet = this.game.musicPlayer._previousVolume || 0.5;
                this.game.musicPlayer.setVolume(volumeToSet);
                console.log("Music unmuted, volume:", volumeToSet);
            }
        } else {
            console.warn("Music player not initialized");
        }
    }
    
    /**
     * Cycle between camera modes when above water
     */
    cycleCameraMode() {
        if (!this.game || !this.game.player) return;
        
        // Skip if game is paused
        if (this.game.ui && this.game.ui.isGamePaused) return;
        
        // Only allow camera mode cycling when above water
        if (this.game.player.isUnderwater) {
            if (this.game.ui) {
                this.game.ui.addTrick("Camera modes only available above water");
            }
            return;
        }
        
        // Cycle between camera modes
        if (!this.game.player.cameraMode) {
            this.game.player.cameraMode = "fixed";
        } else if (this.game.player.cameraMode === "fixed") {
            this.game.player.cameraMode = "follow";
        } else if (this.game.player.cameraMode === "follow") {
            this.game.player.cameraMode = "top";
        } else if (this.game.player.cameraMode === "top") {
            this.game.player.cameraMode = "fixed";
        }
        
        // Update camera based on new mode
        this.game.player.updateCameraMode();
        
        // Show notification
        if (this.game.ui) {
            this.game.ui.addTrick(`Camera mode: ${this.game.player.cameraMode}`);
        }
    }
    
    /**
     * Toggle free camera mode
     */
    toggleFreeCameraMode() {
        if (!this.game || !this.game.player || !this.game.scene) return;
        
        // Skip if game is paused
        if (this.game.ui && this.game.ui.isGamePaused) return;
        
        this.freeCamMode = !this.freeCamMode;
        
        if (this.freeCamMode) {
            // Store current camera position and target
            const currentCamera = this.game.scene.activeCamera;
            if (!currentCamera) return;
            
            this.savedCameraPosition = currentCamera.position.clone();
            this.savedCameraTarget = this.game.player.mesh.position.clone();
            
            // Create free camera if it doesn't exist
            if (!this.freeCamera) {
                this.freeCamera = new BABYLON.FreeCamera("freeCamera", this.savedCameraPosition, this.game.scene);
                this.freeCamera.setTarget(this.savedCameraTarget);
                
                // Set camera speed
                this.freeCamera.speed = 2.0;
                
                // Enable camera controls
                this.freeCamera.keysUp = []; // Disable default keys
                this.freeCamera.keysDown = [];
                this.freeCamera.keysLeft = [];
                this.freeCamera.keysRight = [];
            } else {
                // Update free camera position and target
                this.freeCamera.position = this.savedCameraPosition;
                this.freeCamera.setTarget(this.savedCameraTarget);
            }
            
            // Set free camera as active
            this.game.scene.activeCamera = this.freeCamera;
            
            // Show notification
            if (this.game.ui) {
                this.game.ui.addTrick("Free camera mode enabled - Use ZQSD to move");
            }
            
            console.log("Free camera mode enabled");
        } else {
            // Switch back to player camera
            if (this.game.player.isUnderwater) {
                this.game.scene.activeCamera = this.game.player.followCamera;
            } else {
                this.game.scene.activeCamera = this.game.player.aerialCamera;
            }
            
            // Reset camera target to player
            if (this.game.player.camera) {
                this.game.player.camera.lockedTarget = this.game.player.mesh;
            }
            
            // Show notification
            if (this.game.ui) {
                this.game.ui.addTrick("Free camera mode disabled");
            }
            
            console.log("Free camera mode disabled");
        }
    }
    
    /**
     * Toggle chunk debug mode - simplified to do nothing
     */
    toggleChunkDebugMode() {
        console.log("Chunk debug mode removed");
    }
} 