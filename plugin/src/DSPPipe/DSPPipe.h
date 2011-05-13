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

#define SUFFICIENT_BUFFER_SIZE	(DEST_FREQ / LOW_SPEED_RATIO_LIM)
#define CBUF_PCKT_SIZE_NEED (MAX_PACKET_SIZE/4 + \
							 RESAMPLE_PADDING)

struct SoundPacket
{
public:

	int16_t 	NumChan;
	int16_t		Decoded;
	int64_t		TimeStamp;
	int64_t 	FFmpeg_PTS;
	int64_t		FFmpeg_DTSt;
	size_t		Size;
	size_t		DataStartPoint;
	int64_t		Position;
	int64_t		ConverganceDur;
	size_t		Duration;
	SoundPacket	*Next;
	void		*_Helper;
	
	void CopyPacket(AVPacket *avpkt, AVStream *avstrm)
	{
		FFmpeg_PTS 		= avpkt->pts;
		FFmpeg_DTSt 	= avpkt->dts;
		Position		= avpkt->pos;
		ConverganceDur	= avpkt->convergence_duration;
		Duration		= avpkt->duration;
		Size			= 0;
		
		if (FFmpeg_PTS != (int64_t) AV_NOPTS_VALUE)
			TimeStamp =  av_q2d(avstrm->time_base) * FFmpeg_PTS;
		else
			TimeStamp = -1;
	}
	
	static SoundPacket *StereoPacket(void *pHelper)
	{
		SoundPacket *pspRetVal = (SoundPacket *) MALLOC (sizeof(SoundPacket));

		pspRetVal->NumChan = 2;
		pspRetVal->_Helper = pHelper;

		return pspRetVal;
	}

	static void FreePacket(SoundPacket *pspPacket)
	{
		FREE(pspPacket);
	}

};

class CircularBuffer
{
private:

	size_t			m_uiBufferSize;
	uint32_t		**m_puiBuffer;
	uint32_t		**m_puiActualBuffer;

	int32_t			m_iNumChan;
	
	SoundPacket		*m_pspCurPacket;

	size_t			m_puiDataCur;
	size_t			m_puiDataEnd;
	
	size_t			m_puiEndWriteMark;
	
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
	
	void Flush()
	{
		SoundPacket *pspTemp = m_pspCurPacket;
		//ReportError("In");
		while (pspTemp != NULL)
		{
			m_pspCurPacket = m_pspCurPacket->Next;
			FREE(pspTemp);
			pspTemp = m_pspCurPacket;
		}
		
		m_pspCurPacket = NULL;
		m_llClock = 0;
		m_puiDataEnd = 0;
		m_puiEndWriteMark = 0;
		
		for(int i=0; i<m_iNumChan; i++)
		{
			memset(m_puiActualBuffer[i],
				   0,
				   sizeof(uint32_t) * 
					  (m_uiBufferSize +
					   2 * (MEM_ALIGN_AMT/sizeof(uint32_t)) + 
					   MUS_BUFFER_SIZE));
		}
	}
	
	int64_t GetBufferClock() {return m_llClock * m_fDivSampleRate;};
	
	int64_t GetPcktStrtClock() {return m_pspCurPacket->TimeStamp;};
	
	int64_t	GetCurClock() 
	{
		int64_t llRetVal = m_pspCurPacket->TimeStamp;

		if (llRetVal == -1)
			return GetBufferClock();
		else
		{
			if (m_pspCurPacket->DataStartPoint > m_puiDataCur)
				m_puiDataCur += m_uiBufferSize;
		
			int32_t iInPcktClock = m_puiDataCur - 
											m_pspCurPacket->DataStartPoint;
			
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
							 m_puiDataStart);*/

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
		/*ReportError4("uiDist=%i, uiNewCurPnt=%i, DataStartPoint=%i, Size=%i",
					uiDist,
					m_puiDataCur,
					m_pspCurPacket->DataStartPoint,
					m_pspCurPacket->Size/8);*/

		size_t uiNewCurPnt = m_puiDataCur;
		
		if (m_puiDataCur < m_pspCurPacket->DataStartPoint)
			uiNewCurPnt += m_uiBufferSize;
		
		size_t puiPacketEnd = m_pspCurPacket->DataStartPoint + 
												m_pspCurPacket->Size/8;

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
	int32_t				m_iUsePrefetching;
	
	MUS_MESSAGE			m_msgPipeInStatus;
	MUS_MESSAGE			m_msgPipeOutStatus;
	
	
	char				*m_cstrCurSongPath;
	char 				*m_cstrMetaJSON;
	float				m_fSampleRate;
	double				m_dResampConvFactor;

	size_t				m_lSongEndInSec;

	BassTrebleFilter	*m_btfSongLvlEQ;
	ResampleFilter  	m_rfResample;

	FFmpegWrapper		m_FFmpegDecoder;
	
	CircularBuffer		m_cbBuf;
	
	uint32_t			*m_puiWorkingBuf;

	size_t				m_uiPreFetchEndPos;
	
	int32_t				m_iFadeHelper;
	

public:

	SoundPipe	*Next;

	MUS_MESSAGE Init(int32_t iNumChan,
			  size_t uiBufferSize,
			  float fCurSpeed,
			  int32_t iPrefetch = 0);

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
		m_rfResample.SetFilterRate(f * m_dResampConvFactor);
	
		// the rate changed, so update the prefetch
		//	if needed
		if (m_iUsePrefetching)
			PrefetchOut();
	}

	MUS_MESSAGE PrefetchOut();
	
	MUS_MESSAGE DecodeAndBuffer();
	
	MUS_MESSAGE PipeOut(uint32_t **puiBuffToFill,
						size_t lRequested,
						MUS_MESSAGE *Msg,
						size_t *puiNumWrittem);
	
	MUS_MESSAGE PipeIn();
	
	uint32_t Seek(double);

	char *GetMeta() 
	{
		assert(m_cstrMetaJSON != NULL);
		char *cstrRetVal = m_cstrMetaJSON;
		m_cstrMetaJSON = NULL;
		return cstrRetVal;
	};

};

const char ErrorString[50] = "{\"error\":1}";

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
	
	MsgHandler 		*m_pMsgHandler;

	int32_t _GetInactivePipe() {return ((m_iActivePipe) ? 0 : 1);};
	
	void _PassSongTransMsgGood(const char *Meta)
	{
		m_pMsgHandler->PassMessage(MUS_MESSAGE_PASS_SONG_INFO, Meta);
	}

	void _PassSongTransMsgBad()
	{
		m_pMsgHandler->PassMessage(MUS_MESSAGE_PASS_SONG_INFO, ErrorString);
	}

public:
	
	void Init(MsgHandler *pMsgHandler)
	{
		m_pMsgHandler = pMsgHandler;
		m_fRate = 1.0;

		m_iNumChan = NUM_CHANNELS;
	
		m_spPipe[0].Init(m_iNumChan, BUFFER_SIZE_MEDIUM, m_fRate);
		m_spPipe[1].Init(m_iNumChan, BUFFER_SIZE_MEDIUM, m_fRate);
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
	}
	
	int16_t Open(const char *cstrFileName)
	{
		SDL_LockAudio();
		m_spPipe[_GetInactivePipe()].Flush();
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

	int16_t SetNext(const char *cstrFileName, float fTransition)
	{
		if (m_spPipe[m_iActivePipe].GetInStatus() ==
									MUS_STATUS_WAITING_FOR_SONG)
		{
			return Open(cstrFileName);
		}

		if ((fTransition > 0.5) || (fTransition < -0.5))
		{
			if (fTransition < 0)
			{
				fTransition *= -1;
				m_iEndType = END_TYPE_CROSSFADE;

			}
			else
			{
				m_iEndType = END_TYPE_GAP;
			}

			m_iCurScale = END_MAX_GAP;
			m_iEndLength = (fTransition * DEST_FREQ);
			if (m_iEndLength > END_MAX_GAP)
			{
				m_iEndType |= 1;
				m_iEndLength = END_MAX_GAP;

			}
			else
			{
				int32_t iTemp = END_MAX_GAP/(fTransition*DEST_FREQ);
				m_iEndType |= iTemp;
			}
		}
		else
		{
			m_iEndType = 0;
		}
		SDL_LockAudio();
		m_spPipe[_GetInactivePipe()].Flush();
		MUS_MESSAGE Msg = m_spPipe[_GetInactivePipe()].Open(cstrFileName);
		SDL_UnlockAudio();
		return Msg;

	}
	
	void SetFilterRate(double f)
	{
		m_spPipe[0].SetFilterRate(f);
		m_spPipe[1].SetFilterRate(f);
	}
	
	char *GetSongState()
	{
		char *cstrRet;

		if (m_spPipe[m_iActivePipe].GetInStatus() ==
												MUS_STATUS_WAITING_FOR_SONG)
		{
			cstrRet = (char *) MALLOC(512);

			sprintf(cstrRet,
					"{\"CurPos\":0, \"EndAmt\":0, \"InState\":103, "
					"\"InState\":103, \"CurrentSongPath\":\"\"}");
		}
		else
		{
			const char *cstrCurrentSong =
										m_spPipe[m_iActivePipe].GetSongPath();

			cstrRet = (char *) MALLOC(512 + strlen(cstrCurrentSong));

			sprintf(cstrRet,
					"{\"CurPos\":%i, \"EndAmt\":%i, \"InState\":%i, "
					"\"InState\":%i, \"CurrentSongPath\":\"%s\"}",
					m_spPipe[m_iActivePipe].GetCurTime(),
					m_spPipe[m_iActivePipe].GetEndTime(),
					m_spPipe[m_iActivePipe].GetInStatus(),
					m_spPipe[m_iActivePipe].GetOutStatus(),
					cstrCurrentSong);
		}

		return cstrRet;
	}

	void RunDecodeStage()
	{
		//ReportError("In RunDecodeState");

		MUS_MESSAGE msg = m_spPipe[m_iActivePipe].PipeIn();

		if ((msg != MUS_PIPEINMES_PACKET_ADDED) || 
			(m_spPipe[m_iActivePipe].IsEnoughBuffer()))
		{
			//ReportError("Inactive Work Performed");
			m_spPipe[_GetInactivePipe()].PipeIn();	
		}

		//ReportError("Finished RunDecodeStage");
	}

	void RunProcessStage(uint32_t **puiBuffToFill, int lRequested);
};


#endif /* DSPPIPE_H_ */
