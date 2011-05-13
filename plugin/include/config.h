/*
 * config.h
 *
 *  Created on: Jan 15, 2011
 *      Author: Katiebird
 */

#ifndef CONFIG_H_
#define CONFIG_H_

// Read little Endian
#define READ_LITTLE_ENDIAN

#define SUPPORTED_EXTEN {5863768, 193436047, 193485930, 193486309, 193497511, 193499443, 193499444, 193499445, 193499446, 193499497, 193501378, 193501753, 193504453, 193509907, 193510282, 193510303, 2089074171, 2090260091}
// These are all the hash values of the following (not in the same order) using DJBHash
//#define SUPPORTED_EXTEN "mp3,wma,m4a,aac,flac,FLAC,ogg,ra,ram,wav,mp2,mp1,mpg,als,ors,mp4,3gp,wmv"

#define INDEX_STUF "/wamp.index"
#define INDEX_TMP "/~wamp.tmp"

// Define this to turn on the WormDebug options.
// More granular options should be tweeked from WormDebug.h
#ifdef DEBUG_CODE
#define DEBUG 1
#endif

#define MUS_BUFFER_SIZE 4096


// Here we define the various audio variables
#define NUM_CHANNELS 2	// number of supported audio playback channels
#define DEST_FREQ 44100	// playback frequency
#define LOW_SPEED_RATIO_LIM 0.25 // Lower limit for playback speed factor
#define HIGH_SPEED_RATIO_LIM 4.0 // Upper limit for playback speed factor

// For when we start building for the touchpad
#ifdef BUILD_FOR_TOUCHPAD
#define NUM_SIM_TRACKS 2
#else
#define NUM_SIM_TRACKS 1
#endif



#ifdef ON_DEVICE
#define USE_PDL 1
// define where external resources are
#define RESAMPLE_RES_PATH "res/resamp.res" // locate resample coef
#else

#define RESAMPLE_RES_PATH "git/STAGING/audiophile.application/res/resamp.res"

#define ON_TEST_RIG_HOME_DIR "c:/Users/Katiebird/Music"

#endif

#endif /* CONFIG_H_ */
