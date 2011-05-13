/* Simple implementation of Biquad filters -- Tom St Denis
*
* Based on the work

Cookbook formulae for audio EQ biquad filter coefficients
---------------------------------------------------------
by Robert Bristow-Johnson, pbjrbj@viconet.com  a.k.a. robert@audioheads.com

* Available on the web at

http://www.smartelectronix.com/musicdsp/text/filters005.txt

* Enjoy.
*
* This work is hereby placed in the public domain for all purposes, whether
* commercial, free [as in speech] or educational, etc.  Use the code and please
* give me credit if you wish.
*
* Tom St Denis -- http://tomstdenis.home.dhs.org*/

#include "config.h"

#ifndef GRAPHIC_EQ_H
#define GRAPHIC_EQ_H


#include <math.h>
#include <stdlib.h>
#include "MusFilter.h"

#ifndef M_LN2
#define M_LN2         0.69314718055994530942
#endif

#ifndef M_PI
#define M_PI            3.14159265358979323846
#endif


/* filter types */
enum EQ_FilterType {
   LPF, /* low pass filter */
   HPF, /* High pass filter */
   BPF, /* band pass filter */
   NOTCH, /* Notch Filter */
   PEQ, /* Peaking band EQ filter */
   LSH, /* Low shelf filter */
   HSH /* High shelf filter */
};

enum EQ_KNOBS {
	BASS,
	MID,
	TREBLE
};

// FIR Knob Coefficients
#define BASS_TAP_NUM			70
#define TREBLE_TAP_NUM			39
#define MID_TAP_NUM				50


#define FILTER_GAIN_SCALE		8

#define FILTER_GAIN_RANGE 		24
#define FILTER_GAIN_MIN			-12
#define FILTER_GAIN_STEP		1
#define NUM_EQ_FILTERS			3

#define L_H_PASS_Q_FACTOR 0.707 // this is the Q for butterworth

class BiQuadFilter
{
public:

	// All coefficients are normalized to a0
	int32_t m_a1, m_a2, m_b0, m_b1, m_b2;
	// feedback variables
	int32_t m_X1, m_X2, m_Y0, m_Y1, m_Y2;

	int32_t m_Scale;

public:
    void setPeakingEqualizer(double cf, double sf, double gain, double bw);
    void setBandPass(double cf, double sf, double resonance);
    void setLowShelf(double cf, double sf, double gain, double slope);
    void setHighShelf(double cf, double sf, double gain, double slope);
    void setLowPass(double cf, double sf, double gain, double slope);
    void setHighPass(double cf, double sf, double gain, double slope);
    void setCoefficients(double a0, double a1, double a2, double b0, double b1, double b2);
    void reset() {m_X1=m_X2=m_Y0=m_Y1=m_Y2=0.0;};
    int16_t process(int16_t x0);
};

class CascadingIIRFilter
{
private:
	BiQuadFilter 	m_pbqfFilterBank[2];
	
public:
	void setBandPass(double lcf, double hcf, double sf)
	{
		m_pbqfFilterBank[0].setLowPass(hcf, sf, 0, L_H_PASS_Q_FACTOR);
		m_pbqfFilterBank[1].setHighPass(lcf, sf, 0, L_H_PASS_Q_FACTOR);
	};
	
	int16_t process(int16_t x0) 
	{	
		x0 = m_pbqfFilterBank[0].process(x0);
		return m_pbqfFilterBank[1].process(x0);
	};
	
	void reset() {m_pbqfFilterBank[0].reset(); m_pbqfFilterBank[1].reset();};
};

class BassTrebleFilter
{
protected:

	// IIR Filter variables
	BiQuadFilter 		m_bqfIIRBassFilter[NUM_CHANNELS];
	BiQuadFilter		m_bqfIIRTrebleFilter[NUM_CHANNELS];
	CascadingIIRFilter	m_bqfIIRMidFilter[NUM_CHANNELS];
	
	// FIR Filter variables
	int16_t			m_psFIRBASSKnobCoef[BASS_TAP_NUM];
	int16_t			m_psFIRTREBKnobCoef[TREBLE_TAP_NUM];
	int16_t			m_psFIRMIDKnobCoef[MID_TAP_NUM];
	
	int16_t			m_sBassGain;
	int16_t			m_sTrebleGain;
	int16_t			m_sMidRangeGain;
	int16_t			m_sVol;

	/* Computes a BiQuad filter on a sample */
	void ProcessSampleIIR(int16_t *insample, int16_t *outsample,
										size_t Requested, int16_t iChan);

	void ProcessSampleFIR(int16_t *insample, int16_t *outsample,
										size_t Requested);

	/* sets up a BiQuad Filter */
	void SetIIRFilterCoef();
	void SetFIRFilterCoef();

public:

	FiltMessage Init();
	FiltMessage Close() {return FILT_Success;};
				
	void SetBass(float fBass);
	char *GetBass();
	
	void SetVol(float fBass);
	char *GetVol();

	void SetTreble(float fTreble);
	char *GetTreble();
	
	void SetMid(float fTreble);
	char *GetMid();
	
	void Reset();

	void Filter(int16_t *psChanIn, size_t uiStartPos, size_t *piNumRead,
								int16_t *pucOutBuffer, size_t pRequested);

};

#endif
