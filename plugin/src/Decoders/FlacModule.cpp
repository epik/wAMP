/*
 * mpgmodule.cpp
 *
 *  Created on: Aug 17, 2010
 *      Author: Katiebird
 */
/*
#include "FlacModule.h"
#include "../WormDebug.h"
#include <cstring>

MusMessage FLACWrapper::Open(const char *cstrFileName)
{
	FLAC__StreamDecoderInitStatus init_status = init(cstrFileName);
	if (init_status != FLAC__STREAM_DECODER_INIT_STATUS_OK)
	{
		ReportError1("ERROR: initializing decoder: %s", 
							FLAC__StreamDecoderInitStatusString[init_status]);
		return MUS_MOD_Error;
	}
	
	process_until_end_of_metadata ();

	m_iOverFlowSize = 0;
	m_mmBufferedState = MUS_MOD_Success;
	
	return MUS_MOD_Success;
};

MusMessage FLACWrapper::Close()
{
	finish();

	return MUS_MOD_Success;
};


/* This fills a buffer (piBuffToFill) with bytes from the file, and puts the number of
 * bytes written to plNumBytesWritten.
 *//*
MusMessage FLACWrapper::FillBuffWithRawSong(uint8_t *piBuffToFill, size_t *plNumBytesWritten)
{	
	if (m_iOverFlowSize > 0)
	{	
		if (m_iOverFlowSize > (GetBufferSize()/2))
		{
			// iOverFlow is in int16_t units, GetBufferSize is in int8_t units
			m_iOverFlowSize -= GetBufferSize()/2;
			//ReportError1("\tOverflowSize=%i", m_iOverFlowSize);
			memcpy(piBuffToFill, m_piOverFlowBuffer, GetBufferSize());
			m_piOverFlowBuffer += GetBufferSize()/2;
			(*plNumBytesWritten) = GetBufferSize();
			return MUS_MOD_Success;
		}
		else
		{
			memcpy(piBuffToFill, m_piOverFlowBuffer, m_iOverFlowSize*2);
			piBuffToFill += m_iOverFlowSize;
			(*plNumBytesWritten) = m_iOverFlowSize*2;
			m_iOverFlowSize = 0;
			delete[] m_piOFBufferRoot;
			if (m_mmBufferedState == MUS_MOD_Done)
				return MUS_MOD_Done;
			if ((*plNumBytesWritten) == (size_t) GetBufferSize())
				return MUS_MOD_Success;
		}
	}
	else
	{
		(*plNumBytesWritten) = 0;
	}

	//ReportError1("NumBytesWritten=%i", *plNumBytesWritten);

	m_piBuffToFill = (int16_t *) piBuffToFill;
	m_plNumWritten = plNumBytesWritten;
	
	while ((*m_plNumWritten) < (uint32_t) GetBufferSize())
	{
		process_single();

		if (get_state() == FLAC__STREAM_DECODER_END_OF_STREAM)
		{
			if (m_iOverFlowSize)
			{
				m_mmBufferedState = MUS_MOD_Done;
				return MUS_MOD_Success;
			}
			else
			{
				return MUS_MOD_Done;
			}
		}
	
	}

	return MUS_MOD_Success;
}

int16_t	FLACWrapper::IsType(const char *cstrFileName, size_t iPos)
{
	if ((iPos - 5) < 0)
		return 0;

	cstrFileName += (iPos - 5);

	if ((cstrFileName[0] ==  '.') &&
		((cstrFileName[1] == 'f') || (cstrFileName[1] == 'F')) &&
		((cstrFileName[2] == 'l') || (cstrFileName[2] == 'L')) &&
		((cstrFileName[3] == 'a') || (cstrFileName[3] == 'A')) &&
		((cstrFileName[4] == 'c') || (cstrFileName[4] == 'C')))
	{
		return 1;
	}
	else
		return 0;
}

int64_t FLACWrapper::Seek(double Pos)
{
	return MUS_MOD_Success;
}

void FLACWrapper::error_callback(::FLAC__StreamDecoderErrorStatus status)
{
	ReportError1("Got error callback: %s", FLAC__StreamDecoderErrorStatusString[status]);
}

::FLAC__StreamDecoderWriteStatus FLACWrapper::write_callback(const ::FLAC__Frame *frame, const FLAC__int32 * const buffer[])
{
	size_t lFrameSize = frame->header.blocksize * 4;

	if (((*m_plNumWritten) + lFrameSize) > (uint32_t) GetBufferSize())
	{

		size_t lOverFlowSize = ((*m_plNumWritten) + lFrameSize) - GetBufferSize();
		m_piOFBufferRoot = new int16_t[(lOverFlowSize/2)];
		
		lFrameSize = GetBufferSize() - (*m_plNumWritten);
		lFrameSize /= 4;

		for (size_t i=0; i<lFrameSize;i++)
		{
			*(m_piBuffToFill++) = buffer[0][i];
			*(m_piBuffToFill++) = buffer[1][i];
		}

		(*m_plNumWritten) += lFrameSize*4;

		m_piOverFlowBuffer = m_piOFBufferRoot;
		

		for (size_t i=lFrameSize; i<frame->header.blocksize;i++)
		{
			*(m_piOverFlowBuffer++) = buffer[0][i];
			*(m_piOverFlowBuffer++) = buffer[1][i];
		}
		
		m_iOverFlowSize = frame->header.blocksize - lFrameSize;

		m_iOverFlowSize *= 2;

		m_piOverFlowBuffer = m_piOFBufferRoot;
	}
	else
	{
		for (size_t i=0; i<frame->header.blocksize;i++)
		{
			*(m_piBuffToFill++) = buffer[0][i];
			*(m_piBuffToFill++) = buffer[1][i];
		}
		
		(*m_plNumWritten) += lFrameSize;
	}

	return FLAC__STREAM_DECODER_WRITE_STATUS_CONTINUE;
}

void FLACWrapper::metadata_callback(const ::FLAC__StreamMetadata *metadata)
{
	if(metadata->type == FLAC__METADATA_TYPE_STREAMINFO)
	{
		SetSampleRate(metadata->data.stream_info.sample_rate);
	}
}*/
