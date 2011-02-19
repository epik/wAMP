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

#include "MusModule.h"

class FFmpegWrapper: public MusModule
{
private:

    AVFormatContext *m_pFormatCtx;
    AVCodecContext 	*m_pCodecCtx;
    int16_t			m_iStreamID;
    AVCodec 		*m_pCodec;

    AVPacket 		m_packet;

    size_t			m_iSongLength;

    int16_t			*m_psTmpBufferBase;
    int16_t			*m_psOverFlowBuffer;
    int32_t			m_iOverFlowSize;

    MusMessage		m_mmBufferedState;

    MusMessage FindDecoder(const char *cstrFileName);

public:
    FFmpegWrapper() {};


	MusMessage Init();
	MusMessage Uninit();
	MusMessage Open(const char *cstrFileName);
	MusMessage Close();
	MusMessage FillBuffWithRawSong(uint8_t *piBuffToFill,
													size_t *plNumBytesWritten);
	size_t GetSeconds() {return m_iSongLength;};

	int16_t IsType(const char *cstrFileName, size_t iPos=0);

	int64_t Seek(double);
	
	char *GetMetadata();
};

#endif /* FFMPEGMODULE_H_ */
