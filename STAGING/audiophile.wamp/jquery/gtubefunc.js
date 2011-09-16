      var events = [];
      var errors = [];
      var vid = '';
      var chromeless = true;
      var isAS2 = false;
      var useOriginalParameters = true;
      var definedPlayers = {'AS2': 1, 'AS3': 1, 'HTML5': 1};
      var playerParameters = ['autohide', 'autoplay', 'border', 'cc_load_policy', 'color', 'color1', 'controls', 'disablekb', 'enablejsapi', 'egm', 'fs', 'hd', 'index', 'iv_load_policy', 'list', 'loopas2', 'loop', 'modestbranding', 'origin', 'playerapiid', 'playlist', 'rel', 'showinfo', 'showsearch', 'shuffle', 'start', 'theme'];
      var unsupported = {
                          'AS2': {
                            'color': 1,
                            'controls': 1,
                            'index': 1,
                            'list': 1,
                            'loop': 1,
                            'modestbranding': 1,
                            'origin': 1,
                            'playlist': 1,
                            'shuffle': 1
                          },
                          'AS3': {
                            'border': 1,
                            'color1': 1,
                            'egm': 1,
                            'hd': 1,
                            'loopas2': 1,
                            'showsearch': 1
                          },
                          'HTML5': {
                            'border': 1,
                            'cc_load_policy': 1,
                            'color': 1,
                            'color1': 1,
                            'disablekb': 1,
                            'egm': 1,
                            'fs': 1,
                            'hd': 1,
                            'index': 1,
                            'iv_load_policy': 1,
                            'list': 1,
                            'loopas2': 1,
                            'modestbranding': 1,
                            'playerapiid': 1,
                            'rel': 1,
                            'showinfo': 1,
                            'showsearch': 1
                          },
                        }
      var as2Options = {'border': 1, 'color1': 1, 'color2': 1, 'disablekb': 1, 'egm': 1, 'hd': 1, 'showsearch': 1};
      var as3Options = {'controls': 1, 'playlist': 1};
      var ytswf;

      // Define quality options for validating form inputs
      var qualityLevels = {'default': 1, 'highres': 1, 'hd1080': 1, 'hd720': 1, 'large': 1, 'medium': 1, 'small': 1};

      // Let demo users preview color settings of embedded player
      var colorRegex = /\#?[0-9A-Fa-f]{6}/;

      /**
       * The 'getParamValue' function retrieves a GET or POST parameter from
       * the page.
       * @param {string} param Mandatory The parameter for which you are
       *                                 retrieving a value.
       * @return {string} The parameter value.
       */
      function getParamValue(param) {
        var loc = location.search.substring(1, location.search.length);
        var paramValue;
        var params = loc.split('&')
        for (i = 0; i < params.length; i++) {
          paramName = params[i].substring(0, params[i].indexOf('='));
          if (paramName == param) {
            paramValue = params[i].substring(params[i].indexOf('=') + 1);
          }
        }
        return paramValue;
      }

      /**
       * The 'constructUrl' function builds the SWF URL based on the selected
       * video and other parameters that the user may have selected.
       * @param {string} baseUrl Mandatory The URL domain --
       *                                   e.g. http://www.youtube.com/.
       * @return {string} The SWF URL for the video player.
       */
      function constructUrl(baseUrl) {
        vid = getParamValue('v') ? getParamValue('v') : 'vkt6N1WJTdY';
        chromeless = (getParamValue('playerType') &&
            (getParamValue('playerType') == 'chromeless') ? true : false);
        isAS2 = getParamValue('playerVersion') && 
            (getParamValue('playerVersion') == 'as2');
        var argsString = 'enablejsapi=1&playerapiid=ytplayer';

        (baseUrl.search('\/$')) || (baseUrl += '/');

        // Choose correct URL format:
        // Chromeless = http://www.youtube.com/apiplayer?video_id=VIDEO_ID&args
        // AS3 embedded = http://www.youtube.com/e/VIDEO_ID?args
        // AS2 = http://www.youtube.com/v/VIDEO_ID?args

        // XSS sanitizer -- make sure the video ID is 11-character alphanumeric
        if (xssSanitizer('Video ID', vid, 'videoId')) {
          if (chromeless) {
              apiUrl = (isAS2) ?
                  baseUrl + 'apiplayer?video_id=' + vid + '&' + argsString :
                  baseUrl + 'apiplayer?version=3&video_id=' + vid + '&' +
                    argsString;
          } else if (!isAS2) {
              apiUrl = (argsString) ?
                  baseUrl + 'v/' + vid + '?version=3&' + argsString :
                  baseUrl + 'v/' + vid + '?version=3';

          } else {
              apiUrl = (argsString) ?
                  baseUrl + 'v/' + vid + '?' + argsString :
                  baseUrl + 'v/' + vid;
          }
          return apiUrl;
        }
		
        // Show a default video ID if the user's URL specified a bad one.
        return baseUrl + 'apiplayer?version=3&video_id=vkt6N1WJTdY&' +
            argsString;
      }

      /**
       * The 'updatePlayer' function changes the page location to explicitly
       * set values for the 'playerType' and 'playerVersion' parameters,
       * enabling the user to switch between embedded and chromeless, AS2 and
       * AS3.
       */
      function updatePlayer() {
        var playerType = document.getElementById('playerType').value;
        var playerVersion = document.getElementById('playerVersion').value;
        location.href = '/apis/youtube/youtube_player_demo.html?' +
            'playerType=' + playerType + 
            '&playerVersion=' + playerVersion;
      }

      /**
       * The 'switchPlayerType' function changes the player type from 
       * somewhere on the page other than the player options menus.
       * @param {string} playerType Mandatory Indicates whether the user is
       *                                      switching to chromeless or
       *                                      embedded player.
       */
      function switchPlayerType(playerType) {
        document.getElementById('playerType').value = playerType;
        updatePlayer();
      }

      /**
       * The 'setPlayerOptions' function updates the pulldown settings for the
       * player options after the page has loaded.
       */
      function setPlayerOptions() {
        if (chromeless) {
          document.getElementById('playerType').value = 'chromeless';
        }
        if (isAS2) {
          document.getElementById('playerVersion').value = 'as2';
        }
      }

      /**
       * The 'showPlayerParameters' function changes the list of parameters to
       * only display the parameters supported in a particular player (or to
       * display all parameters). The list can be filtered to only display
       * parameters supported in the AS2, AS3, or HTML5 players.
       */
      function showPlayerParameters(displayStatus) {
        var originalParameters = getParamValue('playerVersion');
        if (originalParameters && definedPlayers[originalParameters] &&
            useOriginalParameters) {
          document.getElementById('playerVersion').value = originalParameters;
        }
        useOriginalParameters = false;
        var firstChangeText = 'any YouTube embedded player';
        var secondChangeText = 'any YouTube embedded player';
        var parameterSubheaderText = 'All YouTube player parameters';
        var playerVersion = document.getElementById('playerVersion').value;
        if (playerVersion && definedPlayers[playerVersion]) {
          firstChangeText = 'the ' + playerVersion + ' embedded player';
          parameterSubheaderText = playerVersion + ' player parameters';
        }
        var firstChangeElement = document.getElementById('first_change_text');
        if (firstChangeElement) {
          firstChangeElement.innerHTML = firstChangeText;
        }
        var secondChangeElement = document.getElementById('second_change_text');
        if (secondChangeElement) {
          secondChangeElement.innerHTML = firstChangeText;
        }
        var parameterSubheader = document.getElementById('parameter-subheader');
        if (parameterSubheader) {
          parameterSubheader.innerHTML = parameterSubheaderText;
        }
        for (var count in playerParameters) {
          parameterName = document.getElementById(playerParameters[count]);
          parameterDefinition = document.getElementById(playerParameters[count] + '-definition');
          parameterLink = document.getElementById(playerParameters[count] + '-link');
          if (parameterName && parameterDefinition && parameterLink) {
            if ((playerVersion && unsupported[playerVersion] &&
                 unsupported[playerVersion][playerParameters[count]]) ||
                (parameterName.id == 'loopas2' && displayStatus == 'load')) {
              parameterName.style.display = 'none';
              parameterDefinition.style.display = 'none';
              parameterLink.style.display = 'none';
            } else {
              parameterName.style.display = '';
              parameterDefinition.style.display = '';
              parameterLink.style.display = '';
            }
          }
        }
      }

      /**
        * The 'setDisplayedOptions' function hides parameters that work in
        * AS2 but not in AS3 (border, color1, color2, etc.) when the user is
        * viewing the AS3 player and shows those options when the user is
        * viewing the AS2 player.
        */
      function setDisplayedOptions() {
        for (var option in as2Options) {
          paramRow = document.getElementById(option + '-param');
          if (isAS2 && paramRow) {
            paramRow.style.display = '';
          } else if (paramRow) {
            paramRow.style.display = 'none';
          }
        }
        for (var option in as3Options) {
          paramRow = document.getElementById(option + '-param');
          if (!isAS2 && paramRow) {
            paramRow.style.display = '';
          } else if (paramRow) {
            paramRow.style.display = 'none';
          }
        }
      }

      /**
       * The 'updateColor' function checks the value of a text field to
       * determine whether its value is a hexadecimal color. If so, it updates
       * an element with a specific ID (the text field's ID + '-preview') so
       * that it's background is the color, enabling the user to preview the
       * color setting.
       * @param {object} box Mandatory The object where the color is entered.
       */
      function updateColor(box) {
        var colorValue = box.value;
        var result = colorRegex.exec(colorValue);
        if (result != null) {
          if (colorValue.length == 6) {
            colorValue = '#' + colorValue;
          }
          if (document.getElementById(box.id + '-preview')) {
            document.getElementById(box.id + '-preview').style.backgroundColor =
                colorValue;
          }
        }
      }

      /**
       * All of the player function calls are documented at:
       * http://code.google.com/apis/youtube/flash_api_reference.html
       *
       * You can navigate directly to a description of each function by
       * appending the function name, as an anchor link, to the URL above.
       * For example, the two URLs below would be used to link to the "mute"
       * and "playVideo" functions, respectively:
       * http://code.google.com/apis/youtube/flash_api_reference.html#mute
       * http://code.google.com/apis/youtube/flash_api_reference.html#playVideo
       */

      // Event handlers

      /**
       * The 'onYouTubePlayerReady' function executes when the onReady event
       * fires, indicating that the player is loaded, initialized and ready
       * to receive API calls.
       * @param {string} playerId Mandatory A value that identifies the player.
       */
      function onYouTubePlayerReady(playerId) {
        // No need to do any of this stuff if the function was called
        // because the user customized the player parameters for the embedded
        // player.
        if (playerId && playerId != 'undefined') {
          ytswf = document.getElementById('yembed');
          if (ytswf) 
		  {
			console.log("working");
			
			// This ensures that there's a video cued if using chromeless player
            if (vid && chromeless) {
              cueVideo(vid, 0);
            }
            /*setInterval(updateytplayerInfo, 1);
            getVideoUrl();
            getEmbedCode(false);
            updateytplayerInfo();
            ytswf.addEventListener('onStateChange', 'onytplayerStateChange');
            ytswf.addEventListener('onError', 'onPlayerError');
            ytswf.addEventListener('onPlaybackQualityChange',
                'onytplayerQualityChange');*/
			ytswf.mute();
			ytswf.setPlaybackQuality("medium");
          }
        }
      }

      /**
       * The 'onytplayerStateChange' function executes when the onStateChange
       * event fires. It captures the new player state and updates the
       * "Player state" displayed in the "Playback statistics".
       * @param {string} newState Mandatory The new player state.
       */
      function onytplayerStateChange(newState) {
        events.push('onStateChange event: Player state changed to: "' + 
            newState + '" (' + getPlayerState(newState) + ')');
        updateHTML('playerstate', newState);
      }

      /**
       * The 'onPlayerError' function executes when the onError event fires.
       * It captures the error and adds it to an array that is displayed in
       * the "Errors" section of the demo.
       * @param {string} errorCode Mandatory A code that explains the error.
       */
      function onPlayerError(errorCode) {
        errors.push('Error: ' + errorCode);
      }

      /**
       * The 'onytplayerQualityChange' function executes when the
       * onPlaybackQualityChange event fires. It captures the new playback
       * quality and updates the "Quality level" displayed in the "Playback
       * Statistics".
       * @param {string} newQuality Mandatory The new playback quality.
       */
      function onytplayerQualityChange(newQuality) {
        events.push('onPlaybackQualityChange event: ' +
            'Playback quality changed to "' + newQuality + '"');
        updateHTML('playerq', newQuality);
      }

      /**
       * The 'updateHTML' function updates the innerHTML of an element.
       * @param {string} elmId Mandatory The element to update HTML for.
       * @param {string} value Mandatory The updated HTML for the element.
       */
      function updateHTML(elmId, value) {
        if (document.getElementById(elmId)) {
          document.getElementById(elmId).innerHTML = value;
        }
      }

      /**
       * The 'clearOutput' removes any HTML in a few page elements and resets
       * the events[] and errors[] arrays.
       */
      function clearOutput() {
        updateHTML('errorCode', '');
        updateHTML('videoUrl', '');
        updateHTML('eventhistory', '');
        updateHTML('embedCode', '');
        updateHTML('embedPreview', '');
        events = [];
        errors = [];
      }

      /** Functions for the api calls */
      /**
       * The 'loadVideo' function determines whether the user is trying to
       * load a video by its video ID or its URL and then calls the appropriate
       * function to actually load the video. After loading the video, this
       * function updates the video URL and embed code for the video.
       * @param {string} idOrUrl Mandatory The ID or URL that identifies the
       *                                   video to load.
       * @param {number} startSeconds Optional The time offset, measured in
       *                                       seconds from the beginning of the
       *                                       video, from which the video
       *                                       should start playing.
       * @param {string} quality Optional The suggested playback quality for
       *                                  the video. Please see
       *                                  http://code.google.com/apis/youtube/flash_api_reference.html#setPlaybackQuality
       *                                  for more information.
       */
      function loadVideo(idOrUrl, startSeconds, quality) {
        // XSS sanitizer -- make sure params contain valid values
        if (xssSanitizer('Video ID or URL', idOrUrl, 'videoIdOrUrl') &&
            xssSanitizer('Start at', startSeconds, 'digits') &&
            xssSanitizer('Suggested quality', quality, 'qualitylevels')) {
          var urlRegex = /http\:/;
          if (idOrUrl.match(urlRegex)) {
            ytswf.loadVideoByUrl(idOrUrl, parseInt(startSeconds), quality);
            events.push('loadVideoByUrl(' + idOrUrl + 
                ', parseInt(' + startSeconds + '), ' + quality + ');');
          } else {
            ytswf.loadVideoById(idOrUrl, parseInt(startSeconds), quality);
            events.push('loadVideoById(' + idOrUrl + 
                ', parseInt(' + startSeconds + '), ' + quality + ');');
          }
          getVideoUrl();
          getEmbedCode(true);
        }
      }

      /**
       * The 'cueVideo' function determines whether the user is trying to
       * cue a video by its video ID or its URL and then calls the appropriate
       * function to actually cue the video. After cueing the video, this
       * function updates the video URL and embed code for the video.
       * @param {string} idOrUrl Mandatory The ID or URL that identifies the
       *                                   video to cue.
       * @param {number} startSeconds Optional The time offset, measured in
       *                                       seconds from the beginning of the
       *                                       video, from which the video
       *                                       should start playing.
       * @param {string} quality Optional The suggested playback quality for
       *                                  the video. Please see
       *                                  http://code.google.com/apis/youtube/flash_api_reference.html#setPlaybackQuality
       *                                  for more information.
       */
      function cueVideo(idOrUrl, startSeconds, quality) {
        // XSS sanitizer -- make sure params contain valid values
        if (xssSanitizer('Video ID or URL', idOrUrl, 'videoIdOrUrl') &&
            xssSanitizer('Start at', startSeconds, 'digits') &&
            xssSanitizer('Suggested quality', quality, 'qualitylevels')) {
          var urlRegex = /http\:/;
          if (idOrUrl.match(urlRegex)) {
            ytswf.cueVideoByUrl(idOrUrl, parseInt(startSeconds), quality);
            events.push('cueVideoByUrl(' + idOrUrl + 
                ', parseInt(' + startSeconds + '), ' + quality + ');');
          } else {
            ytswf.cueVideoById(idOrUrl, parseInt(startSeconds), quality);
            events.push('cueVideoById(' + idOrUrl + 
                ', parseInt(' + startSeconds + '), ' + quality + ');');
          }
          getVideoUrl();
          getEmbedCode(true);
        }
      }

      /**
       * The 'getQuality' function returns the actual playback quality of the
       * video shown in the player.
       * @return {string} The quality level of the currently playing video.
       */
      function getQuality() {
        var quality = ytswf.getPlaybackQuality();
        if (!quality) {
          return '';
        }
        return quality;
      }

      /**
       * The 'setQuality' function sets the suggested playback quality for the
       * video. It calls player.setPlaybackQuality(suggestedQuality:String).
       * @param {string} newQuality Mandatory The suggested playback quality.
       */
      function setQuality(newQuality) {
        events.push('setPlaybackQuality(' + newQuality + ');');
        ytswf.setPlaybackQuality(newQuality);
      }

      /**
       * The 'getQualityLevels' function retrieves the set of quality formats
       * in which the current video is available. It calls
       * player.getAvailableQualityLevels().
       * @return {string} A string (comma-separated values) of available quality
       *                  levels for the currently playing video.
       */
      function getQualityLevels() {
        return ytswf.getAvailableQualityLevels();
      }

      // Player controls ... play, pause, stop, seekTo, clearVideo (AS2 only)
      /**
       * The 'play' function plays the currently cued/loaded video. It calls
       * player.playVideo().
       */
      function play() {
        events.push('playVideo();');
        ytswf.playVideo();
      }

      /**
       * The 'pause' function pauses the currently cued/loaded video. It calls
       * player.pauseVideo().
       */
      function pause() {
        events.push('pauseVideo();');
        ytswf.pauseVideo();
      }

      /**
       * The 'stop' function stops the currently cued/loaded video. It also
       * closes the NetStream object and cancels loading of the video. It calls
       * player.stopVideo().
       */
      function stop() {
        events.push('stopVideo();');
        ytswf.stopVideo();
      }

      /**
       * The 'seekTo' function seeks to the specified time of the video. The
       * time is specified as an offest, measured in seconds from the beginning
       * of the video. The function causes the player to find the closest
       * keyframe before the specified value.
       * @param {number} seconds Mandatory The time offset to skip to.
       * @param {boolean} allowSeekAhead Mandatory A flag that indicates if
       *                                          the player will make a new
       *                                          request to the server if the
       *                                          specified time is beyond the
       *                                          currently loaded video data.
       */
      function seekTo(seconds, allowSeekAhead) {
        // XSS sanitizer -- make sure param contains a valid value
        if (xssSanitizer('Seek to', seconds, 'digits')) {
          events.push('seekTo(' + seconds + ', ' + allowSeekAhead + ');');
          ytswf.seekTo(seconds, allowSeekAhead);
        }
      }

      /**
       * The 'xssSanitizer' function tries to make sure that the user isn't
       * being directed to something that would exploit an XSS vulnerability
       * by verifying that the input value matches a particular rule. If the
       * provided value is invalid, the page will display an error indicating
       * that either the value is invalid or that it doesn't have XSS
       * vulnerabilities to exploit.
       * @param {string} field Mandatory A name that identifies the field being
       *     validated. This will appear in the error list if the value is bad.
       * @param {string} value Mandatory The value to be validated.
       * @param {string} rulesOfSanitation Mandatory A string that identifies
       *     the accepted format of the value -- e.g. alphanumeric, digits,
       *     videoId, etc.
       * @param {boolean} skipEvent Optional A flag that indicates that the
       *     error should not be printed. This is used to avoid inadvertently
       *     displaying an error when a field could include, say, a videoId or
       *     a videoUrl.
       * @return {boolean} Returns true if the value is valid and false if not.
       */
      function xssSanitizer(field, value, rulesOfSanitation, skipEvent) {
        var regex = /[\"\<\>]/;
        if (value.match(regex)) {
          errors.push('These aren\'t the XSS vulnerabilities you\'re looking for.');
          return false;
        } else if (rulesOfSanitation) {
          if (rulesOfSanitation == 'alphanumeric') {
            var regex = /[\W]/;
            if (value.match(regex)) {
              errors.push('This \'' + field + '\' value is not supported. The value must be an alphanumeric string.');
              return false;
            }
          } else if (rulesOfSanitation == 'digits') {
            var regex = /[\D]/;
            if (value.match(regex)) {
              errors.push('This \'' + field + '\' value is not supported. The value must be an integer.');
              return false;
            }
          } else if (rulesOfSanitation == 'playlist') {
            var regex = /^[\w\-]{11}(,[\w\-]{11})*$/;
            if (value.match(regex)) {
              return true;
            }
            errors.push('This \'' + field + '\' value is not supported. The value must be a comma-delimited list of 11-character YouTube video IDs.');
            return false;
          } else if (rulesOfSanitation == 'qualitylevels') {
            if (qualityLevels[value]) {
              errors.push('This \'' + field + '\' value is not supported. The value must be a supported quality level.');
            }
          } else if (rulesOfSanitation == 'videoIdOrUrl') {
            if (!xssSanitizer(field, value, 'videoId', true)) {
              if (!xssSanitizer(field, value, 'videoUrl', true)) {
                errors.push('This \'' + field + '\' value is not supported. The value must be an 11-character YouTube video ID or a YouTube watch page URL in the format \'http://www.youtube.com/v/VIDEO_ID\'.');
                return false;
              }
            }
          } else if (rulesOfSanitation == 'videoId') {
            var regex = /^[\w\-]{11}$/;
            if (value.match(regex)) {
              return true;
            }
            if (!skipEvent) {
              errors.push('This \'' + field + '\' value is not supported. The value must be an 11-character YouTube video ID.');
            }
            return false;
          } else if (rulesOfSanitation == 'videoUrl') {
            var regex = /^http\:\/\/www.youtube.com\/v\/([\w\-]){11}$/;
            if (value.match(regex)) {
              return true;
            }
            if (!skipEvent) {
              errors.push('This \'' + field + '\' value is not supported. The value must be a YouTube watch page URL in the format \'http://www.youtube.com/v/VIDEO_ID\'.');
            }
            return false;
          }
        }
        return true;
      }

      /**
       * The 'clearVideo' function ...
       */
//      function clearVideo() {
//        ytplayer.clearVideo();
//      }

      // Volume functions ... mute, unMute, isMuted, getVolume, setVolume
      /**
       * The 'mute' function mutes the player. It calls player.mute().
       */
      function mute() {
        events.push('mute();');
        ytswf.mute();
      }

      /**
       * The 'unMute' function unmutes the player. It calls player.unMute().
       */
      function unMute() {
        events.push('unMute();');
        ytswf.unMute();
      }

      /**
       * The 'isMuted' function determines whether the player is muted.
       * It returns 'true' if the player is muted and 'false' otherwise.
       * It calls player.isMuted().
       * @return {string} Returns 'on' if volume is on and 'off' if volume
       *                  is off (muted).
       */
      function isMuted() {
        if (!ytswf.isMuted()) {
          return 'on';
        }
        return 'off';
      }

      /**
       * The 'getVolume' function returns the player volume. The volume is
       * returned as an integer on a scale of 0 to 100. This function will
       * not necessarily return 0 if the player is muted. Instead, it will
       * return the volume level that the player would be at if unmuted.
       * It calls player.getVolume().
       * @return {number} A number between 0 and 100 that specifies current
       *                  volume level.
       */
      function getVolume() {
        return ytswf.getVolume();
      }

      /**
       * The 'setVolume' function sets the player volume.
       * @param {number} newVolume Mandatory The new player volume. The value
       *                                     must be an integer between 0 and
       *                                     100. It calls
       *                                     player.setVolume(volume).
       */
      function setVolume(newVolume) {
        // XSS sanitizer -- make sure volume is just numbers.
        if (xssSanitizer('Volume', newVolume, 'digits')) {
          events.push('setVolume(' + newVolume + ');');
          ytswf.setVolume(newVolume);
        }
      }

      // Player size ... setPlayerHeight and setPlayerSize

      /**
       * The 'setPlayerHeight' function calculates the height of the player
       * for the given aspect ratio and width, which are specified in the demo.
       * This ensures that the player dimensions are a legitimate aspect ratio,
       * which should make videos look nicer.
       * @param {string} aspectRatio Mandatory The aspect ratio of the player.
       *                                       Valid values are 'standard' (4x3)
       *                                       and 'widescreen' (16x9).
       * @param {number} playerWidth Mandatory The pixel-width of the player.
       */
      function setPlayerHeight(aspectRatio, playerWidth) {
        // XSS sanitizer -- make sure player width is just numbers.
        if (xssSanitizer('Width', playerWidth, 'digits')) {
          if (aspectRatio == 'widescreen') {
            updateHTML('playerHeight', ((playerWidth * 9) / 16));
          } else if (aspectRatio == 'standard') {
            updateHTML('playerHeight', ((playerWidth * 3) / 4));
          }
        }
      }

      /**
       * The 'setPlayerSize' function adjusts the size of the video and of the
       * DOM element to match the width and height set in the demo.
       * @param {number} playerWidth Mandatory The desired player width.
       * @param {number} playerHeight Mandatory The desired player width.
       */
      function setPlayerSize(playerWidth, playerHeight) {
        events.push('setSize(' + playerWidth + ', ' + playerHeight + ');');
        ytswf.setSize(playerWidth, playerHeight);
        document.getElementById('myytplayer').width = playerWidth;
        document.getElementById('myytplayer').height = playerHeight;
      }

      // Retrieving video information and playback status

      /**
       * The 'updateytplayerInfo' function updates the volume and
       * "Playback statistics" displayed  on the page. (It doesn't actually
       * update the player itself.) The onYouTubePlayerReady uses the
       * setInterval() function to indicate that this function should run
       * every millisecond.
       */
      function updateytplayerInfo() {
        updateHTML('volume', getVolume());

        updateHTML('videoduration', getDuration());
        updateHTML('videotime', getCurrentTime());
        updateHTML('playerstate', getPlayerState());

        updateHTML('bytestotal', getBytesTotal());
        updateHTML('startbytes', getStartBytes());
        updateHTML('bytesloaded', getBytesLoaded());

        updateHTML('playbackquality', getQuality());
        updateHTML('availablelevels', getQualityLevels());
        updateHTML('ismuted', isMuted());
        if (events.length > 0) {
          updateHTML('eventhistory', '<ol><li>' + events.join('<li>') +
              '</ol>');
        }
        if (errors.length > 0) {
          updateHTML('errorCode', '<ol><li>' + errors.join('<li>') +
              '</ol>');
        }
      }

      /**
       * The 'getDuration' function retrieves the length of the video. It calls
       * player.getDuration() function.
       * @return {number} The length of the video in seconds.
       */
      function getDuration() {
        return ytswf.getDuration();
      }

      function roundNumber(number, decimalPlaces) {
        decimalPlaces = (!decimalPlaces ? 2 : decimalPlaces);
        return Math.round(number*Math.pow(10, decimalPlaces))/
            Math.pow(10,decimalPlaces);
      }

      /**
       * The 'getCurrentTime' function returns the elapsed time in seconds from
       * the beginning of the video. It calls player.getCurrentTime().
       * @return {number} The elapsed time, in seconds, of the playing video.
       */
      function getCurrentTime() {
        var currentTime = ytswf.getCurrentTime();
        return roundNumber(currentTime, 3);
      }

      /**
       * The 'getPlayerState' function returns the status of the player. It
       * calls ytswf.getPlayerState() to retrieve an integer, which
       * identifies the player status:
       *   -1: unstarted
       *    0: ended
       *    1: playing
       *    2: paused
       *    3: buffering
       *    5: video cued
       * @return {string} The current state of the video player -- e.g.
       *                  'playing', 'paused', etc.
       */
      function getPlayerState() {
        var playerState = ytswf.getPlayerState();
        switch (playerState) {
          case 5:
            return 'video cued';
          case 3:
            return 'buffering';
          case 2:
            return 'paused';
          case 1:
            return 'playing';
          case 0:
            return 'ended';
          case -1:
            return 'unstarted';
          default:
            return 'Status uncertain';
        }
        return ytswf.getPlayerState();
      }

      /**
       * The 'getBytesTotal' function returns the size in bytes of the currently
       * loaded/cued video. It calls player.getVideoBytesTotal().
       * @return {number} The total number of bytes in the video.
       */
      function getBytesTotal() {
        return ytswf.getVideoBytesTotal();
      }

      /**
       * The 'getStartBytes' function returns the number of bytes from which
       * the currently loaded video started loading. It calls
       * player.getVideoStartBytes().
       * @return {number} The number of bytes into the video when the player
       *                  began playing the video.
       */
      function getStartBytes() {
        return ytswf.getVideoStartBytes();
      }

      /**
       * The 'getBytesLoaded' function returns the number of bytes loaded for
       * the current video. It calls player.getVideoBytesLoaded().
       * @return {number} The number of bytes loaded for the current video.
       */
      function getBytesLoaded() {
        return ytswf.getVideoBytesLoaded();
      }

      /**
       * The 'getVideoUrl' function returns the YouTube.com URL for the
       * currently loaded/playing video. It calls player.getVideoUrl().
       */
      function getVideoUrl() {
        var videoUrl = ytswf.getVideoUrl();
        updateHTML('videoUrl', videoUrl);
      }

      /**
       * The 'getEmbedCode' function returns the embed code for the currently
       * loaded/playing video. It then creates a node to add the embed code
       * to the page. It calls player.getVideoEmbedCode().
       *
       * This function also runs when the demo user updates the embedded player
       * parameters. In that case, the block of code beginning with:
       *   if (updateParams) {
       * will run to identify the player parameters that the user has changed
       * and to modify the sample embed code and the embedded player preview
       * accordingly.
       *
       * @param {boolean} updateParams Optional Modify embed code to reflect
       *                                        updated player parameters.
       */
      function getEmbedCode(updateParams) {
        var result = ytswf.getVideoEmbedCode();
        var resultNode = document.getElementById('embedCode');
        if (resultNode) {
          while (resultNode.hasChildNodes()) {
            resultNode.removeChild(resultNode.firstChild);
          }
        }
        if (result) {
          // Default embed code being returned contains 'version=3'.
          // Remove '?version=3' (or '&version=3') if user is testing AS2 API
          if (isAS2) {
            result = result.replace(/[\?\&]version=3/g, '');
          }
          var newNode = document.createElement('textarea');
          newNode.id = 'embed_string';
          newNode.cols = 70;
          newNode.rows = 10;

          // This block of code doesn't need to run on initial page load.
          if (updateParams) {
            var parent = document.getElementById('embedded-player-options');
            var inputs = parent.getElementsByTagName('input');
            var selects = parent.getElementsByTagName('select');

            // First character in arguments should be '?' unless URL already
            // contains parameters, in which case, it should be '&'. It seems
            // like when you refresh the AS2 player, it already has the
            // hl=en_US and feature=player_embedded parameters set.
            var argString = '';
            var regex = /[\?\&]/;
            if (!result.match(regex)) {
              argString = '?';
            } else {
              argString = '&';
            }

            // Construct arg string based on values of player params in form.
            // Do not include parameter in string if it's set to default value.
            for (var i = 0, input; input = inputs[i]; i++) {
              var paramValue = input.value;
              var paramName = input.id.replace(/embedded\-player\-/, '');
              // Skip AS2-only parameters when user is testing AS3 options,
              // and skip AS3-only parameters when user is testing AS2 options.
              if ((!isAS2 && as2Options[paramName]) ||
                  (isAS2 && as3Options[paramName])) {
                continue;
              }
              // XSS sanitizer -- make sure player height/width are numbers.
              if (paramName == 'width' && xssSanitizer('Width', paramValue, 'digits')) {
                var width = parseInt(paramValue);
                result = result.replace(/ width=\"([^\"]+)/g,
                    ' width=\"' + width);
                continue;
              } else if (paramName == 'height' && xssSanitizer('Height', paramValue, 'digits')) {
                var originalHeight = parseInt(paramValue);
                var height = originalHeight + 25;
                result = result.replace(/ height=\"([^\"]+)/g,
                    ' height=\"' + height);
                continue;
              } else if (paramName == 'color1' || paramName == 'color2') {
                paramValue = '0x' + paramValue;
              } else if (paramName == 'rel' || paramName == 'showsearch' ||
                         paramName == 'showinfo' || paramName == 'controls') {
                if (paramValue == 'on') {
                  continue;
                }
                paramValue = '0';
              } else if (paramValue == 'on' && input.checked) {
                paramValue = '1';
              // XSS sanitizer -- make sure playerapiid, playlist, and start
              // parameters all contain valid values.
              } else if (paramName == 'playerapiid') {
                if (!paramValue || !xssSanitizer('playerapiid', paramValue, 'alphanumeric')) {
                  continue;
                }
              } else if (paramName == 'playlist') {
                if (!paramValue || !xssSanitizer('playlist', paramValue, 'playlist')) {
                  continue;
                }
              } else if (paramName == 'start') {
                if (!paramValue || !xssSanitizer('start', paramValue, 'digits')) {

                  continue;
                }
              } else {
                continue;
              }
              argString += paramName + '=' + paramValue + '&';
            }
            for (var s = 0, select; select = selects[s]; s++) {
              var paramValue = select.value;
              var paramName = select.id.replace(/embedded\-player\-/, '');
              if (paramName == 'iv_load_policy' && paramValue != '1') {
                argString += paramName + '=' + paramValue + '&';
              }
            }
            argString = argString.substring(0, argString.length - 1);
            argString += '&feature=player_embedded';

            // Replace whatever parameters are in the standard embed code
            // with the customized parameters set by the user.
            result = result.replace(/www.youtube.com([^\"]+)/g,
                 'www.youtube.com$1' + argString);
          }

          // Make the embed code easier to read.
          result = result.replace(/><([^\/])/g, '>\n<$1');
          newNode.value = result;
          resultNode.appendChild(newNode); // append code to output node
        } else if (chromeless) {
          document.getElementById('embedDisclaimer').style.display = '';
        }
        updateHTML('embedPreview', result); // show embedded player preview
      }
