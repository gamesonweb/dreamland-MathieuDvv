/**
 * Classe MusicPlayer pour gérer le chargement et la lecture des pistes musicales
 */
class MusicPlayer {
    /**
     * Constructeur
     * @param {BABYLON.Scene} scene - La scène
     * @param {UIManager} ui - Le gestionnaire d'interface utilisateur
     */
    constructor(scene, ui) {
        this.scene = scene;
        this.ui = ui;
        this.currentTrackIndex = 0;
        this.playlist = [];
        this.currentTrack = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.trackNameText = null;
        
        // Initialiser le lecteur de musique
        this.initialize();
    }
    
    /**
     * Initialiser le lecteur de musique
     */
    initialize() {
        console.log("Initialisation du lecteur de musique...");
        
        // Si l'interface est déjà initialisée, créer l'affichage du nom de la piste
        if (this.ui.mainUI) {
            this.createTrackNameDisplay();
        } else {
            // Sinon, attendre que l'interface soit initialisée
            console.log("En attente de l'initialisation de l'interface...");
            // Vérifier toutes les 100ms si l'interface est initialisée
            const checkInterval = setInterval(() => {
                if (this.ui.mainUI) {
                    clearInterval(checkInterval);
                    this.createTrackNameDisplay();
                }
            }, 100);
        }
    }
    
    /**
     * Créer l'affichage du nom de la piste
     */
    createTrackNameDisplay() {
        // Créer AdvancedDynamicTexture pour le nom de la piste
        if (!this.ui.mainUI) {
            console.warn("Interface principale pas encore initialisée, report de la création de l'affichage du nom de la piste");
            return;
        }
        
        // Créer un bloc de texte pour le nom de la piste
        this.trackNameText = new BABYLON.GUI.TextBlock();
        this.trackNameText.text = "";
        this.trackNameText.color = "white";
        this.trackNameText.fontSize = 16;
        this.trackNameText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.trackNameText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.trackNameText.paddingLeft = "10px";
        this.trackNameText.paddingBottom = "10px";
        this.ui.mainUI.addControl(this.trackNameText);
    }
    
    /**
     * Charger la liste de lecture depuis le répertoire assets/Sounds/Musics
     */
    loadPlaylist() {
        console.log("Chargement de la liste de lecture musicale...");
        
        this.addTrackToPlaylist("Aqua Horizon", "assets/Sounds/Musics/Aqua-Horizon.mp3");
        this.addTrackToPlaylist("Bliss", "assets/Sounds/Musics/Bliss.mp3");
        this.addTrackToPlaylist("Carrot Car", "assets/Sounds/Musics/Carrot-car.mp3");
        this.addTrackToPlaylist("Editing a Mii", "assets/Sounds/Musics/Editing-a-Mii.mp3");
        this.addTrackToPlaylist("Emerald Sparkles", "assets/Sounds/Musics/Emerald-Sparkles.mp3");
        this.addTrackToPlaylist("Gelwave", "assets/Sounds/Musics/Gelwave.mp3");
        this.addTrackToPlaylist("Dolphin", "assets/Sounds/Musics/glaciære.mp3");
        this.addTrackToPlaylist("Hang Glider", "assets/Sounds/Musics/Hang-Glider.mp3");
        this.addTrackToPlaylist("LEASE", "assets/Sounds/Musics/LEASE.mp3");
        this.addTrackToPlaylist("Lotus Waters", "assets/Sounds/Musics/Lotus-waters.mp3");
        this.addTrackToPlaylist('Low Poly Heaven', 'assets/Sounds/Musics/Low-poly-heaven.mp3');
        this.addTrackToPlaylist("Moog City 2", "assets/Sounds/Musics/Moog-city-2.mp3");
        this.addTrackToPlaylist("November 8", "assets/Sounds/Musics/November8.mp3");
        this.addTrackToPlaylist("Online play", "assets/Sounds/Musics/Online-Play.mp3");
        this.addTrackToPlaylist("Overpopulation", "assets/Sounds/Musics/Overpopulation.mp3");
        this.addTrackToPlaylist("Photo Channel 03", "assets/Sounds/Musics/Photo-Channel-03.mp3");
        this.addTrackToPlaylist("Sabbath", "assets/Sounds/Musics/Sabbath.mp3");
        this.addTrackToPlaylist("Scenic", "assets/Sounds/Musics/Scenic.mp3");
        this.addTrackToPlaylist("Shores Of Tomorrows", "assets/Sounds/Musics/Shores-Of-Tomorrow.mp3");
        this.addTrackToPlaylist("Staff credits", "assets/Sounds/Musics/Staff-credits.mp3");
        this.addTrackToPlaylist("Subwoofer Lullaby", "assets/Sounds/Musics/Subwoofer-Lullaby.mp3");
        this.addTrackToPlaylist("Sunburst", "assets/Sounds/Musics/Sunburst.mp3");
        this.addTrackToPlaylist("Swingin Spathiphyllums", "assets/Sounds/Musics/Swingin-Spathiphyllums.mp3");
        this.addTrackToPlaylist("Wii Party Main Menu", "assets/Sounds/Musics/Wii-party-main-menu.mp3");
        // Mélanger la liste de lecture
        this.playlist = this.playlist.sort(() => Math.random() - 0.5);
        
        // Commencer la lecture si nous avons des pistes
        if (this.playlist.length > 0) {
            this.playCurrentTrack();
        }
    }
    
    /**
     * Ajouter une piste à la liste de lecture
     * @param {string} name - Le nom de la piste
     * @param {string} path - Le chemin vers le fichier de la piste
     */
    addTrackToPlaylist(name, path) {
        this.playlist.push({
            name: name,
            path: path,
            sound: null
        });
    }
    
    /**
     * Lire la piste actuelle
     */
    playCurrentTrack() {
        if (this.playlist.length === 0) {
            console.warn("La liste de lecture est vide");
            return;
        }
        
        const track = this.playlist[this.currentTrackIndex];
        
        // Si la piste est déjà chargée, la lire
        if (track.sound) {
            this.playTrack(track);
            return;
        }
        
        // Sinon, la charger et la lire
        console.log(`Chargement de la piste: ${track.name}`);
        track.sound = new BABYLON.Sound(
            track.name,
            track.path,
            this.scene,
            () => {
                console.log(`Piste chargée: ${track.name}`);
                this.playTrack(track);
            },
            {
                autoplay: false,
                volume: this.volume
            }
        );
        
        // Ajouter un écouteur d'événement pour la fin de la piste
        track.sound.onended = () => {
            console.log(`Piste terminée: ${track.name}`);
            this.playNextTrack();
        };
    }
    
    /**
     * Lire une piste
     * @param {Object} track - La piste à lire
     */
    playTrack(track) {
        // Arrêter la piste actuelle si elle est en cours de lecture
        if (this.currentTrack && this.currentTrack.sound && this.currentTrack.sound.isPlaying) {
            this.currentTrack.sound.stop();
        }
        
        // Lire la nouvelle piste
        this.currentTrack = track;
        track.sound.play();
        this.isPlaying = true;
        
        // Mettre à jour l'affichage du nom de la piste
        this.updateTrackNameDisplay();
        
        console.log(`Lecture en cours: ${track.name}`);
    }
    
    /**
     * Lire la piste suivante dans la liste de lecture
     */
    playNextTrack() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.playCurrentTrack();
    }
    
    /**
     * Mettre à jour l'affichage du nom de la piste
     */
    updateTrackNameDisplay() {
        if (this.trackNameText && this.currentTrack) {
            this.trackNameText.text = `♪ Lecture en cours: ${this.currentTrack.name}`;
        }
    }
    
    /**
     * Définir le volume
     * @param {number} volume - Le volume (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // Mettre à jour le volume pour toutes les pistes
        this.playlist.forEach(track => {
            if (track.sound) {
                track.sound.setVolume(this.volume);
            }
        });

        // Mettre à jour les sons ambiants s'ils existent
        if (this.scene.game) {
            if (this.scene.game.ambientSound) {
                this.scene.game.ambientSound.setVolume(this.volume * 0.3);
            }
            if (this.scene.game.wavesSounds) {
                this.scene.game.wavesSounds.forEach(wave => {
                    wave.setVolume(this.volume * 0.4);
                });
            }
        }

        // Afficher l'indicateur de volume dans l'affichage du nom de la piste
        if (this.trackNameText) {
            const volumeText = `Volume: ${Math.round(this.volume * 100)}%`;
            const currentTrackName = this.currentTrack ? ` | ♪ ${this.currentTrack.name}` : '';
            this.trackNameText.text = volumeText + currentTrackName;
            
            // Réinitialiser pour n'afficher que le nom de la piste après un délai
            clearTimeout(this._volumeDisplayTimeout);
            this._volumeDisplayTimeout = setTimeout(() => {
                if (this.currentTrack) {
                    this.trackNameText.text = `♪ ${this.currentTrack.name}`;
                } else {
                    this.trackNameText.text = '';
                }
            }, 2000);
        }
    }
} 