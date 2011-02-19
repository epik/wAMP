/*
 * FFmpegModule.cpp
 *
 *  Created on: Jan 27, 2011
 *      Author: Katiebird
 */

#include "FFmpegModule.h"

MusMessage FFmpegWrapper::Init()
{
    /* initialize libavcodec, and register all codecs and formats */
    av_register_all();

    m_psTmpBufferBase = (int16_t *) av_malloc((AVCODEC_MAX_AUDIO_FRAME_SIZE +
    									   	   FF_INPUT_BUFFER_PADDING_SIZE) *
    									   	  3);
    return MUS_MOD_Success;
}

MusMessage FFmpegWrapper::Uninit()
{
	av_free(m_psTmpBufferBase);

    return MUS_MOD_Success;
}

int16_t FFmpegWrapper::IsType(const char *cstrFileName, size_t iPos)
{
	int16_t retVal = 0;

	MusMessage Msg = FindDecoder(cstrFileName);

	if (Msg == MUS_MOD_Success)
		retVal = 1;

	// Close the codec
	avcodec_close(m_pCodecCtx);

	// Close the video file
	av_close_input_file(m_pFormatCtx);

	return 1;
}

MusMessage FFmpegWrapper::FindDecoder(const char *cstrFileName)
{
	//ReportError1("Open with FFmpeg File=%s", cstrFileName);

    // Open audio file
	int err = av_open_input_file(&m_pFormatCtx, cstrFileName, NULL, 0, NULL);

    if(err != 0)
    {
    	char cstrFFmpegError[128];
    	char cstrErrBuf[256] = "Error Opening Song:";

    	av_strerror(err, cstrFFmpegError, sizeof(cstrFFmpegError));

    	strcat(cstrErrBuf, cstrFFmpegError);

    	MUS_ERROR(MUS_ERROR_LOAD_PROBLEM, cstrErrBuf);
		return MUS_MOD_Error;
    }

    // Retrieve stream information
    err = av_find_stream_info(m_pFormatCtx);

    if(err<0)
    {
    	char cstrFFmpegError[128];
    	char cstrErrBuf[256] = "Error retrieving stream:";

    	av_strerror(err, cstrFFmpegError, sizeof(cstrFFmpegError));

    	strcat(cstrErrBuf, cstrFFmpegError);

    	MUS_ERROR(MUS_ERROR_LOAD_PROBLEM, cstrErrBuf);
		return MUS_MOD_Error;
    }

#ifdef DEBUG
    // Dump information about file onto standard error
    //dump_format(m_pFormatCtx, 0, "c:/r.wma", 0);
#endif

    m_iStreamID = -1;
    for(uint16_t i=0; i<m_pFormatCtx->nb_streams; i++)
    {
		if(m_pFormatCtx->streams[i]->codec->codec_type==CODEC_TYPE_AUDIO)
		{
			m_iStreamID = i;
			break;
		}
    }

    if(m_iStreamID==-1)
    {
    	MUS_ERROR(MUS_ERROR_LOAD_PROBLEM, "Unable to find stream");
		return MUS_MOD_Error;
    }

    // Get a pointer to the codec context for the video stream
    m_pCodecCtx=m_pFormatCtx->streams[m_iStreamID]->codec;


    // Find the decoder for the music stream
    m_pCodec = avcodec_find_decoder(m_pCodecCtx->codec_id);

    // No decoder found
    if (!m_pCodec)
    {

    	MUS_ERROR(MUS_ERROR_LOAD_PROBLEM, "Codec not supported");
		return MUS_MOD_Error;
    }

    return MUS_MOD_Success;
}

MusMessage FFmpegWrapper::Open(const char *cstrFileName)
{
	MusMessage Msg = FindDecoder(cstrFileName);

	if (Msg != MUS_MOD_Success)
		return Msg;

    // Inform the codec that we can handle truncated bitstreams -- i.e.,
    // bitstreams where frame boundaries can fall in the middle of packets
    if(m_pCodec->capabilities & CODEC_CAP_TRUNCATED)
    	m_pCodecCtx->flags|=CODEC_FLAG_TRUNCATED;


    m_mmBufferedState = MUS_MOD_Success;

    m_psOverFlowBuffer = m_psTmpBufferBase;

    m_iOverFlowSize = 0;

    // Open codec
    int err = avcodec_open(m_pCodecCtx, m_pCodec);
    if(err<0)
    {
    	char cstrFFmpegError[128];
    	char cstrErrBuf[256] = "Unable to open codec:";

    	av_strerror(err, cstrFFmpegError, sizeof(cstrFFmpegError));

    	strcat(cstrErrBuf, cstrFFmpegError);

    	MUS_ERROR(MUS_ERROR_LOAD_PROBLEM, cstrErrBuf);
		return MUS_MOD_Error;
    }

    // Get song length
    m_iSongLength = m_pFormatCtx->duration / AV_TIME_BASE;
    SetSampleRate(m_pCodecCtx->sample_rate);

    return MUS_MOD_Success;
}

MusMessage FFmpegWrapper::Close()
{
	// Close the codec
	avcodec_close(m_pCodecCtx);

	// Close the video file
	av_close_input_file(m_pFormatCtx);

	return MUS_MOD_Success;
}

int64_t FFmpegWrapper::Seek(double time)
{
	if (m_pFormatCtx == 0)
		return -1;

	av_seek_frame(m_pFormatCtx, -1, time * AV_TIME_BASE,
									AVSEEK_FLAG_ANY | AVSEEK_FLAG_BACKWARD);


	av_read_frame(m_pFormatCtx, &m_packet);

	int64_t retVal = av_rescale(m_packet.dts,
						m_pFormatCtx->streams[m_iStreamID]->time_base.num,
						m_pFormatCtx->streams[m_iStreamID]->time_base.den);

	av_seek_frame(m_pFormatCtx, -1, time * AV_TIME_BASE,
										AVSEEK_FLAG_ANY | AVSEEK_FLAG_BACKWARD);


	return retVal*44100;

}

MusMessage FFmpegWrapper::FillBuffWithRawSong(uint8_t *piBuffToFill,
												size_t *plNumBytesWritten)
{
	//ReportError1("****At start OverflowSize=%i", m_iOverFlowSize);
	if (m_iOverFlowSize > 0)
	{
		if (m_iOverFlowSize > GetBufferSize())
		{
			// iOverFlow is in int16_t units, GetBufferSize is in int8_t units
			m_iOverFlowSize -= GetBufferSize();
			//ReportError1("\tOverflowSize in if =%i", m_iOverFlowSize);
			memcpy(piBuffToFill, m_psOverFlowBuffer, GetBufferSize());
			m_psOverFlowBuffer += GetBufferSize()/2;
			(*plNumBytesWritten) = GetBufferSize();
			return MUS_MOD_Success;
		}
		else
		{
			//ReportError1("\tOverflowSize in else=%i", m_iOverFlowSize);
			memcpy(piBuffToFill, m_psOverFlowBuffer, m_iOverFlowSize);
			piBuffToFill += m_iOverFlowSize;
			(*plNumBytesWritten) = m_iOverFlowSize;
			m_iOverFlowSize = 0;
			m_psOverFlowBuffer = m_psTmpBufferBase;
			if (m_mmBufferedState != MUS_MOD_Success)
				return MUS_MOD_Done;
			if ((*plNumBytesWritten) == (size_t) GetBufferSize())
				return MUS_MOD_Success;
		}
	}
	else
	{
		(*plNumBytesWritten) = 0;
	}


	while ((*plNumBytesWritten) < (uint32_t) GetBufferSize())
	{
		int err = av_read_frame(m_pFormatCtx, &m_packet);

		//ReportError1("err=%i", err);
		//ReportError1("NumWritten=%i",(*plNumBytesWritten));

		if ((err) || (url_feof(m_pFormatCtx->pb)))
		{
			ReportError("Getting this far");

			if ((err == AVERROR_EOF) || (url_feof(m_pFormatCtx->pb)))
			{
				ReportError("Done");
				return MUS_MOD_Done;
			}
			else
			{
				char cstrFFmpegError[128];
				char cstrErrBuf[256] = "Error reading frame:";

				av_strerror(err, cstrFFmpegError, sizeof(cstrFFmpegError));

				strcat(cstrErrBuf, cstrFFmpegError);

				MUS_ERROR(MUS_ERROR_LOAD_PROBLEM, cstrErrBuf);
				return MUS_MOD_Error;
			}
		}

		do
		{

			//ReportError("Are there Multiple packets in read");

			int32_t iSize = AVCODEC_MAX_AUDIO_FRAME_SIZE +
													FF_INPUT_BUFFER_PADDING_SIZE;

			int tmpErr = avcodec_decode_audio3(m_pCodecCtx, m_psTmpBufferBase,
																&iSize, &m_packet);

			if (tmpErr <= 0)
			{
				ReportError("Test");
				char cstrFFmpegError[128];
				char cstrErrBuf[256] = "Unable to decode:";

				av_strerror(err, cstrFFmpegError, sizeof(cstrFFmpegError));

				strcat(cstrErrBuf, cstrFFmpegError);

				MUS_ERROR(MUS_ERROR_LOAD_PROBLEM, cstrErrBuf);

				break;
			}

			int iCheckOverflow = (iSize + (*plNumBytesWritten)) - GetBufferSize();

			if (iCheckOverflow > 0)
			{
				memcpy(piBuffToFill, m_psTmpBufferBase, (iSize-iCheckOverflow));
				m_psOverFlowBuffer = m_psTmpBufferBase +
													((iSize-iCheckOverflow)/2);
				(*plNumBytesWritten) += (iSize-iCheckOverflow);
				m_iOverFlowSize = iCheckOverflow;
				//ReportError1("Other End NumWritten=%i",(*plNumBytesWritten));
				return MUS_MOD_Success;
			}
			else
			{
				memcpy(piBuffToFill, m_psTmpBufferBase, iSize);
				(*plNumBytesWritten) += iSize;
				//ReportError1("iSize=%i",iSize);
				piBuffToFill += iSize;
				if((*plNumBytesWritten) ==  GetBufferSize())
					return m_mmBufferedState;
			}

			m_packet.size -= iSize;
			m_packet.data += iSize;
			
		} while (m_packet.size > 0);
	}

	ReportError1("End NumWritten=%i",(*plNumBytesWritten));

	return m_mmBufferedState;
}


/********************************************
 * GetMetadata()
 *
 * This dumps the metadata information contained in the
 *	song into a json formatted string.
 *
 * OUT
 *	JSON formatted string (its a javascript thing for those C people)
 *		You will need to delete this using free() rather than delete[].
 ********************************************/
char *FFmpegWrapper::GetMetadata()
{
	if (!m_pFormatCtx)
	{
		return NULL;
	}

	// For now allocate 2056 characters for the json.  
	//	If we need more, we will realloc
	char *cstrRet = (char *) malloc(2056);
	
	// keep track of how many characters we have in the string
	//	in case we need to realloc
	size_t	CurSize = 2;
	size_t	SizeLim = 2056;
	
	// variable to pass the metadata pairs to
	AVMetadataTag *tag=NULL;

	// add the starting bracket to the json
	sprintf(cstrRet,"{");

	char *cstrTmp;

	// iterate through the metadata
	while((tag=av_metadata_get(m_pFormatCtx->metadata, "", tag, AV_METADATA_IGNORE_SUFFIX)))
	{
		// first calculate the size of this metadata item
		//	remember to add a buffer to account for the quote marks 
		//	and colon used for the JSON item (we use 10 to be safe)
		size_t	tmpSize = strlen(tag->key) + strlen(tag->value) + 12;
		
		// Make sure we have enough room in our main JSON string
		CurSize += tmpSize;
		while (CurSize > SizeLim)
		{
			tmpSize = MAX(tmpSize+512, 1028);
			// for ease of use, increment in intervals of 1028
			SizeLim += 1028;
			cstrRet = (char *) realloc(cstrRet, SizeLim);
		}
		
		// allocate a new temp string to place the metadata pair into
		cstrTmp = (char *) malloc(tmpSize);
		sprintf(cstrTmp, " \"%s\":\"%s\",", tag->key, tag->value);
		strcat(cstrRet, cstrTmp);
		free(cstrTmp);
	}
	
	cstrTmp = cstrRet;

	while((*cstrTmp) != 0) cstrTmp++;
	cstrTmp--;
	*cstrTmp = '}';
	return cstrRet;
}
