/*
 * DSPPipe.cpp
 *
 *  Created on: Apr 24, 2011
 *      Author: Katiebird
 */

#include "DSPPipe.h"

#define FILTER_PADDING	

void CircularBuffer::Init(int32_t iNumChan, size_t uiBufferSize)
{
	assert(uiBufferSize*2 > (CBUF_PCKT_SIZE_NEED + 
							 SUFFICIENT_BUFFER_SIZE));

	m_llClock = 0;
	
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
		m_puiDataCur -= m_uiBufferSize;

	ReportError1("m_puiDataCur=%i", m_puiDataCur);

	return &m_puiBuffer[iChan][m_puiDataCur];
}

MUS_MESSAGE CircularBuffer::AdvanceCurPnt(size_t uiAmt)
{
	m_llClock += uiAmt * 2;

	/*ReportError3("Entering AdvanceCurPnt With Values Cur=%i End=%i uiAmt=%i",
				m_puiDataCur,
				m_puiDataEnd,
				uiAmt);*/

	if (m_pspCurPacket == NULL)
		return MUS_STATUS_WAITING_FOR_SONG;
		
	while ((uiAmt = CheckIfOverCurPckt(uiAmt)) != 0)
	{
		if (AdvanceToNextPacket() == MUS_INTMES_END_OF_SONG_REACHED)
		{
			return MUS_INTMES_END_OF_SONG_REACHED;
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

	if (m_pspCurPacket->Next == NULL)
	{
		SoundPacket::FreePacket(m_pspCurPacket);

		//ReportError("Done all the freeing");

		m_pspCurPacket = NULL;
		m_puiDataCur = m_puiDataEnd;
		return MUS_INTMES_END_OF_SONG_REACHED;
	}
	else
	{

		SoundPacket *pspTemp = m_pspCurPacket;
		m_pspCurPacket = m_pspCurPacket->Next;

		m_puiDataCur = m_pspCurPacket->DataStartPoint;

		SoundPacket::FreePacket(pspTemp);

		//ReportError("Done all the freeing");
		return MUS_INTMES_NEXT_FRAME;
	}
}

MUS_MESSAGE CircularBuffer::AddStereoPacket(SoundPacket *pspNextPacket,
									  uint16_t *pcData,
									  int32_t iSize)
{	
	/*ReportError3("Entering AddStereoPacket With Values Cur=%i End=%i Size=%i",
				m_puiDataCur,
				m_puiDataEnd,
				iSize);*/
	
	if (pspNextPacket->Size == 0)
	{
		//ReportError("Here Adding a packet");

		pspNextPacket->DataStartPoint = m_puiDataEnd;	
		
		pspNextPacket->Next = NULL;
	
		if (m_pspCurPacket == NULL)
		{
			m_pspCurPacket = pspNextPacket;
		}
		else
		{
			SoundPacket *pspIter = m_pspCurPacket;

			while (pspIter->Next != NULL)
				pspIter = pspIter->Next;
			
			pspIter->Next = pspNextPacket;
		}
	}
	pspNextPacket->Size += iSize;
	
	uint16_t *puiPointer0 	= (uint16_t *) &m_puiBuffer[0][m_puiDataEnd];
	uint16_t *puiPointer1 	= (uint16_t *) &m_puiBuffer[1][m_puiDataEnd];
	uint16_t *puiStart0 	= (uint16_t *) m_puiBuffer[0];
	uint16_t *puiStart1 	= (uint16_t *) m_puiBuffer[1];
	uint16_t *puiEnd0		= (uint16_t *) &m_puiBuffer[0][m_uiBufferSize];
	uint16_t *puiEnd1		= (uint16_t *) &m_puiBuffer[1][m_uiBufferSize];
	
	uint32_t iTrigger = 0;

	assert(iSize%8 == 0);
	
	for (uint32_t i=m_puiDataEnd; i<(m_puiDataEnd + iSize/8); i++)
	{

		if(i>=(m_uiBufferSize+MUS_BUFFER_SIZE + RESAMPLE_PADDING))
		{

			*(puiStart0++) = *(pcData++);
			*(puiStart1++) = *(pcData++);
			*(puiStart0++) = *(pcData++);
			*(puiStart1++) = *(pcData++);

		}
		else if (i>=m_uiBufferSize)
		{
			iTrigger = 1;
			*(puiStart0++) = *(puiPointer0++) = *(pcData++);
			*(puiStart1++) = *(puiPointer1++) = *(pcData++);
			*(puiStart0++) = *(puiPointer0++) = *(pcData++);
			*(puiStart1++) = *(puiPointer1++) = *(pcData++);
		}
		else if(i>=(MUS_BUFFER_SIZE + RESAMPLE_PADDING))
		{
			*(puiPointer0++) = *(pcData++);
			*(puiPointer1++) = *(pcData++);
			*(puiPointer0++) = *(pcData++);
			*(puiPointer1++) = *(pcData++);
		}
		else
		{
			*(puiEnd0++) = *(puiPointer0++) = *(pcData++);
			*(puiEnd1++) = *(puiPointer1++) = *(pcData++);
			*(puiEnd0++) = *(puiPointer0++) = *(pcData++);
			*(puiEnd1++) = *(puiPointer1++) = *(pcData++);
		}
	}
	
	if (iTrigger)
	{
		/*for (int i=0; i<3; i++)
			m_puiBuffer[0][m_uiBufferSize];*/
		ReportError1("********** BufferSize - %i", m_uiBufferSize);

		m_puiDataEnd = (m_puiDataEnd + iSize/8) - m_uiBufferSize;
		
		for(int i=0; i<RESAMPLE_PADDING; i++)
		{
			m_puiActualBuffer[0][i] = 
							m_puiBuffer[0][m_uiBufferSize -
										   RESAMPLE_PADDING +
										   i];
			m_puiActualBuffer[1][i] = 
							m_puiBuffer[1][m_uiBufferSize -
										   RESAMPLE_PADDING +
										   i];
		}
	}
	else
		m_puiDataEnd += iSize/8;

	
	/*ReportError3("Exiting AddStereoPacket With Values Cur=%i End=%i Size=%i",
				m_puiDataCur,
				m_puiDataEnd
				iSzie);*/
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

		SoundPacket *pspNextPacket = SoundPacket::StereoPacket(&m_cbBuf);
	
		MusMessage msg = m_FFmpegDecoder.GetNextPacket(pspNextPacket);
	
		if (msg == MUS_MOD_Success)
		{
			if (m_msgPipeInStatus != MUS_STATUS_INITIAL_BUFFERING)
				m_msgPipeInStatus = MUS_STATUS_BUFFERING;
			return MUS_PIPEINMES_PACKET_ADDED;
		}
		else if (msg == MUS_MOD_Done)
		{
			ReportError("Song Done");
			m_msgPipeInStatus = MUS_STATUS_SOURCE_EOF;
			return MUS_PIPEINMES_NO_MORE_PACKETS;
		}
		else if (MUS_MOD_Error)
		{
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

		ReportError("Meep");

		for (int i=0; i<m_iNumChan; i++)
		{
			memset(&puiBuffToFill[i][uiStartPos],
				   0,
				   uiFetchAmt*4);
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
			memset(&puiBuffToFill[i][uiStartPos],
				   0,
				   uiFetchAmt * 4);
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
	
	//ReportError("End of pipeout");

	return *msg;
}


MUS_MESSAGE SoundPipe::PrefetchOut()
{
	// Implement eventually, but need mutex and stuff
	/*	m_uiPreFetchEndPos = m_cbBuf->GetSamples(m_puiWriteBuf,
											RESAMPLE_PADDING,
											m_rfResample->AdvanceByAmount(
																	MUS_BUFFER_SIZE),
											RESAMPLE_PADDING);*/

	return 0;
}


MUS_MESSAGE SoundPipe::Init(int32_t iNumChan, 
							size_t uiBufferSize,
							float fCurSpeed,
							int32_t iPrefetch)
{
	m_rfResample.SetFilterRate(fCurSpeed);
	m_btfSongLvlEQ = 
				(BassTrebleFilter *) MALLOC(sizeof(BassTrebleFilter) *
											iNumChan);
		
	m_cbBuf.Init(iNumChan, uiBufferSize);
	m_iUsePrefetching = iPrefetch;
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

	m_msgPipeInStatus 		= MUS_STATUS_WAITING_FOR_SONG;
	m_msgPipeOutStatus 		= MUS_STATUS_WAITING_FOR_SONG;	
	return MUS_STATUS_WAITING_FOR_SONG;
}


MUS_MESSAGE SoundPipe::Flush()
{
	//ReportError("Flushing Pipe");
	m_cbBuf.Flush();
	free(m_cstrCurSongPath);
	m_cstrCurSongPath = NULL;
	
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
	m_msgPipeInStatus 	= MUS_STATUS_BUFFERING;
	m_msgPipeOutStatus 	= MUS_STATUS_PLAYING;

	Flush();

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

	m_cstrCurSongPath = (char *) MALLOC (strlen(cstrFileName) + 2);

	strcpy(m_cstrCurSongPath, cstrFileName);

	m_fSampleRate = m_FFmpegDecoder.GetSampleRate();

	if (m_fSampleRate == 0) m_fSampleRate = 11250;

	m_dResampConvFactor = DEST_FREQ/m_fSampleRate;

	float fCurSpeed = m_rfResample.GetSpeed();
	
	m_rfResample.SetFilterRate(fCurSpeed * m_dResampConvFactor);

	m_lSongEndInSec = m_FFmpegDecoder.GetDuration();

	if (m_lSongEndInSec == 0)
		m_lSongEndInSec = UINT_MAX;

	char *cstrTempMeta = m_FFmpegDecoder.GetMetadata();

	m_cstrMetaJSON = (char *) MALLOC(strlen(cstrTempMeta) +
									 strlen(m_cstrCurSongPath) + 
									 50);	
	
	sprintf(m_cstrMetaJSON,
			"{\"CurrentSongPath\":\"%s\","
			"\"Metadata\":%s}",
			m_cstrCurSongPath,
			cstrTempMeta);
				
	FREE(cstrTempMeta);

	// Create message to start song

	m_msgPipeInStatus 	= MUS_STATUS_INITIAL_BUFFERING;
	m_msgPipeOutStatus 	= MUS_STATUS_PLAYING;

	//ReportError("Made it through Pipe Open Routine");

	return MUS_STATUS_INITIAL_BUFFERING;
}


void AudioPipeline::RunProcessStage(uint32_t **puiBuffToFill, int lRequested)
{
	MUS_MESSAGE Msg;

	size_t uiEndPnt = 0;

	Msg = m_spPipe[m_iActivePipe].PipeOut(puiBuffToFill,
										  lRequested/8,
										  &Msg,
										  &uiEndPnt);

	if (Msg == MUS_STATUS_WAITING_FOR_SONG)
		return;

	if ((END_TYPE_CROSSFADE & m_iEndType) &&
		(Msg != MUS_STATUS_ERROR))
	{
		int64_t llSampsLeft = m_spPipe[m_iActivePipe].GetEndCntdwn();

		/*ReportError2("Current llSampsLeft=%i, m_iEndLength=%i",
					   (int32_t) llSampsLeft,
					   (int32_t) m_iEndLength);*/

		if (llSampsLeft == SONG_END_UNKNOWN)
			return;

		if (llSampsLeft <= m_iEndLength)
		{
			size_t uiSecEndPnt = 0;

			Msg = m_spPipe[_GetInactivePipe()].PipeOut(m_puiMixBuf,
												lRequested/8,
												&Msg,
												&uiSecEndPnt);

			/*//ReportError2("Current uiEndPnt=%i, uiSecEndPnt=%i",
										 uiEndPnt,
										 uiSecEndPnt);*/

			for (int i=0; i<m_iNumChan; i++)
			{
				int16_t *psOld = (int16_t *) puiBuffToFill[i];
				int16_t *psNew = (int16_t *) m_puiMixBuf[i];
				int8_t *psStop = (int8_t *) psOld + lRequested/2;

				while ((int8_t *) psOld < psStop)
				{
					int64_t uiTemp = *(psOld);
					uiTemp *= (int64_t) (m_iCurScale);
					uiTemp >>= END_SCALE_Q;
					*(psOld) = uiTemp;

					uiTemp = *(psNew++);
					uiTemp *= (int64_t) (END_MAX_GAP - m_iCurScale);
					uiTemp >>= END_SCALE_Q;

					*(psOld++) += uiTemp;
				}
			}

			m_iCurScale -= (lRequested/8 * (m_iEndType & END_STEP_MASK));

			m_iEndLength -= lRequested/8;

			if (m_iEndLength <= 0)
			{
				//ReportError("Beep");

				m_spPipe[m_iActivePipe].MarkDone();
				m_iActivePipe = _GetInactivePipe();
				_PassSongTransMsgGood(m_spPipe[m_iActivePipe].GetMeta());
			}
		}
	}
	else if (Msg == MUS_INTMES_END_OF_SONG_REACHED)
	{
		ReportError("Transitioning to the next song");
		
		size_t uiNumToWrite = lRequested/8 - uiEndPnt;

		if (uiNumToWrite > 0)
		{
			Msg = m_spPipe[_GetInactivePipe()].PipeOut(puiBuffToFill,
											uiNumToWrite,
											&Msg,
											&uiEndPnt);
		}

		m_spPipe[m_iActivePipe].MarkDone();
		m_iActivePipe = _GetInactivePipe();
		
		if (m_spPipe[m_iActivePipe].GetOutStatus() != MUS_STATUS_ERROR)
		{
			//ReportError("Tracking down where the plugin is called from");
			_PassSongTransMsgGood(m_spPipe[m_iActivePipe].GetMeta());
		}
		else
		{
			_PassSongTransMsgBad();
		}
	}

	//ReportError("Here at end of this");

}
