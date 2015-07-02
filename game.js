window.onload = function() {

    var rhinorun = new Gameworld;
    var coinmachine = new Machine;

    var background;

    var game = new Phaser.Game(
        window.innerWidth, 
        window.innerHeight, 
        Phaser.AUTO, '', 
        { 
            preload: function() {
                rhinorun.preload();
            },  
            create: function() {
                rhinorun.create();
            }, 
            update: function() { 
                rhinorun.refresh(); 
            } 
        }
    );


    /**
     * Paser.Animation.generateFrameNames(prefix, start, stop, suffix, zeroPad) zeroPad = number of decimals
     */


    /**
     * Gameworld
     */

    function Gameworld() {
        this.teaser = true;
        this.extendedTeaser = false;
        this.gameOver = false;

        this.currentDecision = 0;
        this.currentScene = null;

        this.animationObjects = {};

        this.sceneA = null;
        this.sceneB = null;

        this.frameNum = 0;
        this.speed = 2;

        this.isInteractive = true;
        this.nextAnimation = null;

        this.changePoints = [ 
            { 'frame': 395 },
            { 'frame': 408 },
            { 'frame': 795 },
        ];
        this.currentChangePoint = 0;

        this.timeline = [];
        this.cursor = 0;
    }

    Gameworld.prototype.preload = function() {
        // Background images
        game.load.image('canyon', 'assets/backgrounds/schlucht.jpg');

        // Animations
        game.load.atlasXML('rhino__walking', 'assets/rhino__walking/rhino__walking.png', 'assets/rhino__walking/rhino__walking.xml');
    }

    Gameworld.prototype.create = function() {
        this.animationObjects.rhino = game.add.sprite(window.innerWidth/2, 0, 'rhino__walking');
        // Position the animation
        this.animationObjects.rhino.y = window.innerHeight - (this.animationObjects.rhino.width/2);
        // Mirror this animation
        this.animationObjects.rhino.anchor.setTo(.5, .5);
        this.animationObjects.rhino.scale.x *= -1;
        // Add a looped animation called walk
        this.animationObjects.rhino.animations.add('walk', null, 30, true);
        this.animationObjects.rhino.animations.play('walk');

        // Set the timeline for the whole game
        // Rhino walks
        this.timeline.push( { 'sprite': this.animationObjects.rhino, 'animation': 'walk' } );
        // Problem: canyon
        this.timeline.push( [ 
            { 'sprite': this.animationObjects.rhino_bridge, 'animation': 'bridge' }, 
            { 'sprite': this.animationObjects.rhino_raft, 'animation': 'raft' } 
        ]);
        // Rhino walks
        this.timeline.push( { 'sprite': this.animationObjects.rhino, 'animation': 'walk' } );
        // Problem: stones
        this.timeline.push( [ 
            { 'sprite': this.animationObjects.rhino_bridge, 'animation': 'bridge' }, 
            { 'sprite': this.animationObjects.rhino_raft, 'animation': 'raft' } 
        ]);
    }

    Gameworld.prototype.over = function() {
        this.gameOver = true;
    }

    Gameworld.prototype.isOver = function() {
        return this.gameOver;
    }

    Gameworld.prototype.refresh = function() {
        // Do all the crazy stuff here
        // console.log("refreshin");
        if(this.frameNum % this.speed == 0) {
            background.x -= 1;
        }
        this.frameNum++;

        // Wenn eine Interaktion durch den User möglich ist
        //      Wenn Geld eingeworfen wurde
        //          Setze Entscheidung
        //              wurde münze a eingeworfen setze entscheidung auf 1
        //              wurde münze b eingeworfen setze entscheidung auf 2
        //          Setze nächste Animation nach entscheidung
        //          Interaktion durch den User ist nicht mehr möglich
        // 
        // Wenn ein changePoint erreicht wurde
        //      Wenn Entscheidung erforderlich und Entscheidung == 0
        //          leite Game Over ein
        //      sonst
        //          spiele nächste Animation
        //          
        //       
        // Wann ist eine Interaktion möglich?
        // Was ist die nächste Animation, wenn keine Interaktion möglich ist?
        //    
        if(this.isInteractive) {
            if(this.coinmachine.hasCoin()) {
                for(var i = 0; i < coins.length; i++) {
                    if(this.coinmachine.whatCoin() == this.coins[i]) {
                        this.decision = i+1;
                    }
                } 
                this.cursor++;
                this.nextAnimation = this.timeline[this.cursor][this.decision-1];
                this.isInteractive = false;
            }
        }

        if((background.x * -1) == this.changePoints[this.currentChangePoint].pixels) {
            if(this.changePoints[this.currentChangePoint].decision) {
                this.gameOver = true;
            } else {
                this.nextAnimation.sprite.play(this.nextAnimation.animation);
            }
        }
    }

    Gameworld.prototype.nextLinearAnimation = function() {
        this.cursor++;
        this.nextAnimation = this.timeline[this.cursor];
    }

    Gameworld.prototype.whatNext = function() {
        // Decide whats going on next
    }


    /**
     * Machine
     */
    
    function Machine() {
        this.credit = 0;
        this.hasCoin = false;
        this.lastCoin = 0;
        this.isEjecting = false;
        this.hasEjected = false;
    }

    Machine.prototype.eject = function() {
        // Eject money here (i.a. sending a package to server)
        this.isEjecting = true;
    }

    Machine.prototype.endEjection = function() {
        this.isEjecting = false;
        this.hasEjected = true;
    }

    Machine.prototype.hasCoin = function() {
        var hasCoin = this.hasCoin;
        this.hasCoin = false;
        return hasCoin;
    }

    Machine.prototype.whatCoin = function() {
        var lastCoin = this.lastCoin;
        this.lastCoin = 0;
        return lastCoin;
    }

    Machine.prototype.setCoin = function(coinValue) {
        this.hasCoin = true;
        this.lastCoin = coinValue;
    }

    Machine.prototype.hasEjected = function() {
        if(this.isEjecting == false && this.hasEjected == true) {
            this.hasEjected = false;
            return true;
        } else {
            return false;
        }
    }

    Machine.prototype.credit = function() {
        return this.credit;
    }

    Machine.prototype.setCredit = function(credit) {
        this.credit = credit;
    }

};