/*
 * FFmpegModule.h
 *
 *  Created on: Jan 27, 2011
 *      Author: Katiebird
 */

#ifndef FFMPEGMODULE_H_
#define FFMPEGMODULE_H_

extern "C" {
#include "libavformat\avformat.h"
#include "libavcodec\avcodec.h"
}

#define MAX_PACKET_SIZE (AVCODEC_MAX_AUDIO_FRAME_SIZE + \
						 FF_INPUT_BUFFER_PADDING_SIZE)

#include "MusModule.h"

class FFmpegWrapper
{
private:

    AVFormatContext *m_pFormatCtx;
    AVCodecContext 	*m_pCodecCtx;
    int16_t			m_iStreamID;
    AVCodec 		*m_pCodec;

	AVPacket		m_avPacket;
	
	uint16_t		*m_psTmpBufferBase;
	
	int32_t			m_lRate;
	int32_t			m_iSkipNextFrame;
	int64_t			m_iSongLength;
	
	char			*m_cstrMetaString;
	int32_t			m_iMetaAllocAmt;
	
	char			*m_cstrTemp1;
	char			*m_cstrTemp2;
	int32_t			m_iTempAlloc;
	
    MusMessage FindDecoder(const char *cstrFileName);

public:
    FFmpegWrapper() {};


	MusMessage Init();
	MusMessage Uninit();
	MusMessage Open(const char *cstrFileName);
	MusMessage Close();
	MusMessage GetNextPacket(void *avpkt);
	uint32_t Seek(double);
	
	int16_t PrepareMetadata(const char *cstrFileName);
	const char *GetValue(const char *Name);
	const char *GetMetadata();
	
	int32_t GetSampleRate() {return m_lRate;};
	int64_t GetDuration() {return m_iSongLength;};
};

#endif /* FFMPEGMODULE_H_ */
