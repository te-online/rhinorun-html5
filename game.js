$(document).ready( function() {
    /**
     * SETTINGS VARS
     */
    // The number of levels available
    var numLevels = 5;
    // The time before end of walking scene when options appear to user (in ms)
    var decisionTime = 10000;
    // The coins available (SYNTAX?)
    var availableCoins =  { '50': '1', '100': '2' };

    /**
     * PROGRAMM VARS
     */
    // The current level and start level = 1
    var currentLevel = 1;
    // The current amount of money inserted
    var currentCredit = 0;
    // The current amount of money inserted when not being called to
    var wrongCredit = 0;
    // The current decision of the user
    var currentDecision = 0;

    /**
     * Initial Video configuration
     */
    // Disable video controls
    $('video').each(function(i, item) {
        $(item)[0].controls = false;
    });
    // Hide all videos
    $('video').hide();
    $('audio').hide();

    // Looping teaser and extended teaser
    $('video[data-type=teaser]')[0].loop = true;
    $('video[data-type=ext_teaser]')[0].loop = true;
    $('audio[data-type=game_background]')[0].loop = true;

    // Set volume of game audio
    $('audio[data-type=game_background]')[0].volume = 0.5;

    // preload videos and stop all
    preload();

    // Play the first one
    // but wait for preloading to finish
    setTimeout(function() {
        $('video[data-type=teaser]').fadeIn().vid_play();
    }, 500);
    

    // Don't display overlays
    $('.optionIcons').hide();
    // $('.optionIcons').eq(0).show();
    $('.wintext').hide();

    /**
     * SOCKET CONNECTION
     */
    // Connect Web socket
    socket = io.connect();

    socket.on('KINECT__stateChange', function (data) {
        if($('video[data-type=option]').vid_numPlaying() > 0 ||
            $('video[data-type=walking]').vid_numPlaying() > 0 ||
            $('video[data-type=gameover]').vid_numPlaying() > 0) {
            console.log("Teaser attempt canceled");
            return;
        }
        console.log('KINECT is now '+data.state);
        // Wenn kinect changes
        kinectChange(data);
    });

    socket.on('MACHINE__hasCoin', function (data) {
        hasCoin(data);           
    });

    function hasCoin(data) {
        // Wenn money
        // wenn walking spielt
        if($('video[data-type=walking]').vid_numPlaying() > 0) {
            // addiere Betrag zu value
            currentCredit += parseInt(data.coin);
            // setze decision
            currentDecision = availableCoins[parseInt(data.coin)];
            console.log("Credit: "+currentCredit+" Decision: "+currentDecision);
            $('.currentCredit').text(parseMoney(currentCredit));
            $('.optionIcons[data-id='+currentLevel+'] .optionIcon[data-id='+data.coin+']').addClass('paid');
            $('.optionIcons[data-id='+currentLevel+'] .optionIcon:not([data-id='+data.coin+'])').addClass('notpaid');
        } else if($('video[data-type=teaser]').vid_numPlaying() > 0) {
            $('video[data-type=teaser]').fadeOut(function() {
                $(this).vid_stop();
                $('video[data-type=walking][data-id='+currentLevel+']').fadeIn().vid_play();
                $('audio[data-type=game_background]').vid_play();
                currentDecision = 0;
            });
        } else if($('video[data-type=ext_teaser]').vid_numPlaying() > 0) {
            $('video[data-type=ext_teaser]').fadeOut(function() {
                $(this).vid_stop();
                $('video[data-type=walking][data-id='+currentLevel+']').fadeIn().vid_play();
            });
        } else {
            // sonst addiere zu wrong money 
            wrongCredit += data.coin;
            $('.wrongCredit').text(parseMoney(wrongCredit));
        }  
    }

    function kinectChange(data) {
        //  wenn user == true und ext_teaser !playing
        if(data.state && $('video[data-type=ext_teaser]').vid_numPlaying() == 0) {
            //  fade teaser aus und ext_teaser ein
            $('video[data-type=teaser]').fadeOut(function() {
                $(this).vid_stop();
            });
            $('video[data-type=ext_teaser]').vid_play().fadeIn();
        } else if(!data.state && $('video[data-type=teaser]').vid_numPlaying() == 0) {
             //  wenn user == false and teaser !playing
             //  fade teaser ein und ext_teaser aus
            $('video[data-type=ext_teaser]').fadeOut(function() {
                $(this).vid_stop();
            });
            $('video[data-type=teaser]').vid_play().fadeIn();
        } 
    }


    /**
     * LISTENERS
     */

    // Wenn video walking on end
    $('video[data-type=walking]').bind('ended', function() {
        $('.optionIcons[data-id='+currentLevel+']').fadeOut();
        $('.optionIcons[data-id='+currentLevel+'] .optionIcon').removeClass('notpaid').removeClass('paid');
        $(this).attr('data-callToAction', 'false');
        if(currentDecision > 0) {
            // Verstecke walking
            $(this).vid_stop().hide();
            $('video[data-type=option][data-decision='+currentDecision+'][data-id='+currentLevel+']').show().vid_play();
        } else {
            // Blende walking aus
            $(this).vid_stop().fadeOut( function() {
                // Zeige gameover mit id = 0 (Standard Gameover)
                console.log('gameover 0');
                $('audio[data-type=game_background]').vid_stop();
                $('video[data-type=gameover][data-id=0]').fadeIn().vid_play();
            });
        }
    });

    // Wenn video option on end
    $('video[data-type=option]').bind('ended', function() {
        // Wenn letztes Level noch nicht erreicht
        if(currentLevel + 1 <= numLevels) {
            currentLevel++;
            // Verstecke option
            $(this).vid_stop().hide();
            // Spiele nächstes walking
            $('video[data-type=walking][data-id='+currentLevel+']').show().vid_play();
            // Reset current decision
            currentDecision = 0;
        } else {
            // Verstecke option
            $(this).vid_stop().hide();
            $('audio[data-type=game_background]').vid_stop();
            // Zeige gameover mit id = 1 (Win Gameover)
            $('video[data-type=gameover][data-id=1]').show().vid_play();
            // Zeige hier ggf. noch einen Text mit dem currentCredit
            $('p[data-type=winslogan]').hide();
            var random = Math.floor(Math.random() * 3) + 1;
            $('p[data-type=winslogan][data-id='+random+']').show();
            $('.wintext').fadeIn();
            // Gib hier das Geld zurück
            socket.emit('MACHINE__eject', { eject: true });
        }
    });

    $('video[data-type=walking]').bind('timeupdate', function() {
        // Wenn 400ms vor Ende
        if((($(this).vid_duration() - $(this).vid_currentTime()) <= decisionTime) && $(this).attr('data-callToAction') != "true") {
            $('.optionIcons[data-id='+currentLevel+']').fadeIn().find('.optionTimer').startTimer(decisionTime);
            $(this).attr('data-callToAction', 'true');
        }
    })

    $('video[data-type=gameover]').on('timeupdate', function() {
        // Wenn 400ms vor Ende
        if((($(this).vid_duration() - $(this).vid_currentTime()) <= 400) && $(this).attr('data-animated') != "true") {
            $(this).attr('data-animated', 'true');
            $(this).fadeOut( function() {
                $(this).attr('data-animated', 'false');
                $(this).vid_stop();
            });
            $('.wintext').fadeOut();
            $('video[data-type=teaser]').fadeIn().vid_play();
            currentLevel = 1;
            currentCredit = 0;
        }
    });

    /**
     * Parse cents in euro readable format
     */
    function parseMoney(cents) {
        cents = cents/100;
        cents = cents.replace(".", ",");
        cents = cents.replace(",5", ",50");
        return cents + " €";
    }

    /**
     * Preload videos
     */
    function preload() {
        $('video').vid_play();
        setTimeout(function() {
            $('video').vid_stop();
        }, 250);        
    }

    /**
     * Debugging
     */
    document.addEventListener('keydown', function(event) {
        if(event.keyCode == 37) {
            hasCoin({coin: 50});
        } else if(event.keyCode == 39) {
            hasCoin({coin: 100});
        }
        if(event.keyCode == 38) {
            kinectChange({state: true});
        } else if(event.keyCode == 40) {
            kinectChange({state: false});
        }
    });
    
});


/**
 * Extend jQuery for the HMTL5 video functions of DOM
 * Iterate through each object and apply DOM-functions
 */
jQuery.fn.extend({
    vid_play: function() {
        return this.each(function(i, item) {
          this.play();
        });
        console.log("playing");
    },
    vid_stop: function() {
        return this.each(function() {
          this.pause();
          this.currentTime = 0;
        });
        console.log("stopping");
    },
    vid_pause: function() {
        return this.each(function() {
            this.pause();
        });
    },
    vid_duration: function() {
        // in seconds, but we want milliseconds
        return this[0].duration * 1000;
    },
    vid_currentTime: function() {
        // in seconds, but we want milliseconds
        return this[0].currentTime * 1000;
    },
    vid_jumpTo: function(milliseconds) {
        this[0].currentTime = second/1000;
    },
    vid_loop: function() {
        return this.each(function() {
          this.loop = true;
          console.log(this);
        });
        console.log("looping");
    },
    vid_playing: function() {
        return !this[0].paused;
    },
    vid_numPlaying: function() {
        var numPlaying = 0;
        this.each(function(i, item) {
            if(!$(item)[0].paused) {
                numPlaying++;
            }
        });
        return numPlaying;
    },
    startTimer: function(milliseconds) {
        var t = milliseconds/360;
        $(this).drawTimer(t, 360);
    },
    drawTimer: function(speed, alpha) {
        var timer = this[0];
        var α = alpha;
        var π = Math.PI;
        if(α > 0) {
            α--;
            α %= 360;
            var r = ( α * π / 180 );
            var x = Math.sin( r ) * 125;
            var y = Math.cos( r ) * - 125;
            var mid = ( α > 180 ) ? 1 : 0;
            var anim = 'M 0 0 v -125 A 125 125 1 ' + mid + ' 1 ' +  x  + ' ' +  y  + ' z';
         
            timer.setAttribute( 'd', anim );
          
            setTimeout(function() {
                $(timer).drawTimer(speed, α);
            }, speed); // Redraw
        }
    }
});