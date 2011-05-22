/*
 * DSPPipe.h
 *
 *  Created on: Apr 24, 2011
 *      Author: Katiebird
 */

#ifndef DSPPIPE_H_
#define DSPPIPE_H_

#include "config.h"
#include "../WormDebug.h"
#include "../Messages.h"
#include <stdarg.h>

#include "../Filters/Filters.h"
#include "../Decoders/Decoders.h"
#include "FFmpegFix.h"
#include <sdl.h>

#define FIXED_POINT_SEC_CONVERT_FACTOR ((1<<26)/(DEST_FREQ))
#define RESAMPLE_PADDING				8

#define BUFFER_SIZE_X_LARGE	(1 << 20)
#define BUFFER_SIZE_LARGE	((1 << 19) + (1 << 18))
#define BUFFER_SIZE_MEDIUM	(1 << 18)
#define BUFFER_SIZE_SMALL	(1 << 17)

#define END_TYPE_CROSSFADE	(1 << 28)
#define END_TYPE_GAP		(1 << 30)
#define END_GAP_TRIGGER		(1 << 29)
#define END_STEP_MASK		((1 << 19) - 1)

#define END_MAX_GAP		(1 << 18)
#define END_SCALE_Q			18

#define SONG_END_UNKNOWN	-1

#define SUFFICIENT_BUFFER_SIZE	DEST_FREQ
#define CBUF_PCKT_SIZE_NEED (MAX_PACKET_SIZE/4 + \
							 RESAMPLE_PADDING)

#define BUFFER_UNDERFLOW	-2
#define BUFFER_SONG_END		-1

struct SoundPacket
{
public:

#ifdef DEBUG
	int32_t		_FIRST;
	int32_t		AllocPos;
#else
	int64_t		FFmpeg_DTS;
	int64_t		ConverganceDur;
#endif

	int32_t 	NumChan;
	int64_t		TimeStamp;
	int64_t 	FFmpeg_PTS;
	size_t		Size;
	size_t		DataStartPoint;
	int64_t		Position;
	size_t		Duration;
	void		*_Helper;
#ifdef DEBUG
	SoundPacket	*Next;
	int32_t		_LAST;
#endif
	
	void CopyPacket(AVPacket *avpkt, AVStream *avstrm)
	{
		FFmpeg_PTS 		= avpkt->pts;
		Position		= avpkt->pos;
		Duration		= avpkt->duration;
		Size			= 0;

#ifndef DEBUG
		FFmpeg_DTS 		= avpkt->dts;
		ConverganceDur 	= avpkt->convergence_duration;
#endif
		
		if (FFmpeg_PTS != (int64_t) AV_NOPTS_VALUE)
			TimeStamp =  av_q2d(avstrm->time_base) * FFmpeg_PTS;
		else
			TimeStamp = -1;
	}
	
};

class SoundPacketAllocator
{
private:

	SoundPacket* 	m_pspPacketArray;
	size_t		 	m_uiNumAllocated;
	size_t			m_uiEnd;
	size_t			m_uiStart;
	size_t			m_uiNumUsed;
	int32_t			m_iFresh;

public:

	void Init()
	{
		m_uiNumAllocated = 512;
		ReportError1("Size of SoundPacket=%i", sizeof(SoundPacket));
		assert(sizeof(SoundPacket) % 32 == 0);
		m_pspPacketArray = (SoundPacket *) MALLOC(sizeof(SoundPacket) * (m_uiNumAllocated + 2));

		m_uiEnd 	= 0;
		m_uiStart 	= 0;
		m_uiNumUsed = 0;
#ifdef DEBUG
		for (uint32_t i=0; i<m_uiNumAllocated; i++)
		{
			m_pspPacketArray[i].AllocPos = i;
			m_pspPacketArray[i]._FIRST = 0xBAADC0DE;
			m_pspPacketArray[i]._LAST = 0xBAADC0DE;
		}
#endif
	}

	void Flush()
	{
		m_uiEnd 	= 0;
		m_uiStart 	= 0;
		m_uiNumUsed = 0;
	}

	SoundPacket *StereoPacket(void *pHelper);

	int32_t	FinishPckt()
	{
		SoundPacket *pspPacket = &m_pspPacketArray[m_uiStart];

#ifdef DEBUG

		/*ReportError3("Freeing: %i with memaddress %i | m_uiStart: %i",
					 pspPacket->AllocPos,
					 pspPacket,
					 m_uiStart);*/

		if (pspPacket->_FIRST != 0xBAADC0DE)
		{
			ReportError3("Expected Memory Overwrite Problem at mem: %i | AllocPos: %i | Val: %X",
						 pspPacket,
						 pspPacket->AllocPos,
						 pspPacket->_FIRST);

			assert(0);
		}

		if (pspPacket->_LAST != 0xBAADC0DE)
		{
			ReportError("Strange Memory Write Problem");
			assert(0);
		}
#endif

		m_uiStart++;
		m_uiStart &= (m_uiNumAllocated - 1);

		m_uiNumUsed--;
		
		//ReportError1("CurrentHelperVal=%X", pspPacket->_Helper);

		if (m_uiNumUsed == 0)
		{
			if (pspPacket->_Helper == NULL)
				return BUFFER_UNDERFLOW;
			else
				return BUFFER_SONG_END;
		}

		return m_uiStart;

		//ReportError("Done Free Packet");
	}

	SoundPacket *GetCurPacket()
	{
		return &m_pspPacketArray[m_uiStart];
	}
	
};

class CircularBuffer
{
private:

	SoundPacketAllocator	m_spaAllocator;

	size_t			m_uiBufferSize;
	uint32_t		**m_puiBuffer;
	uint32_t		**m_puiActualBuffer;

	int32_t			m_iNumChan;

	size_t			m_puiDataCur;
	size_t			m_puiDataEnd;
	
	uint32_t		m_uiSampleRate;
	float			m_fDivSampleRate;
	int64_t			m_llClock;

public:

	void Init(int32_t iNumChan, size_t uiBufferSize);

	void Uninit()
	{
		for(int i=0; i<m_iNumChan; i++)
		{
			FREE(m_puiActualBuffer[i]);
		}
		
		FREE(m_puiActualBuffer);
		
		FREE(m_puiBuffer);
	}

	void Start(uint32_t	uiSampleRate)
	{
		Flush();
		m_uiSampleRate = uiSampleRate;
		m_fDivSampleRate = 2/m_uiSampleRate;
	}
	
	SoundPacket *GetPacket()
	{
		return m_spaAllocator.StereoPacket(this);
	}

	void Flush()
	{
		//ReportError("Flushing");
		m_spaAllocator.Flush();

		m_llClock = 0;
		m_puiDataEnd = 0;
		m_puiDataCur = 0;
		
		for(int i=0; i<m_iNumChan; i++)
		{
			int32_t len = m_uiBufferSize + MUS_BUFFER_SIZE;
			uint32_t *iter = m_puiActualBuffer[i];
		
			while(len--)
			{
				*(iter++) = 0;
			}
		}

		m_spaAllocator.Flush();
	}
	
	int64_t GetBufferClock() {return m_llClock * m_fDivSampleRate;};
	
	int64_t GetPcktStrtClock() 
	{
		SoundPacket *pspTemp = m_spaAllocator.GetCurPacket();
		return pspTemp->TimeStamp;
	};
	
	int64_t	GetCurClock() 
	{
		SoundPacket *pspTemp = m_spaAllocator.GetCurPacket();
	
		int64_t llRetVal = pspTemp->TimeStamp;

		if (llRetVal == -1)
			return GetBufferClock();
		else
		{
			if (pspTemp->DataStartPoint > m_puiDataCur)
				m_puiDataCur += m_uiBufferSize;
		
			int32_t iInPcktClock = m_puiDataCur - 
											pspTemp->DataStartPoint;
			
			if (iInPcktClock > (int32_t) m_uiSampleRate/2)
			{
				iInPcktClock *= m_fDivSampleRate;
				return llRetVal + iInPcktClock;
			}
			else
				return iInPcktClock;
		}	
	}
	
	
	size_t GetBuffSamps()
	{
		/*ReportError3("m_uiBufferSize = %u; m_puiDataEnd = %u; m_puiDataStart = %u",
							 m_uiBufferSize,
							 m_puiDataEnd,
							 m_puiDataCur);*/

		int32_t uiTemp = m_puiDataEnd - m_puiDataCur;
		if (uiTemp >= 0)
			return uiTemp * 2;
		else
			return (m_uiBufferSize + uiTemp) * 2;
	}
	
	
	// Checks if the specified distance will push the
	//	current position past the current packet boundary
	size_t CheckIfOverCurPckt(size_t uiDist)
	{
		SoundPacket *pspTemp = m_spaAllocator.GetCurPacket();
	
		/*ReportError4("uiDist=%i, uiNewCurPnt=%i, DataStartPoint=%i, Size=%i",
					uiDist,
					m_puiDataCur,
					pspTemp->DataStartPoint,
					pspTemp->Size/8);*/
					
		size_t uiNewCurPnt = m_puiDataCur;
		
		if (m_puiDataCur < pspTemp->DataStartPoint)
			uiNewCurPnt += m_uiBufferSize;
		
		size_t puiPacketEnd = pspTemp->DataStartPoint + 
												pspTemp->Size/8;

		if ((uiNewCurPnt + uiDist) <= puiPacketEnd)
		{
			m_puiDataCur += uiDist;
			if (m_puiDataCur > m_uiBufferSize)
				m_puiDataCur -= m_uiBufferSize;
			return 0;
		}
		else
			return (uiNewCurPnt + uiDist) - puiPacketEnd;
	}
	
	
	// Get the amount of free space left in the buffer
	size_t GetAvailableSize()
	{
		/*ReportError3("m_uiBufferSize = %u; m_puiDataEnd = %u; m_puiDataStart = %u",
					 m_uiBufferSize,
					 m_puiDataEnd,
					 m_puiDataStart);*/

		int32_t iTemp = (m_puiDataCur - RESAMPLE_PADDING) - m_puiDataEnd;
		if (iTemp-- <= 0)
			return m_uiBufferSize + iTemp;
		else
			return iTemp;
	}

	size_t CheckNewEndPoint(size_t uiSize, size_t *puiNewEndPoint)
	{
		*puiNewEndPoint = m_puiDataEnd;
		*puiNewEndPoint += uiSize;
		if (*puiNewEndPoint < m_uiBufferSize)
			return 0;
		else
		{
			*puiNewEndPoint -= m_uiBufferSize;
			return *puiNewEndPoint;
		}
	}

	MUS_MESSAGE AdvanceCurPnt(size_t Amt);
	
	uint32_t *GetSamples(int32_t chan);
	MUS_MESSAGE AdvanceToNextPacket();
	MUS_MESSAGE AddStereoPacket(SoundPacket *pspNextPacket, 
						  uint16_t *pcData,
						  int32_t iSize);

};


class SoundPipe
{
private:

	static const int32_t m_ESTIMATE_END = -2;
	static const int32_t m_EXACT_END 	= -3;

	int32_t				m_iNumChan;
	
	MUS_MESSAGE			m_msgPipeInStatus;
	MUS_MESSAGE			m_msgPipeOutStatus;
	
	char				*m_cstrCurSongPath;
	int32_t				m_iCurSongAlloc;
	
	char 				*m_cstrMetaJSON;
	float				m_fSampleRate;
	double				m_dResampConvFactor;

	size_t				m_lSongEndInSec;

	BassTrebleFilter	m_btfSongLvlEQ[2];
	ResampleFilter  	m_rfResample;

	FFmpegWrapper		m_FFmpegDecoder;
	
	CircularBuffer		m_cbBuf;
	
	uint32_t			*m_puiWorkingBuf;
	
	int32_t				m_iFadeHelper;
	

public:

	SoundPipe	*Next;

	MUS_MESSAGE Init(int32_t iNumChan,
			  size_t uiBufferSize);

	void Uninit()
	{
		FREE(m_puiWorkingBuf);
	}

	MUS_MESSAGE GetInStatus() {return m_msgPipeInStatus;};

	MUS_MESSAGE GetOutStatus() {return m_msgPipeOutStatus;};

	const char *GetSongPath() {return m_cstrCurSongPath;};

	void SetBass(float f)
	{
		for(int i=0; i<m_iNumChan; i++)
		{
			m_btfSongLvlEQ[i].SetBass(f);
		}
	}
	
	void SetTreble(float f)
	{
		for(int i=0; i<m_iNumChan; i++)
		{
			m_btfSongLvlEQ[i].SetTreble(f);
		}
	}
	
	void SetVol(float f)
	{
		for(int i=0; i<m_iNumChan; i++)
		{
			m_btfSongLvlEQ[i].SetVol(f);
		}
	}
	
	void SetMid(float f)
	{
		for(int i=0; i<m_iNumChan; i++)
		{
			m_btfSongLvlEQ[i].SetVol(f);
		}
	}
	
	MUS_MESSAGE ResetFilters();
	
	void MarkDone()
	{
		m_msgPipeInStatus 		= MUS_STATUS_WAITING_FOR_SONG;
		m_msgPipeOutStatus 		= MUS_STATUS_WAITING_FOR_SONG;
	}

	uint32_t IsEnoughBuffer()
	{
		if (m_cbBuf.GetBuffSamps() > SUFFICIENT_BUFFER_SIZE)
			return 1;
		else
			return 0;
	};
	
	MUS_MESSAGE Open(const char *cstrFileName);

	MUS_MESSAGE	Flush();
	
	size_t GetCurTime()
	{
		return m_cbBuf.GetCurClock();
	}

	size_t GetEndTime()
	{
		return m_lSongEndInSec;
	}
	
	int64_t GetEndCntdwn()
	{

		if ((m_msgPipeInStatus == MUS_STATUS_SOURCE_EOF) ||
			(m_msgPipeInStatus == MUS_STATUS_ERROR))
		{
			return m_cbBuf.GetBuffSamps();
		}
		else
		{
			size_t uiRetVal = GetEndTime() - GetCurTime();
			return uiRetVal * DEST_FREQ;
		}
	}
	
	void SetFilterRate(float f) 
	{
		ReportError1("SetFilterRate=%f", f);
		m_rfResample.SetFilterRate(f * m_dResampConvFactor);
	}

	MUS_MESSAGE DecodeAndBuffer();
	
	MUS_MESSAGE PipeOut(uint32_t **puiBuffToFill,
						size_t lRequested,
						MUS_MESSAGE *Msg,
						size_t *puiNumWrittem);
	
	MUS_MESSAGE PipeIn();
	
	uint32_t Seek(double);

	char *GetMeta() 
	{
		char *cstrRetVal = m_cstrMetaJSON;
		m_cstrMetaJSON = NULL;
		return cstrRetVal;
	};

};


class AudioPipeline
{
private:

	SoundPipe 		m_spPipe[2];
	int32_t			m_iActivePipe;

	int32_t			m_iNumChan;
	float			m_fRate;
	
	int32_t			m_iEndType;
	int32_t			m_iEndLength;
	int32_t			m_iCurScale;
	
	uint32_t		**m_puiMixBuf;
	
	char			m_cstrState[128];
	
	MsgHandler 		*m_pMsgHandler;

	int32_t _GetInactivePipe() {return ((m_iActivePipe) ? 0 : 1);};
	
	void _PassSongTransMsgGood(char *Meta)
	{
		m_pMsgHandler->PassMessage(MUS_MESSAGE_PASS_SONG_INFO, Meta);
	}

	void _PassSongTransMsgBad()
	{
		char *msg = (char *)MALLOC(50);
		strcpy(msg, "{\"error\":1}");
		m_pMsgHandler->PassMessage(MUS_MESSAGE_PASS_SONG_INFO, msg);
	}

public:
	
	void Init(MsgHandler *pMsgHandler)
	{
		m_pMsgHandler = pMsgHandler;
		m_fRate = 1.0;

		m_iNumChan = NUM_CHANNELS;
	
		m_spPipe[0].Init(m_iNumChan, BUFFER_SIZE_MEDIUM);
		m_spPipe[1].Init(m_iNumChan, BUFFER_SIZE_MEDIUM);
		m_iActivePipe = 0;
		
		m_puiMixBuf = (uint32_t **)MALLOC(NUM_CHANNELS * sizeof(uint32_t *));

		for(int i=0; i<NUM_CHANNELS; i++)
		{
			*(m_puiMixBuf+i) = (uint32_t *) MALLOC(sizeof(uint32_t) *
													  (MUS_BUFFER_SIZE/
															LOW_SPEED_RATIO_LIM +
													   40));
		}
	}

	void Uninit()
	{
		m_spPipe[0].Uninit();
		m_spPipe[1].Uninit();
	}

	void SetBass(float f)
	{
		m_spPipe[0].SetBass(f);
		m_spPipe[1].SetBass(f);
	}
	
	void SetTreble(float f)
	{
		m_spPipe[0].SetTreble(f);
		m_spPipe[1].SetTreble(f);
	}
	
	void SetVol(float f)
	{
		m_spPipe[0].SetVol(f);
		m_spPipe[1].SetVol(f);
	}
	
	void SetMid(float f)
	{
		m_spPipe[0].SetMid(f);
		m_spPipe[1].SetMid(f);
	}
	
	void SetSpeed(float f)
	{
		m_spPipe[0].SetFilterRate(f);
		m_spPipe[1].SetFilterRate(f);
		m_fRate = f;
	}
	
	int16_t Open(const char *cstrFileName)
	{
		SDL_LockAudio();
		m_spPipe[_GetInactivePipe()].Flush();
		m_spPipe[_GetInactivePipe()].SetFilterRate(m_fRate);
		MUS_MESSAGE msg = m_spPipe[_GetInactivePipe()].Open(cstrFileName);
		if (msg == MUS_STATUS_INITIAL_BUFFERING)
		{
			ReportError("Passing Good message");
			_PassSongTransMsgGood(m_spPipe[_GetInactivePipe()].GetMeta());
			m_iActivePipe = _GetInactivePipe();
			SDL_UnlockAudio();
			return MUS_STATUS_BUFFERING;
		}
		else
		{
			ReportError("Passing Bad message");
			_PassSongTransMsgBad();
			SDL_UnlockAudio();
			return MUS_STATUS_ERROR;
		}
	}

	int64_t Seek(double dTime)
	{
		SDL_LockAudio();
		int64_t llRet = m_spPipe[m_iActivePipe].Seek(dTime);
		SDL_UnlockAudio();
		return llRet;
	}

	int16_t SetNext(const char *cstrFileName, float fTransition);
	
	void SetFilterRate(double f)
	{
		m_spPipe[0].SetFilterRate(f);
		m_spPipe[1].SetFilterRate(f);
	}
	
	const char *GetSongState()
	{
		if (m_spPipe[m_iActivePipe].GetInStatus() ==
												MUS_STATUS_WAITING_FOR_SONG)
		{
			sprintf(m_cstrState,
					"{\"CurPos\":0, \"EndAmt\":0, \"InState\":103, "
					"\"InState\":103}");
		}
		else
		{
			sprintf(m_cstrState,
					"{\"CurPos\":%i, \"EndAmt\":%i, \"InState\":%i, "
					"\"InState\":%i}",
					m_spPipe[m_iActivePipe].GetCurTime(),
					m_spPipe[m_iActivePipe].GetEndTime(),
					m_spPipe[m_iActivePipe].GetInStatus(),
					m_spPipe[m_iActivePipe].GetOutStatus());
		}

		return m_cstrState;
	}

	void RunDecodeStage();

	void RunProcessStage(uint32_t **puiBuffToFill, int lRequested);
};


#endif /* DSPPIPE_H_ */
