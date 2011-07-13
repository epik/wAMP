/*
 * MusController.cpp
 *
 *  Created on: Aug 18, 2010
 *      Author: Joshua Soreth-Harman
 *
 *	This code was inspired by code from the MPG123 project.  In
 *	particular sdl.c (copyright 2006-9 by the mpg123 project).
 *  As such, I would consider it bound by their LGPL.
 *	I also drew inspiration from ao_sdl.c (copyleft 2001 by Felix
 *	B�nemann (atmosfear@users.sf.net) from mplayer, but I avoided
 *	using code from that project so to avoid the GPL.
 */

 /*
  *	This is basically a wrapper class that loads up a MusModule
  * object for each supported codec and formats it so the filter
  * and SDL can read it properly.  It also handles the basic
  * control of the music stream.
  */

#include "MusController.h"
#include <sdl.h>
#include "WormThread.h"
#include <cmath>


// We use global variables for thread safe passing here
// Message queue to allow for thread safe operation
MusicMessage	*g_dqMessageBuffer = NULL;
MusicMessage	*g_dqSongMessageBuffer = NULL;

// Callback functions to set variables in the global filter


// This is the call back required to be passed to the SDL sound library.
// -MusicController is a pointer to a this object, so the callback
// 	can access the MusicController being used by the main program.
// -destStream is the stream to load the processed data into so SDL can
//	read it.  Although it is passed as a Uint8, samples are consist of
//	one short for each channel of playback
// -lRequested is the length of Uint8.  It is not the number of requested
//	samples wich is actually 1/4 the size.
void MusController::audio_callback_sdl(void *MusicController,
										Uint8 *destStream, int lRequested)
{
	//ReportError("Audiocall Back In");
	MusController *pmcController = (MusController *)MusicController;

	pmcController->Mixer(destStream, lRequested);
	//ReportError("End Audiocall Back");
}


void MusController::Mixer(uint8_t *destStream, int lRequested)
{
#ifndef BUILD_FOR_TOUCHPAD	

	m_apPipeline[0].RunProcessStage(m_puiBuffToFill, lRequested);

	//ReportError("In mixer part of mixer");

	int16_t *psChan0 = (int16_t *) m_puiBuffToFill[0];
	int16_t *psChan1 = (int16_t *) m_puiBuffToFill[1];

	int16_t	*psTravStream = (int16_t *) destStream;
		
	for(int i=0; i<lRequested/4; i++)
	{
		*(psTravStream++) = *(psChan0++);
		*(psTravStream++) = *(psChan1++);
	}
	

	//ReportError("Mixer Out");
#else

	m_apPipeline[0].RunProcessStage(m_puiBuffToFill, lRequested);

	//ReportError("In mixer part of mixer");

	int16_t *psChan0 = (int16_t *) m_puiBuffToFill[0];
	int16_t *psChan1 = (int16_t *) m_puiBuffToFill[1];

	if (!m_iUseEQ)
	{
		int16_t	*psTravStream = (int16_t *) destStream;
	
		for(int i=0; i<lRequested/4; i++)
		{
			*(psTravStream++) = *(psChan0++);
			*(psTravStream++) = *(psChan1++);
		}
	}
	else
	{
		//ReportError("In EQ");
		m_eqGraphEQ.Filter(psChan0, psChan1, (int16_t *) destStream, lRequested/2);
	}

#endif

}


int16_t MusController::Init(void (*funcCallBack)(const char *),
							void (*funcSeekCallBack)(const char *))
{
	ReportError("In MusController Init");

	m_funcCallBack = funcCallBack;
	m_funcSeekCallBack = funcSeekCallBack;

	m_iUseEQ = 1;

	SDL_AudioSpec 	sdlasWanted, sdlasGot;

	sdlasWanted.channels 	= m_NUM_CHANNELS;
	sdlasWanted.freq		= m_DEST_FREQ;
	sdlasWanted.samples		= MUS_BUFFER_SIZE;
	sdlasWanted.callback	= audio_callback_sdl;
	sdlasWanted.userdata	= this;
	sdlasWanted.format		= AUDIO_S16;

	if ( SDL_OpenAudio(&sdlasWanted, &sdlasGot) )
	{
		ReportError1("Couldn't open SDL audio: %s\n", SDL_GetError());
		MUS_ERROR(MUS_ERROR_SDL_AUDIO_OPEN, SDL_GetError());
		return 1;
	}

	ReportError("In MusController Init - Made it past the SDL stuff");

	m_puiBuffToFill = (uint32_t **)MALLOC((1 + NUM_CHANNELS) * sizeof(uint32_t *));

#ifdef DEBUG
	*(m_puiBuffToFill+NUM_CHANNELS) = (uint32_t *) 0xBAADC0DE;
#endif

	for(int i=0; i<NUM_CHANNELS; i++)
	{
		m_puiBuffToFill[i] = (uint32_t *) MALLOC(sizeof(uint32_t) *
												  ((MUS_BUFFER_SIZE/
														LOW_SPEED_RATIO_LIM) +
												   40));
#ifdef DEBUG
		int32_t test = ((MUS_BUFFER_SIZE/
				LOW_SPEED_RATIO_LIM) +
				20);

		m_puiBuffToFill[i][test] = 0xBAADC0DE;
#endif
	}

#ifdef DEBUG
	if (*(m_puiBuffToFill+NUM_CHANNELS) != (uint32_t *) 0xBAADC0DE)
	{
		ReportError("Mem Problem");
		assert(0);
	}
#endif
	
	// Load the fir values for the resample filter
	//	which is a static variable shared across each
	//	instances of the filter.
	ResampleFilter::Init();
	
	for(int i=0; i<NUM_SIM_TRACKS; i++)
		m_apPipeline[i].Init(this);

	m_eqGraphEQ.Init();

	return 0;

};


int16_t MusController::Open(const char *cstrFileName,
							int32_t iTrack)
{
	//ReportError1("File path %s", cstrFileName);

	MUS_MESSAGE err = m_apPipeline[0].Open(cstrFileName);

	if (err == MUS_STATUS_ERROR)
	{
		return 1;
	}

	m_apPipeline[iTrack].RunDecodeStage();

	//ReportError("Finished Open");

	return 0;
};

int16_t MusController::SetNext(const char *cstrFileName,
							   float fTransition,
							   int32_t iTrack)
{
	//ReportError1("File path %s", cstrFileName);

	MUS_MESSAGE err = m_apPipeline[0].SetNext(cstrFileName, fTransition);

	if (err == MUS_STATUS_ERROR)
	{
		return 1;
	}

	//ReportError("Finished Open");

	return 0;
};




/**************************************
 * Seek()
 *
 *	This function is used to change the current playing position
 *		of the song.
 *
 * In
 * 	seconds - absolute position in seconds to seek to
 * Out
 *	0 is no error, 1 if error
 ***************************************/ 
int16_t MusController::Seek(double seconds, int32_t iTrack)
{
	uint32_t iCallbackVal;

	// call the seek routine of the playback library
	iCallbackVal = m_apPipeline[iTrack].Seek(seconds);

	m_apPipeline[iTrack].RunDecodeStage();

	sprintf(m_pcstrSeekCallback, "%i", iCallbackVal);

	m_funcSeekCallBack(m_pcstrSeekCallback);
	

	return 0;
}


/**************************************
 * Start()
 *
 *	This function launches a new thread that handles song file
 *		control such as byte decoding and playback position
 ***************************************/
void MusController::Start()
{
	// Don't need to save this, Thread should be self sufficient
	pthread_t Thread;

	// spawn the thread to run MusController's logic loop
	pthread_create(&Thread, NULL, ThreadedOperation, this);
}



/**************************************
 * Stop()
 *
 *	Resets the song to 0
 *
 *	Out
 *		0 for all cases
 ***************************************/
int16_t MusController::Stop()
{
	SDL_PauseAudio(1);

	return 0;
};

/**************************************
 * ThreadedOperation()
 *
 *	This is a static function that is used by as the launching
 *		point for threaded operation
 *
 *	In
 *		Pointer to music player object to launch
 *
 *	Out
 *		None, return value is a void pointer so the function template
 *		matches the callback
 ***************************************/
void *MusController::ThreadedOperation(void *pvObject)
{
	// Cast the object passed by the thread start routine to
	//	MusController
	MusController *pMusControl = (MusController *) pvObject;

	// Start MusController's maing logic loop
	pMusControl->Tick();

	// Do not worry about return value for now
	return NULL;
}


/**************************************
 * Tick()
 *
 *	This is the main logic control loop for the player.
 *		It processes all the messages passed by the user,
 *		buffers the song, and makes sure all the filters
 *		and decode modules are init.
 ***************************************/
void MusController::Tick()
{
	// This is used for message passing
	// Msg is the actual message that is passed, while MsgData
	//	is used to pass the funciton any additional data
	MusicMessage 	MsgData; // data passed with message
	MUS_MESSAGE		Msg;	 // message that is passed

	// run until we get a quit message
	while (1)
	{

		//Check is there are any messages to read.  If there are,
		//	run until they have all been read
		while (!_MsgQueueEmpty())
		{
			ReportError("Message queue reading");

			// Get the message (this is a locking function call)
			Msg = _ReadMessage(&MsgData);

			// Check what the message says
			if (Msg == MUS_MESSAGE_OPEN_SONG)
			{
				ReportError("Acting off of open song message");
				Open(MsgData.StrData, 0);
			}
			else if (Msg == MUS_MESSAGE_SET_NEXT)
			{
				ReportError("Acting off of set next message");
				SetNext(MsgData.StrData, MsgData.DoubleData, 0);
			}
			else if (Msg == MUS_MESSAGE_SEEK)
			{
				// The user sent a seek message.  Uncomment below to log to
				//	stderr every time a seek message is received.
				ReportError1("Seeking position %f", MsgData.DoubleData);
				Seek(MsgData.DoubleData, 0);
			}
			else if (Msg == MUS_INTMES_BUFFER_UNDERFLOW)
			{
				// We have had an underflow, so register it as an error
				MUS_ERROR(MUS_ERROR_UNDERFLOW, "Buffer underflow");

				// update status to say that we are not able to output
				//	song data

			}
			else if (Msg == MUS_INTMES_END_OF_SONG_REACHED)
			{
				// We reach here if the end of a song is reached, and
				//	a next song has not been set.
				Stop();
			}
			else if (Msg == MUS_MESSAGE_PASS_SONG_INFO)
			{
				ReportError("Handling Pas Song Info");
				m_funcCallBack(MsgData.StrData);
				FREE(MsgData.StrData);
			}


		} //while(bContinue)*/

		//ReportError("About to decode");

		for(int i=0; i<NUM_SIM_TRACKS; i++)
			m_apPipeline[i].RunDecodeStage();

		//ReportError("Finished decode stage");

		// Allow another thread the chance to run
		WormSleep(1);

	} // While (1)

	// Quit was called, so clean everything up
	Uninit();
}


/**************************************
 * Uninit()
 *
 *	Destructor function for MusModule.  Has to be called
 *		manually.
 ***************************************/
int16_t MusController::Uninit()
{
	SDL_PauseAudio(1);

	MUS_ERROR(MUS_ERROR_NOT_INIT, "MusModule uninited.");

	for(int i=0; i<NUM_SIM_TRACKS; i++)
		m_apPipeline[i].Uninit();

	SDL_CloseAudio();

	return 0;
};


const char* MusController::PassMessage(MUS_MESSAGE cmMsg, ...)
{
	LockMusMsgQueue();
	va_list Args;
	va_start(Args, cmMsg);
	if (cmMsg == MUS_MESSAGE_ATTRIB_SET)
	{
		float 	fSpeed;
		int32_t iIntArg;
		const char 	*pCharStrArg;

		int32_t ID = va_arg(Args, int32_t);

		switch (ID)
		{
		case ATTRIB_MUSCON_PAUSED:
			iIntArg = va_arg(Args, int32_t);
			SDL_PauseAudio(iIntArg);
			break;
		case ATTRIB_RESAMP_SPEED_VAL:
			fSpeed = va_arg(Args, double);
			iIntArg = va_arg(Args, int32_t);
			m_apPipeline[iIntArg].SetSpeed(fSpeed);
			break;
		case ATTRIB_BASSTREB_BASS_VAL:
			fSpeed = va_arg(Args, double);
			iIntArg = va_arg(Args, int32_t);
			m_apPipeline[iIntArg].SetBass(fSpeed);
			break;
		case ATTRIB_BASSTREB_TREB_VAL:
			fSpeed = va_arg(Args, double);
			iIntArg = va_arg(Args, int32_t);
			m_apPipeline[iIntArg].SetTreble(fSpeed);
			break;
		case ATTRIB_BASSTREB_MID_VAL:
			fSpeed = va_arg(Args, double);
			iIntArg = va_arg(Args, int32_t);
			m_apPipeline[iIntArg].SetMid(fSpeed);
			break;
		case ATTRIB_BASSTREB_VOL_VAL:
			fSpeed = va_arg(Args, double);
			iIntArg = va_arg(Args, int32_t);
			m_apPipeline[iIntArg].SetVol(fSpeed);
			break;
		case ATTRIB_EQ:
			pCharStrArg = va_arg(Args, const char *);
			m_eqGraphEQ.SetEQVals(pCharStrArg);
			break;
		}
	}
	else if (cmMsg == MUS_MESSAGE_ATTRIB_GET)
	{

	}
	else if (cmMsg == MUS_MESSAGE_GET_SONG_CUR)
	{
		sprintf(m_pcstrCurTimeCallback, "%u", m_apPipeline[0].GetCurTime());
		UnlockMusMsgQueue();
		return m_pcstrCurTimeCallback;
	}
	else if (cmMsg == MUS_MESSAGE_GET_SONG_END)
	{
		sprintf(m_pcstrEndTimeCallback, "%u", m_apPipeline[0].GetEndTime());
		UnlockMusMsgQueue();
		return m_pcstrEndTimeCallback;
	}
	else
	{
		ReportError("Creating msg and putting val in it");

		// This is a message that requires adding something to the
		//	message queue
		MusicMessage *MusicMsg = (MusicMessage *) malloc(sizeof(MusicMessage));
		MusicMsg->Next = NULL;

		if (cmMsg == MUS_MESSAGE_OPEN_SONG)
		{
			MusicMsg->Msg = MUS_MESSAGE_OPEN_SONG;
			char *cstrArg = va_arg(Args, char *);
			if (cstrArg)
			{
				MusicMsg->StrData = (char *) MALLOC(strlen(cstrArg)+8);
				strcpy(MusicMsg->StrData, cstrArg);
				MusicMsg->DoubleData = va_arg(Args, double);
			}
			else
			{
				UnlockMusMsgQueue();
				return NULL;
			}
			ReportError1("Created Message to Open Song %s", cstrArg);
		}
		else if (cmMsg == MUS_MESSAGE_SET_NEXT)
		{
			MusicMsg->Msg = MUS_MESSAGE_SET_NEXT;
			char *cstrArg = va_arg(Args, char *);
			MusicMsg->StrData = (char *) MALLOC(strlen(cstrArg)+8);
			strcpy(MusicMsg->StrData, cstrArg);
			MusicMsg->DoubleData = va_arg(Args, double);
			ReportError1("Created Message to SetNext %s", cstrArg);
		}
		else if (cmMsg == MUS_MESSAGE_SEEK)
		{
			MusicMsg->Msg = MUS_MESSAGE_SEEK;
			MusicMsg->DoubleData = va_arg(Args, double);
			ReportError1("Seeking to position %f", MusicMsg->DoubleData);
		}
		else if (cmMsg == MUS_MESSAGE_PASS_SONG_INFO)
		{
			char *cstrArg = va_arg(Args, char *);
			MusicMsg->Msg = MUS_MESSAGE_PASS_SONG_INFO;
			MusicMsg->StrData = cstrArg;
			ReportError1("Created Message to with Song Info: %s", cstrArg);
		}
		else
		{
			MusicMsg->Msg = cmMsg;
		}

		_AddMessage(MusicMsg);
	}
	va_end(Args);
	UnlockMusMsgQueue();
	//ReportError("Unlock Msg Queue after pass");
	return NULL;
}

void MusController::_AddMessage(MusicMessage *Message, int16_t iClearSongInfoBuf)
{
	//ReportError1("Adding Message %i", Message->Msg);
	if (g_dqMessageBuffer != NULL)
	{
		MusicMessage *Iter = g_dqMessageBuffer;
		while(Iter->Next != NULL)
			Iter = Iter->Next;
		Iter->Next = Message;
		Message->Next = NULL;
	}
	else
	{
		g_dqMessageBuffer = Message;
		Message->Next = NULL;
	}
}

MUS_MESSAGE MusController::_ReadMessage(MusicMessage *Message)
{
	//ReportError("Reading Message");
	MUS_MESSAGE retVal;
	LockMusMsgQueue();
	memcpy(Message, g_dqMessageBuffer, sizeof(MusicMessage));
	MusicMessage *Temp = g_dqMessageBuffer->Next;
	FREE(g_dqMessageBuffer);
	g_dqMessageBuffer = Temp;
	UnlockMusMsgQueue();
	retVal = Message->Msg;
	return retVal;
}

bool MusController::_MsgQueueEmpty()
{
	//ReportError("Checking if MSG Queue is empty");
	bool retVal = false;
	LockMusMsgQueue();
	if (g_dqMessageBuffer == NULL)
		retVal = true;
	UnlockMusMsgQueue();
	return retVal;
}
