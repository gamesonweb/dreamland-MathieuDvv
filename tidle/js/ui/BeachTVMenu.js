/**
 * Classe BeachTVMenu pour afficher un menu TV simple
 */
class BeachTVMenu {
    constructor(scene, game) {
        console.log("Initialisation de BeachTVMenu...");
        this.scene = scene;
        this.game = game;
        this.isOpen = false;
        this.menuUI = null;
        this.menuContainer = null;
        
        // Créer le menu UI
        this.createMenu();
        
        console.log("Initialisation de BeachTVMenu terminée");
    }
    
    /**
     * Créer l'interface du menu
     */
    createMenu() {
        // Créer une interface en plein écran
        this.menuUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("BeachTVMenuUI");
        
        // Créer le conteneur principal
        this.menuContainer = new BABYLON.GUI.Rectangle();
        this.menuContainer.width = "600px";
        this.menuContainer.height = "400px";
        this.menuContainer.cornerRadius = 20;
        this.menuContainer.color = "white";
        this.menuContainer.thickness = 2;
        this.menuContainer.background = "#333333E0";
        this.menuContainer.isVisible = false;
        this.menuUI.addControl(this.menuContainer);
        
        // Créer le titre
        const titleText = new BABYLON.GUI.TextBlock();
        titleText.text = "BEACH TV";
        titleText.color = "white";
        titleText.fontSize = 24;
        titleText.height = "40px";
        titleText.fontStyle = "bold";
        titleText.top = "-160px";
        this.menuContainer.addControl(titleText);
        
        // Créer le contenu
        const contentText = new BABYLON.GUI.TextBlock();
        contentText.text = "Bienvenue sur Beach TV!\n\nCeci est une version simplifiée du menu TV.\nProfitez de votre séjour à la plage!";
        contentText.color = "white";
        contentText.fontSize = 18;
        contentText.height = "200px";
        contentText.top = "-40px";
        this.menuContainer.addControl(contentText);
        
        // Créer le bouton de fermeture
        const closeButton = BABYLON.GUI.Button.CreateSimpleButton("closeButton", "FERMER");
        closeButton.width = "150px";
        closeButton.height = "40px";
        closeButton.color = "white";
        closeButton.cornerRadius = 20;
        closeButton.background = "#4CAF50";
        closeButton.top = "120px";
        closeButton.onPointerUpObservable.add(() => {
            this.close();
        });
        this.menuContainer.addControl(closeButton);
    }
    
    /**
     * Ouvrir le menu
     */
    open() {
        if (!this.isOpen) {
            this.menuContainer.isVisible = true;
            this.isOpen = true;
            
            // Mettre le jeu en pause
            if (this.game) {
                this.game.pauseGame();
            }
        }
    }
    
    /**
     * Fermer le menu
     */
    close() {
        if (this.isOpen) {
            this.menuContainer.isVisible = false;
            this.isOpen = false;
            
            // Reprendre le jeu
            if (this.game) {
                this.game.resumeGame();
            }
        }
    }
    
    /**
     * Basculer l'état du menu
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
} 