/*
 * musmodule.h
 *
 *  Created on: Aug 17, 2010
 *      Author: Katiebird
 */
/*
#include "config.h"

#ifndef FLAC_MODULE_H_
#define FLAC_MODULE_H_

#include "../WormDebug.h"
#include "MusModule.h"
#include "../../include/FLAC++/decoder.h"


class FLACWrapper: public MusModule, public FLAC::Decoder::File 
{
private:
	int16_t 	*m_piBuffToFill;
	size_t		*m_plNumWritten;
	int16_t		*m_piOverFlowBuffer;
	int32_t 	m_iOverFlowSize;
	int16_t 	*m_piOFBufferRoot;
	MusMessage 	m_mmBufferedState;

public:
	FLACWrapper() {};


	MusMessage Init() {return MUS_MOD_Success;};
	MusMessage Uninit() {return MUS_MOD_Success;};
	MusMessage Open(const char *cstrFileName);
	MusMessage Close();
	MusMessage FillBuffWithRawSong(uint8_t *piBuffToFill,
													size_t *plNumBytesWritten);
	size_t GetSeconds() {return (get_total_samples()/44100);};

	int16_t IsType(const char *cstrFileName, size_t iPos);

	int64_t Seek(double);


	
protected:

	virtual ::FLAC__StreamDecoderWriteStatus write_callback(
										const ::FLAC__Frame *frame,
										const FLAC__int32 * const buffer[]);
	virtual void metadata_callback(const ::FLAC__StreamMetadata *metadata);
	virtual void error_callback(::FLAC__StreamDecoderErrorStatus status);
};



#endif /* MUSMODULE_H_ */
