/*
 * GraphEQ.h
 *
 *  Created on: May 16, 2011
 *      Author: Katiebird
 */

#ifndef GRAPHEQ_H_
#define GRAPHEQ_H_

#include "EQFilter.h"

#define TOTAL_EQ_NUM  (NUM_MID_EQ_FILT + 2)
#define EQ_GAIN_Q		7

class GraphEQ
{
protected:

	// IIR Filter variables
	BiQuadFilter 		m_bqfIIRBassFilter[NUM_CHANNELS];
	BiQuadFilter		m_bqfIIRTrebleFilter[NUM_CHANNELS];
	CascadingIIRFilter	m_bqfIIRMidFilter[NUM_CHANNELS][NUM_MID_EQ_FILT];



	int16_t		m_sEQGain[TOTAL_EQ_NUM];


	/* Computes a BiQuad filter on a sample */
	void ProcessSampleIIR(int16_t *insample, int16_t *outsample,
										size_t Requested, int16_t iChan);

	/* sets up a BiQuad Filter */
	void SetIIRFilterCoef();

public:

	FiltMessage Init() {return FILT_Success;};
	FiltMessage Close() {return FILT_Success;};

	void SetEQVals(const char *Vals);

	void Reset() {};

	void Filter(int16_t *psChanIn, size_t uiStartPos, size_t *piNumRead,
								int16_t *pucOutBuffer, size_t pRequested);

};

#endif /* GRAPHEQ_H_ */
