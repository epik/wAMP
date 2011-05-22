/*
 * Messages.h
 *
 *  Created on: Dec 24, 2010
 *      Author: Katiebird
 */

#ifndef MESSAGES_H_
#define MESSAGES_H_

#include <stdint.h>


// *********************************************************
// Here we declare the IDs for Attributes
// *********************************************************
#define ATTRIBID_MAX	10	

// Note that these must be below ATTRIBID_MAX.
// For now we do no checking, but that is not
// guaranteed.

//**For filters
#define ATTRIB_BASSTREB_BASS_VAL			1
#define ATTRIB_BASSTREB_TREB_VAL			2
#define ATTRIB_BASSTREB_MID_VAL				3
#define ATTRIB_BASSTREB_VOL_VAL				6

//**For music module
#define ATTRIB_MUSCON_PAUSED				4

//**For resample
#define ATTRIB_RESAMP_SPEED_VAL				5

// *********************************************************
// Here we declare MusMessages
// *********************************************************
#define MUS_MESSAGE int32_t

//**Messages that will be passed by js to MusManager
#define MUS_MESSAGE_ATTRIB_SET				(1<<21)
#define MUS_MESSAGE_ATTRIB_GET				(1<<22)
#define MUS_MESSAGE_GET_SONG_STATE			1
#define MUS_MESSAGE_GET_CURSONG_PATH		2
#define MUS_MESSAGE_SEEK					3
#define MUS_MESSAGE_GET_META				4
// Here we define the different ways to open the next music file
#define MUS_MESSAGE_OPEN_SONG				11
#define MUS_MESSAGE_SET_NEXT				12
// Here we define messages to to send to the indexer
#define MUS_MESSAGE_GET_CURRENT_DIR_LS		20
#define MUS_MESSAGE_GET_FULL_SONG_INDEX		21

// define the messages to handle song transitions
#define MUS_MESSAGE_SET_NEXT_META			30
#define MUS_MESSAGE_PASS_SONG_INFO			31

//**MusManager status states
#define MUS_STATUS_BUF_FULL					101
#define MUS_STATUS_BUFFERING				107
#define MUS_STATUS_INITIAL_BUFFERING		112
#define MUS_STATUS_ERROR					102
#define MUS_STATUS_WAITING_FOR_SONG			103
#define MUS_STATUS_LOADING					105
#define MUS_STATUS_SOURCE_EOF				110
#define MUS_STATUS_PLAYING					111

//**special status updates for second song
#define MUS_STATUS_NEXT_SONG_SET			106
#define MUS_STATUS_NEXT_SONG_NOT_SET		108

//**MusManager internal message passing
#define MUS_INTMES_END_OF_SONG_REACHED		1001
#define MUS_INTMES_BUFFER_UNDERFLOW			1002
#define MUS_INTMES_NEXT_FRAME				1003

//**PIPE-IN possible return messages
#define MUS_PIPEINMES_PIPE_FULL				1004
#define MUS_PIPEINMES_PACKET_ADDED			1005
#define MUS_PIPEINMES_NO_MORE_PACKETS		1006

//**MusManager Error Codes
#define MUS_ERROR_CODE_CLEAR				0
#define MUS_ERROR_LOAD_PROBLEM				-1
#define MUS_ERROR_SDL_AUDIO_OPEN			-2
#define MUS_ERROR_SOUND_LIB_LOAD			-3
#define MUS_ERROR_NOT_INIT					-4
#define MUS_ERROR_DECODE_ERR				-5
#define MUS_ERROR_UNDERFLOW					-6
#define MUS_ERROR_SEEK_PROBLEM				-7
#define MUS_ERROR_ATTRIBUTE_CALLBACK_ERR	-8

#define MUS_INDEX_STATE_NOT_READY			0
#define MUS_INDEX_STATE_ALREADY				1
#define MUS_INDEX_STATE_FIRST				2
#define MUS_INDEX_STATE_FAILED				3

// *********************************************************
// Here we declare some generic message structs
// *********************************************************
struct MusicMessage
{
	MUS_MESSAGE Msg;

	// Other variables for passing additional info
	char *StrData;
	int32_t	IntData;
	double 	DoubleData;

	MusicMessage *Next;
};

class MsgHandler
{
public:

	virtual const char*	PassMessage(MUS_MESSAGE cmMsg,...) = 0;

};

#endif /* MESSAGES_H_ */
