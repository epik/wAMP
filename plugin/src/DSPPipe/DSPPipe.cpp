/*
 * DSPPipe.cpp
 *
 *  Created on: Apr 24, 2011
 *      Author: Katiebird
 */

#include "DSPPipe.h"
#include "../WormThread.h"

#define FILTER_PADDING	

SoundPacket *SoundPacketAllocator::StereoPacket(void *pHelper)
{
	//ReportError("Entering Stereo Packet");
	m_iNumUsed++;
	
	/*ReportError3("Allocating Num: %i, Num Allocated: %i, Num m_uiStart: %i",
				 m_uiEnd,
				 m_iNumUsed,
				 m_uiStart);*/
	
	SoundPacket *pspRetVal = &m_pspPacketArray[m_uiEnd++];		
	m_uiEnd %= m_uiNumAllocated;


	pspRetVal->NumChan = 2;
	pspRetVal->_Helper = pHelper;

	//ReportError("Done Stereo");
	m_iClean = 0;
	return pspRetVal;
}

void CircularBuffer::Init(int32_t iNumChan, size_t uiBufferSize)
{
	assert(uiBufferSize*2 > (CBUF_PCKT_SIZE_NEED + 
							 SUFFICIENT_BUFFER_SIZE));
	m_spaAllocator.Init();

	m_llClock = 0;
	m_puiDataEnd = 0;
	m_puiDataCur = 0;
	m_piDataNumUsed = 0;
	
	m_puiRealEnd = uiBufferSize + 1;

	m_iNumChan = iNumChan;

	m_uiBufferSize = uiBufferSize;

	m_puiActualBuffer 	= (uint32_t **)MALLOC(iNumChan * sizeof(uint32_t *));
	m_puiBuffer 		= (uint32_t **)MALLOC(iNumChan * sizeof(uint32_t *));
	//for each row allocate memory for columns
	for(int i=0; i<iNumChan; i++)
	{
	   *(m_puiActualBuffer+i) = (uint32_t *) MALLOC(sizeof(uint32_t) * 
											  (uiBufferSize + 
											  2 * 
												(MEM_ALIGN_AMT/
												sizeof(uint32_t)) + 
											  MUS_BUFFER_SIZE + 40));
		assert(MEM_ALIGN_AMT >= RESAMPLE_PADDING*sizeof(uint32_t));
		*(m_puiBuffer+i) = 	*(m_puiActualBuffer+i) + MEM_ALIGN_AMT/sizeof(uint32_t);				
	}
}


uint32_t *CircularBuffer::GetSamples(int32_t iChan)
{
	if (m_puiDataCur >= m_uiBufferSize)
	{
		int32_t 	iLen = MUS_BUFFER_SIZE;
		uint32_t	*iterDest0 = &m_puiBuffer[0][m_uiBufferSize];
		uint32_t	*iterDest1 = &m_puiBuffer[1][m_uiBufferSize];

		while(iLen--)
		{
			*(iterDest1++) = (*(iterDest0++) = 0);
		}
		m_puiDataCur -= m_uiBufferSize;
	}

	//ReportError1("m_puiDataCur=%i", m_puiDataCur);

	return &m_puiBuffer[iChan][m_puiDataCur];
}

MUS_MESSAGE CircularBuffer::AdvanceCurPnt(size_t uiAmt)
{
	m_llClock += uiAmt * 2;

	m_piDataNumUsed -= uiAmt;

	m_puiDataCur += uiAmt;
	if (m_puiDataCur > m_uiBufferSize)
		m_puiDataCur -= m_uiBufferSize;

	while (1)
	{
		size_t uiDSP = m_spaAllocator.GetDataStartPnt();
		size_t uiSize = m_spaAllocator.GetSize()/8;
		

		//ReportError2("uiSize=%i, uiAmt=%i", uiSize, uiAmt);

		if (uiSize >= uiAmt)
		{
			uiDSP += uiAmt;
			if (uiDSP > m_uiBufferSize)
				uiDSP -= m_uiBufferSize;
			uiSize -= uiAmt;
			m_spaAllocator.SetNewData(uiDSP, uiSize*8);
			break;
		}

		uiAmt -= uiSize;
		int32_t iErr = m_spaAllocator.FinishPckt();

		if ((iErr == BUFFER_EMPTY) || (m_piDataNumUsed <= 0))
		{
			if (m_puiRealEnd < m_uiBufferSize)
			{
				m_puiDataCur = 0;
				m_puiDataEnd = 0;
				m_piDataNumUsed = 0;
				return MUS_INTMES_END_OF_SONG_REACHED;
			}
			else
			{
				return MUS_INTMES_BUFFER_UNDERFLOW;
			}
		}
	}

	//ReportError("Finished AdvanceCurPnt");
		
	return MUS_INTMES_NEXT_FRAME;
}
		

volatile int64_t CircularBuffer::GetCurClock()
{
	int64_t llRetVal = m_spaAllocator.GetCurPacketTimeStamp();

	if (llRetVal == -1)
		return GetBufferClock();
	else
		return llRetVal;
}

MUS_MESSAGE CircularBuffer::AddStereoPacket(SoundPacket *pspNextPacket,
									  uint16_t *pcData,
									  int32_t iSize)
{	
	/*ReportError1("Entering AddStereoPacket With Values NumUsed=%i",
				m_piDataNumUsed);*/
	
	if (pspNextPacket->Size == 0)
	{
		pspNextPacket->DataStartPoint = m_puiDataEnd;	
	}
	pspNextPacket->Size += iSize;
	
	uint16_t *puiPointer0 	= (uint16_t *) &m_puiBuffer[0][m_puiDataEnd];
	uint16_t *puiPointer1 	= (uint16_t *) &m_puiBuffer[1][m_puiDataEnd];
	
	uint32_t iTrigger = 0;
	
	iSize /= 8;

	int32_t iTemp = m_puiDataEnd + iSize;
	
	m_piDataNumUsed += iSize;

	if ((m_puiDataEnd < MUS_BUFFER_SIZE) && (iTemp > MUS_BUFFER_SIZE))
		iTrigger = 1;

	m_puiDataEnd = iTemp;

	while (iSize--)
	{
		*(puiPointer0++) = *(pcData++);
		*(puiPointer1++) = *(pcData++);
		*(puiPointer0++) = *(pcData++);
		*(puiPointer1++) = *(pcData++);
	}

	if ((iTrigger) && ((m_puiDataCur + MUS_BUFFER_SIZE) < m_uiBufferSize))
	{
		for (int i=0; i<NUM_CHANNELS; i++)
		{
			int32_t 	iLen = MUS_BUFFER_SIZE;
			uint32_t	*iterSource = &m_puiBuffer[i][0];
			uint32_t	*iterDest = &m_puiBuffer[i][m_uiBufferSize];

			while(iLen--)
			{
				*(iterDest++) = *(iterSource++);
			}
		}
	}
	else if ((m_puiDataEnd>m_uiBufferSize))
	{	
		m_puiDataEnd = m_puiDataEnd - m_uiBufferSize;

		for (int i=0; i<NUM_CHANNELS; i++)
		{
			int32_t 	iLen = m_puiDataEnd + MEM_ALIGN_AMT/sizeof(uint32_t);
			uint32_t	*iterDest = &m_puiActualBuffer[i][0];
			uint32_t	*iterSource =
								&m_puiBuffer[i][m_uiBufferSize -
			        	                       MEM_ALIGN_AMT/sizeof(uint32_t)];

			while(iLen--)
			{
				*(iterDest++) = *(iterSource++);
			}
		}
	}

	
	//ReportError("End");
	return 0;
}


MUS_MESSAGE SoundPipe::PipeIn()
{
	//ReportError("In the >>>>>>>>IN Pipe");

	if ((m_msgPipeInStatus == MUS_STATUS_WAITING_FOR_SONG) ||
		(m_msgPipeInStatus == MUS_STATUS_SOURCE_EOF) ||
		(m_msgPipeInStatus == MUS_STATUS_ERROR))
		return m_msgPipeInStatus;
	
	//ReportError("About to Check available size");

	if (m_cbBuf.GetAvailableSize() > CBUF_PCKT_SIZE_NEED)
	{

		SoundPacket *pspNextPacket = m_cbBuf.GetPacket();
	
		MusMessage msg = m_FFmpegDecoder.GetNextPacket(pspNextPacket);

		pspNextPacket->_Helper = NULL;

		if (msg == MUS_MOD_Success)
		{
			if (!IsEnoughBuffer())
			{
				m_msgPipeInStatus = MUS_STATUS_BUFFERING;
			}
			else
				m_msgPipeInStatus = MUS_STATUS_INITIAL_BUFFERING;
			//ReportError("Success");
			return MUS_PIPEINMES_PACKET_ADDED;
		}
		else if (msg == MUS_MOD_Done)
		{
			ReportError("Song Done");
			m_cbBuf.MarkDone();
			m_msgPipeInStatus = MUS_STATUS_SOURCE_EOF;
			pspNextPacket->_Helper = (void *) 0xC0DE0000;
			return MUS_PIPEINMES_NO_MORE_PACKETS;
		}
		else if (MUS_MOD_Error)
		{
			//ReportError("Error");
			m_msgPipeInStatus = MUS_STATUS_ERROR;
			return MUS_PIPEINMES_NO_MORE_PACKETS;
		}
	}
	else
	{
		//ReportError("Pipe Full");
		m_msgPipeInStatus = MUS_STATUS_BUF_FULL;
		return MUS_PIPEINMES_PIPE_FULL;
	}

	return 0;
}


MUS_MESSAGE SoundPipe::PipeOut(uint32_t **puiBuffToFill, 
							   size_t uiFetchAmt, 
							   MUS_MESSAGE *msg,
							   size_t *puiNumWrittem)
{
	//ReportError1("In the OUT with: %i", m_cbBuf.GetBuffSamps());

	size_t uiStartPos = *puiNumWrittem;

	if ((m_msgPipeOutStatus == MUS_STATUS_UNDER_FLOW) &&
		!(IsEnoughBuffer()) &&
		(m_msgPipeInStatus != MUS_STATUS_SOURCE_EOF) &&
		(m_msgPipeInStatus != MUS_STATUS_ERROR) &&
		(m_msgPipeInStatus != MUS_STATUS_BUF_FULL))
	{
		for (int i=0; i<m_iNumChan; i++)
		{
			ReportError("Here in Underflow land");
			int32_t iLen = uiFetchAmt;
			uint32_t *iter = &puiBuffToFill[i][uiStartPos];

			while(iLen--)
				*(iter++) = 0;

		}
		*puiNumWrittem = 0;

		return MUS_STATUS_UNDER_FLOW;

	}

	//ReportError("Not in the underflow area");

	if (m_msgPipeOutStatus == MUS_STATUS_UNDER_FLOW)
		m_msgPipeOutStatus = MUS_STATUS_PLAYING;

	if ((m_msgPipeOutStatus == MUS_STATUS_WAITING_FOR_SONG) ||
		(m_msgPipeOutStatus == MUS_STATUS_ERROR) ||
		((m_msgPipeInStatus == MUS_STATUS_INITIAL_BUFFERING) &&
		 (!(IsEnoughBuffer()))))
	{
		//ReportError("Here in the other null write");

		for (int i=0; i<m_iNumChan; i++)
		{
			int32_t iLen = uiFetchAmt;
			uint32_t *iter = &puiBuffToFill[i][uiStartPos];

			while(iLen--)
				*(iter++) = 0;

		}

		*puiNumWrittem = 0;
		
		return MUS_STATUS_WAITING_FOR_SONG;
	}
	
	//ReportError("Writing actual music bytes");

	uint32_t *puiWriteBuf;
	
	size_t uiTargetAmt = m_rfResample.AdvanceByAmount(uiFetchAmt);

	uint32_t uiCheckEnd = m_cbBuf.GetBuffSamps();
	
	if (!uiCheckEnd)
	{
		if (m_msgPipeInStatus == MUS_STATUS_SOURCE_EOF)
		{
			m_msgPipeOutStatus = MUS_INTMES_END_OF_SONG_REACHED;
			return MUS_INTMES_END_OF_SONG_REACHED;
		}
		else
		{
			m_msgPipeOutStatus = MUS_INTMES_BUFFER_UNDERFLOW;
			return MUS_INTMES_BUFFER_UNDERFLOW;
		}

	}
	uint32_t uiTmpFetch = uiFetchAmt;
	
	if (uiCheckEnd < uiFetchAmt)
	{
		uiTmpFetch = uiCheckEnd;
		
		for (int i=0; i<m_iNumChan; i++)
		{
			int iLen = uiFetchAmt;
			uint32_t *iter = &puiBuffToFill[i][uiStartPos];
			
			while(iLen--)
				*(iter++) = 0;
		}
	}
	
	/*ReportError3("About to read bytes uiTargetAmt=%i, uiCheckEnd=%i, uiTmpFetch=%i",
				 uiTargetAmt,
				 uiCheckEnd,
				 uiTmpFetch);*/

	size_t uiNumRead;// = uiFetchAmt;
	
	if (m_iFadeHelper)
	{
		FadeDown();
	}

	for (int i=0; i<m_iNumChan; i++)
	{
		puiWriteBuf = m_cbBuf.GetSamples(i);

		if (m_bUseResampFilt)
		{
			m_rfResample.Filter(puiWriteBuf,
								(size_t) RESAMPLE_PADDING,
								&uiNumRead,
								(int16_t *)  m_puiWorkingBuf,
								uiTmpFetch*2);

			*puiNumWrittem = uiNumRead;

			m_btfSongLvlEQ[i].Filter((int16_t *) m_puiWorkingBuf,
								  (size_t) 0,
								  &uiNumRead,
								  (int16_t *) &puiBuffToFill[i][uiStartPos],
								  uiTmpFetch*2);
		}
		else
		{

			m_btfSongLvlEQ[i].Filter((int16_t *) puiWriteBuf,
								  (size_t) RESAMPLE_PADDING,
								  &uiNumRead,
								  (int16_t *) &puiBuffToFill[i][uiStartPos],
								  uiTmpFetch*2);

			/*for (int i=0; i<m_iNumChan; i++)
			{
				for(int j=0;j<uiFetchAmt;j++)
				{
					puiBuffToFill[i][uiStartPos+j] = puiWriteBuf[j];
				}
			}*/

			uiNumRead = uiFetchAmt;
		}

	}
	
	//ReportError("Made if past the processing stuff");

	*msg = m_cbBuf.AdvanceCurPnt(uiNumRead);
	
	if (*msg == MUS_INTMES_BUFFER_UNDERFLOW)
	{
		ReportError("Underflow");
		m_msgPipeOutStatus = MUS_STATUS_UNDER_FLOW;
	}
	else if (*msg == MUS_INTMES_BUFFER_UNDERFLOW)
	{
		m_msgPipeOutStatus = MUS_INTMES_END_OF_SONG_REACHED;
	}

	//ReportError("End of pipeout");

	return *msg;
}


MUS_MESSAGE SoundPipe::Init(int32_t iNumChan, 
							size_t uiBufferSize)
{
	m_rfResample.SetFilterRate(1.0);
	/*m_btfSongLvlEQ =
				(BassTrebleFilter *) MALLOC(sizeof(BassTrebleFilter) *
											iNumChan);*/
		
	m_cbBuf.Init(iNumChan, uiBufferSize);
	m_iNumChan = iNumChan;
	m_iFadeHelper = 0;
	
	// Initialize ffmpeg
	m_FFmpegDecoder.Init();

	//for each row allocate memory for columns
	for(int i=0; i<iNumChan; i++)
	{
		m_btfSongLvlEQ[i].Init();
	}
	
	m_iCurVol = VOL_NORM_LEVEL;

	m_puiWorkingBuf = (uint32_t *) MALLOC(sizeof(uint32_t) *
												(MUS_BUFFER_SIZE/LOW_SPEED_RATIO_LIM +
												40));

	m_cbBuf.Flush();

	m_cstrCurSongPath = (char *) MALLOC(2048);
	m_iCurSongAlloc = 2048;
	
	m_msgPipeInStatus 		= MUS_STATUS_WAITING_FOR_SONG;
	m_msgPipeOutStatus 		= MUS_STATUS_WAITING_FOR_SONG;	
	return MUS_STATUS_WAITING_FOR_SONG;
}


MUS_MESSAGE SoundPipe::Flush()
{
	m_msgPipeInStatus 		= MUS_STATUS_WAITING_FOR_SONG;
	m_msgPipeOutStatus 		= MUS_STATUS_WAITING_FOR_SONG;

	//ReportError("Flushing Pipe");
	m_cbBuf.Flush();
	
	m_cstrCurSongPath[0] = '\0';
	
	m_dResampConvFactor = 1.0;

	m_iFadeHelper = 0;

	free(m_cstrMetaJSON);
	m_cstrMetaJSON = NULL;
	m_FFmpegDecoder.Close();
	ResetFilters();

	m_msgPipeInStatus 		= MUS_STATUS_WAITING_FOR_SONG;
	m_msgPipeOutStatus 		= MUS_STATUS_WAITING_FOR_SONG;	
	//ReportError("Finished Flushing Pipe");
	return MUS_STATUS_WAITING_FOR_SONG;
}


uint32_t SoundPipe::Seek(double dTime)
{
	if ((m_msgPipeInStatus == MUS_STATUS_WAITING_FOR_SONG) ||
		(m_msgPipeOutStatus == MUS_STATUS_WAITING_FOR_SONG))
	{
		return -1;
	}

	SDL_LockAudio();
	m_msgPipeInStatus 		= MUS_STATUS_WAITING_FOR_SONG;
	m_msgPipeOutStatus 		= MUS_STATUS_WAITING_FOR_SONG;
	SDL_UnlockAudio();

	m_cbBuf.Flush();
	ResetFilters();

	ReportError1("About to call FFmpeg seek with %f", dTime);

	uint32_t retVal = m_FFmpegDecoder.Seek(dTime);

	m_msgPipeInStatus 	= MUS_STATUS_INITIAL_BUFFERING;
	m_msgPipeOutStatus 	= MUS_STATUS_PLAYING;
	
	return retVal;
}


MUS_MESSAGE SoundPipe::ResetFilters()
{
	for(int i=0; i<m_iNumChan; i++)
	{
		m_btfSongLvlEQ[i].Reset();
	}

	return 0;
}

MUS_MESSAGE SoundPipe::Open(const char *cstrFileName)
{
	SDL_LockAudio();
	m_msgPipeInStatus 		= MUS_STATUS_WAITING_FOR_SONG;
	m_msgPipeOutStatus 		= MUS_STATUS_WAITING_FOR_SONG;	
	SDL_UnlockAudio();
	
	MusMessage err = m_FFmpegDecoder.Open(cstrFileName);
	ReportError1("Opening %s", cstrFileName);

	if (err == MUS_MOD_Error)
	{
		m_msgPipeInStatus 	= MUS_STATUS_ERROR;
		m_msgPipeOutStatus	= MUS_STATUS_ERROR;
		return MUS_STATUS_ERROR;
	}

	m_cstrCurSongPath = ReallocStringCopy(m_cstrCurSongPath, 
										  &m_iCurSongAlloc, 
										  cstrFileName);

	m_fSampleRate = m_FFmpegDecoder.GetSampleRate();

	if (m_fSampleRate == 0) m_fSampleRate = 44100;

	m_dResampConvFactor = DEST_FREQ/m_fSampleRate;

	float fCurSpeed = m_rfResample.GetSpeed();
	
	ReportError2("fCurSpeed=%f, resampconv=%f", fCurSpeed, m_dResampConvFactor);

	fCurSpeed *= m_dResampConvFactor;

	m_rfResample.SetFilterRate(fCurSpeed);

	if (fCurSpeed == 1.0)
		m_bUseResampFilt = 0;
	else
		m_bUseResampFilt = 1;

	m_lSongEndInSec = m_FFmpegDecoder.GetDuration();

	if (m_lSongEndInSec == 0)
		m_lSongEndInSec = UINT_MAX;

	const char *cstrTempMeta = m_FFmpegDecoder.GetMetadataLite();

	const char *cstrName = strrchr(m_cstrCurSongPath, '/');

	cstrName++;

	m_cstrMetaJSON = (char *) MALLOC(strlen(cstrName) +
									 strlen(cstrTempMeta) +
									 strlen(m_cstrCurSongPath) +
									 64);

	sprintf(m_cstrMetaJSON,
			"{\"path\":\"%s\","
			"\"name\":\"%s\","
			"\"Metadata\":%s}",
			m_cstrCurSongPath,
			cstrName,
			cstrTempMeta);


	ReportError1("MetaJSON: %s", m_cstrMetaJSON);

	// Create message to start song

	m_msgPipeInStatus 	= MUS_STATUS_INITIAL_BUFFERING;
	m_msgPipeOutStatus 	= MUS_STATUS_PLAYING;
	
	//ReportError("Made it through Pipe Open Routine");

	return MUS_STATUS_INITIAL_BUFFERING;
}


int16_t AudioPipeline::SetNext(const char *cstrFileName, float fTransition)
{

	ReportError1("Set Next=%s", cstrFileName);

	if (m_spPipe[m_iActivePipe].GetInStatus() ==
								MUS_STATUS_WAITING_FOR_SONG)
	{
		return Open(cstrFileName);
	}

	if(QuickExtCheck(cstrFileName) == 0)
		return 0;

	if ((fTransition > 0.5) || (fTransition < -0.5))
	{
		if (fTransition < 0)
		{
			fTransition *= -1;
			m_iEndType = END_TYPE_CROSSFADE;

			m_iCurScale = END_MAX_GAP;
			m_iEndLength = fTransition;
			if (m_iEndLength > 10)
			{
				m_iScaleBy = END_MAX_GAP/10;
				m_iEndLength = 10;

			}
			else
			{
				m_iScaleBy = END_MAX_GAP/fTransition;
			}

		}
		else
		{
			m_iEndType = END_TYPE_GAP;

			m_iEndLength = fTransition;
			if (m_iEndLength > 10)
			{
				m_iEndLength = DEST_FREQ * 10;
			}
			else
			{
				m_iEndLength = DEST_FREQ * fTransition;
			}

		}


	}
	else
	{
		m_iEndType = 0;
	}

	int32_t iInactivePipe = _GetInactivePipe();



	m_spPipe[iInactivePipe].Flush();
	m_spPipe[iInactivePipe].SetFilterRate(m_fRate);
	MUS_MESSAGE Msg = m_spPipe[_GetInactivePipe()].Open(cstrFileName);
	return Msg;

}


void AudioPipeline::RunProcessStage(uint32_t **puiBuffToFill, int lRequested)
{

	MUS_MESSAGE Msg;

	size_t uiEndPnt = 0;

	int64_t llSampsLeft = m_spPipe[m_iActivePipe].GetEndCntdwn();

	//ReportError("1");

	if ((END_GAP_TRIGGER == m_iEndType) && (m_iEndLength >= lRequested/8))
	{

		ReportError1("m_iEndLength:%i", m_iEndLength);

		for (int i=0; i<m_iNumChan; i++)
		{
			memset(puiBuffToFill[i],
				   0,
				   lRequested/2);
		}

		m_iEndLength -= lRequested/8;
		if (m_iEndLength < lRequested/8)
		{
			m_iEndLength = 0;
			m_iEndType = 0;
			m_spPipe[m_iActivePipe].SetDoneStatus();
			m_iActivePipe = _GetInactivePipe();
			_PassSongTransMsgGood(m_spPipe[m_iActivePipe].GetMeta());
		}
		return;
	}
	else if ((END_TYPE_CROSSFADE == m_iEndType) &&
			 (llSampsLeft < m_iEndLength))
	{
		ReportError1("Samples Left: %i", llSampsLeft);
		m_iEndLength = llSampsLeft;
		m_iCurScale -= m_iScaleBy;
		m_spPipe[m_iActivePipe].SetFade(MIN(m_iCurScale, m_iTrackFade));
	}
	
	//ReportError("2");

	Msg = m_spPipe[m_iActivePipe].PipeOut(puiBuffToFill,
										  lRequested/8,
										  &Msg,
										  &uiEndPnt);

	//ReportError("3");

	if ((Msg == MUS_STATUS_WAITING_FOR_SONG) ||
		(Msg == MUS_INTMES_BUFFER_UNDERFLOW))
		return;

	if ((END_TYPE_CROSSFADE & m_iEndType) &&
		(Msg != MUS_STATUS_ERROR))
	{

		if (llSampsLeft <= m_iEndLength)
		{
			if (m_spPipe[_GetInactivePipe()].GetOutStatus() == MUS_STATUS_ERROR)
			{
				m_iEndType = 0;
				m_iEndLength = 0;
				return;
			}

			size_t uiSecEndPnt = 0;

			m_spPipe[_GetInactivePipe()].SetFade(MIN(m_iTrackFade,
													 END_MAX_GAP - m_iCurScale));

			Msg = m_spPipe[_GetInactivePipe()].PipeOut(m_puiMixBuf,
												lRequested/8,
												&Msg,
												&uiSecEndPnt);

			for (int i=0; i<m_iNumChan; i++)
			{
				int32_t iLimit = lRequested/4;
				uint16_t *pusOrigIter = (uint16_t *) puiBuffToFill[i];
				uint16_t *pusNewSongIter = (uint16_t *) m_puiMixBuf[i];

				while(iLimit--)
				{
					*(pusOrigIter++) += *(pusNewSongIter++);
				}
			}

			//int32_t lAdjRequest = ResampleFilter::AdvanceByAmtStat(lRequested, m_iFixedResampFilt);

			ReportError1("m_iEndLangth=%i", m_iEndLength);

			if (m_iEndLength <= 0)
			{
				ReportError("Should End");

				m_iEndLength = 0;
				m_iEndType = 0;
				m_iActivePipe = _GetInactivePipe();
				_PassSongTransMsgGood(m_spPipe[m_iActivePipe].GetMeta());
				m_spPipe[m_iActivePipe].SetFade(MIN(END_MAX_GAP, m_iTrackFade));
			}
		}
	}
	else if (Msg == MUS_INTMES_END_OF_SONG_REACHED)
	{
		if (m_spPipe[_GetInactivePipe()].GetOutStatus() == MUS_STATUS_ERROR)
		{
			m_spPipe[m_iActivePipe].SetDoneStatus();
			m_iActivePipe = _GetInactivePipe();
			_PassSongTransMsgBad();		
			return;
		}
		
		int32_t uiNumToWrite = lRequested/8 - uiEndPnt;

		if (END_TYPE_GAP == m_iEndType)
		{
			if (uiNumToWrite > 0)
			{
				for (int i=0; i<m_iNumChan; i++)
				{
					memset(&puiBuffToFill[i][uiEndPnt],
						   0,
						   uiNumToWrite * 4);
				}

				m_iEndLength -= lRequested/8;
			}

			m_iEndType = END_GAP_TRIGGER;
			return;
		}
		else
		{
			ReportError1("uiNumToWrite=%i", uiNumToWrite);

			if (uiNumToWrite > 0)
			{
				Msg = m_spPipe[_GetInactivePipe()].PipeOut(puiBuffToFill,
												uiNumToWrite,
												&Msg,
												&uiEndPnt);
			}

			m_spPipe[m_iActivePipe].SetDoneStatus();
			m_iActivePipe = _GetInactivePipe();
			m_iEndLength = 0;
			m_iEndType = 0;

			_PassSongTransMsgGood(m_spPipe[m_iActivePipe].GetMeta());

		}

	}

	//ReportError("Here at end of this");
}

void AudioPipeline::RunDecodeStage()
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
