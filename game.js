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
    // Play the first one
    $('video[data-type=teaser]').fadeIn().vid_play();

    // Looping teaser and extended teaser
    $('video[data-type=teaser]')[0].loop = true;
    $('video[data-type=ext_teaser]')[0].loop = true;

    // Don't display overlays
    $('.optionIcons').hide();
    $('.wintext').hide();

    /**
     * SOCKET CONNECTION
     */
    // Connect Web socket
    socket = io.connect();

    socket.on('KINECT_stateChange', function (data) {
        // Wenn kinect changes
        //  wenn user == true und ext_teaser !playing
        if(data.state && $('video[data-type=ext_teaser]').vid_numPlaying() == 0) {
            //      fade teaser aus und ext_teaser ein
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
    });

    socket.on('MACHINE_hasCoin', function (data) {
        // Wenn money
        // wenn walking spielt
        if($('video[data-type=walking]').vid_numPlaying() > 0) {
            // addiere Betrag zu value
            currentCredit += data.coin;
            // setze decision
            currentDecision = availableCoins[data.coin];
            $('.currentCredit').text(parseMoney(currentCredit));
        } else if($('video[data-type=teaser]').vid_numPlaying() > 0) {
            $('video[data-type=teaser]').fadeOut(function() {
                $(this).vid_stop();
                $('video[data-type=walking][data-id='+currentLevel+']').fadeIn().vid_play();
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
    });


    /**
     * LISTENERS
     */

    // Wenn video walking on end
    $('video[data-type=walking]').bind('ended', function() {
        $('.optionIcons').fadeOut();
        $(this).attr('data-callToAction', 'false');
        if(currentDecision > 0) {
            // Verstecke walking
            $(this).vid_stop().hide();
            $('video[data-type=option][data-decision='+currentDecision+'][data-id='+currentLevel+']').show().vid_play();
        } else {
            // Blende walking aus
            $(this).vid_stop().fadeOut( function() {
                // Zeige gameover mit id = 0 (Standard Gameover)
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
        } else {
            // Verstecke option
            $(this).vid_stop().hide();
            // Zeige gameover mit id = 1 (Win Gameover)
            $('video[data-type=gameover][data-id=1]').show().vid_play();
            // Zeige hier ggf. noch einen Text mit dem currentCredit
            $('.wintext').fadeIn();
            // Gib hier das Geld zurück
            socket.emit('MACHINE__eject', true);
        }
    });

    $('video[data-type=walking]').bind('timeupdate', function() {
        // Wenn 400ms vor Ende
        if((($(this).vid_duration() - $(this).vid_currentTime()) <= decisionTime) && $(this).attr('data-callToAction') == "false") {
            $('.optionIcons[data-id='+currentLevel+']').fadeIn();
            $(this).attr('data-callToAction', 'true');
        }
    })

    $('video[data-type=gameover]').on('timeupdate', function() {
        // Wenn 400ms vor Ende
        if((($(this).vid_duration() - $(this).vid_currentTime()) <= 400) && $(this).attr('data-animated') == "false") {
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
        cents = ""+cents;
        cents = cents.replace(".", ",");
        return cents + " €";
    }
    
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
        if($(item)[0].paused) {
            numPlaying++;
        }
    });
    return numPlaying;
  }
});