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
     * SOCKET CONNECTION
     */
    // Connect Web socket
    socket = io.connect();

    socket.on('KINECT_stateChange', function (data) {
        // Wenn kinect changes
        //  wenn user == true und ext_teaser !playing
        if(data.state && $('video[data-type=ext_teaser]:playing').size() == 0) {
            //      fade teaser aus und ext_teaser ein
            $('video[data-type=teaser]').fadeOut(function() {
                $(this).stop();
            });
            $('video[data-type=ext_teaser]').play().fadeIn();
        } else if(!data.state && $('video[data-type=teaser]:playing').size() == 0) {
             //  wenn user == false and teaser !playing
             //  fade teaser ein und ext_teaser aus
            $('video[data-type=ext_teaser]').fadeOut(function() {
                $(this).stop();
            });
            $('video[data-type=teaser]').play().fadeIn();
        }        
    });

    socket.on('MACHINE_hasCoin', function (data) {
        // Wenn money
        //  wenn walking spielt
        if($('video[data-type=walking]:playing').size() > 0) {
            //  addiere Betrag zu value
            currentCredit += data.coin;
            //      setze decision
            currentDecision = availableCoins[data.coin];
        } else {
            //  sonst
            //  addiere zu wrong money 
            wrongCredit += data.coin;
        }             
    });


    /**
     * LISTENERS
     */

    // Wenn video walking on end
    $(document).on('end', 'video[data-type=walking]', function() {
        $('.optionIcons').fadeOut();
        $(this).attr('data-callToAction', 'false');
        if(currentDecision > 0) {
            // Verstecke walking
            $(this).stop().hide();
            $('video[data-type=option][data-id='+currentDecision+']').show().play();
        } else {
            // Blende walking aus
            $(this).stop().fadeOut( function() {
                // Zeige gameover mit id = 0 (Standard Gameover)
                $('video[data-type=gameover][data-id=0]').fadeIn().play();
            });
        }
    });

    // Wenn video option on end
    $(document).on('end', 'video[data-type=option]', function() {
        // Wenn letztes Level noch nicht erreicht
        if(currentLevel + 1 <= numLevels) {
            currentLevel++;
            // Verstecke option
            $(this).stop().hide();
            // Spiele nächstes walking
            $('video[data-type=walking][data-id='+currentLevel+']').show().play();
        } else {
            // Verstecke option
            $(this).stop().hide();
            // Zeige gameover mit id = 1 (Win Gameover)
            $('video[data-type=option][data-id=1]').show().play();
            /**
             * Zeige hier ggf. noch einen Text mit dem currentCredit
             * Gib hier das Geld zurück
             */
            socket.emit('MACHINE__eject', true);
        }
    });

    // Wenn teaser on end
    $(document).on('end', 'video[data-type=teaser]', function() {
        // rewind teaser and play again
    });

    // Wenn ext_teaser on end
    $(document).on('end', 'video[data-type=ext_teaser]', function() {
        // rewind ext_teaser and play again
    });

    $(document).on('play', 'video[data-type=walking]', function() {
        // Wenn 400ms vor Ende
        if((($(this).duration() - $(this).time()) <= decisionTime) && $(this).attr('data-callToAction') == "false") {
            $('.optionIcons').fadeIn();
            $(this).attr('data-callToAction', 'true');
        }
    })

    $(document).on('play', 'video[data-type=gameover]', function() {
        // Wenn 400ms vor Ende
        if((($(this).duration() - $(this).time()) <= 400) && $(this).attr('data-animated') == "false") {
            $(this).attr('data-animated', 'true');
            $(this).fadeOut( function() {
                $(this).attr('data-animated', 'false');
                $(this).stop();
            });
            $('video[data-type=teaser]').fadeIn().play();
            currentLevel = 1;
            currentCredit = 0;
        }
    });

    jQuery.fn.extend({
      play: function() {
        return this.each(function(i, item) {
          this.play();
        });
      },
      stop: function() {
        return this.each(function() {
          this.stop();
        });
      }
    });
    
});


};