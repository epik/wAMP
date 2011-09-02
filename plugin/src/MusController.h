/*
 * MusController.h
 *
 *  Created on: Aug 18, 2010
 *      Author: Katiebird
 */

#ifndef MUSCONTROLLER_H_
#define MUSCONTROLLER_H_

#include "config.h"

#include <stdarg.h>
#include "WormMacro.h"
#include "Messages.h"
#include "Filters/Filters.h"
#include "Decoders/Decoders.h"
#include "Messages.h"
#include "Indexer/Indexer.h"
#include "DSPPipe/DSPPipe.h"

#define CROSS_FADE_FIXED_Q		END_SCALE_Q
#define CROSS_FADE_FIXED_ONE	(1<<END_SCALE_Q)
#define CROSS_FADE_FIXED_HALF	(1<<(END_SCALE_Q-1))

#define MUS_PLAY_CONST 0
#define MUS_PAUSE_CONST 1

class MusController:public MsgHandler
{
public:

	static const uint16_t		m_NUM_CHANNELS = NUM_CHANNELS;
	static const uint16_t 		m_NUM_SIM_TRACKS = NUM_SIM_TRACKS;
	static const uint32_t 		m_DEST_FREQ = DEST_FREQ;

#ifdef BUILD_FOR_TOUCHPAD	
	// Vals for fixed point crossfade
	static const uint32_t	m_CROSS_FADE_LEFT	= CROSS_FADE_FIXED_ONE;
	static const uint32_t	m_CROSS_FADE_MID	= CROSS_FADE_FIXED_HALF;
	static const uint32_t	m_CROSS_FADE_RIGHT	= 0;
#endif

private:

	MUS_MESSAGE _ReadMessage(MusicMessage *MsgData);
	bool 		_MsgQueueEmpty();
	void 		_AddMessage(MusicMessage *Msg, 
							int16_t iClearSongInfoBuf = 0);

	uint32_t		m_iTrackCrossfadeLeft;
							
	int32_t			m_iPlay;
	void 			(*m_funcCallBack)(const char *, const char *, const char *, int32_t);
	void 			(*m_funcSeekCallBack)(const char *, int32_t);
	int16_t			m_sAfterSeek;

	uint32_t		**m_puiBuffToFillZero;
	uint32_t		**m_puiBuffToFillOne;
	uint32_t		*m_puiStaticZeroBuff;
	
	AudioPipeline 	m_apPipeline[NUM_SIM_TRACKS];
	
	char			m_pcstrSeekCallback[64];
	char			m_pcstrCurTimeCallback[64];
	char			m_pcstrEndTimeCallback[64];
	char			m_pcstrBPM[64];

	GraphEQ			m_eqGraphEQ;

	int32_t			m_bTrackPlaying[NUM_SIM_TRACKS];

public:

	MusController()
	{
		m_sAfterSeek = 0;
		m_iPlay = 1;
	};

	~MusController() {};

	void Tick();

	// Callback functions
	//	Needed for sdl, to replace default music controller
	static void audio_callback_sdl(void *MusicController, 
									uint8_t *destStream, 
									int lRequested);
	//	Needed for running the main process as a seperate thread
	static void *ThreadedOperation(void *);
	

	int16_t Seek(double, int32_t iTrack);
	int16_t Init(void (*funcCallBack)(const char *, const char *, const char *, int32_t),
				 void (*funcSeekCallBack)(const char *, int32_t));
	int16_t Open(const char *cstrFileName, int32_t iTrack);
	int16_t SetNext(const char *cstrFileName, float fTransition, int32_t iTrack);
	int16_t Stop();
	void Mixer(uint8_t *destStream, int lRequested);

	void StartSong();

	int16_t Uninit();


	const char*	PassMessage(MUS_MESSAGE cmMsg,...);
	void	Start();

	void	Quit() {m_iPlay = 0;};
};




#endif /* MUSCONTROLLER_H_ */
