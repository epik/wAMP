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


// the resample filter used by the musmodule for playback
extern ResampleFilter g_rfResample;

enum FilterType
{
	FT_START = 0,
	FT_BASSTREB = FT_START,
	FT_RESAMP,
	FT_END = 2
};

DefineEnumIteratorsMacro(FilterType);

#define END_BUF_CLEAR	0
#define NEED_TO_BUF_END 1
#define END_BUF_FULL -1


class MusController:public AttributeHandler
{
public:

	static const short 			m_NUM_CHANNELS = NUM_CHANNELS;
	static const unsigned long 	m_DEST_FREQ = DEST_FREQ;
	static const long			m_lBufferSize = 4096 * 4;

	// bytes of the decoded song are seperated into channels
	// additionally we need at least two buffers for each channel to
	// allow alternate writes and reads.
	// There are other data structures that could be used like a 
	// circular array, but it gets a bit complicated with the resample 
	// filter needing access to both previous and future samples,
	// so I had the choice, either modify the resample code, which would
	// require adding an additional instruction (at least under my
	// understanding arm asm) to mod each read value in the resample loop,
	// or I do it the way I have which requires an additional compare in
	// on the write side of things in the best case, and two memory copies,
	// in the worst and only a fixed compare and mod on the read side of
	// things.  This way is more memory wasteful, but this whole resample
	// implementation trades memory for speed.
	// constants needed to keep track of the buffering
	static const size_t	c_NumBuffs			= 2;
	static const size_t c_BufferUsableSize 	= 1 << 20; // must be power of 2
	static const size_t c_BuffInitialOffset = m_lBufferSize;
	static const size_t c_CopyPoint			= c_BufferUsableSize - 
													c_BuffInitialOffset;
	static const size_t c_BuffTale 			= 2 * m_lBufferSize + 1024;
	static const size_t c_BufferTrueSize 	= c_BufferUsableSize + 
								c_BuffInitialOffset + c_BuffTale;

private:

	MusFilter		*pftFilters[FT_END];

	// There is no reason to dynamically create or add wrappers
	// so we just declare them statically.  We shouldn't be
	// referencing them through this member outside of this header
	// file, however, to ensure that we only ever have to edit this
	// file to add a new file format
	FFmpegWrapper	m_FFmpegDecoder;


	// The buffer
	uint32_t 		*m_piChanBuffer[c_NumBuffs * 2][m_NUM_CHANNELS];
	int16_t			m_psTempBuf[m_lBufferSize*2];
	int16_t			m_psResamplTmpBuf[m_NUM_CHANNELS][m_lBufferSize*2];
	// track which buffer we are writing and reading from
	uint32_t 		m_iWritingBuffID;
	uint32_t 		m_iReadingBuffID;
	uint32_t		m_iEndSonBuffID;
	// track if we need to back copy bits to ensure proper filter behavior
	uint32_t 		m_iDirtyBuff;
	// track the position of where we are in the decoded music byte stream
	size_t			m_lModuleWriteToPos;
	size_t			m_lSongEndPos;
	size_t	 		m_lReadToDSPPos;
	size_t			m_lBufEndPos;
	size_t			m_lBufEndID;
	int32_t			m_iEndSet;

	int32_t 		m_lEndShiftRemain;

	// length of the song, (i.e. end point)
	int32_t			m_iStopWriting;
	

	// variable containing the actual resample filter
	BassTrebleFilter	m_geqEqualizer;



	int16_t FillInitialBuff(uint32_t SecBuf, uint32_t WaitTime);
	
	MUS_MESSAGE ReadMessage(MusicMessage *MsgData);
	bool MsgQueueEmpty();
	void AddMessage(MusicMessage *Msg);

	// We need these for determining next song transitions
	int16_t			m_sNextSongWriteType;
	int32_t			m_iPartialWrite;
	long			m_lNextSongGap;
	double			m_lNextSongTimeBack;
	int16_t			m_bDirtyLoad;
	long			m_lCurSongFadeDown;
	long			m_lNextSongFadeIn;
	uint16_t		m_sCurrentShiftAmt;

	int32_t			m_iPlay;

public:
	
	void Tick();

	MusController();
	~MusController() {};

	// Callback functions
	//	Needed for sdl, to replace default music controller
	static void audio_callback_sdl(void *MusicController, 
									uint8_t *destStream, int lRequested);
	//	Needed for running the main process as a seperate thread
	static void *ThreadedOperation(void *);
	

	int16_t Seek(double);
	int16_t Init();
	int16_t Open(const char *cstrFileName);
	int16_t Stop();
	int16_t OpenNext(MUS_MESSAGE OpenType, const char *cstrFileName,
													double Time = 0);


	int16_t Uninit();
	int16_t FillBuffer();
	
	uint32_t 	GetSecsBuffered();
	
	char*	PassMessage(MUS_MESSAGE cmMsg,...);
	void		Start();

	void		Quit() {m_iPlay = 0;};
};


inline MusController::MusController()
{
	// set music fill pointers to point to the first element
	m_lModuleWriteToPos = 0;
	m_lReadToDSPPos = 0;
	m_lNextSongGap = 0;

	m_lEndShiftRemain = 0;

	m_sNextSongWriteType = 0;
	m_iPartialWrite = 0;
	
	m_iStopWriting = 0;

	m_lBufEndPos = 0;
	m_lBufEndID = 0;
	m_iEndSet = 0;

	pftFilters[FT_BASSTREB]	= &m_geqEqualizer;
	pftFilters[FT_RESAMP] = &g_rfResample;

	m_iPlay = 1;

}



#ifndef USE_EXTERNAL_WORM_LOGIC
// declare a global MusController to work with if we are not using
//	the worm logic wrapper
extern MusController g_mcGlobMusCont;
#endif

#endif /* MUSCONTROLLER_H_ */
