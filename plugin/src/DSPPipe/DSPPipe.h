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
#include "../WormFFT.h"

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

#define SUFFICIENT_BUFFER_SIZE	DEST_FREQ
#define CBUF_PCKT_SIZE_NEED (MAX_PACKET_SIZE/4 + \
							 RESAMPLE_PADDING)

#define BUFFER_EMPTY		-1

#define BPM_TICK_HIST 215

struct SoundPacket
{
public:


	int64_t		FFmpeg_DTS;
	int64_t		ConverganceDur;
	int32_t 	NumChan;
	int64_t		TimeStamp;
	int64_t 	FFmpeg_PTS;
	size_t		Size;
	size_t		DataStartPoint;
	int64_t		Position;
	size_t		Duration;
	void		*_Helper;

	
	void CopyPacket(AVPacket *avpkt, AVStream *avstrm)
	{
		FFmpeg_PTS 		= avpkt->pts;
		Position		= avpkt->pos;
		Duration		= avpkt->duration;
		Size			= 0;

		FFmpeg_DTS 		= avpkt->dts;
		ConverganceDur 	= avpkt->convergence_duration;

		
		if (FFmpeg_PTS != (int64_t) AV_NOPTS_VALUE)
			TimeStamp =  av_q2d(avstrm->time_base) * FFmpeg_PTS;
		else
			TimeStamp = -1;
	}
	
};

class SoundPacketAllocator
{
private:

	SoundPacket* 		m_pspPacketArray;
	size_t				m_uiNumAllocated;
	volatile size_t		m_uiEnd;
	volatile size_t		m_uiStart;
	volatile int32_t	m_iNumUsed;
	volatile int32_t	m_iClean;

public:

	void Init()
	{
		m_uiNumAllocated = 8192;
		ReportError1("Size of SoundPacket=%i", sizeof(SoundPacket));
		assert(sizeof(SoundPacket) % 32 == 0);
		m_pspPacketArray = (SoundPacket *) MALLOC(sizeof(SoundPacket) * (m_uiNumAllocated + 2));

		m_uiEnd 	= 0;
		m_uiStart 	= 0;
		m_iNumUsed = 0;
		m_iClean = 1;

	}

	void Flush()
	{
		m_uiEnd 	= 0;
		m_uiStart 	= 0;
		m_iNumUsed  = 0;
		m_iClean 	= 1;
	}

	SoundPacket *StereoPacket(void *pHelper);

	int32_t	FinishPckt()
	{


		m_uiStart++;
		m_uiStart %= m_uiNumAllocated;

		/*ReportError3("FinishPckt Num: %i, Num Allocated: %i, Num m_uiStart: %i",
					 m_uiEnd,
					 m_iNumUsed,
					 m_uiStart);*/

		m_iNumUsed--;

		if (m_iNumUsed < 0)
			assert(0);

		if (m_iNumUsed <= 0)
		{
			m_iNumUsed = 0;
			m_uiStart = 0;
			m_uiEnd = 0;
			return BUFFER_EMPTY;
		}

		return m_uiStart;

		//ReportError("Done Free Packet");
	}

	volatile int64_t GetCurPacketTimeStamp()
	{
		if (m_iClean)
		{
			ReportError("Clean for some reason");
			return 0;
		}

		return m_pspPacketArray[m_uiStart].TimeStamp;
	}

	volatile size_t GetDataStartPnt()
	{
		if (m_iClean)
			return 0;
	
		return m_pspPacketArray[m_uiStart].DataStartPoint;
	}

	volatile size_t GetSize()
	{
		if (m_iClean)
		{
			ReportError("Umm, Clean?");
			return 0;
		}
	
		return m_pspPacketArray[m_uiStart].Size;
	}

	volatile void SetNewData(uint32_t uiAmt, size_t uiSize)
	{
		m_iClean 	= 0;
	
		m_pspPacketArray[m_uiStart].DataStartPoint = uiAmt;
		m_pspPacketArray[m_uiStart].Size = uiSize;
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

	volatile size_t		m_puiDataCur;
	volatile size_t		m_puiDataEnd;
	volatile int32_t	m_piDataNumUsed;
	
	size_t			m_puiRealEnd;

	uint32_t		m_uiSampleRate;
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
	}
	
	void MarkDone()
	{
		m_puiRealEnd = m_puiDataEnd;
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
		m_piDataNumUsed = 0;
		
		m_puiRealEnd = m_uiBufferSize + 2;

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
	
	void SetBuffClock(double dSetTime)
	{
		m_llClock = dSetTime * (int64_t) m_uiSampleRate;
	}

	int64_t GetBufferClock()
	{
		return m_llClock / (int64_t) m_uiSampleRate;
	};
	
	int64_t GetPcktStrtClock() 
	{
		return m_spaAllocator.GetCurPacketTimeStamp();
	};
	
	volatile int64_t GetCurClock();
	
	int32_t GetBuffSamps()
	{
		/*ReportError3("m_uiBufferSize = %u; m_puiDataEnd = %u; m_puiDataStart = %u",
							 m_piDataNumUsed,
							 m_puiDataEnd,
							 m_puiDataCur);*/

		return m_piDataNumUsed;
	}
		
	
	// Get the amount of free space left in the buffer
	size_t GetAvailableSize()
	{
		/*ReportError3("m_uiBufferSize = %u; m_puiDataEnd = %u; m_puiDataStart = %u",
					 m_uiBufferSize,
					 m_puiDataEnd,
					 m_puiDataStart);*/

		return m_uiBufferSize - RESAMPLE_PADDING - m_piDataNumUsed;

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
	
	volatile MUS_MESSAGE	m_msgPipeInStatus;
	volatile MUS_MESSAGE	m_msgPipeOutStatus;
	
	char				*m_cstrCurSongPath;
	int32_t				m_iCurSongAlloc;
	
	float				m_fSampleRate;
	double				m_dResampConvFactor;

	size_t				m_lSongEndInSec;

	BassTrebleFilter	m_btfSongLvlEQ[2];
	ResampleFilter  	m_rfResample;

	FFmpegWrapper		m_FFmpegDecoder;
	
	CircularBuffer		m_cbBuf;
	
	uint32_t			*m_puiWorkingBuf;
	
	int32_t				m_iFadeHelper;
	int32_t				m_iCurVol;
	
	int32_t				m_bUseResampFilt;
	
	BPMDetect			m_BPMDetect;
	int8_t				m_iTicks[BPM_TICK_HIST];
	int32_t				m_iCurrentTick;

	int32_t				m_iBPMCnt;

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

	int32_t GetBPM()
	{
		return m_iBPMCnt;
	}

	const char *GetFreqMagString()
	{
		return (const char *) m_BPMDetect.GetFrqMagArray();
	}

	const char *GetAvgMagString()
	{
		return (const char *) m_BPMDetect.GetAvgMagArray();
	}

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
		m_iCurVol = VOL_NORM_LEVEL * f;

		uint32_t uiScale = m_iCurVol;

		if (m_iFadeHelper != 0)
		{
			uiScale *= m_iFadeHelper;
			uiScale >>= END_SCALE_Q;
		}

		for(int i=0; i<m_iNumChan; i++)
		{
			m_btfSongLvlEQ[i].SetVolFix((int16_t) uiScale);
		}
	}
	
	void FadeDown()
	{
		uint32_t uiScale = m_iCurVol;

		if (m_iFadeHelper != 0)
		{
			uiScale *= m_iFadeHelper;
			uiScale >>= END_SCALE_Q;
		}

		for(int i=0; i<m_iNumChan; i++)
		{
			m_btfSongLvlEQ[i].SetVolFix((int16_t) uiScale);
		}
	}

	void SetFade(int32_t iFadeHelper)
	{
		//ReportError1("iFadeHelper=%i", iFadeHelper);

		if (iFadeHelper <= 0)
			iFadeHelper = 1;
		else if (iFadeHelper >= END_MAX_GAP)
			iFadeHelper = 0;
		//ReportError1("iFadeHelper=%i", iFadeHelper);
		m_iFadeHelper = iFadeHelper;
	}

	void SetMid(float f)
	{
		for(int i=0; i<m_iNumChan; i++)
		{
			m_btfSongLvlEQ[i].SetVol(f);
		}
	}
	


	MUS_MESSAGE ResetFilters();
	
	void SetDoneStatus()
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
	
	int64_t GetCurTime()
	{
		if ((m_msgPipeOutStatus == MUS_STATUS_WAITING_FOR_SONG) ||
			(m_msgPipeInStatus == MUS_STATUS_WAITING_FOR_SONG))
		{
			return 0;
		}
	
		//ReportError("A problem with CurClock");

		return m_cbBuf.GetCurClock();
	}

	size_t GetEndTime()
	{
		if ((m_msgPipeOutStatus == MUS_STATUS_WAITING_FOR_SONG) ||
			(m_msgPipeInStatus == MUS_STATUS_WAITING_FOR_SONG))
		{
			return 0;
		}
	
		return m_lSongEndInSec;
	}
	
	int64_t GetEndCntdwn()
	{

		if ((m_msgPipeInStatus == MUS_STATUS_SOURCE_EOF) ||
			(m_msgPipeInStatus == MUS_STATUS_ERROR))
		{
			return m_cbBuf.GetBuffSamps()/DEST_FREQ;
		}
		else
		{
			size_t uiRetVal = GetEndTime() - GetCurTime();
			return uiRetVal;
		}
	}
	
	void SetFilterRate(float f) 
	{
		ReportError1("SetFilterRate=%f", f);
		f *= m_dResampConvFactor;

		m_rfResample.SetFilterRate(f);

		if (f == 1.0)
			m_bUseResampFilt = 0;
		else
			m_bUseResampFilt = 1;

	}

	MUS_MESSAGE DecodeAndBuffer();
	
	MUS_MESSAGE PipeOut(uint32_t **puiBuffToFill,
						size_t lRequested,
						MUS_MESSAGE *Msg,
						size_t *puiNumWrittem);
	
	MUS_MESSAGE PipeIn();
	
	uint32_t Seek(double);

	char *GetPath() 
	{		
		if (m_cstrCurSongPath[0] == 0)
		{
			return NULL; 
		}
			
		char *cstrRetVal = (char *) MALLOC(strlen(m_cstrCurSongPath) + 2);
		strcpy(cstrRetVal, m_cstrCurSongPath);

		return cstrRetVal;
	};
	
	char *GetArtist() 
	{
		const char *cstrMeta = m_FFmpegDecoder.GetValue("album_artist");
		
		if (!cstrMeta)
		{
			cstrMeta = m_FFmpegDecoder.GetValue("artist"); 
		}
		
		if (!cstrMeta)
			return NULL;
			
		char *cstrRetVal = (char *) MALLOC(strlen(cstrMeta) + 2);
		strcpy(cstrRetVal, cstrMeta);

		return cstrRetVal;
	};

	char *GetTitle() 
	{
		const char *cstrMeta = m_FFmpegDecoder.GetValue("title");
		
		if (!cstrMeta)
			return NULL;
			
		char *cstrRetVal = (char *) MALLOC(strlen(cstrMeta) + 2);
		strcpy(cstrRetVal, cstrMeta);

		return cstrRetVal;
	};
	
};


class AudioPipeline
{
private:

	int32_t			m_iTrackID;

	int32_t			m_iTrackFade;

	SoundPipe 			m_spPipe[2];
	volatile int32_t	m_iActivePipe;

	int32_t			m_iNumChan;
	float			m_fRate;
	
	float			m_fVol;
	int32_t			m_iFade;
	float			m_fBass;
	float			m_fTreb;
	float			m_fMid;
	
	int32_t			m_iEndType;
	int32_t			m_iEndLength;
	int32_t			m_iCurScale;
	int32_t			m_iScaleBy;
	
	int32_t			m_iFixedResampFilt;

	uint32_t		**m_puiMixBuf;
	
	MsgHandler 		*m_pMsgHandler;

	int32_t			m_bNextNotSet;

	int32_t _GetInactivePipe() {return ((m_iActivePipe) ? 0 : 1);};
	
	void _PassSongTransMsgGood(int32_t pipeToUse)
	{
		m_pMsgHandler->PassMessage(MUS_MESSAGE_PASS_SONG_INFO,
								   m_spPipe[pipeToUse].GetPath(),
								   m_spPipe[pipeToUse].GetArtist(),
								   m_spPipe[pipeToUse].GetTitle(),
								   m_iTrackID);
	}

	void _PassSongTransMsgBad()
	{
		m_pMsgHandler->PassMessage(MUS_MESSAGE_PASS_SONG_INFO, 
								   NULL, 
								   NULL, 
								   NULL, 
								   m_iTrackID);
	}

public:
	
	void Init(MsgHandler *pMsgHandler, int32_t iTrack)
	{
		m_iTrackID = iTrack;

		m_pMsgHandler = pMsgHandler;
		m_fRate = 1.0;
		m_fVol = 1.0;
		m_fMid = 1.0;
		m_fTreb = 1.0;
		m_fBass = 1.0;
		
		m_bNextNotSet = 0;

		m_iScaleBy = 0;

		m_iTrackFade = END_MAX_GAP;

		m_iFixedResampFilt = (1<<10);

		m_iFade = END_MAX_GAP;
		
		m_iNumChan = NUM_CHANNELS;
	
		m_spPipe[0].Init(m_iNumChan, BUFFER_SIZE_X_LARGE);
		m_spPipe[1].Init(m_iNumChan, BUFFER_SIZE_X_LARGE);
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

	void SetNoNext()
	{
		m_bNextNotSet = 1;
	}

	int32_t GetBPM()
	{
		return m_spPipe[m_iActivePipe].GetBPM();
	}

	void SetTrackFade(int32_t iTrackFade)
	{
		m_iTrackFade = iTrackFade;
	}

	void Uninit()
	{
		m_spPipe[0].Uninit();
		m_spPipe[1].Uninit();
	}

	void SetBass(float f)
	{
		m_fBass = f;
		m_spPipe[0].SetBass(f);
		m_spPipe[1].SetBass(f);
	}
	
	void SetTreble(float f)
	{
		m_fTreb = f;
		m_spPipe[0].SetTreble(f);
		m_spPipe[1].SetTreble(f);
	}
	
	void SetVol(float f)
	{
		m_fVol = f;
		m_spPipe[0].SetVol(f);
		m_spPipe[1].SetVol(f);
	}
	
	void SetMid(float f)
	{
		m_fMid = f;
		m_spPipe[0].SetMid(f);
		m_spPipe[1].SetMid(f);
	}
	
	void SetSpeed(float f)
	{
		m_spPipe[0].SetFilterRate(f);
		m_spPipe[1].SetFilterRate(f);
		m_fRate = f;
		m_iFixedResampFilt = (1<<10) * f;
	}
	
	int16_t Open(const char *cstrFileName)
	{
		if(QuickExtCheck(cstrFileName) == 0)
		{
			_PassSongTransMsgBad();
			return MUS_STATUS_ERROR;
		}

		int32_t iInactive = _GetInactivePipe();
		m_spPipe[iInactive].Flush();
		m_spPipe[iInactive].SetFilterRate(m_fRate);
		m_spPipe[iInactive].SetVol(m_fVol);
		m_spPipe[iInactive].SetBass(m_fBass);
		m_spPipe[iInactive].SetTreble(m_fTreb);
		m_spPipe[iInactive].SetMid(m_fMid);
		MUS_MESSAGE msg = m_spPipe[iInactive].Open(cstrFileName);
		if (msg == MUS_STATUS_INITIAL_BUFFERING)
		{
			ReportError("Passing Good message");
			_PassSongTransMsgGood(iInactive);
			m_iActivePipe = _GetInactivePipe();
			return MUS_STATUS_BUFFERING;
		}
		else
		{
			ReportError("Passing Bad message");
			_PassSongTransMsgBad();
			return MUS_STATUS_ERROR;
		}
	}

	const char *GetFreqMagString()
	{
		return m_spPipe[m_iActivePipe].GetFreqMagString();
	}

	const char *GetAvgMagString()
	{
		return m_spPipe[m_iActivePipe].GetAvgMagString();
	}

	int64_t Seek(double dTime)
	{
		int32_t iActive = m_iActivePipe;
		int64_t llRet = m_spPipe[iActive].Seek(dTime);
		m_spPipe[iActive].SetFilterRate(m_fRate);
		m_spPipe[iActive].SetVol(m_fVol);
		m_spPipe[iActive].SetBass(m_fBass);
		m_spPipe[iActive].SetTreble(m_fTreb);
		m_spPipe[iActive].SetMid(m_fMid);
		return llRet;
	}

	int16_t SetNext(const char *cstrFileName, float fTransition);
	
	void SetFilterRate(double f)
	{
		m_spPipe[0].SetFilterRate(f);
		m_spPipe[1].SetFilterRate(f);
	}
	
	size_t GetEndTime()
	{
		return m_spPipe[m_iActivePipe].GetEndTime();
	}

	size_t GetCurTime()
	{
		return (int32_t) m_spPipe[m_iActivePipe].GetCurTime();
	}

	int32_t RunDecodeStage();

	void RunProcessStage(uint32_t **puiBuffToFill, int lRequested);
};


#endif /* DSPPIPE_H_ */
