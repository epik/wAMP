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
// Status variable of the current song state
MUS_MESSAGE 	g_cmStatus = MUS_STATUS_ERROR;
// status of the next song to play
MUS_MESSAGE		g_cmNextSongStatus = MUS_STATUS_ERROR;
// variables for keeping track of currently playing song
char m_cstrCurrentSong[512];
// keep track of the next song to play
char m_cstrNextSong[512];

// the resample filter used by the musmodule for playback
ResampleFilter  g_rfResample;
float			g_fSongRateScale = 1.0;
float			g_fNextSongRateScale = 1.0;
float			g_fCurSpeed = 1.0;
int16_t			g_bDifSampleRate = 0;

// Callback functions to set variables in the global filter
void SetSpeed(double fSpeed)
{
	ReportError2("Speed Set=%f, scaled by=%f", fSpeed, g_fSongRateScale);
	g_rfResample.SetFilterRate(fSpeed * g_fSongRateScale);
	g_fCurSpeed = fSpeed;
};
char* GetSpeed()
{
	char *str = (char *) malloc(10);
	sprintf(str, "%f", g_fCurSpeed);
	return str;
};

// This is for keeping track of the sample rate scale factor of the current
//      song (Dest Sample Rate/Src Sample rate) - lower value makes song play
//	    faster
double	m_dCurSongRate;
// keeps track of the sample rate scale factor of the next song
double m_dNextSongRate;
// we need this to adjust song len to reflect the transition method
int32_t	m_iSongTransLenFix;


// Keep track of current song length and pos
int32_t			m_lSongEndInSec;
int32_t			m_lCurSongSamp;




// Callback for pausing or playing audio
int16_t m_sPaused;
void SetPaused(int32_t val)
{
	m_sPaused = val;
	SDL_PauseAudio(val);
};
char* GetPaused()
{
	char *str = (char *) malloc(10);
	sprintf(str, "%i", m_sPaused);
	return str;
}


// macros and functions for working with the multiple buffers
#define NextBufNum(x) (x^1)
#define NextBufNumActual(x) NextBufNum(x)+c_NumBuffs
#define BufNumActual(x) x+c_NumBuffs
#define PreviousBufNum(x) (x^1)
#define PreviousBufNumActual(x) PreviousBufNum(x)+c_NumBuffs

// Gets the distance between two buffer positions
int32_t GetBuffRelativeDis(uint32_t ReadBuf, size_t ReadPos,
							uint32_t WriteBuf, size_t WritePos)
{
	// Note that ReadPos must be less than 2*c_BufferUsableSize
	//	if that was allowed, then we would need a more detailed
	//	calc
	if (ReadPos > (MusController::c_BufferUsableSize*2))
		ReportError("Problem with ReadPos above usable buf * 2 ");
	// Note the same condition here.  This limits the length of
	//	allowable gaps.
	if ((WritePos+MusController::c_BufferUsableSize)<0)
		ReportError("Problem with WritePos below 0");

	if (ReadBuf == WriteBuf)
	{
		return WritePos - ReadPos;
	}

	int retVal;

	if (WritePos >= 0)
	{
		if (ReadPos > MusController::c_BufferUsableSize)
		{
			retVal = WritePos + MusController::c_BufferUsableSize;
			retVal -= ReadPos;
		}
		else
		{
			retVal = MusController::c_BufferUsableSize - ReadPos;
			retVal += WritePos;
		}
	}
	else
	{
		retVal = WritePos + MusController::c_BufferUsableSize;
		retVal -= ReadPos;
	}

	return retVal;
}

// Adds a number to a buffer
inline void AddNumToBuff(uint32_t &BufID, size_t &BufPos, size_t NumToAdd)
{
	BufPos += NumToAdd;

	if (BufPos > MusController::c_BufferUsableSize)
	{
		BufPos = BufPos - MusController::c_BufferUsableSize;
		BufID = NextBufNum(BufID);
	}
}

// subtracts a number from a buffer
inline void SubNumFromBuff(uint32_t &BufID, size_t &BufPos, size_t NumToAdd)
{
	// Buf is unsigned we use a signed temp
	int32_t iTmp = BufPos - NumToAdd;

	if (iTmp < 0)
	{
		BufPos = MusController::c_BufferUsableSize + iTmp;
		BufID = NextBufNum(BufID);
	}
	else
		BufPos = iTmp;
}

#define FIXED_POINT_SEC_CONVERT_FACTOR ((1<<26)/(DEST_FREQ))

size_t ConvertToSecs(size_t lSamps)
{
	uint64_t llConvert = (uint64_t) lSamps * FIXED_POINT_SEC_CONVERT_FACTOR;
	llConvert += (1<<25);
	return llConvert>>26;
}

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
	//ReportError("****************ENTERING FILTER CALLBACK*************");

	/*ReportError2("{\"CurPos\":%i,\"EndAmt\":%i}",
				 ConvertToSecs(m_lCurSongSamp),
				 m_lSongEndInSec);*/

	MusController *pmcController = (MusController *)MusicController;
	int32_t	lPartialAdvance = 0;
	/*ReportError7("Cur End Pos %i:ID %i, Cur Write Pos %i:ID: %i, Cur read pos %i:ID %i, req %i",
									pmcController->m_lSongEndPos,
									pmcController->m_iEndSonBuffID,
									pmcController->m_lModuleWriteToPos,
									pmcController->m_iWritingBuffID,
									pmcController->m_lReadToDSPPos,
									pmcController->m_iReadingBuffID,
									lRequested);*/

	// Check if we are in a state where we should not be playing
	//	and send silence if we are
	if ((g_cmStatus == MUS_STATUS_LOADING) ||
			(g_cmStatus == MUS_STATUS_WAITING_FOR_SONG))
	{
		ReportError("Prevented early stream playback");
		memset(destStream, 0, lRequested);
		return;
	}

	int32_t iOver;

	int32_t iConvRequest = g_rfResample.AdvanceByAmount(lRequested/8);

	if (g_cmStatus == MUS_STATUS_LOADING_NEXT_SONG)
	{
		iOver = GetBuffRelativeDis(pmcController->m_iReadingBuffID,
							   (pmcController->m_lReadToDSPPos + iConvRequest),
							   pmcController->m_iEndSonBuffID,
							   pmcController->m_lSongEndPos);

		//ReportError1("iOver val=%i", iOver);

		if (iOver < 0)
		{
			g_cmStatus = MUS_STATUS_SONG_LOADED;
			g_cmNextSongStatus = MUS_STATUS_NEXT_SONG_NOT_SET;
			//ReportError2("About to copy string=%s, with %s", m_cstrCurrentSong, m_cstrNextSong);
			strcpy(m_cstrCurrentSong, m_cstrNextSong);
			memset(m_cstrNextSong, 0, 255);
			//ReportError("About to GetSeconds");
			m_lSongEndInSec =
						   pmcController->m_FFmpegDecoder.GetSeconds();
			m_lCurSongSamp = 0;
			g_fSongRateScale = g_fNextSongRateScale;
			SetSpeed(g_fCurSpeed);

			pmcController->StartSong();

			lPartialAdvance = iOver;

			//ReportError("About to swap buffers");
			pmcController->m_lSongEndPos = pmcController->m_lBufEndPos;
			pmcController->m_iEndSonBuffID = pmcController->m_lBufEndID;
			pmcController->m_lBufEndPos = 0;
			pmcController->m_lBufEndID = 0;

			if (pmcController->m_iEndSet == END_BUF_FULL)
			{
				pmcController->m_iEndSet = NEED_TO_BUF_END;
			}
			else //if (pmcController->m_iEndSet == NEED_TO_BUF_END)
			{
				pmcController->m_iEndSet = END_BUF_CLEAR;
			}

		}

	}

	iOver = GetBuffRelativeDis(pmcController->m_iReadingBuffID,
							   (pmcController->m_lReadToDSPPos + iConvRequest),
							   pmcController->m_iWritingBuffID,
							   pmcController->m_lModuleWriteToPos);

	if (iOver < 0)
	{
		//ReportError("In the underflow area");

		if ((pmcController->m_iStopWriting) &&
					(g_cmStatus != MUS_STATUS_LOADING_NEXT_SONG))
		{
			//ReportError("passing mus end of song reached");
			g_cmStatus = MUS_STATUS_WAITING_FOR_SONG;
			pmcController->PassMessage(MUS_INTMES_END_OF_SONG_REACHED);
			//ReportError("passed the message");
			memset(destStream, 0, lRequested);
			//ReportError("set the 0s");
			return;
		}
		else
		{
			ReportError("passing underflow");
			// We have an underflow error
			// First make sure no further playing occurs until condition
			//	is fixed
			g_cmStatus = MUS_STATUS_LOADING;

			// Now pass the message to let the MusController know there
			//	is a problem.
			pmcController->PassMessage(MUS_INTMES_BUFFER_UNDERFLOW);

			// Pass silence to SDL
			memset(destStream, 0, lRequested);

			// Return without advancing the read pointer
			return;
		}
	}

	//ReportError("About to start filtering");

	short *psOutBuffer = (short *)destStream;

	size_t	uiNumRead = 0;

	int16_t	*piChan[2];

	g_rfResample.Filter(
				pmcController->m_piChanBuffer[pmcController->m_iReadingBuffID][0],
				pmcController->m_lReadToDSPPos,
				&uiNumRead,
				pmcController->m_psTempBuf,
				lRequested/4);

	g_rfResample.Filter(
				pmcController->m_piChanBuffer[pmcController->m_iReadingBuffID][1],
				pmcController->m_lReadToDSPPos,
				&uiNumRead,
				pmcController->m_psTempBuf+lRequested/4,
				lRequested/4);

	piChan[0] = pmcController->m_psTempBuf;
	piChan[1] = (pmcController->m_psTempBuf+lRequested/4);

	// Uncomment for the speed control
	/*int16_t *psChan0 = pmcController->m_psTempBuf;
	int16_t *psChan1 = (pmcController->m_psTempBuf+lRequested/4);

	for (int i=0;i<m_lBufferSize;i++)
	{
		*psOutBuffer++ = *psChan0++;
		*psOutBuffer++ = *psChan1++;
	}*/



	// Uncomment this for the raw stream
	/*int16_t *psChan0 = (int16_t *) &pmcController->m_piChanBuffer[pmcController->m_iReadingBuffID][0][pmcController->m_lReadToDSPPos];
	int16_t *psChan1 = (int16_t *) &pmcController->m_piChanBuffer[pmcController->m_iReadingBuffID][1][pmcController->m_lReadToDSPPos];

	pmcController->m_lReadToDSPPos += m_lBufferSize/2;

	for (int i=0;i<m_lBufferSize;i++)
	{
		*psOutBuffer++ = *psChan0++;
		*psOutBuffer++ = *psChan1++;
	}*/

	pmcController->m_lReadToDSPPos += uiNumRead;

	m_lCurSongSamp += (uiNumRead*2) + lPartialAdvance;

	if(pmcController->m_lReadToDSPPos > c_BufferUsableSize)
	{
		pmcController->m_lReadToDSPPos %= c_BufferUsableSize;
		pmcController->m_iReadingBuffID =
						NextBufNum(pmcController->m_iReadingBuffID);
	}

	pmcController->m_geqEqualizer.Filter(
			piChan,
			0,
			&uiNumRead,
			psOutBuffer,
			lRequested/2);

	//ReportError("*****************EXITING FILTER CALLBACK***************");

};


int16_t MusController::Init(void (*funcCallBack)(char *))
{
	m_funcCallBack = funcCallBack;

	m_cstrMetaRetTemp = (char *) malloc(4096);
	m_iSizeMetaRetTemp = 4096;

	m_sPaused = 1;
	RegisterIntAttribute(GetPaused,
						SetPaused,
						ATTRIB_MUSCON_PAUSED);

	SDL_AudioSpec 	sdlasWanted, sdlasGot;

	sdlasWanted.channels 	= m_NUM_CHANNELS;
	sdlasWanted.freq		= m_DEST_FREQ;
	sdlasWanted.samples		= m_lBufferSize;
	sdlasWanted.callback	= audio_callback_sdl;
	sdlasWanted.userdata	= this;
	sdlasWanted.format		= AUDIO_S16;

	if ( SDL_OpenAudio(&sdlasWanted, &sdlasGot) )
	{
		ReportError1("Couldn't open SDL audio: %s\n", SDL_GetError());
		MUS_ERROR(MUS_ERROR_SDL_AUDIO_OPEN, SDL_GetError());
		return 1;
	}

	// Initialize ffmpeg
	m_FFmpegDecoder.SetBufferSize(m_lBufferSize);
	m_FFmpegDecoder.Init();


	for (size_t i=0;i<c_NumBuffs;i++)
	{
		m_piChanBuffer[i+c_NumBuffs][0] = (uint32_t *)
								malloc(sizeof(uint32_t) * c_BufferTrueSize);
		m_piChanBuffer[i+c_NumBuffs][1] = (uint32_t *)
								malloc(sizeof(uint32_t) * c_BufferTrueSize);

		m_piChanBuffer[i][0] = &m_piChanBuffer[i+c_NumBuffs][0][c_BuffInitialOffset];
		m_piChanBuffer[i][1] = &m_piChanBuffer[i+c_NumBuffs][1][c_BuffInitialOffset];
	}

	RegisterDoubleAttribute(GetSpeed, SetSpeed, ATTRIB_RESAMP_SPEED_VAL);

	for (FilterType i = FT_START; i != FT_END; i++)
	{
		FiltMessage err = pftFilters[i]->Init(this);

		if (err == FILT_Error)
			return 1;
	}

	Stop();

	g_cmStatus = MUS_STATUS_WAITING_FOR_SONG;
	g_cmNextSongStatus = MUS_STATUS_NEXT_SONG_NOT_SET;

	return 0;

};


int16_t MusController::Open(const char *cstrFileName)
{
	//ReportError1("File path %s", cstrFileName);

	MusMessage err = m_FFmpegDecoder.Open(cstrFileName);

	if (err == MUS_MOD_Error)
	{
		return 1;
	}

	//ReportError("Finished Open");

	return 0;
};

using namespace std;


/**************************************************
 * FillBuffer()
 *
 *	This routine calls the decoder to decode the song bytestream
 *		and then adds it to a buffer for playback.  The playback
 *		buffer is designed to simulate a circular buffer.  It does
 *		that by having two arrays and copying the end of one array
 *		to the start of the other array.  It also handles song
 *		transitions.
 *
 *	OUT
 *		0 for no error, 1 for error (error return is not yet implemented)
 ***************************************************/
int16_t MusController::FillBuffer()
{
	// If we add a gap in between two songs, we need to adjust the point
	//	that signifies the song to end.  Because we simulate a circular
	//	buffer using two arrays, and because of the implementation of
	//	the circular array, we cannot have the write pos be less then
	//	the read pos when they are both on the same array.  Therefore
	//	when we need to advance the gap so far that it would move the
	//	write pointer to the other buffer, we have to wait until the
	//	read buffer moves off of that buffer.
	if (m_lEndShiftRemain > 0)
	{
		if (m_iWritingBuffID == PreviousBufNum(m_iReadingBuffID))
		{
			AddNumToBuff(m_iEndSonBuffID, m_lSongEndPos, m_lEndShiftRemain);
			m_lEndShiftRemain = 0;
		}
	}

	if (m_iEndSet == END_BUF_FULL)
		return 0;

	// Stop writing will be set when the buffer has reached the end of the
	//	current song.
	if (m_iStopWriting)
	{
		// If we have fully buffered the song to its end, we can start to
		//	load the next song to the buffer it is set.
		if(g_cmNextSongStatus == MUS_STATUS_NEXT_SONG_SET)
		{
			// we should start writing again
			m_iStopWriting = 0;

			// let other methods know we are working with the next song
			g_cmStatus = MUS_STATUS_LOADING_NEXT_SONG;

			// we only want to keep one song open at a time
			m_FFmpegDecoder.Close();

			int32_t err = Open(m_cstrNextSong);

			if (err)
			{
				m_iStopWriting = 1;
				g_cmNextSongStatus = MUS_STATUS_NEXT_SONG_NOT_SET;
				g_cmStatus = MUS_STATUS_SONG_LOADED;

				MUS_ERROR(MUS_ERROR_LOAD_PROBLEM,
									"Problem trying to open the next song");

				m_bDirtyLoad = 1;
				return 0;
			}

			g_fNextSongRateScale =
						m_FFmpegDecoder.GetSampleRate()/DEST_FREQ;

			SetMeta();

			// The next buffer can be set with a number of options.
			//	 Here we figure out what those options are and set
			//	 the proper variables.
			if (m_lNextSongGap == 0)
			{
				//No gap

				m_sNextSongWriteType = 0;

			}
			else if (m_lNextSongGap > 0)
			{
				// Playback with a gap

				m_sNextSongWriteType = 1;

				if (m_iWritingBuffID == PreviousBufNum(m_iReadingBuffID))
				{
					AddNumToBuff(m_iEndSonBuffID, m_lSongEndPos,
													m_lNextSongGap);
				}
				else
				{
					int32_t iTmp = m_lSongEndPos + m_lNextSongGap;
					iTmp -= MusController::c_BufferUsableSize;
					if ( iTmp > 0)
					{
						m_lEndShiftRemain = iTmp;
						AddNumToBuff(m_iEndSonBuffID, m_lSongEndPos,
													m_lNextSongGap - iTmp);
					}
					else
					{
						AddNumToBuff(m_iEndSonBuffID, m_lSongEndPos,
													m_lNextSongGap);
					}
				}
			}
			else
			{
				// Crossfade transition

				// zero out the fade in for the next song
				m_lNextSongFadeIn = 0;

				// Check if the sample rates differ between the songs
				//	that are being cross faded.
				if (g_fNextSongRateScale == g_fSongRateScale)
					g_bDifSampleRate = 1;


				//songs should overlap
				int iCheckFadeRoom;
				iCheckFadeRoom = GetBuffRelativeDis(m_iReadingBuffID,
										m_lReadToDSPPos + (3*m_lBufferSize),
										m_iWritingBuffID,
										m_lModuleWriteToPos - m_lCurSongFadeDown);

				//ReportError1("iCheckFade=%i", iCheckFadeRoom);

				// First, we need to make sure we have sufficient room
				//	to implement the fade
				if (iCheckFadeRoom < 0)
				{
					m_lCurSongFadeDown += iCheckFadeRoom;
					m_lNextSongFadeIn -= iCheckFadeRoom;
				}

				SDL_LockAudio();
				SubNumFromBuff(m_iEndSonBuffID, m_lSongEndPos,
												m_lCurSongFadeDown);

				//ReportError1("WritePos=%i", m_lModuleWriteToPos);

				SubNumFromBuff(m_iWritingBuffID, m_lModuleWriteToPos,
												m_lCurSongFadeDown);
				SDL_UnlockAudio();

				// Check if we need to copy the write to buffer for
				//	resampling later.  If so, we need to copy 2
				//	buffers worth to allow the resample filter room
				//	to traverse the stream
				if (0) //(g_bDifSampleRate) - uncomment when ready
				{
					memcpy(m_psResamplTmpBuf[0],
							&m_piChanBuffer[BufNumActual(m_iWritingBuffID)]
										  [0]
										  [m_lModuleWriteToPos -
													m_lBufferSize +
													c_BuffInitialOffset],
							2*m_lBufferSize*sizeof(int16_t));
					memcpy(m_psResamplTmpBuf[1],
							&m_piChanBuffer[BufNumActual(m_iWritingBuffID)]
										  [1]
										  [m_lModuleWriteToPos -
													m_lBufferSize +
													c_BuffInitialOffset],
							2*m_lBufferSize*sizeof(int16_t));
				}


				//ReportError1("WritePos=%i", m_lModuleWriteToPos);



				m_sNextSongWriteType = 3;

			}
		}
		else
		{
			// buffer is fully decoded, but no next song has been set
			return 0;
		}
	}

	// Check if we have reached the end of one of the two arrays
	//	being used to simulate the circular buffer.
	if (m_lModuleWriteToPos > c_BufferUsableSize)
	{
		// Check whether the write buffer is on the same array
		//	as the read pointer.  If it is, then
		//	we need to copy the end of the buffer we are currently
		//	writing to, to the start of the next buffer.  We also
		//	adjust the pointers to reflect the transition.
		if (m_iWritingBuffID == m_iReadingBuffID)
		{
			m_lModuleWriteToPos %= c_BufferUsableSize; // mod (1<<19)
			size_t iCpySize = c_BuffInitialOffset +
										m_lModuleWriteToPos;
			memcpy(m_piChanBuffer[NextBufNumActual(m_iWritingBuffID)][0],
					&m_piChanBuffer[m_iWritingBuffID][0][c_CopyPoint],
					iCpySize*sizeof(uint32_t));
			memcpy(m_piChanBuffer[NextBufNumActual(m_iWritingBuffID)][1],
					&m_piChanBuffer[m_iWritingBuffID][1][c_CopyPoint],
					iCpySize*sizeof(uint32_t));
			m_iDirtyBuff = m_lModuleWriteToPos;
			m_iWritingBuffID = NextBufNum(m_iWritingBuffID);
		}
		else
		{
			// If the write buffer is not on the same buffer
			// as the read buffer then that means we have
			// maxed out the buffer, so nothing to do
			return 0;
		}
	}

	size_t plNumBytesWritten;

	uint8_t pucTempBuffer[m_lBufferSize+1];


	MusMessage mmWritingStatus = MUS_MOD_Success;

	// This if/then statement figures out how we should fill the
	//	temp buffer before we add it to the main circular buffer
	//	We will either fill it completely with song data, or we will
	//	fill it with silence, or partial silence.
	if ((m_sNextSongWriteType == 0) || (m_sNextSongWriteType == 3))
	{
		// We end up here if we are doing gapless transition or
		//	crossfade or a fresh load
		mmWritingStatus = m_FFmpegDecoder.FillBuffWithRawSong(
										pucTempBuffer, &plNumBytesWritten);

		//assert(g_test++ < 1);

		//ReportError1("The num bytes returned %i", plNumBytesWritten);
	}
	else if (m_sNextSongWriteType == 1)
	{

		// We only allow transitions of size X * Buffersize
		memset(pucTempBuffer, 0, m_lBufferSize);
		plNumBytesWritten = m_lBufferSize;
		m_lNextSongGap -= m_lBufferSize;

		//positive gap
		if (m_lNextSongGap<m_lBufferSize)
		{
			m_sNextSongWriteType = 0;
			m_lNextSongGap = 0;
		}
	}



	// We have an error, so truncate the stream at the last good position
	if ((plNumBytesWritten == 0) && (mmWritingStatus != MUS_MOD_Too_Short))
	{
		if (mmWritingStatus == MUS_MOD_Success)
		{
			return 0;
		}

		SDL_LockAudio();

		m_iStopWriting = 1;

		if (m_iEndSet == NEED_TO_BUF_END)
		{
			m_lBufEndPos = m_lModuleWriteToPos;
			m_lBufEndID = m_iWritingBuffID;
			m_iEndSet = END_BUF_FULL;
		}
		else
		{
			m_lSongEndPos = m_lModuleWriteToPos;
			m_iEndSonBuffID = m_iWritingBuffID;
			m_iEndSet = NEED_TO_BUF_END;
		}
		SDL_UnlockAudio();
		return 1;
	}

	uint8_t *pucStop;
	uint8_t pucTempBufferSec[m_lBufferSize*6];
	short *psBuffPointer;
	
	if (mmWritingStatus == MUS_MOD_Too_Short)
	{
	
		memset(&pucTempBufferSec, 0, (m_lBufferSize*6));
		
		pucStop = &pucTempBufferSec[(m_lBufferSize*6)];
		
		psBuffPointer = (short *) pucTempBufferSec;
		
		g_bDifSampleRate = 0;
		m_sNextSongWriteType = 0;
		
		plNumBytesWritten = (m_lBufferSize*6);
	}
	else
	{

		pucStop = &pucTempBuffer[plNumBytesWritten];
		psBuffPointer = (short *) pucTempBuffer;
	}

	// Get a pointer to the current write position for both the left and right
	//	buffer.
	int16_t *piPointer0 = (int16_t *)
					&m_piChanBuffer[m_iWritingBuffID][0][m_lModuleWriteToPos];
	int16_t *piPointer1 = (int16_t *)
					&m_piChanBuffer[m_iWritingBuffID][1][m_lModuleWriteToPos];



	// This if/else statement controls how the information is actually
	//	written to the circular playback buffer.  Either it is written
	//	directly to the buffer, or it is cross faded in
	if (m_sNextSongWriteType != 3)
	{
		// Write the temp buffer directly to the circular playback buffer
		while (psBuffPointer < (short *)pucStop)
		{
			*piPointer0++ = (*psBuffPointer++);
			*piPointer1++ = (*psBuffPointer++);
		}
	}
	else
	{
		// We end up here if we are cross fading.  We need to resample the
		//	old song if it is a different sample rate than the new stream.
		//	We resample the old song because we treat the new song as
		//	starting at the point its byte stream is reached, and so
		//	the playback sample changes at that point.
		if (g_bDifSampleRate)
		{


		}

		while (psBuffPointer < (short *)pucStop)
		{
			int64_t temp = *piPointer0 * (int64_t) m_lCurSongFadeDown;
			temp >>= m_sCurrentShiftAmt;
			int64_t temp1 = (*psBuffPointer++) * (int64_t) m_lNextSongFadeIn;
			temp1 >>= m_sCurrentShiftAmt;
			*piPointer0++ = temp + temp1;
			temp = *piPointer1 * (int64_t) m_lCurSongFadeDown;
			temp >>= m_sCurrentShiftAmt;
			temp1 = (*psBuffPointer++) * (int64_t) m_lNextSongFadeIn;
			temp1 >>= m_sCurrentShiftAmt;
			*piPointer1++ = temp + temp1;
			m_lCurSongFadeDown--;
			m_lNextSongFadeIn++;
		}

		if ((m_lCurSongFadeDown - m_lBufferSize)  < 0)
		{
			// stop adjusting
			g_bDifSampleRate = 0;
			m_sNextSongWriteType = 0;
		}
	}


	// We have an error, so truncate the stream at the last good position
	if (mmWritingStatus == MUS_MOD_Error)
	{
		SDL_LockAudio();
		m_iStopWriting = 1;

		if (m_iEndSet == NEED_TO_BUF_END)
		{
			m_lBufEndPos = m_lModuleWriteToPos;
			m_lBufEndID = m_iWritingBuffID;
			m_iEndSet = END_BUF_FULL;
		}
		else
		{
			m_lSongEndPos = m_lModuleWriteToPos;
			m_iEndSonBuffID = m_iWritingBuffID;
			m_iEndSet = NEED_TO_BUF_END;
		}
		SDL_UnlockAudio();
		return 1;
	}


	uint32_t *piDestStart;

	// need to update this before write pos to make sure we are thread safe
	if (m_iDirtyBuff)
	{
		size_t iCpyPoint = c_BufferUsableSize + m_iDirtyBuff;

		if ((m_lModuleWriteToPos + plNumBytesWritten/8) < c_BuffTale)
		{
			size_t iCpySize = (m_lModuleWriteToPos + plNumBytesWritten/8) -
										m_iDirtyBuff;
			piDestStart = &m_piChanBuffer[PreviousBufNum(m_iWritingBuffID)]
										 [0][iCpyPoint];
			memcpy(piDestStart,
					&m_piChanBuffer[m_iWritingBuffID][0][m_iDirtyBuff],
					iCpySize*sizeof(uint32_t));
			piDestStart = &m_piChanBuffer[PreviousBufNum(m_iWritingBuffID)]
										 [1][iCpyPoint];
			memcpy(piDestStart,
					&m_piChanBuffer[m_iWritingBuffID][1][m_iDirtyBuff],
					iCpySize*sizeof(uint32_t));
			m_iDirtyBuff = m_lModuleWriteToPos + plNumBytesWritten/8;
		}
		else
		{
			size_t iCpySize = c_BuffTale - m_iDirtyBuff;
			piDestStart = &m_piChanBuffer[PreviousBufNum(m_iWritingBuffID)]
										 [0][iCpyPoint];
			memcpy(piDestStart,
					&m_piChanBuffer[m_iWritingBuffID][0][m_iDirtyBuff],
					iCpySize*sizeof(uint32_t));
			piDestStart = &m_piChanBuffer[PreviousBufNum(m_iWritingBuffID)]
										 [1][iCpyPoint];
			memcpy(piDestStart,
					&m_piChanBuffer[m_iWritingBuffID][1][m_iDirtyBuff],
					iCpySize*sizeof(uint32_t));
			m_iDirtyBuff = 0;
		}
	}

	m_lModuleWriteToPos += plNumBytesWritten/8;


	if ((mmWritingStatus == MUS_MOD_Done) || 
				(mmWritingStatus == MUS_MOD_Too_Short))
	{
		SDL_LockAudio();
		m_iStopWriting = 1;

		if (m_iEndSet == NEED_TO_BUF_END)
		{
			m_lBufEndPos = m_lModuleWriteToPos;
			m_lBufEndID = m_iWritingBuffID;
			m_iEndSet = END_BUF_FULL;
		}
		else
		{
			m_lSongEndPos = m_lModuleWriteToPos;
			m_iEndSonBuffID = m_iWritingBuffID;
			m_iEndSet = NEED_TO_BUF_END;
		}
		SDL_UnlockAudio();
		return 1;
	}


	return 0;
};


/**************************************
 * FillInitialBuff()
 *
 *	This makes sure the buffer is filled according to certain
 *		specifications.  It keeps filling until either a specified
 *		amount of time has elapsed, or the buffer can play for
 *		a specified number of seconds at the quickest playback
 *		speed
 *
 *	In
 *		SecBuf - number of seconds of playback that needs to be buffered
 *		WaitTime - number of clock ticks that should be spent filling the
 *					buffer
 *
 *	Out
 *		0 on success
 ***************************************/
int16_t MusController::FillInitialBuff(uint32_t SecBuf,
										uint32_t WaitTime)
{
	// Uncomment to let you know whenever we enter fillinitialbuffer
	//ReportError("Starting to fill initial buffer");

	// this keeps track of how many seconds have been buffered
	uint32_t uiCurSecBuf = 0;

	// this keeps track of how long the user has waited for
	//	the buffering
	uint32_t uiCurWaitTime = 0;

	int32_t iStopWrite = 0;

	// This starts the timer running so we can know how long we have
	//	been filling the buffer
	WormMarkStartTime();

	// Run fillbuffer until we meet one of the specified conditions
	while ((uiCurSecBuf < SecBuf) &&   // check the number of secs buffered
		   !(iStopWrite) &&        // check if buffer is full
		   (uiCurWaitTime < WaitTime)) // check wait time
	{
		// This is the call to the function that actually fills the buffer
		iStopWrite = FillBuffer();

		// update seconds buffered
		uiCurSecBuf = GetSecsBuffered();

		// update time since we started
		uiCurWaitTime = WormCheckTimeSinceMark();

		// Give the gui a chance to work
		WormSleep(1);
	}

	// Update the state variable to let the rest of controller know
	//	we are ready to start reading from the music stream
	g_cmStatus = MUS_STATUS_SONG_LOADED;

	// Uncomment to write to stderr every time this function finishes
	//ReportError("Finished initial buffer fill");

	// Return success
	return 0;
}


/**************************************
 * GetSecsBuffered()
 *
 *	Returns the number of seconds worth of bytes that we have.  Based
 *		on a sample rate of 44100x4
 *
 *	Out
 *		Seconds worth of data that has been buffered
 ***************************************/
uint32_t MusController::GetSecsBuffered()
{
	long iSeconds;

	iSeconds = GetBuffRelativeDis(m_iReadingBuffID,
							   	  m_lReadToDSPPos,
							   	  m_iWritingBuffID,
							   	  m_lModuleWriteToPos);

	// now figure out how many samples per second we have
	iSeconds = iSeconds/m_DEST_FREQ;
	// now account for worst case speed scenario
	iSeconds *= LOW_SPEED_RATIO_LIM;

	return iSeconds;
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
int16_t MusController::Seek(double seconds)
{
	int NextCheck = 0;

	// make sure we are not in the playback loop
	//	while running seek
	SDL_LockAudio();

	if (g_cmStatus == MUS_STATUS_LOADING_NEXT_SONG)
	{
		// if we are here, it means we have already started
		//	loading the next song.  As a result, we need to roll
		//	back and reload the current song
		m_FFmpegDecoder.Close();
		Open(m_cstrCurrentSong);
		NextCheck = 1;
	}
	else if (m_bDirtyLoad)
	{
		// This is called if we tried to set next, but there was an
		//	error.  The result is that there is nothing to close
		//	because no song was loaded, but we still need to reopen
		//	the currently playing song
		m_bDirtyLoad = 0;
		Open(m_cstrCurrentSong);
	}

	// call the seek routine of the playback library
	m_lCurSongSamp = m_FFmpegDecoder.Seek(seconds);

	// reset all the position markers to 0
	m_lModuleWriteToPos = 0;
	m_lReadToDSPPos		= 0;
	m_iWritingBuffID	= 0;
	m_iReadingBuffID	= 0;
	m_iDirtyBuff		= 0;

	// tell fillbuffer to start writing again
	m_iStopWriting = 0;

	// Make sure the buffer prior to the start position
	//	is clear for the resample filter
	for (size_t i=0;i<c_BuffInitialOffset;i++)
			m_piChanBuffer[c_NumBuffs][0][i] = 0;

	// Clear out the iir filter history.
	m_geqEqualizer.Reset();

	// refill the buffer, but don't wait longer than 1 sec
	FillInitialBuff(5,1);

	// allow the player to start up again
	SDL_UnlockAudio();

	// Make sure we set next if it was already loading
	if (NextCheck)
	{
		OpenNext(MUS_MESSAGE_SET_NEXT, m_cstrNextSong, m_lNextSongTimeBack);
	}

	return 0;
}


/**************************************
 * SetNextMeta()
 *
 *	This sets the metadate for the StartSong
 *	callback.
 ***************************************/
void MusController::SetMeta()
{
	char *cstrMega = m_FFmpegDecoder.GetMetadata();

	PassMessage(MUS_MESSAGE_SET_NEXT_META, cstrMega);

	free(cstrMega);
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


/**************************************************
 * StartSong()
 *
 *	This routine formats a JSON to pass to the javascript
 *	to let it know that a song has ended.
 **************************************************/
void MusController::StartSong()
{
	PassMessage(MUS_MESSAGE_PASS_SONG_INFO);
};


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

	// move the write pointer to the start of where the song should be
	//	since we create the initial 0 buffer for the filter
	m_lModuleWriteToPos = 0;
	m_lReadToDSPPos		= 0;
	m_iWritingBuffID	= 0;
	m_iReadingBuffID	= 0;
	m_iDirtyBuff		= 0;
	m_iEndSonBuffID		= 0;
	m_lSongEndPos		= 0;

	// Clear out the buffer to make sure the filter will work ok
	for (size_t i=0;i<c_BuffInitialOffset;i++)
	{
		m_piChanBuffer[c_NumBuffs][0][i] = 0;
		m_piChanBuffer[c_NumBuffs][1][i] = 0;
	}

	m_iStopWriting = 0;

	m_geqEqualizer.Reset();

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

	int16_t iSkipOnce = 0;

	// run until we get a quit message
	while (1)
	{
		// Check is there are any messages to read.  If there are,
		//	run until they have all been read
		while (!MsgQueueEmpty())
		{
			// Get the message (this is a locking function call)
			Msg = ReadMessage(&MsgData);

			// Check what the message says
			if (Msg == MUS_MESSAGE_OPEN_SONG)
			{
				//ReportError("Acting off of open song message");
				OpenNext(Msg, MsgData.StrData);
			}
			else if (Msg == MUS_MESSAGE_SET_NEXT)
			{
				//ReportError("Acting off of set next message");
				OpenNext(Msg, MsgData.StrData, MsgData.DoubleData);
			}
			else if (Msg == MUS_MESSAGE_SEEK)
			{
				// The user sent a seek message.  Uncomment below to log to
				//	stderr every time a seek message is received.
				//ReportError1("Seeking position %f", MsgData.DoubleData);
				Seek(MsgData.DoubleData);
			}
			else if (Msg == MUS_INTMES_BUFFER_UNDERFLOW)
			{
				// We have had an underflow, so register it as an error
				MUS_ERROR(MUS_ERROR_UNDERFLOW, "Buffer underflow");

				// update status to say that we are not able to output
				//	song data


				// refill the buffer, but don't wait longer than 1 sec
				FillInitialBuff(5,1);
			}
			else if (Msg == MUS_INTMES_END_OF_SONG_REACHED)
			{
				// We reach here if the end of a song is reached, and
				//	a next song has not been set.
				Stop();
				m_FFmpegDecoder.Close();
				iSkipOnce = 1;
				ReportError("Done end times message actions");
			}
			else if (Msg == MUS_MESSAGE_PASS_SONG_INFO)
			{
				m_funcCallBack(MsgData.MetaPointer);
				free(MsgData.MetaPointer);
			}


		} //while(bContinue)


		if (iSkipOnce)
			iSkipOnce = 0;
		else
		{
			// Try and fill buffer if there is a song loaded and the
			//	player is not in an error state.  FillBuffer function
			//	will handle whether the buffer is actually full or not
			//	so we don't need to check for that.  Same with song end.
			if ((g_cmStatus != MUS_STATUS_WAITING_FOR_SONG) &&
				(g_cmStatus != MUS_STATUS_ERROR))
			{
				// This fills the buffer with song data
				FillBuffer();
			}
		}


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
	m_FFmpegDecoder.Close();

	SetPaused(1);

	MUS_ERROR(MUS_ERROR_NOT_INIT, "MusModule uninited.");
	g_cmNextSongStatus = MUS_STATUS_ERROR;


	m_FFmpegDecoder.Uninit();

	for (FilterType i = FT_START; i != FT_END; i++)
	{
		pftFilters[i]->Close();
	}

	SDL_CloseAudio();

	// free memory
	for (size_t i=0;i<c_NumBuffs;i++)
	{
		free(m_piChanBuffer[i+c_NumBuffs][0]);
		free(m_piChanBuffer[i+c_NumBuffs][1]);
	}


	return 0;
};

int16_t MusController::OpenNext(MUS_MESSAGE OpenType,
								const char *cstrFileName,
								double Time)
{
	int16_t err;

	if (g_cmStatus == MUS_STATUS_WAITING_FOR_SONG)
	{
		//ReportError("Open directed to initial start");
		m_iEndSet = END_BUF_CLEAR;
		g_cmStatus = MUS_STATUS_LOADING;
		err = Open(cstrFileName);

		if (err)
		{
			ReportError("Error while opening, setting state back to waiting");
			g_cmStatus = MUS_STATUS_WAITING_FOR_SONG;
			return 1;
		}

		strcpy(m_cstrCurrentSong, cstrFileName);

		int iDen = m_FFmpegDecoder.GetSampleRate();

		if (iDen < 11025) iDen = 11025;

		g_fSongRateScale = DEST_FREQ/iDen;

		/*ReportError1("Song Samplerate=%li",
									m_FFmpegDecoder.GetSampleRate());*/
		SetSpeed(g_fCurSpeed);
		m_lSongEndInSec = m_FFmpegDecoder.GetSeconds();

		SetMeta();

		StartSong();

		m_lCurSongSamp = 0;
		FillInitialBuff(5,1);
		m_bDirtyLoad = 0;
		//ReportError("Initial start finished");
		return 0;
	}
	else if (OpenType == MUS_MESSAGE_OPEN_SONG)
	{
		//ReportError("Hard start for the next song started");
		g_cmStatus = MUS_STATUS_LOADING;
		m_iEndSet = END_BUF_CLEAR;
		Stop();
		m_FFmpegDecoder.Close();
		err = Open(cstrFileName);

		if (err)
		{
			ReportError("Error while opening, setting state back to waiting");
			g_cmStatus = MUS_STATUS_WAITING_FOR_SONG;
			return 1;
		}

		strcpy(m_cstrCurrentSong, cstrFileName);

		int iDen = m_FFmpegDecoder.GetSampleRate();

		if (iDen < 11025) iDen = 11025;

		g_fSongRateScale = DEST_FREQ/iDen;
		/*ReportError1("Song Samplerate=%li",
									m_FFmpegDecoder.GetSampleRate());*/
		SetSpeed(g_fCurSpeed);
		m_lSongEndInSec = m_FFmpegDecoder.GetSeconds();

		SetMeta();

		StartSong();

		m_lCurSongSamp = 0;
		// We should be writing fresh here
		m_iStopWriting = 0;
		FillInitialBuff(5,1);
		m_bDirtyLoad = 0;
		//eportError("Hard start for the next song finished");
		return 0;
	}
	else if (OpenType == MUS_MESSAGE_SET_NEXT)
	{
		m_lNextSongTimeBack = Time;

		int iTime = Time;

		strcpy(m_cstrNextSong, cstrFileName);

		if (iTime == 0)
		{
			m_lNextSongGap = 0;
			m_iSongTransLenFix = 0;
			g_cmNextSongStatus = MUS_STATUS_NEXT_SONG_SET;
			return 0;
		}
		else if (iTime > 0)
		{
			m_iSongTransLenFix = m_lNextSongGap = Time * DEST_FREQ;
			g_cmNextSongStatus = MUS_STATUS_NEXT_SONG_SET;
			return 0;
		}
		else
		{
			if (Time < -5.0)
				Time = -5.0;
			m_iSongTransLenFix = m_lCurSongFadeDown = -Time * DEST_FREQ;
			m_sCurrentShiftAmt = 0;
			while (m_lCurSongFadeDown > 0)
			{
				m_sCurrentShiftAmt++;
				m_lCurSongFadeDown >>= 1;
			}
			m_lCurSongFadeDown = 1<<m_sCurrentShiftAmt;
			m_lNextSongGap = -1;
			g_cmNextSongStatus = MUS_STATUS_NEXT_SONG_SET;
			return 0;
		}
	}

	ReportError("Should NOT reach here");
	// should never reach here
	assert(0);
	return 0;
};

char* MusController::PassMessage(MUS_MESSAGE cmMsg, ...)
{
	char *cstrRet = NULL;
	LockMusMsgQueue();
	va_list Args;
	va_start(Args, cmMsg);
	if (cmMsg == MUS_MESSAGE_ATTRIB_SET)
	{
		AttribID ID = va_arg(Args, AttribID);
		char *Val = va_arg(Args, char *);
		SetAttribute(ID, Val);
	}
	else if (cmMsg == MUS_MESSAGE_ATTRIB_GET)
	{
		cstrRet = (char *) malloc(200);
		AttribID ID = va_arg(Args, AttribID);
		char *cstrVal = va_arg(Args, char *);
		GetAttribute(ID, cstrVal);
		strcpy(cstrRet, cstrVal);
	}
	else if (cmMsg == MUS_MESSAGE_GET_SONG_STATE)
	{
		cstrRet = (char *) malloc(512);
		sprintf(cstrRet,
				"{\"CurPos\":%i, \"EndAmt\":%i, \"SongState\":%i, "
				"\"CurrentSongPath\":\"%s\","
				"\"NextSongState\":%i}",
				 ConvertToSecs(m_lCurSongSamp),
				 m_lSongEndInSec,
				 g_cmStatus,
				 m_cstrCurrentSong,
				 g_cmNextSongStatus);
	}
	else if (cmMsg == MUS_MESSAGE_GET_META)
	{
		cstrRet = m_FFmpegDecoder.GetMetadata();
	}
	else
	{
		//ReportError("Creating msg and putting val in it");

		// This is a message that requires adding something to the
		//	message queue
		MusicMessage *MusicMsg = (MusicMessage *) malloc(sizeof(MusicMessage));
		MusicMsg->Next = NULL;
		MusicMsg->MetaPointer = NULL;

		if (cmMsg == MUS_MESSAGE_OPEN_SONG)
		{
			MusicMsg->Msg = MUS_MESSAGE_OPEN_SONG;
			char *cstrArg = va_arg(Args, char *);
			strcpy(MusicMsg->StrData, cstrArg);
			MusicMsg->DoubleData = va_arg(Args, double);
			ReportError1("Created Message to Open Song %s", cstrArg);
		}
		else if (cmMsg == MUS_MESSAGE_SET_NEXT)
		{
			MusicMsg->Msg = MUS_MESSAGE_SET_NEXT;
			char *cstrArg = va_arg(Args, char *);
			strcpy(MusicMsg->StrData, cstrArg);
			MusicMsg->DoubleData = va_arg(Args, double);
			ReportError1("##################Created Message to SetNext %s", cstrArg);
		}
		else if (cmMsg == MUS_MESSAGE_SEEK)
		{
			MusicMsg->Msg = MUS_MESSAGE_SEEK;
			MusicMsg->DoubleData = va_arg(Args, double);
			//ReportError1("Seeking to position %f", MusicMsg->DoubleData);
		}
		else if (cmMsg == MUS_MESSAGE_SET_NEXT_META)
		{
			char *cstrArg = va_arg(Args, char *);

			MusicMsg->MetaPointer = (char *) malloc(strlen(cstrArg)+2048);

			sprintf(MusicMsg->MetaPointer,
						"{\"CurrentSongPath\":\"%s\","
						"\"Metadata\":%s}",
						m_cstrCurrentSong,
						cstrArg);

		}
		else
		{
			MusicMsg->Msg = cmMsg;
		}

		AddMessage(MusicMsg);
	}
	va_end(Args);
	UnlockMusMsgQueue();
	//ReportError("Unlock Msg Queue after pass");
	return cstrRet;
}

void MusController::AddMessage(MusicMessage *Message, int16_t iClearSongInfoBuf)
{
	//ReportError1("Adding Message %i", Message->Msg);
	if (Message->MetaPointer == NULL)
	{
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
	else
	{
		if (iClearSongInfoBuf)
		{
			while (g_dqSongMessageBuffer != NULL)
			{
				MusicMessage *Temp = g_dqMessageBuffer->Next;
				free(g_dqMessageBuffer->MetaPointer);
				free(g_dqMessageBuffer);
				g_dqMessageBuffer = Temp;
			}
		}
		if (g_dqSongMessageBuffer != NULL)
		{
			MusicMessage *Iter = g_dqSongMessageBuffer;
			while(Iter->Next != NULL)
				Iter = Iter->Next;
			Iter->Next = Message;
			Message->Next = NULL;
		}
		else
		{
			g_dqSongMessageBuffer = Message;
			Message->Next = NULL;
		}
	}
}

MUS_MESSAGE MusController::ReadMessage(MusicMessage *Message)
{
	MUS_MESSAGE retVal;
	LockMusMsgQueue();
	//ReportError1("Size being copied %i", sizeof(MusicMessage));
	memcpy(Message, g_dqMessageBuffer, sizeof(MusicMessage));
	MusicMessage *Temp = g_dqMessageBuffer->Next;
	free(g_dqMessageBuffer);
	g_dqMessageBuffer = Temp;
	if (Message->Msg == MUS_MESSAGE_PASS_SONG_INFO)
	{
		if (g_dqSongMessageBuffer == NULL)
		{
			Message->MetaPointer = NULL;
		}
		else
		{
			MusicMessage *Temp = g_dqSongMessageBuffer->Next;
			Message->MetaPointer = g_dqSongMessageBuffer->MetaPointer;
			free (g_dqSongMessageBuffer);
			g_dqSongMessageBuffer = Temp;
		}
	}
	UnlockMusMsgQueue();
	retVal = Message->Msg;
	return retVal;
}

bool MusController::MsgQueueEmpty()
{
	bool retVal = false;
	LockMusMsgQueue();
	if (g_dqMessageBuffer == NULL)
		retVal = true;
	UnlockMusMsgQueue();
	return retVal;
}
