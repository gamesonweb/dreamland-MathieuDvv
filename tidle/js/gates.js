/**
 * Classe Gate pour représenter une porte individuelle dans le jeu
 */
class Gate {
    constructor(scene, position, rotation, scale, id, game, isHorizontal) {
        this.scene = scene;
        this.game = game;
        this.id = id;
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.isHorizontal = isHorizontal;
        this.passed = false;
        this.points = 100;
        this.createMesh();
    }
    
    createMesh() {
        // Créer l'anneau principal
        this.mesh = BABYLON.MeshBuilder.CreateTorus("gate_" + this.id, {
            diameter: 8,
            thickness: 0.4,
            tessellation: 32
        }, this.scene);
        
        // Créer la hitbox (légèrement plus grande)
        this.hitbox = BABYLON.MeshBuilder.CreateTorus("gate_hitbox_" + this.id, {
            diameter: 8.5,
            thickness: 1,
            tessellation: 16
        }, this.scene);
        
        // Créer le matériau pour la porte
        const material = new BABYLON.StandardMaterial("gateMaterial_" + this.id, this.scene);
        material.emissiveColor = new BABYLON.Color3(0, 0.8, 1); // Lueur bleue vive
        material.alpha = 0.9;
        this.mesh.material = material;
        
        // Rendre la hitbox invisible et activer les collisions
        this.hitbox.isVisible = false;
        this.hitbox.checkCollisions = true;
        
        // Définir la position et l'échelle
        this.mesh.position = this.position.clone();
        this.hitbox.position = this.position.clone();
        
        // Définir l'orientation
        if (this.isHorizontal) {
            this.mesh.rotation = new BABYLON.Vector3(Math.PI/2, this.rotation.y, 0);
            this.hitbox.rotation = new BABYLON.Vector3(Math.PI/2, this.rotation.y, 0);
        } else {
            this.mesh.rotation = this.rotation.clone();
            this.hitbox.rotation = this.rotation.clone();
        }
        
        // Appliquer l'échelle
        this.mesh.scaling = this.scale.clone();
        this.hitbox.scaling = this.scale.clone();
    }
    
    markAsPassed() {
        if (this.passed) return;
        
        this.passed = true;
        
        // Rendre la porte moins visible
        if (this.mesh && this.mesh.material) {
            this.mesh.material.alpha = 0.3;
            this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0.2, 0.3);
        }
        
        // Jouer un effet sonore
        if (this.game.soundManager) {
            this.game.soundManager.playSound('gate');
        }
        
        // Afficher une notification de score
        if (this.game.player && this.game.player.trickNotifier) {
            this.game.player.trickNotifier.showTrick(`Porte! +${this.points}`, "#00FFFF");
        }
    }
    
    remove() {
        if (this.mesh) {
            this.mesh.dispose();
            this.mesh = null;
        }
        if (this.hitbox) {
            this.hitbox.dispose();
            this.hitbox = null;
        }
    }
}

/**
 * Classe GateManager pour gérer toutes les portes dans le jeu
 */
class GateManager {
    constructor(game) {
        this.game = game;
        this.worldManager = game.worldManager; // Référence au worldManager pour maintenir la compatibilité
        this.scene = game.scene;
        this.gates = [];
        this.nextGateId = 0;
    }
    
    createGateRing(radius, height, gateCount, isHorizontal) {
        for (let i = 0; i < gateCount; i++) {
            const angle = (i / gateCount) * Math.PI * 2;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;
            
            const gate = new Gate(
                this.scene,
                new BABYLON.Vector3(x, height, z),
                new BABYLON.Vector3(0, angle, 0),
                new BABYLON.Vector3(1, 1, 1),
                this.nextGateId++,
                this.game,
                isHorizontal
            );
            
            this.gates.push(gate);
        }
    }
    
    createGates() {
        // Effacer les portes existantes
        this.clear();
        
        const config = this.worldManager.settings.gateConfig;
        const baseRadius = this.worldManager.settings.baseRadius;
        const radiusIncrements = this.worldManager.settings.radiusIncrements;
        
        // Créer des portes pour chaque incrément de rayon
        radiusIncrements.forEach(increment => {
            const radius = baseRadius + increment;
            
            // Créer des portes horizontales au-dessus de l'eau
            this.createGateRing(
                radius,
                config.surfaceHeight,
                config.gatesPerRing,
                true
            );
            
            // Créer des portes verticales sous l'eau
            this.createGateRing(
                radius,
                config.underwaterHeight,
                config.gatesPerRing,
                false
            );
        });
        
        console.log(`Création de ${this.gates.length} portes terminée`);
    }
    
    /**
     * Méthode update simplifiée pour améliorer les performances
     */
    update() {
        // Ne procéder que si le joueur existe
        if (!this.game.player || !this.game.player.mesh) return;
        
        const playerMesh = this.game.player.mesh;
        const maxCheckDistance = 8; // Vérifier uniquement les portes à moins de 8 unités (optimisé)
        
        // Optimisation: vérifier moins de portes par frame
        const checkCount = Math.min(10, this.gates.length);
        const startIdx = Math.floor(Math.random() * Math.max(1, this.gates.length - checkCount));
        
        for (let i = 0; i < checkCount; i++) {
            const idx = (startIdx + i) % this.gates.length;
            const gate = this.gates[idx];
            
            if (!gate.passed && gate.hitbox) {
                const distance = BABYLON.Vector3.Distance(playerMesh.position, gate.position);
                if (distance < maxCheckDistance) {
                    // Vérifier si le joueur est proche du centre de la porte
                    if (distance < 3) {
                        gate.markAsPassed();
                        this.worldManager.addScore(gate.points, 'hoops');
                    }
                }
            }
        }
    }
    
    clear() {
        this.gates.forEach(gate => gate.remove());
        this.gates = [];
        this.nextGateId = 0;
    }

    /**
     * Créer des portes dans un segment spécifique - simplifié pour ne rien faire
     * @param {number} chunkX - Coordonnée X du segment
     * @param {number} chunkZ - Coordonnée Z du segment
     */
    createGatesInChunk(chunkX, chunkZ) {
        // Suppression de la création de portes basée sur les segments
        console.log("Création de portes basée sur les segments supprimée");
    }
    
    /**
     * Créer une porte individuelle
     * @param {BABYLON.Vector3} position - Position de la porte
     * @returns {Object} Objet de porte
     */
    createGate(position) {
        // Créer le maillage de porte avec une tessellation inférieure pour de meilleures performances
        const gate = BABYLON.MeshBuilder.CreateTorus("gate_" + this.nextGateId++, {
            diameter: 8,
            thickness: 0.5,
            tessellation: 16 // Tessellation réduite pour de meilleures performances
        }, this.scene);
        
        // Positionner la porte
        gate.position = position;
        
        // Rotation aléatoire autour de l'axe Y
        gate.rotation.y = Math.random() * Math.PI * 2;
        
        // Créer une hitbox pour la détection de collision (boîte plus simple)
        const hitbox = BABYLON.MeshBuilder.CreateBox("gateHitbox_" + (this.nextGateId - 1), {
            width: 8,
            height: 8,
            depth: 1
        }, this.scene);
        
        // Rendre la hitbox invisible et non sélectionnable
        hitbox.isVisible = false;
        hitbox.isPickable = false;
        
        // Positionner la hitbox à la porte
        hitbox.position = position;
        hitbox.rotation.y = gate.rotation.y;
        
        // Parenter la hitbox à la porte pour une gestion plus facile
        hitbox.parent = gate;
        
        // Créer un matériau pour la porte
        const gateMaterial = new BABYLON.StandardMaterial("gateMaterial_" + (this.nextGateId - 1), this.scene);
        gateMaterial.emissiveColor = new BABYLON.Color3(0, 0.8, 0.8);
        gateMaterial.specularColor = new BABYLON.Color3(0.2, 1, 1);
        
        // Appliquer le matériau
        gate.material = gateMaterial;
        
        // Geler le maillage de la porte pour de meilleures performances
        gate.freezeWorldMatrix();
        
        // Créer l'objet porte
        const gateObj = {
            mesh: gate,
            hitbox: hitbox,
            passed: false,
            id: this.nextGateId - 1
        };
        
        // Ajouter au tableau de portes
        this.gates.push(gateObj);
        
        return gateObj;
    }
} 