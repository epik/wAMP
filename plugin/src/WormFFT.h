/*
 * WormFFT.h
 *
 *  Created on: Aug 13, 2011
 *      Author: Katiebird
 */

#ifndef WORMFFT_H_
#define WORMFFT_H_

#include "config.h"
#include "WormDebug.h"

#include <stdint.h>
#include <stdarg.h>

#define fixed short

// This defines the size of the FFT we use to break the spectrum
//	down
#define FFT_DECOMP_SIZE 	256
#define FFT_DECOMP_N		8	// 2^FFT_DECOMP_N ==  FFT_DECOMP_SIZE

#define MAG_HIS_LEN			256
#define MAG_HIS_N			8

// This defines how much history we retain to detect the beat
#define BEAT_HIST_LEN		8
#define BEAT_HIST_N			3	// 2^BEAT_HIST_N ==  BEAT_HIST_LEN

// Only check the lower frequency bins
#define BIN_CHECK_NUM		6

extern int fix_fft(fixed fr[], fixed fi[], int m, int inverse);

class BPMDetect
{
private:

	int8_t	m_psHistory[BIN_CHECK_NUM][BEAT_HIST_LEN];
	int8_t	m_pcFreqMag[FFT_DECOMP_SIZE/2 + 4];
	int8_t	m_pcAvgMag[MAG_HIS_LEN];
	int8_t	m_pcAvgMagToStr[MAG_HIS_LEN + 4];
	uint16_t m_pcCurMagWPos;
	int16_t m_iCurHisBin;
	int16_t m_iValid;
	
public:

	static int16_t m_iSquareTable[100];

	void Init()
	{
		for (int i=0; i<BIN_CHECK_NUM; i++)
		{
			memset(m_psHistory, 0, BEAT_HIST_LEN);
		}

		memset(m_pcFreqMag, 1, FFT_DECOMP_SIZE/2);
		memset(m_pcAvgMag, 1, MAG_HIS_LEN);
		memset(m_pcAvgMagToStr, 1, MAG_HIS_LEN);

		m_pcFreqMag[FFT_DECOMP_SIZE/2] = 0;
		m_pcFreqMag[FFT_DECOMP_SIZE/2 + 1] = 0;

		m_pcAvgMagToStr[MAG_HIS_LEN] = 0;
		m_pcAvgMagToStr[MAG_HIS_LEN + 1] = 0;

		m_iCurHisBin = 0;
		m_pcCurMagWPos = 0;
		m_iValid = 0;
	};

	int8_t *GetFrqMagArray() { return m_pcFreqMag;};
	int8_t *GetAvgMagArray()
	{
		for (int i=0; i<MAG_HIS_LEN; i++)
		{
			int pos = (m_pcCurMagWPos + i) % MAG_HIS_LEN;
			m_pcAvgMagToStr[i] = m_pcAvgMag[pos];
		}

		return m_pcAvgMagToStr;
	};

	int32_t DetectBeat(fixed *real);
};


#endif /* WORMFFT_H_ */
