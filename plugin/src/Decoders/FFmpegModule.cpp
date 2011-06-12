/*
 * FFmpegModule.cpp
 *
 *  Created on: Jan 27, 2011
 *      Author: Katiebird
 */

#include "FFmpegModule.h"
#include "../DSPPipe/DSPPipe.h"
#include "../WormMacro.h"
extern "C" {
#include "libavformat/metadata.h"
}

MusMessage FFmpegWrapper::Init()
{
    /* initialize libavcodec, and register all codecs and formats */
    av_register_all();

    m_psTmpBufferBase = (uint16_t *) av_malloc(AVCODEC_MAX_AUDIO_FRAME_SIZE +
    									   	   FF_INPUT_BUFFER_PADDING_SIZE + 
											   64);
	
	m_cstrMetaString = (char *) MALLOC(8192);
	m_iMetaAllocAmt = 8192;

	m_cstrTemp1 = (char *) MALLOC(2048);
	m_cstrTemp2 = (char *) MALLOC(2048);
	m_iTempAlloc = 2048;
	
#ifdef DEBUG
	m_psTmpBufferBase[((AVCODEC_MAX_AUDIO_FRAME_SIZE +
    						FF_INPUT_BUFFER_PADDING_SIZE)/2)+2] = 0xBAAD;
#endif
    return MUS_MOD_Success;
}

MusMessage FFmpegWrapper::Uninit()
{
	av_free(m_psTmpBufferBase);

    return MUS_MOD_Success;
}

// Fast Open function to allow the indexer to quickly open the file
//	and get the metadata it needs from it
int16_t FFmpegWrapper::PrepareMetadata(const char *cstrFileName)
{

	m_pFormatCtx = NULL;

	// Open audio file
	int err = av_open_input_file(&m_pFormatCtx, cstrFileName, NULL, 0, NULL);

	if(err != 0)
	{
		Close();
		return 0;
	}

	return 1;

}

MusMessage FFmpegWrapper::FindDecoder(const char *cstrFileName)
{
	//ReportError1("Open with FFmpeg File=%s", cstrFileName);

    // Open audio file
	int err = av_open_input_file(&m_pFormatCtx, cstrFileName, NULL, 0, NULL);

    if(err != 0)
    {
    	char cstrFFmpegError[1024];
    	char cstrErrBuf[1024] = "Error Opening Song:";

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

    // Get a pointer to the codec context for the music stream
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

	m_iSkipNextFrame = 0;

	if (Msg != MUS_MOD_Success)
		return Msg;

    // Inform the codec that we can handle truncated bitstreams -- i.e.,
    // bitstreams where frame boundaries can fall in the middle of packets
    if(m_pCodec->capabilities & CODEC_CAP_TRUNCATED)
    	m_pCodecCtx->flags |= CODEC_FLAG_TRUNCATED;

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
	if (m_iSongLength == 0)
	{
		err = av_read_frame(m_pFormatCtx, &m_avPacket);

		if ((err == AVERROR_EOF) || (url_feof(m_pFormatCtx->pb)))
			m_iSkipNextFrame = 2;
		else if (err == 0)
			m_iSkipNextFrame = 1;
		else
		{
			char cstrFFmpegError[128];
			char cstrErrBuf[256] = "Error reading frame:";

			av_strerror(err, cstrFFmpegError, sizeof(cstrFFmpegError));
			strcat(cstrErrBuf, cstrFFmpegError);

			MUS_ERROR(MUS_ERROR_LOAD_PROBLEM, cstrErrBuf);
			return MUS_MOD_Error;
		}
		
		m_iSongLength = m_pFormatCtx->duration / AV_TIME_BASE;
	}
	
    return MUS_MOD_Success;
}

int32_t FFmpegWrapper::GetSampleRate()
{
	if (m_pCodecCtx)
	{
		if (m_pCodecCtx->sample_rate)
		{
			return m_pCodecCtx->sample_rate;
		}
	}

	return 0;
};

MusMessage FFmpegWrapper::Close()
{
	// Close the codec
	if (m_pCodecCtx)
		avcodec_close(m_pCodecCtx);

	//ReportError1("About to close m_pFormatCtx which has val of %i", m_pFormatCtx);

	// Close the video file
	if (m_pFormatCtx)
	{
		av_close_input_file(m_pFormatCtx);
		m_pFormatCtx = NULL;

		//fake_avformat_free_context(m_pFormatCtx);
	}

	return MUS_MOD_Success;
}

uint32_t FFmpegWrapper::Seek(double time)
{
	if (m_pFormatCtx == 0)
		return -1;

	int err = av_seek_frame(m_pFormatCtx, -1, time * AV_TIME_BASE,
									AVSEEK_FLAG_ANY | AVSEEK_FLAG_BACKWARD);

	if ((err == AVERROR_EOF) || (url_feof(m_pFormatCtx->pb)))
		m_iSkipNextFrame = 2;
	else if (err == 0)
		m_iSkipNextFrame = 1;
	else
	{
		char cstrFFmpegError[256];
		char cstrErrBuf[512] = "Error reading frame:";

		av_strerror(err, cstrFFmpegError, sizeof(cstrFFmpegError));
		strcat(cstrErrBuf, cstrFFmpegError);

		MUS_ERROR(MUS_ERROR_LOAD_PROBLEM, cstrErrBuf);
		return MUS_MOD_Error;
	}

	m_iSkipNextFrame = av_read_frame(m_pFormatCtx, &m_avPacket);

	int64_t retVal = av_rescale(m_avPacket.pts,
						m_pFormatCtx->streams[m_iStreamID]->time_base.num,
						m_pFormatCtx->streams[m_iStreamID]->time_base.den);

	if (retVal >= 0)
		return (uint32_t) retVal;
	else
		return (uint32_t) (retVal * -1);

}


MusMessage FFmpegWrapper::GetNextPacket(void *pvPacket)
{
	//ReportError("Entering GetNextPacket");

	int32_t iCurRead = 0;
	
	SoundPacket *pspPacket = (SoundPacket *) pvPacket;

	int32_t iSize = AVCODEC_MAX_AUDIO_FRAME_SIZE +
					FF_INPUT_BUFFER_PADDING_SIZE +
					30;

	int err;
	
	if (m_iSkipNextFrame == 0)
		err = av_read_frame(m_pFormatCtx, &m_avPacket);

	pspPacket->CopyPacket(&m_avPacket, m_pFormatCtx->streams[m_iStreamID]);
	
	if ((err) || 
		(url_feof(m_pFormatCtx->pb)) || 
		(m_iSkipNextFrame == 2))
	{
		//ReportError1("err=%i", err);

		if ((err == AVERROR_EOF) || (url_feof(m_pFormatCtx->pb)))
		{
			char cstrFFmpegError[128];
			char cstrErrBuf[256] = "We have reached the end of file error:";

			av_strerror(err, cstrFFmpegError, sizeof(cstrFFmpegError));

			strcat(cstrErrBuf, cstrFFmpegError);

			MUS_ERROR(MUS_ERROR_LOAD_PROBLEM, cstrErrBuf);

			ReportError1("After EOF, size of packet is %i", m_avPacket.size);

			if (m_avPacket.size == 0)
			{

				if (m_avPacket.data != NULL)
					av_free_packet(&m_avPacket);

				return MUS_MOD_Done;
			}
			else
			{
				iSize = AVCODEC_MAX_AUDIO_FRAME_SIZE +
									FF_INPUT_BUFFER_PADDING_SIZE +
									4;

				int tmpErr = avcodec_decode_audio3(m_pCodecCtx,
												   (int16_t *) m_psTmpBufferBase,
												   &iSize,
												   &m_avPacket);
#ifdef DEBUG
				assert(m_psTmpBufferBase[((AVCODEC_MAX_AUDIO_FRAME_SIZE +
										FF_INPUT_BUFFER_PADDING_SIZE)/2)+2] == 0xBAAD);
#endif
												   
												   
												   
				ReportError3("Finished packet Decode, with an iSize of %i,"
						     "packet size %i, and tmpErr of %i",
						     iSize,
						     m_avPacket.size,
						     tmpErr);

				if (tmpErr > 0)
				{
					CircularBuffer *pcbBuf = 
								(CircularBuffer *) pspPacket->_Helper;
					
					pcbBuf->AddStereoPacket(pspPacket,
											(uint16_t *) m_psTmpBufferBase,
											iSize);
				}

				return MUS_MOD_Done;
			}
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

	//ReportError("Moving on to the decode stage");
	
	do
	{

		iSize = AVCODEC_MAX_AUDIO_FRAME_SIZE +
							FF_INPUT_BUFFER_PADDING_SIZE +
							40;

		int tmpErr = avcodec_decode_audio3(m_pCodecCtx, 
										   (int16_t *) m_psTmpBufferBase,
										   &iSize, 
										   &m_avPacket);

		/*ReportError3("Finished packet Decode, with an iSize of %i,"
				     "packet size %i, and tmpErr of %i",
				     iSize,
				     m_avPacket.size,
				     tmpErr);*/

		if (tmpErr <= 0)
		{
			ReportError1("tmpErr Val: %i", tmpErr);

			char cstrFFmpegError[128];
			char cstrErrBuf[256] = "Unable to decode:";

			av_strerror(tmpErr, cstrFFmpegError, sizeof(cstrFFmpegError));

			strcat(cstrErrBuf, cstrFFmpegError);

			MUS_ERROR(MUS_ERROR_LOAD_PROBLEM, cstrErrBuf);

			CircularBuffer *pcbBuf =
						(CircularBuffer *) pspPacket->_Helper;

			pcbBuf->AddStereoPacket(pspPacket,
								(uint16_t *) m_psTmpBufferBase,
								iSize);
			
			return MUS_MOD_Success;
		}

		iCurRead += tmpErr;

		CircularBuffer *pcbBuf = 
					(CircularBuffer *) pspPacket->_Helper;
		
		pcbBuf->AddStereoPacket(pspPacket,
								(uint16_t *) m_psTmpBufferBase,
								iSize);

	} while (iCurRead < m_avPacket.size);

	av_free_packet(&m_avPacket);

	//ReportError1("End GetNextPacket With NumWritten=%i", pspPacket->Size);

	return MUS_MOD_Success;
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
const char *FFmpegWrapper::GetMetadata()
{
	if (!m_pFormatCtx)
	{
		return NULL;
	}
	
	// keep track of how many characters we have in the string
	//	in case we need to realloc
	size_t	CurSize = 2;
	
	// variable to pass the metadata pairs to
	AVMetadataTag *tag=NULL;

	// add the starting bracket to the json
	sprintf(m_cstrMetaString,"{");

	int iActualData = 0;

	// iterate through the metadata
	while((tag=av_metadata_get(m_pFormatCtx->metadata, "", tag, AV_METADATA_IGNORE_SUFFIX)))
	{
		iActualData = 1;

		// first calculate the size of this metadata item
		//	remember to add a buffer to account for the quote marks 
		//	and colon used for the JSON item (we use 10 to be safe)
		size_t	tmpSize = SafeStringLen(tag->key) + SafeStringLen(tag->value) + 12;
		
		// Make sure we have enough room in our main JSON string
		CurSize += tmpSize;
		if (CurSize >= m_iMetaAllocAmt)
		{
			m_iMetaAllocAmt = CurSize + 1024;
			m_cstrMetaString = (char *) REALLOC(m_cstrMetaString, m_iMetaAllocAmt);
		}
		
		
		m_cstrTemp2 = ReallocSafeStringCopy(m_cstrTemp2, &m_iTempAlloc, tag->value);

		if (tmpSize + 20 > m_iTempAlloc)
		{
			m_iTempAlloc = tmpSize + 1024;
			m_cstrTemp1 = (char *) REALLOC(m_cstrTemp1, m_iTempAlloc);
			m_cstrTemp2 = (char *) REALLOC(m_cstrTemp2, m_iTempAlloc);
		}
		

		sprintf(m_cstrTemp1, " \"%s\":\"%s\",", tag->key, m_cstrTemp2);
		strcat(m_cstrMetaString, m_cstrTemp1);
	}
	
	if (iActualData)
	{
		char *cstrTmp = m_cstrMetaString;
		while((*cstrTmp) != '\0') cstrTmp++;
		cstrTmp--;
		*cstrTmp = '}';
	}
	else
		sprintf(m_cstrMetaString,"{}");

	return m_cstrMetaString;
}

/********************************************
 * GetMetadataLite()
 *
 * Create a JSON with only title and artist
 *
 * OUT
 *	JSON formatted string (its a javascript thing for those C people)
 *		You will need to delete this using free() rather than delete[].
 ********************************************/
const char *FFmpegWrapper::GetMetadataLite()
{
	ReportError("In Metadata Lite");

	if (!m_pFormatCtx)
	{
		return NULL;
	}

	// keep track of how many characters we have in the string
	//	in case we need to realloc
	size_t	CurSize = 2;

	// variable to pass the metadata pairs to
	AVMetadataTag *tag=NULL;

	// add the starting bracket to the json
	sprintf(m_cstrMetaString,"{");

	ReportError("About to get artist");

	tag=av_metadata_get(m_pFormatCtx->metadata, "artist", tag, AV_METADATA_IGNORE_SUFFIX);
	// first calculate the size of this metadata item
	//	remember to add a buffer to account for the quote marks
	//	and colon used for the JSON item (we use 10 to be safe)

	size_t	tmpSize;

	if (tag)
	{
		tmpSize = strlen("artist") + strlen(tag->value) + 12;

		// Make sure we have enough room in our main JSON string
		CurSize += tmpSize;
		if (CurSize >= m_iMetaAllocAmt)
		{
			m_iMetaAllocAmt = CurSize + 1024;
			m_cstrMetaString = (char *) REALLOC(m_cstrMetaString, m_iMetaAllocAmt);
		}


		m_cstrTemp2 = ReallocSafeStringCopy(m_cstrTemp2, &m_iTempAlloc, tag->value);

		if (tmpSize + 20 > m_iTempAlloc)
		{
			m_iTempAlloc = tmpSize + 1024;
			m_cstrTemp1 = (char *) REALLOC(m_cstrTemp1, m_iTempAlloc);
			m_cstrTemp2 = (char *) REALLOC(m_cstrTemp2, m_iTempAlloc);
		}

		sprintf(m_cstrTemp1, "\"artist\":\"%s\",", m_cstrTemp2);
	}
	else
		sprintf(m_cstrTemp1, "\"artist\":\"\",");

	strcat(m_cstrMetaString, m_cstrTemp1);

	ReportError("About to get title");

	tag = NULL;

	tag=av_metadata_get(m_pFormatCtx->metadata, "title", tag, AV_METADATA_IGNORE_SUFFIX);

	if (tag)
	{
		// first calculate the size of this metadata item
		//	remember to add a buffer to account for the quote marks
		//	and colon used for the JSON item (we use 10 to be safe)
		tmpSize = strlen("title") + strlen(tag->value) + 12;

		// Make sure we have enough room in our main JSON string
		CurSize += tmpSize;
		if (CurSize >= m_iMetaAllocAmt)
		{
			m_iMetaAllocAmt = CurSize + 1024;
			m_cstrMetaString = (char *) REALLOC(m_cstrMetaString, m_iMetaAllocAmt);
		}


		m_cstrTemp2 = ReallocSafeStringCopy(m_cstrTemp2, &m_iTempAlloc, tag->value);

		if (tmpSize + 20 > m_iTempAlloc)
		{
			m_iTempAlloc = tmpSize + 1024;
			m_cstrTemp1 = (char *) REALLOC(m_cstrTemp1, m_iTempAlloc);
			m_cstrTemp2 = (char *) REALLOC(m_cstrTemp2, m_iTempAlloc);
		}

		sprintf(m_cstrTemp1, " \"title\":\"%s\",", m_cstrTemp2);
	}
	else
		sprintf(m_cstrTemp1, "\"title\":\"\",");

	strcat(m_cstrMetaString, m_cstrTemp1);

	ReportError("About to get album");
	
	tag = NULL;

	tag=av_metadata_get(m_pFormatCtx->metadata, "album", tag, AV_METADATA_IGNORE_SUFFIX);

	if (tag)
	{
		// first calculate the size of this metadata item
		//	remember to add a buffer to account for the quote marks
		//	and colon used for the JSON item (we use 10 to be safe)
		tmpSize = strlen("album") + strlen(tag->value) + 12;

		// Make sure we have enough room in our main JSON string
		CurSize += tmpSize;
		if (CurSize >= m_iMetaAllocAmt)
		{
			m_iMetaAllocAmt = CurSize + 1024;
			m_cstrMetaString = (char *) REALLOC(m_cstrMetaString, m_iMetaAllocAmt);
		}


		m_cstrTemp2 = ReallocSafeStringCopy(m_cstrTemp2, &m_iTempAlloc, tag->value);

		if (tmpSize + 20 > m_iTempAlloc)
		{
			m_iTempAlloc = tmpSize + 1024;
			m_cstrTemp1 = (char *) REALLOC(m_cstrTemp1, m_iTempAlloc);
			m_cstrTemp2 = (char *) REALLOC(m_cstrTemp2, m_iTempAlloc);
		}

		sprintf(m_cstrTemp1, " \"album\":\"%s\",", m_cstrTemp2);
	}
	else
		sprintf(m_cstrTemp1, " \"album\":\"%s\",");

	strcat(m_cstrMetaString, m_cstrTemp1);
	
	char *cstrTmp = m_cstrMetaString;

	while((*cstrTmp) != '\0') cstrTmp++;
	cstrTmp--;
	*cstrTmp = '}';

	ReportError1("Out Metadata Lite: %s", m_cstrMetaString);

	return m_cstrMetaString;
}

/********************************
 *	GetValue()
 *
 *	Get a metadata value that matches the specified key
 ********************************/
const char *FFmpegWrapper::GetValue(const char *Key)
{
	// variable to pass the metadata pairs to
	AVMetadataTag *tag=NULL;

	//ReportError1("Getting Key %s", Key);

	tag = av_metadata_get(m_pFormatCtx->metadata, Key, tag, AV_METADATA_IGNORE_SUFFIX);

	if (tag == NULL)
		return NULL;

	return tag->value;
}
