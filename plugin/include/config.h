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

#define SUPPORTED_EXTEN {5863768 /*mp3*/, 193436047/*wma*/, 193485930/*m4a*/, 193486309/*aac*/, \
						193497511/*flac*/, 193499443/*FLAC*/, 193499444/*ogg*/, 193499445/*ra*/, \
						193499446/*ram*/, 193499497/*wav*/, 193501378/*mp2*/, 193501753/*mp1*/, \
						193509907/*als*/}
// These are all the hash values of the following (not in the same order) using DJBHash
//#define SUPPORTED_EXTEN "mp3,wma,m4a,aac,flac,FLAC,ogg,ra,ram,wav,mp2,mp1,als"

#define INDEX_STUF "/wamp.index"
#define INDEX_TMP "/~wamp.tmp"

// Define this to turn on the WormDebug options.
// More granular options should be tweeked from WormDebug.h
#ifdef DEBUG_CODE
//#define DEBUG 1
#endif

#define BUILD_FOR_TOUCHPAD

//#define PROFILE

#ifndef DEBUG
#define NDEBUG
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
