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
	m_uiNumUsed++;
	
	/*ReportError2("Allocating Num: %i, Num Allocated: %i",
				 m_uiEnd,
				 m_uiNumUsed);*/
				 
	if (m_uiNumUsed == m_uiNumAllocated)
	{
		SDL_LockAudio();

		/*ReportError2("Reallocating SoundPacketAlloc to %i (%i)",
					m_uiNumAllocated,
					m_uiNumAllocated * sizeof(SoundPacket));*/
		m_pspPacketArray = (SoundPacket *) REALLOC(m_pspPacketArray,
									((m_uiNumAllocated * 2) + 2) * sizeof(SoundPacket));

		if (m_uiStart)
		{
			while(m_uiStart != m_uiNumAllocated)
			{
				memcpy(&m_pspPacketArray[m_uiStart+m_uiNumAllocated],
					   &m_pspPacketArray[m_uiStart],
					   sizeof(SoundPacket));
				m_uiStart++;
			}
		}
		
		m_uiNumAllocated *= 2;

#ifdef DEBUG
		for (uint32_t i=0; i<m_uiNumAllocated; i++)
		{
			m_pspPacketArray[i].AllocPos = i;
			m_pspPacketArray[i]._FIRST = 0xBAADC0DE;
			m_pspPacketArray[i]._LAST = 0xBAADC0DE;
		}
#endif
		
		SDL_UnlockAudio();
	}
	
	SoundPacket *pspRetVal = &m_pspPacketArray[m_uiEnd++];		
	m_uiEnd &= (m_uiNumAllocated - 1);


#ifdef DEBUG
	pspRetVal->_FIRST = 0xBAADC0DE;
	pspRetVal->_LAST = 0xBAADC0DE;
#endif

	pspRetVal->NumChan = 2;
	pspRetVal->_Helper = pHelper;

	//ReportError("Done Stereo");

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

	ReportError3("Entering AdvanceCurPnt With Values Cur=%i uiAmt=%i buffer=%i",
				m_puiDataCur,
				uiAmt,
				m_uiBufferSize);

	while ((uiAmt = CheckIfOverCurPckt(uiAmt)) != 0)
	{

		MUS_MESSAGE msg = AdvanceToNextPacket();

		if (msg == MUS_INTMES_END_OF_SONG_REACHED)
		{
			return MUS_INTMES_END_OF_SONG_REACHED;
		}
		else if (msg == MUS_INTMES_BUFFER_UNDERFLOW)
		{
			return MUS_INTMES_BUFFER_UNDERFLOW;
		}
	}

	if (m_puiDataCur >= m_uiBufferSize)
		m_puiDataCur -= m_uiBufferSize;

	//ReportError("Finished AdvanceCurPnt");
		
	return MUS_INTMES_NEXT_FRAME;
}
		
		
MUS_MESSAGE CircularBuffer::AdvanceToNextPacket()
{
	//ReportError("Entering AdvanceToNextPacket");

	int32_t iErr = m_spaAllocator.FinishPckt();

	if (iErr == BUFFER_SONG_END)
	{
		m_puiDataCur = m_puiDataEnd;
		return MUS_INTMES_END_OF_SONG_REACHED;
	}
	else if (iErr == BUFFER_UNDERFLOW)
	{
		return MUS_INTMES_BUFFER_UNDERFLOW;
	}

	SoundPacket *pspTemp = m_spaAllocator.GetCurPacket();
	m_puiDataCur = pspTemp->DataStartPoint;

	//ReportError("Done all the freeing");
	return MUS_INTMES_NEXT_FRAME;

}

MUS_MESSAGE CircularBuffer::AddStereoPacket(SoundPacket *pspNextPacket,
									  uint16_t *pcData,
									  int32_t iSize)
{	
	ReportError3("Entering AddStereoPacket With Values Cur=%i End=%i Size=%i",
				m_puiDataCur,
				m_puiDataEnd,
				iSize);
	
	if (pspNextPacket->Size == 0)
	{
		pspNextPacket->DataStartPoint = m_puiDataEnd;	
	}
	pspNextPacket->Size += iSize;
	
	uint16_t *puiPointer0 	= (uint16_t *) &m_puiBuffer[0][m_puiDataEnd];
	uint16_t *puiPointer1 	= (uint16_t *) &m_puiBuffer[1][m_puiDataEnd];
	
	uint32_t iTrigger = 0;
	
	int32_t iTemp = m_puiDataEnd + iSize/8;
	
	if ((m_puiDataEnd < MUS_BUFFER_SIZE) && (iTemp > MUS_BUFFER_SIZE))
		iTrigger = 1;

	while (m_puiDataEnd < iTemp)
	{
		assert(m_puiDataEnd<(m_uiBufferSize+MUS_BUFFER_SIZE + RESAMPLE_PADDING));

		*(puiPointer0++) = *(pcData++);
		*(puiPointer1++) = *(pcData++);
		*(puiPointer0++) = *(pcData++);
		*(puiPointer1++) = *(pcData++);

		m_puiDataEnd++;
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
				m_msgPipeInStatus = MUS_STATUS_BUFFERING;
			else
				m_msgPipeInStatus = MUS_STATUS_INITIAL_BUFFERING;
			//ReportError("Success");
			return MUS_PIPEINMES_PACKET_ADDED;
		}
		else if (msg == MUS_MOD_Done)
		{
			ReportError("Song Done");
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
	//ReportError("In the OUT Pipe<<<<<<<<<<<");

	size_t uiStartPos = *puiNumWrittem;

	if ((m_msgPipeOutStatus == MUS_STATUS_WAITING_FOR_SONG) ||
		(m_msgPipeOutStatus == MUS_STATUS_ERROR) ||
		((m_msgPipeInStatus == MUS_STATUS_INITIAL_BUFFERING) &&
		 (!(IsEnoughBuffer()))))
	{

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
	
	for (int i=0; i<m_iNumChan; i++)
	{
		puiWriteBuf = m_cbBuf.GetSamples(i);

		/*for (int i=0; i<m_iNumChan; i++)
		{
			for(int j=0;j<uiFetchAmt;j++)
			{
				puiBuffToFill[i][uiStartPos+j] = puiWriteBuf[j];
			}
		}*/

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
	
	*msg = m_cbBuf.AdvanceCurPnt(uiNumRead);
	
	if (*msg == MUS_STATUS_INITIAL_BUFFERING)
		m_msgPipeInStatus = MUS_STATUS_INITIAL_BUFFERING;

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
	m_iFadeHelper = -1;
	
	// Initialize ffmpeg
	m_FFmpegDecoder.Init();

	//for each row allocate memory for columns
	for(int i=0; i<iNumChan; i++)
	{
		m_btfSongLvlEQ[i].Init();
	}
	
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
	//ReportError("Flushing Pipe");
	m_cbBuf.Flush();
	
	m_cstrCurSongPath[0] = '\0';
	
	m_dResampConvFactor = 1.0;

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
	m_msgPipeInStatus 	= MUS_STATUS_INITIAL_BUFFERING;
	m_msgPipeOutStatus 	= MUS_STATUS_PLAYING;

	m_cbBuf.Flush();
	ResetFilters();
	
	return m_FFmpegDecoder.Seek(dTime);
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
	MusMessage err = m_FFmpegDecoder.Open(cstrFileName);
	//ReportError1("Opening %s", cstrFileName);

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

	if (m_fSampleRate == 0) m_fSampleRate = 11250;

	m_dResampConvFactor = DEST_FREQ/m_fSampleRate;

	float fCurSpeed = m_rfResample.GetSpeed();
	
	ReportError2("fCurSpeed=%f, resampconv=%f", fCurSpeed, m_dResampConvFactor);

	m_rfResample.SetFilterRate(fCurSpeed * m_dResampConvFactor);

	m_lSongEndInSec = m_FFmpegDecoder.GetDuration();

	if (m_lSongEndInSec == 0)
		m_lSongEndInSec = UINT_MAX;

	const char *cstrTempMeta = m_FFmpegDecoder.GetMetadata();

	m_cstrMetaJSON = (char *) MALLOC(strlen(cstrTempMeta) +
									 strlen(m_cstrCurSongPath) + 
									 50);	
	
	sprintf(m_cstrMetaJSON,
			"{\"CurrentSongPath\":\"%s\","
			"\"Metadata\":%s}",
			m_cstrCurSongPath,
			cstrTempMeta);


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
	m_spPipe[_GetInactivePipe()].SetFilterRate(m_fRate);
	MUS_MESSAGE Msg = m_spPipe[_GetInactivePipe()].Open(cstrFileName);
	SDL_UnlockAudio();
	return Msg;

}


void AudioPipeline::RunProcessStage(uint32_t **puiBuffToFill, int lRequested)
{
	MUS_MESSAGE Msg;

	size_t uiEndPnt = 0;

	if ((END_GAP_TRIGGER & m_iEndType) && (m_iEndLength >= lRequested/8))
	{
		assert(0);
	
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
			m_spPipe[m_iActivePipe].MarkDone();
			m_iActivePipe = _GetInactivePipe();
			_PassSongTransMsgGood(m_spPipe[m_iActivePipe].GetMeta());
		}
		return;
	}
	
	Msg = m_spPipe[m_iActivePipe].PipeOut(puiBuffToFill,
										  lRequested/8,
										  &Msg,
										  &uiEndPnt);

	assert(uiEndPnt < (MUS_BUFFER_SIZE/LOW_SPEED_RATIO_LIM));
										  
	if ((Msg == MUS_STATUS_WAITING_FOR_SONG) ||
		(Msg == MUS_INTMES_BUFFER_UNDERFLOW))
		return;

	if ((END_TYPE_CROSSFADE & m_iEndType) &&
		(Msg != MUS_STATUS_ERROR))
	{
		int64_t llSampsLeft = m_spPipe[m_iActivePipe].GetEndCntdwn();

		ReportError2("Current llSampsLeft=%i, m_iEndLength=%i",
					   (int32_t) llSampsLeft,
					   (int32_t) m_iEndLength);

		if (llSampsLeft == SONG_END_UNKNOWN)
			return;
			
		if (llSampsLeft <= m_iEndLength)
		{
			if (m_spPipe[_GetInactivePipe()].GetOutStatus() == MUS_STATUS_ERROR)
			{
				m_iEndType = 0;
				m_iEndLength = 0;
				return;
			}
			
			size_t uiSecEndPnt = 0;

			Msg = m_spPipe[_GetInactivePipe()].PipeOut(m_puiMixBuf,
												lRequested/8,
												&Msg,
												&uiSecEndPnt);

			m_iCurScale -= (lRequested/8 * (m_iEndType & END_STEP_MASK));

			m_iEndLength -= lRequested/8;

			if (m_iEndLength <= 0)
			{
				m_iEndLength = 0;
				m_iEndType = 0;
				m_spPipe[m_iActivePipe].MarkDone();
				m_iActivePipe = _GetInactivePipe();
				_PassSongTransMsgGood(m_spPipe[m_iActivePipe].GetMeta());
			}
		}
	}
	else if (Msg == MUS_INTMES_END_OF_SONG_REACHED)
	{
		ReportError("Transitioning to the next song");
		
		if (m_spPipe[_GetInactivePipe()].GetOutStatus() == MUS_STATUS_ERROR)
		{
			m_spPipe[m_iActivePipe].MarkDone();
			m_iActivePipe = _GetInactivePipe();
			_PassSongTransMsgBad();		
			return;
		}
		
		int32_t uiNumToWrite = lRequested/8 - uiEndPnt;

		if (END_TYPE_GAP & m_iEndType)
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
		
			m_iEndType |= END_GAP_TRIGGER;
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

			m_spPipe[m_iActivePipe].MarkDone();
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
