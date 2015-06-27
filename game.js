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
        this.gameOver = false;
        this.currentDecision = 0;
        this.animationObjects = {};
        this.frameNum = 0;
        this.speed = 2;
    }

    Gameworld.prototype.preload = function() {
        // Background images
        game.load.image('canyon', 'assets/backgrounds/schlucht.jpg');

        // Animations
        // this.loadFrameAnimation(game, 'assets/rhino__walking/rhino__walking_', 0, 29, 5, '.png', 'rhino__walking_');
        game.load.atlasXML('rhino__walking', 'assets/rhino__walking/rhino__walking.png', 'assets/rhino__walking/rhino__walking.xml');
        // game.load.image('rhino__walking', 'assets/rhino__walking/Rhino walking_00000.png');
    }

    Gameworld.prototype.create = function() {
        background = game.add.image(0, 0, 'canyon');

        this.animationObjects.rhino = game.add.sprite(window.innerWidth/2, 0, 'rhino__walking');
        this.animationObjects.rhino.y = window.innerHeight - (this.animationObjects.rhino.width/2);
        this.animationObjects.rhino.anchor.setTo(.5, .5);
        this.animationObjects.rhino.scale.x *= -1;
        this.animationObjects.rhino.animations.add('walk', null, 30, true);
        this.animationObjects.rhino.animations.play('walk');
    }

    Gameworld.prototype.loadFrameAnimation = function(gameobj, filename, start, stop, zeroPad, ending, slug) {
        for(var i = start; i < stop; i++) {
            var num = this.getWithZeros(i, zeroPad);
            gameobj.load.image(slug+num, filename+num+ending);
            console.log(filename+num+ending);
        }
    }

    Gameworld.prototype.getWithZeros = function(number, numZeros) {
        while(String(number).length < numZeros) {
            number = String(0)+String(number);
        }
        return number;
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