/**
 * Classe UIManager pour gérer tous les éléments d'interface utilisateur du jeu
 */
class UIManager {
    /**
     * Constructeur
     * @param {BABYLON.Scene} scene - La scène
     * @param {Player} [player=null] - Le joueur (optionnel)
     */
    constructor(scene, player = null) {
        this.scene = scene;
        this.player = player;
        this.game = null; // Sera défini par la classe Game
        
        // Textures d'interface utilisateur
        this.mainUI = null;
        this.trickCounts = {}; // Stocker les compteurs de figures
        
        // Compteur FPS
        this.fpsCounter = null;
        this.showFps = false;
        
        // Interface de niveau
        this.levelPanel = null;
        this.scoreText = null;
        this.levelNameText = null;
        this.targetText = null;
        this.levelCompleteContainer = null;
        
        // Écran de chargement
        this.loadingScreen = null;
        this.loadingText = null;
        this.tooltipText = null;
        this.loadingProgress = 0;
        
        // Modal des contrôles clavier
        this.keyControlsModal = null;
        this.isGamePaused = false;
        
        // Initialiser l'interface utilisateur
        this.initialize();
    }
    
    /**
     * Définir la référence au joueur
     * @param {Player} player - L'objet joueur
     */
    setPlayer(player) {
        this.player = player;
    }
    
    /**
     * Initialiser tous les éléments d'interface utilisateur
     */
    initialize() {
        this.createMainUI();
        this.createSpeedMeter();
        this.createTrickListUI();
        this.createFpsCounter();
        this.createLoadingScreen();
        this.createKeyControlsModal();
    }
    
    /**
     * Créer l'interface utilisateur principale
     */
    createMainUI() {
        // Créer une interface en plein écran
        this.mainUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("MainUI");
    }
    
    /**
     * Créer un indicateur de vitesse (style compteur de vitesse)
     */
    createSpeedMeter() {
        // Créer un conteneur pour l'indicateur de vitesse
        const speedContainer = new BABYLON.GUI.Ellipse();
        speedContainer.width = "150px";
        speedContainer.height = "150px";
        speedContainer.thickness = 2;
        speedContainer.color = "white";
        speedContainer.background = "transparent";
        speedContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        speedContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        speedContainer.left = "30px";
        speedContainer.top = "30px";
        this.mainUI.addControl(speedContainer);
        
        // Ajouter l'étiquette de vitesse
        const speedLabel = new BABYLON.GUI.TextBlock();
        speedLabel.text = "Vitesse / s";
        speedLabel.color = "white";
        speedLabel.fontSize = 16;
        speedLabel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        speedLabel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        speedContainer.addControl(speedLabel);
        
        // Stocker la référence au conteneur et à l'étiquette de vitesse
        this.speedContainer = speedContainer;
        this.speedLabel = speedLabel;
        
        // Enregistrer la fonction de mise à jour
        this.scene.registerBeforeRender(() => {
            this.updateSpeedMeter();
        });
    }
    
    /**
     * Mettre à jour l'indicateur de vitesse
     */
    updateSpeedMeter() {
        if (this.player && this.player.velocity) {
            // Calculer la vitesse
            const speed = this.player.velocity.length();
            
            // Mettre à jour le texte de l'étiquette de vitesse avec la vitesse actuelle
            this.speedLabel.text = speed.toFixed(2) + " m/s";
            
            // Mettre à jour la couleur de l'étiquette de vitesse en fonction de la vitesse
            if (speed > 1.0) {
                this.speedLabel.color = "yellow";
            } else if (speed > 0.5) {
                this.speedLabel.color = "white";
            } else {
                this.speedLabel.color = "white";
            }
        }
    }
    
    /**
     * Créer l'interface de liste des figures
     */
    createTrickListUI() {
        // Ajouter le score en haut de la liste - mais seulement s'il n'existe pas déjà
        if (!this.scoreText) {
            const scoreText = new BABYLON.GUI.TextBlock();
            scoreText.name = "scoreText";
            scoreText.text = "Score: " + (this.scene.game && this.scene.game.worldManager ? this.scene.game.worldManager.getScore() : 0);
            scoreText.color = "white";
            scoreText.fontSize = 24; // Taille de police augmentée
            scoreText.height = "30px";
            scoreText.top = "60px"; // Déplacer vers le bas depuis le haut
            scoreText.left = "20px"; // Déplacer depuis le bord gauche
            scoreText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT; // Aligner à gauche
            scoreText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP; // Aligner en haut
            this.mainUI.addControl(scoreText);
            this.scoreText = scoreText; // Stocker la référence au texte de score
        }
        
        // Nous ne créons plus le panneau de figures en haut à droite
        // pour garder l'interface plus propre
    }
    
    /**
     * Ajouter une figure à la liste des figures
     * @param {string} trickName - Nom de la figure
     */
    addTrick(trickName) {
        // Au lieu d'ajouter à un panneau, afficher simplement une notification temporaire
        this.showNotification(trickName, 2000);
    }
    
    /**
     * Créer l'interface des contrôles
     */
    createControlsUI() {
        // Créer un conteneur pour les contrôles
        const controlsContainer = new BABYLON.GUI.Rectangle();
        controlsContainer.width = "300px";
        controlsContainer.height = "300px";
        controlsContainer.thickness = 0;
        controlsContainer.background = "transparent";
        controlsContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        controlsContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        controlsContainer.right = "30px";
        controlsContainer.bottom = "30px";
        this.mainUI.addControl(controlsContainer);
        
        // Créer les contrôles directionnels
        this.createControlButton("Q", -60, 0, controlsContainer);
        this.createControlButton("Z", 0, -60, controlsContainer);
        this.createControlButton("S", 0, 60, controlsContainer);
        this.createControlButton("D", 60, 0, controlsContainer);
        
        // Créer la barre d'espace au centre en bas de l'écran
        const spaceBar = new BABYLON.GUI.Rectangle();
        spaceBar.width = "300px";
        spaceBar.height = "40px";
        spaceBar.cornerRadius = 20;
        spaceBar.color = "white";
        spaceBar.thickness = 2;
        spaceBar.background = "transparent";
        spaceBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        spaceBar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        spaceBar.bottom = "30px";
        this.mainUI.addControl(spaceBar);
        
        // Ajouter l'étiquette d'espace
        const spaceLabel = new BABYLON.GUI.TextBlock();
        spaceLabel.text = "Espace";
        spaceLabel.color = "white";
        spaceLabel.fontSize = 18;
        spaceBar.addControl(spaceLabel);
        
        // Ajouter les instructions de contrôle
        this.createControlInstructions();
    }
    
    /**
     * Créer un bouton de contrôle
     * @param {string} key - L'étiquette de la touche
     * @param {number} offsetX - Décalage X par rapport au centre
     * @param {number} offsetY - Décalage Y par rapport au centre
     * @param {BABYLON.GUI.Container} container - Le conteneur auquel ajouter le bouton
     */
    createControlButton(key, offsetX, offsetY, container) {
        // Créer le bouton
        const button = new BABYLON.GUI.Ellipse();
        button.width = "50px";
        button.height = "50px";
        button.color = "white";
        button.thickness = 2;
        button.background = "transparent";
        button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        button.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        button.left = offsetX;
        button.top = offsetY;
        container.addControl(button);
        
        // Ajouter l'étiquette de la touche
        const keyLabel = new BABYLON.GUI.TextBlock();
        keyLabel.text = key;
        keyLabel.color = "white";
        keyLabel.fontSize = 20;
        button.addControl(keyLabel);
    }

    
    /**
     * Créer le compteur FPS
     */
    createFpsCounter() {
        // Créer le texte FPS
        this.fpsCounter = new BABYLON.GUI.TextBlock();
        this.fpsCounter.text = "FPS: 0";
        this.fpsCounter.color = "white";
        this.fpsCounter.fontSize = 16;
        this.fpsCounter.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.fpsCounter.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.fpsCounter.left = "30px";
        this.fpsCounter.top = "200px"; // En dessous de l'indicateur de vitesse
        this.fpsCounter.isVisible = this.showFps; // Masqué par défaut
        this.mainUI.addControl(this.fpsCounter);
        
        // Enregistrer la fonction de mise à jour pour le FPS
        this.scene.registerBeforeRender(() => {
            if (this.showFps) {
                this.fpsCounter.text = "FPS: " + this.scene.getEngine().getFps().toFixed(0);
            }
        });
    }
    
    /**
     * Basculer la visibilité du compteur FPS
     */
    toggleFpsCounter() {
        this.showFps = !this.showFps;
        this.fpsCounter.isVisible = this.showFps;
    }
    
    /**
     * Créer l'interface de niveau terminé
     */
    createLevelCompleteUI() {
        // Créer un conteneur pour le message de niveau terminé
        this.levelCompleteContainer = new BABYLON.GUI.Rectangle();
        this.levelCompleteContainer.width = "400px";
        this.levelCompleteContainer.height = "200px";
        this.levelCompleteContainer.cornerRadius = 20;
        this.levelCompleteContainer.color = "white";
        this.levelCompleteContainer.thickness = 2;
        this.levelCompleteContainer.background = "rgba(0, 0, 0, 0.7)";
        this.levelCompleteContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.levelCompleteContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.levelCompleteContainer.isVisible = false; // Masqué par défaut
        this.mainUI.addControl(this.levelCompleteContainer);
        
        // Créer un panneau d'empilement pour le contenu
        const completePanel = new BABYLON.GUI.StackPanel();
        this.levelCompleteContainer.addControl(completePanel);
        
        // Ajouter le texte de complétion
        const completeText = new BABYLON.GUI.TextBlock();
        completeText.text = "Niveau Terminé !";
        completeText.color = "white";
        completeText.fontSize = 24;
        completeText.height = "50px";
        completePanel.addControl(completeText);
        
        // Ajouter le texte de score
        const finalScoreText = new BABYLON.GUI.TextBlock();
        finalScoreText.name = "finalScoreText";
        finalScoreText.text = "Votre Score: 0";
        finalScoreText.color = "white";
        finalScoreText.fontSize = 18;
        finalScoreText.height = "30px";
        completePanel.addControl(finalScoreText);
        
        // Ajouter le bouton de niveau suivant
        const nextLevelButton = BABYLON.GUI.Button.CreateSimpleButton("nextLevelButton", "Niveau Suivant");
        nextLevelButton.width = "150px";
        nextLevelButton.height = "40px";
        nextLevelButton.color = "white";
        nextLevelButton.cornerRadius = 20;
        nextLevelButton.background = "green";
        nextLevelButton.onPointerUpObservable.add(() => {
            // Appeler la fonction de niveau suivant sur le jeu
            if (this.scene.game && this.scene.game.worldManager) {
                // Plus de niveaux dans le nouveau système
                this.hideLevelComplete();
            }
        });
        completePanel.addControl(nextLevelButton);
    }
    
    /**
     * Afficher l'interface de niveau terminé
     */
    showLevelComplete() {
        if (!this.levelCompleteUI) {
            this.createLevelCompleteUI();
        }
        
        // Mettre à jour le score final
        if (this.levelCompleteUI) {
            const finalScoreText = this.levelCompleteUI.getChildByName("finalScoreText");
            if (finalScoreText && this.scene.game && this.scene.game.worldManager) {
                finalScoreText.text = "Votre Score: " + (this.scene.game.worldManager.getScore ? this.scene.game.worldManager.getScore() : this.scene.game.worldManager.score || 0);
            }
            
            this.levelCompleteUI.isVisible = true;
            
            // Jouer le son de niveau terminé
            this.playLevelCompleteSound();
        }
    }
    
    /**
     * Masquer l'interface de niveau terminé
     */
    hideLevelComplete() {
        this.levelCompleteContainer.isVisible = false;
    }
    
    /**
     * Mettre à jour l'interface de niveau
     * @param {Object} levelData - Données du niveau
     * @param {number} score - Score actuel
     */
    updateLevelUI(levelData, score) {
    }
    
    /**
     * Mettre à jour l'affichage du score
     * @param {number} score - Score actuel
     */
    updateScore(score) {
        // Si nous avons une référence stockée au texte de score, le mettre simplement à jour
        if (this.scoreText) {
            this.scoreText.text = "Score: " + score;
            return;
        }
        
        // Si nous n'avons pas de référence, supprimer d'abord tous les éléments de texte de score existants
        const toRemove = [];
        for (let i = 0; i < this.mainUI.getChildren().length; i++) {
            const control = this.mainUI.getChildren()[i];
            if (control.name === "scoreText") {
                toRemove.push(control);
            }
        }
        
        // Supprimer tous les éléments de texte de score trouvés
        for (const control of toRemove) {
            this.mainUI.removeControl(control);
        }
        
        // Créer un nouvel élément de texte de score
        const scoreText = new BABYLON.GUI.TextBlock();
        scoreText.name = "scoreText";
        scoreText.text = "Score: " + score;
        scoreText.color = "white";
        scoreText.fontSize = 24;
        scoreText.height = "30px";
        scoreText.top = "60px";
        scoreText.left = "20px";
        scoreText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        scoreText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.mainUI.addControl(scoreText);
        this.scoreText = scoreText; // Store reference to the score text
    }
    
    /**
     * Show a temporary notification message
     * @param {string} message - The message to display
     * @param {number} [duration=3000] - Duration in milliseconds
     */
    showNotification(message, duration = 3000) {
        // Create notification text
        const notification = new BABYLON.GUI.TextBlock();
        notification.text = message;
        notification.color = "white";
        notification.fontSize = 20;
        notification.height = "30px";
        notification.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        notification.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        notification.top = "120px";
        notification.outlineWidth = 1;
        notification.outlineColor = "black";
        this.mainUI.addControl(notification);
        
        // Animate notification
        notification.alpha = 0;
        const fadeIn = new BABYLON.Animation("fadeIn", "alpha", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        const fadeInKeys = [
            { frame: 0, value: 0 },
            { frame: 10, value: 1 }
        ];
        fadeIn.setKeys(fadeInKeys);
        
        const fadeOut = new BABYLON.Animation("fadeOut", "alpha", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        const fadeOutKeys = [
            { frame: 0, value: 1 },
            { frame: 10, value: 0 }
        ];
        fadeOut.setKeys(fadeOutKeys);
        
        // Play fade in animation
        this.scene.beginDirectAnimation(notification, [fadeIn], 0, 10, false, 1, () => {
            // After fade in, wait and then fade out
            setTimeout(() => {
                this.scene.beginDirectAnimation(notification, [fadeOut], 0, 10, false, 1, () => {
                    // Remove notification after fade out
                    this.mainUI.removeControl(notification);
                });
            }, duration - 600); // Subtract animation time from duration
        });
    }
    
    /**
     * Play level complete sound
     */
    playLevelCompleteSound() {
        // Create a sound for level completion
        const completeSound = new BABYLON.Sound("levelCompleteSound", "assets/sounds/levelComplete.wav", this.scene, null, {
            volume: 0.5
        });
        
        completeSound.play();
    }
    
    /**
     * Create loading screen
     */
    createLoadingScreen() {
        // Create a fullscreen container
        this.loadingScreen = new BABYLON.GUI.Rectangle();
        this.loadingScreen.width = "100%";
        this.loadingScreen.height = "100%";
        this.loadingScreen.color = "transparent";
        this.loadingScreen.background = "#000033"; // Darker blue background
        this.loadingScreen.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.loadingScreen.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.loadingScreen.isVisible = false; // Will be shown when needed
        this.loadingScreen.zIndex = 100; // Ensure it's on top of everything
        this.mainUI.addControl(this.loadingScreen);
        
        // Create a stack panel for content
        const loadingPanel = new BABYLON.GUI.StackPanel();
        loadingPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.loadingScreen.addControl(loadingPanel);
        
        // Add title
        const loadingTitle = new BABYLON.GUI.TextBlock();
        loadingTitle.text = "Tidle (beta)";
        loadingTitle.color = "#00AAFF"; // Bright blue color
        loadingTitle.fontSize = 42; // Increased size since we removed the image
        loadingTitle.fontFamily = "Helvetica, Arial, sans-serif";
        loadingTitle.height = "80px"; // Increased height 
        loadingTitle.shadowBlur = 5;
        loadingTitle.shadowColor = "black";
        loadingTitle.paddingBottom = "30px"; // Increased padding
        loadingPanel.addControl(loadingTitle);
        
        // Add loading text
        this.loadingText = new BABYLON.GUI.TextBlock();
        this.loadingText.text = "Loading...";
        this.loadingText.color = "white";
        this.loadingText.fontSize = 24;
        this.loadingText.height = "50px";
        loadingPanel.addControl(this.loadingText);
        
        // Add progress bar container
        const progressBarContainer = new BABYLON.GUI.Rectangle();
        progressBarContainer.width = "400px";
        progressBarContainer.height = "25px";
        progressBarContainer.cornerRadius = 12;
        progressBarContainer.color = "white";
        progressBarContainer.thickness = 2;
        progressBarContainer.background = "transparent";
        loadingPanel.addControl(progressBarContainer);
        
        // Add progress bar
        this.progressBar = new BABYLON.GUI.Rectangle();
        this.progressBar.width = "0%";
        this.progressBar.height = "100%";
        this.progressBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.progressBar.background = "#00AAFF"; // Bright blue
        this.progressBar.cornerRadius = 10;
        progressBarContainer.addControl(this.progressBar);
        
        // Add tooltip text
        this.tooltipText = new BABYLON.GUI.TextBlock();
        this.tooltipText.text = "";
        this.tooltipText.color = "white";
        this.tooltipText.fontSize = 18;
        this.tooltipText.height = "80px";
        this.tooltipText.textWrapping = true;
        this.tooltipText.width = "80%";
        this.tooltipText.top = "40px";
        this.tooltipText.fontStyle = "italic";
        loadingPanel.addControl(this.tooltipText);
    }
    
    /**
     * Show loading screen
     * @param {string} tooltip - Tooltip to display
     */
    showLoadingScreen(tooltip = "") {
        this.loadingScreen.isVisible = true;
        this.loadingProgress = 0;
        this.updateLoadingProgress(0);
        
        if (tooltip) {
            this.tooltipText.text = tooltip;
        }
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        this.loadingScreen.isVisible = false;
    }
    
    /**
     * Update loading progress
     * @param {number} progress - Progress value (0-1)
     */
    updateLoadingProgress(progress) {
        this.loadingProgress = Math.min(1, Math.max(0, progress));
        const percentage = Math.floor(this.loadingProgress * 100);
        this.progressBar.width = percentage + "%";
        this.loadingText.text = `Loading... ${percentage}%`;
    }
    
    /**
     * Create key controls modal
     */
    createKeyControlsModal() {
        // Create modal container
        this.keyControlsModal = new BABYLON.GUI.Rectangle();
        this.keyControlsModal.width = "300px";
        this.keyControlsModal.height = "400px";
        this.keyControlsModal.cornerRadius = 20;
        this.keyControlsModal.color = "white";
        this.keyControlsModal.thickness = 2;
        this.keyControlsModal.background = "rgba(0, 0, 0, 0.8)";
        this.keyControlsModal.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.keyControlsModal.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.keyControlsModal.right = "20px"; // Position from right edge
        this.keyControlsModal.isVisible = false; // Hide by default
        this.mainUI.addControl(this.keyControlsModal);
        
        // Title
        const title = new BABYLON.GUI.TextBlock();
        title.text = "KEYBOARD CONTROLS";
        title.color = "white";
        title.fontSize = 20;
        title.height = "40px";
        title.top = "-150px";
        this.keyControlsModal.addControl(title);
        
        // Subtitle - Press P to close
        const subtitle = new BABYLON.GUI.TextBlock();
        subtitle.text = "Press P to close";
        subtitle.color = "yellow";
        subtitle.fontSize = 14;
        subtitle.height = "20px";
        subtitle.top = "-125px";
        this.keyControlsModal.addControl(subtitle);
        
        // Key descriptions
        const controls = [
            { key: "P", desc: "Show/Hide Controls" },
            { key: "O", desc: "Whale → Gates → Both" },
            { key: "I", desc: "Area Size: 100→150→200" },
            { key: "M", desc: "Toggle Music" },
            { key: "C", desc: "Free Camera Mode" },
            { key: "L", desc: "Change Camera View" },
            { key: "SPACE", desc: "Boost Underwater" },
            { key: "Z/Q/S/D", desc: "Movement Controls" },
            { key: "F", desc: "Show FPS Counter" }
        ];
        
        controls.forEach((control, index) => {
            const controlContainer = new BABYLON.GUI.Rectangle();
            controlContainer.height = "30px";
            controlContainer.thickness = 0;
            controlContainer.background = "transparent";
            controlContainer.top = -90 + (index * 30);
            this.keyControlsModal.addControl(controlContainer);
            
            // Key text
            const keyText = new BABYLON.GUI.TextBlock();
            keyText.text = control.key;
            keyText.color = "yellow";
            keyText.fontSize = 16;
            keyText.width = "80px";
            keyText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            controlContainer.addControl(keyText);
            
            // Description text
            const descText = new BABYLON.GUI.TextBlock();
            descText.text = control.desc;
            descText.color = "white";
            descText.fontSize = 14;
            descText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            controlContainer.addControl(descText);
        });
        
        // Add note at the bottom
        const note = new BABYLON.GUI.TextBlock();
        note.text = "Keyboard controls only";
        note.color = "gray";
        note.fontSize = 12;
        note.height = "20px";
        note.top = "150px";
        this.keyControlsModal.addControl(note);
    }
    
    /**
     * Toggle key controls modal visibility and pause/resume game
     */
    toggleKeyControlsModal() {
        if (!this.keyControlsModal) {
            this.createKeyControlsModal();
        }
        
        this.keyControlsModal.isVisible = !this.keyControlsModal.isVisible;
        this.isGamePaused = this.keyControlsModal.isVisible;
        
        // Pause or resume the game
        if (this.isGamePaused) {
            this.scene.pauseAnimation();
        } else {
            this.scene.resumeAnimation();
        }
    }
}

/**
 * VHS-style Upgrade Menu class to handle player upgrades
 */
class UpgradeMenu {
    /**
     * Constructor
     * @param {Game} game - The game instance
     */
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.player = game.player;
        this.environment = game.environment;
        
        // UI elements
        this.menuContainer = null;
        this.tvScreen = null;
        this.tapeContainer = null;
        this.tapes = [];
        this.confirmButton = null;
        this.closeButton = null;
        
        // Selected tape
        this.selectedTape = null;
        
        // Upgrade options
        this.upgrades = {
            playArea: {
                name: "Expand Area",
                description: "Expand the play area by 50 units",
                cost: 100,
                maxLevel: 3,
                currentLevel: 0,
                apply: (level) => {
                    // Calculate new play area size
                    const newSize = 100 + (level * 50);
                    
                    // Update play area size
                    this.environment.playAreaRadius = newSize;
                    
                    // Update boundary if it exists
                    if (this.environment.boundary) {
                        // Remove old boundary
                        this.environment.boundary.dispose();
                        
                        // Create new boundary
                        this.environment.createBoundary();
                    }
                    
                    // Update underwater boundary if it exists
                    if (this.environment.underwaterBoundary && this.environment.underwaterBoundary.length > 0) {
                        // Clear old underwater boundary
                        this.environment.clearUnderwaterBoundary();
                        
                        // Don't recreate the underwater boundary
                        console.log("Underwater boundary recreation disabled");
                    }
                    
                    return `Play area expanded to ${newSize} units`;
                }
            },
            speed: {
                name: "Enhance Speed",
                description: "Increase maximum speed",
                cost: 150,
                maxLevel: 3,
                currentLevel: 0,
                apply: (level) => {
                    // Calculate speed multiplier (10% increase per level)
                    const speedMultiplier = 1 + (level * 0.1);
                    
                    // Apply speed multiplier to player
                    this.player.speedMultiplier = speedMultiplier;
                    
                    return `Speed increased by ${level * 10}%`;
                }
            },
            jump: {
                name: "Enhance Jump",
                description: "Increase jump height",
                cost: 200,
                maxLevel: 3,
                currentLevel: 0,
                apply: (level) => {
                    // Calculate jump multiplier (15% increase per level)
                    const jumpMultiplier = 1 + (level * 0.15);
                    
                    // Apply jump multiplier to environment
                    this.environment.maxJumpHeight = 40 * jumpMultiplier;
                    
                    return `Jump height increased by ${level * 15}%`;
                }
            }
        };
        
        // Initialize UI
        this.initialize();
    }
    
    /**
     * Initialize the upgrade menu
     */
    initialize() {
        // Create fullscreen UI if it doesn't exist
        if (!this.game.ui || !this.game.ui.mainUI) {
            console.error("UI Manager not initialized");
            return;
        }
        
        // Create menu container - Made larger
        this.menuContainer = new BABYLON.GUI.Rectangle();
        this.menuContainer.width = "800px"; // Increased from 600px
        this.menuContainer.height = "700px"; // Increased from 500px
        this.menuContainer.thickness = 3; // Increased thickness
        this.menuContainer.color = "#333333";
        this.menuContainer.background = "#222222";
        this.menuContainer.cornerRadius = 15;
        this.menuContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.menuContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        
        // Create TV screen (4:3 ratio) - Made larger
        this.tvScreen = new BABYLON.GUI.Rectangle();
        this.tvScreen.width = "600px"; // Increased from 400px
        this.tvScreen.height = "450px"; // Increased from 300px
        this.tvScreen.thickness = 4;
        this.tvScreen.color = "#111111";
        this.tvScreen.background = "#000033";
        this.tvScreen.cornerRadius = 8;
        this.tvScreen.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.tvScreen.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.tvScreen.top = "30px";
        this.menuContainer.addControl(this.tvScreen);
        
        // Create TV screen text - Made larger
        this.tvScreenText = new BABYLON.GUI.TextBlock();
        this.tvScreenText.text = "Select a tape";
        this.tvScreenText.color = "#00FF00";
        this.tvScreenText.fontSize = 32; // Increased from 24
        this.tvScreenText.fontFamily = "Courier New";
        this.tvScreenText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.tvScreenText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        this.tvScreen.addControl(this.tvScreenText);
        
        // Create score display - Made larger
        this.scoreText = new BABYLON.GUI.TextBlock();
        this.scoreText.text = "Points: 0";
        this.scoreText.color = "#FFFF00";
        this.scoreText.fontSize = 24; // Increased from 18
        this.scoreText.fontFamily = "Courier New";
        this.scoreText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.scoreText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.scoreText.top = "15px";
        this.scoreText.right = "15px";
        this.tvScreen.addControl(this.scoreText);
        
        // Create tape container - Adjusted position
        this.tapeContainer = new BABYLON.GUI.StackPanel();
        this.tapeContainer.width = "600px"; // Increased from 400px
        this.tapeContainer.height = "200px"; // Increased from 150px
        this.tapeContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.tapeContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.tapeContainer.top = "500px"; // Adjusted from 340px
        this.tapeContainer.isVertical = false;
        this.menuContainer.addControl(this.tapeContainer);
        
        // Create VHS tapes for each upgrade
        const upgradeKeys = Object.keys(this.upgrades);
        for (let i = 0; i < upgradeKeys.length; i++) {
            const key = upgradeKeys[i];
            const upgrade = this.upgrades[key];
            
            // Create tape container
            const tape = new BABYLON.GUI.Rectangle();
            tape.width = "120px";
            tape.height = "80px";
            tape.thickness = 2;
            tape.color = "#555555";
            tape.background = "#333333";
            tape.cornerRadius = 0;
            tape.key = key; // Store the upgrade key
            
            // Create tape label area (the white part on top of VHS tapes)
            const tapeLabel = new BABYLON.GUI.Rectangle();
            tapeLabel.width = "100px";
            tapeLabel.height = "25px";
            tapeLabel.thickness = 1;
            tapeLabel.color = "#000000";
            tapeLabel.background = "#FFFFFF";
            tapeLabel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            tapeLabel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            tapeLabel.top = "5px";
            tape.addControl(tapeLabel);
            
            // Create tape name text
            const tapeName = new BABYLON.GUI.TextBlock();
            tapeName.text = upgrade.name;
            tapeName.color = "#000000";
            tapeName.fontSize = 12;
            tapeName.fontFamily = "Arial";
            tapeName.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            tapeName.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            tapeLabel.addControl(tapeName);
            
            // Create tape cost text
            const tapeCost = new BABYLON.GUI.TextBlock();
            tapeCost.text = `${upgrade.cost} pts`;
            tapeCost.color = "#FFFF00";
            tapeCost.fontSize = 14;
            tapeCost.fontFamily = "Arial";
            tapeCost.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            tapeCost.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            tapeCost.bottom = "10px";
            tape.addControl(tapeCost);
            
            // Create tape level text
            const tapeLevel = new BABYLON.GUI.TextBlock();
            tapeLevel.text = `Lvl: ${upgrade.currentLevel}/${upgrade.maxLevel}`;
            tapeLevel.color = "#FFFFFF";
            tapeLevel.fontSize = 12;
            tapeLevel.fontFamily = "Arial";
            tapeLevel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            tapeLevel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            tape.addControl(tapeLevel);
            
            // Add tape to container
            this.tapeContainer.addControl(tape);
            
            // Store references
            this.tapes.push({
                key,
                container: tape,
                nameText: tapeName,
                costText: tapeCost,
                levelText: tapeLevel
            });
            
            // Add tape click event
            tape.onPointerClickObservable.add(() => {
                this.selectTape(key);
            });
        }
        
        // Create confirm button - Made larger and more visible
        this.confirmButton = BABYLON.GUI.Button.CreateSimpleButton("confirmBtn", "CONFIRM");
        this.confirmButton.width = "200px";
        this.confirmButton.height = "50px";
        this.confirmButton.thickness = 3;
        this.confirmButton.color = "white";
        this.confirmButton.background = "#007700";
        this.confirmButton.cornerRadius = 12;
        this.confirmButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.confirmButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.confirmButton.bottom = "80px";
        this.confirmButton.fontSize = 24;
        this.menuContainer.addControl(this.confirmButton);
        
        // Create close button - Also using CreateSimpleButton
        this.closeButton = BABYLON.GUI.Button.CreateSimpleButton("closeBtn", "CLOSE");
        this.closeButton.width = "100px";
        this.closeButton.height = "30px";
        this.closeButton.thickness = 2;
        this.closeButton.color = "white";
        this.closeButton.background = "#770000";
        this.closeButton.cornerRadius = 10;
        this.closeButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.closeButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.closeButton.bottom = "20px";
        this.closeButton.fontSize = 16;
        this.menuContainer.addControl(this.closeButton);
        
        // Add close button click event
        this.closeButton.onPointerClickObservable.add(() => {
            this.close();
        });
        
        // Hide menu by default
        this.menuContainer.isVisible = false;
        
        // Add menu to UI
        this.game.ui.mainUI.addControl(this.menuContainer);
        
        console.log("Menu d'amélioration style VHS initialisé");
    }
    
    /**
     * Select a tape
     * @param {string} key - The upgrade key
     */
    selectTape(key) {
        // Get upgrade
        const upgrade = this.upgrades[key];
        
        // Get current score
        const score = this.game.score || 0;
        
        // Check if upgrade is available
        if (upgrade.currentLevel >= upgrade.maxLevel) {
            // Max level reached
            this.tvScreenText.text = "NIVEAU MAXIMUM ATTEINT";
            return;
        }
        
        // Update selected tape
        this.selectedTape = key;
        
        // Update TV screen text
        this.tvScreenText.text = `${upgrade.name}\nCoût: ${upgrade.cost} points\n${upgrade.description}`;
        
        // Update confirm button state
        if (score >= upgrade.cost) {
            this.confirmButton.background = "#007700";
            this.confirmButton.isEnabled = true;
        } else {
            this.confirmButton.background = "#555555";
            this.confirmButton.isEnabled = false;
        }
        
        // Update tape visuals
        for (const tape of this.tapes) {
            if (tape.key === key) {
                tape.container.color = "#FFFF00";
                tape.container.thickness = 3;
            } else {
                tape.container.color = "#555555";
                tape.container.thickness = 2;
            }
        }
    }
    
    /**
     * Confirm the selected upgrade
     */
    confirmUpgrade() {
        // Skip if no tape is selected
        if (!this.selectedTape) return;
        
        // Get upgrade
        const upgrade = this.upgrades[this.selectedTape];
        
        // Get current score
        const score = this.game.score || 0;
        
        // Check if upgrade is available
        if (upgrade.currentLevel >= upgrade.maxLevel) {
            // Max level reached
            this.game.ui.showNotification("Niveau maximum atteint", 2000);
            return;
        }
        
        // Check if player has enough points
        if (score < upgrade.cost) {
            // Not enough points
            this.game.ui.showNotification("Points insuffisants", 2000);
            return;
        }
        
        // Deduct points
        this.game.score -= upgrade.cost;
        
        // Increment upgrade level
        upgrade.currentLevel++;
        
        // Apply upgrade
        const message = upgrade.apply(upgrade.currentLevel);
        
        // Show notification
        this.game.ui.showNotification(message, 3000);
        
        // Update UI
        this.updateScoreDisplay();
        this.updateTapes();
        
        // Reset selection
        this.selectedTape = null;
        this.tvScreenText.text = "Amélioration appliquée !\nSélectionnez une autre cassette";
        this.confirmButton.isVisible = false;
        
        // Reset tape visuals
        for (const tape of this.tapes) {
            tape.container.color = "#555555";
            tape.container.thickness = 2;
        }
    }
    
    /**
     * Open the upgrade menu
     */
    open() {
        // Only open if not already visible
        if (this.menuContainer.isVisible) return;

        // Update score display
        this.updateScoreDisplay();
        
        // Update tapes
        this.updateTapes();
        
        // Reset selection
        this.selectedTape = null;
        this.tvScreenText.text = "Select a tape";
        this.confirmButton.isVisible = true; // Always show confirm button
        
        // Show menu
        this.menuContainer.isVisible = true;
        
        // Pause game
        this.game.pauseGame();
    }
    
    /**
     * Close the upgrade menu
     */
    close() {
        // Hide menu
        this.menuContainer.isVisible = false;
        
        // Resume game
        this.game.resumeGame();
        
        // Reset BeachTV interaction
        if (this.game && this.game.environment && this.game.environment.beachTVInteraction) {
            this.game.environment.beachTVInteraction.lastInteractionTime = 0;
            this.game.environment.beachTVInteraction.isMenuOpen = false;
        }
    }
    
    /**
     * Update the score display
     */
    updateScoreDisplay() {
        // Get current score
        const score = this.game.score || 0;
        
        // Update score text
        this.scoreText.text = `Points: ${score}`;
    }
    
    /**
     * Update the tapes
     */
    updateTapes() {
        // Get current score
        const score = this.game.score || 0;
        
        // Update each tape
        for (const tape of this.tapes) {
            const upgrade = this.upgrades[tape.key];
            
            // Update level text
            tape.levelText.text = `Lvl: ${upgrade.currentLevel}/${upgrade.maxLevel}`;
            
            // Update cost text
            tape.costText.text = `${upgrade.cost} pts`;
            
            // Update tape state
            if (upgrade.currentLevel >= upgrade.maxLevel) {
                // Max level reached
                tape.container.background = "#555555";
                tape.costText.text = "MAX";
                tape.costText.color = "#FFFFFF";
            } else if (score < upgrade.cost) {
                // Not enough points
                tape.container.background = "#333333";
                tape.costText.color = "#FF0000";
            } else {
                // Can purchase
                tape.container.background = "#333333";
                tape.costText.color = "#FFFF00";
            }
        }
    }
} 