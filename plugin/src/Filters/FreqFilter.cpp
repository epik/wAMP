/* The floating point version of the IIR code is based on
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


#include "EQFilter.h"
#include <stdint.h>
#include <limits.h>
#include <stdio.h>
#include "../Messages.h"

#define BIQUAD_SCALE_VAL	INT_MAX
#define BIQUAD_SCALE_LOG	31
#define BIQUAD_Y_GUARD		10
#define BIQUAD_Y_SCALE		21
/*#define BIQUAD_SFACTOR_GUARD	20
#define BIQUAD_SFACTOR_SHIFT	11*/


#define MAX(a,b) ((a)<(b)?(b):(a))
#define ABS(a)	 ((a)<0 ?(-(a)):(a))

using namespace std;


void BassTrebleFilter::SetBass(float fBass)
{	
	//ReportError1("Bass Set=%f", fBass);
	m_sBassGain = (1<<FILTER_GAIN_SCALE) * fBass;
	//ReportError1("Bass Set(fixed)=%i", m_sBassGain);
};
char* BassTrebleFilter::GetBass() 
{
	char *str = (char *) malloc(10);
	sprintf(str, "%f",((float)m_sBassGain/(1<<FILTER_GAIN_SCALE)));
	return str;
};

void BassTrebleFilter::SetMid(float fMid)
{	
	//ReportError1("Bass Set=%f", fBass);
	m_sMidRangeGain = (1<<FILTER_GAIN_SCALE) * fMid;
	//ReportError1("Bass Set(fixed)=%i", m_sBassGain);
};
char* BassTrebleFilter::GetMid() 
{
	char *str = (char *) malloc(10);
	sprintf(str, "%f",((float)m_sMidRangeGain/(1<<FILTER_GAIN_SCALE)));
	return str;
};

void BassTrebleFilter::SetVol(float fBass)
{
	//ReportError1("Bass Set=%f", fBass);
	m_sVol = ((1<<10)*0.85) * fBass;
	//ReportError1("Bass Set(fixed)=%i", m_sBassGain);
};
char* BassTrebleFilter::GetVol()
{
	char *str = (char *) malloc(10);
	sprintf(str, "%f",((float)m_sBassGain/(1<<FILTER_GAIN_SCALE)));
	return str;
};

void BassTrebleFilter::SetTreble(float fTreble)
{
	//ReportError1("Treble Set=%f", fTreble);
	m_sTrebleGain = (1<<FILTER_GAIN_SCALE) * fTreble;
	//ReportError1("Treble Set(fixed)=%i", m_sTrebleGain);
}
char* BassTrebleFilter::GetTreble() 
{
	char *str = (char *) malloc(10);
	sprintf(str, "%f",((float)m_sTrebleGain/(1<<FILTER_GAIN_SCALE)));
	return str;
};


//*****************************
// END Callback
//*****************************/

FiltMessage BassTrebleFilter::Init()
{
	SetIIRFilterCoef();
	
	SetBass(1.0);
	SetMid(1.0);
	SetTreble(1.0);
	SetVol(1.0);

	return FILT_Success;
}


void BassTrebleFilter::Filter(int16_t *psChanIn, size_t uiStartPos,
						size_t *piNumRead, int16_t *pucOutBuffer, 
						size_t pRequested)
{
	int16_t *psChan0 = (int16_t *) &psChanIn[uiStartPos];
	
	ProcessSampleIIR(psChan0, pucOutBuffer, pRequested, 0);
}


void BassTrebleFilter::Reset()
{
	for (int i=0; i<NUM_CHANNELS;i++)
	{
		m_bqfIIRBassFilter[i].reset();
		m_bqfIIRTrebleFilter[i].reset();
		m_bqfIIRMidFilter[i].reset();
	}
}
	
void BassTrebleFilter::ProcessSampleFIR(int16_t *insample, int16_t *outsample,
										size_t Requested)
{
	int64_t	lAccum;
	int16_t *psFiltCoef, *p_z;
	int16_t *outpos = outsample;
	int32_t iResult;

	while (outpos < (outsample + Requested))
	{

		/* calculate the filter */
		psFiltCoef = m_psFIRBASSKnobCoef;
		p_z = insample;
		lAccum = 0;
		for (int j = 0; j < BASS_TAP_NUM; j++) {
			lAccum += *psFiltCoef++ * *p_z--;
		}

		lAccum *= m_sBassGain;
		// note we need to convert from both the original Q16
		//	multiplication and the Q8 bass gain.
		lAccum >>= 24;
		iResult = lAccum;

		psFiltCoef = m_psFIRMIDKnobCoef;
		p_z = insample;
		lAccum = 0;
		for (int j = 0; j < MID_TAP_NUM; j++) {
			lAccum += *psFiltCoef++ * *p_z--;
		}

		// no adjustment for midrange
		lAccum >>= 16;		
		iResult += lAccum;

		psFiltCoef = m_psFIRTREBKnobCoef;
		p_z = insample++;
		lAccum = 0;
		for (int j = 0; j < TREBLE_TAP_NUM; j++) {
			lAccum += *psFiltCoef++ * *p_z--;
		}

		lAccum *= m_sTrebleGain;
		// note we need to convert from both the original Q16
		//	multiplication and the Q8 treble gain.
		lAccum >>= 24;

		iResult += lAccum;

		if (iResult > SHRT_MAX)
		{
			iResult = SHRT_MAX;
		}
		else if (iResult < SHRT_MIN)
		{
			iResult = SHRT_MIN;
		}

		*outpos = (short) iResult;
		outpos++;
	}
}


/* Computes a BiQuad filter on a sample */
void BassTrebleFilter::ProcessSampleIIR(int16_t *insample, int16_t *outsample,
										size_t Requested, int16_t iChan)
{
	int16_t *outpos = outsample;
	int16_t sample;
	int32_t iResult;
	int32_t iTemp;


	while (outpos < (outsample + Requested))
	{	
		sample = *insample++;

		iTemp = m_bqfIIRBassFilter[iChan].process(sample) * m_sBassGain;
		iResult = iTemp >> FILTER_GAIN_SCALE;


		iTemp = m_bqfIIRTrebleFilter[iChan].process(sample) * m_sTrebleGain;
		iResult += iTemp >> FILTER_GAIN_SCALE;


		iTemp = m_bqfIIRMidFilter[iChan].process(sample) * m_sMidRangeGain;
		iResult += iTemp >> FILTER_GAIN_SCALE;

		iResult *= m_sVol;
		iResult >>= 10;


		*outpos = (int16_t) iResult;
		outpos++;
	}
}


/* sets up a BiQuad Filter */
/* Note on Q values
Biquad low-pass and high-pass filters: For a low-pass filter, the
  significant Q values are Q=0.5, which is the maximum value to give no
  overshoot in the time response, and Q=0.707, which gives the most
  flat-topped frequency response without having a resonance 'lip'.

Biquad band-pass, band-stop, all-pass and peaking filters: For these,
  larger Q values are good -- try up to Q=10 or more.  The peaking
  filter is designed to emphasise a frequency range.  The second value
  in this case is the peak gain in dB.  For example: PkBq1/3/10/0.1

Biquad audio shelving filters: These use a 'shelf slope' parameter
  instead of Q.  S=1 gives the steepest slope without a lip, and lower
  values give lower values of slope.  The second parameter is the gain
  in the affected area in dB.
  */

void BassTrebleFilter::SetIIRFilterCoef( )
{
	for (int i=0;i<NUM_CHANNELS;i++)
	{
		// First set the low pass filter
		m_bqfIIRBassFilter[i].setLowPass(200, DEST_FREQ, 0, L_H_PASS_Q_FACTOR);
		// Next set the high pass filter
		m_bqfIIRTrebleFilter[i].setHighPass(6000, DEST_FREQ, 0, L_H_PASS_Q_FACTOR);
		// Finally set set the bandpass
		m_bqfIIRMidFilter[i].setBandPass(400,3000, DEST_FREQ);
	}
}

// This sets the coeficients for the FIR filter
//	The Coeficients were calculated offline to get
//	the best response curve with the lowest number of taps
//	The hard part is to get a good clean bass from this.
// Current Filter Qualities
//	LPF - Rolloff goes from 80-800
//	BPF - Rolloff from 80-800 and 5000-5720
void BassTrebleFilter::SetFIRFilterCoef( )
{
	double h[150];


	// Do Low Pass filter first
	h[  0] =  0.015946168;
	h[  1] =  0.003568981;
	h[  2] =  0.003954978;
	h[  3] =  0.004351430;
	h[  4] =  0.004766572;
	h[  5] =  0.005188480;
	h[  6] =  0.005623959;
	h[  7] =  0.006059372;
	h[  8] =  0.006506917;
	h[  9] =  0.006955960;
	h[ 10] =  0.007423483;
	h[ 11] =  0.007890286;
	h[ 12] =  0.008362933;
	h[ 13] =  0.008799316;
	h[ 14] =  0.009275763;
	h[ 15] =  0.009732156;
	h[ 16] =  0.010172217;
	h[ 17] =  0.010616270;
	h[ 18] =  0.011037969;
	h[ 19] =  0.011452295;
	h[ 20] =  0.011848512;
	h[ 21] =  0.012231448;
	h[ 22] =  0.012594035;
	h[ 23] =  0.012935996;
	h[ 24] =  0.013253175;
	h[ 25] =  0.013547875;
	h[ 26] =  0.013822562;
	h[ 27] =  0.014063533;
	h[ 28] =  0.014278268;
	h[ 29] =  0.014467672;
	h[ 30] =  0.014620790;
	h[ 31] =  0.014749736;
	h[ 32] =  0.014844018;
	h[ 33] =  0.014907623;
	h[ 34] =  0.014939233;
	h[ 35] =  0.014939233;
	h[ 36] =  0.014907623;
	h[ 37] =  0.014844018;
	h[ 38] =  0.014749736;
	h[ 39] =  0.014620790;
	h[ 40] =  0.014467672;
	h[ 41] =  0.014278268;
	h[ 42] =  0.014063533;
	h[ 43] =  0.013822562;
	h[ 44] =  0.013547875;
	h[ 45] =  0.013253175;
	h[ 46] =  0.012935996;
	h[ 47] =  0.012594035;
	h[ 48] =  0.012231448;
	h[ 49] =  0.011848512;
	h[ 50] =  0.011452295;
	h[ 51] =  0.011037969;
	h[ 52] =  0.010616270;
	h[ 53] =  0.010172217;
	h[ 54] =  0.009732156;
	h[ 55] =  0.009275763;
	h[ 56] =  0.008799316;
	h[ 57] =  0.008362933;
	h[ 58] =  0.007890286;
	h[ 59] =  0.007423483;
	h[ 60] =  0.006955960;
	h[ 61] =  0.006506917;
	h[ 62] =  0.006059372;
	h[ 63] =  0.005623959;
	h[ 64] =  0.005188480;
	h[ 65] =  0.004766572;
	h[ 66] =  0.004351430;
	h[ 67] =  0.003954978;
	h[ 68] =  0.003568981;
	h[ 69] =  0.015946168;

	for(int i=0; i<BASS_TAP_NUM; i++)
	{
		m_psFIRBASSKnobCoef[i] = SHRT_MAX * h[i];
	}

	// Mid Range
	h[  0] = -0.017977752;
	h[  1] = -0.007961948;
	h[  2] = -0.004079698;
	h[  3] =  0.002345580;
	h[  4] =  0.007615520;
	h[  5] =  0.007220148;
	h[  6] = -0.001793913;
	h[  7] = -0.018816324;
	h[  8] = -0.039033361;
	h[  9] = -0.054991562;
	h[ 10] = -0.059565464;
	h[ 11] = -0.049764499;
	h[ 12] = -0.028825353;
	h[ 13] = -0.005637206;
	h[ 14] =  0.008642947;
	h[ 15] =  0.005880084;
	h[ 16] = -0.014565873;
	h[ 17] = -0.044130261;
	h[ 18] = -0.067575238;
	h[ 19] = -0.068873064;
	h[ 20] = -0.038362658;
	h[ 21] =  0.022075343;
	h[ 22] =  0.098331964;
	h[ 23] =  0.168368420;
	h[ 24] =  0.210200182;
	h[ 25] =  0.210200182;
	h[ 26] =  0.168368420;
	h[ 27] =  0.098331964;
	h[ 28] =  0.022075343;
	h[ 29] = -0.038362658;
	h[ 30] = -0.068873064;
	h[ 31] = -0.067575238;
	h[ 32] = -0.044130261;
	h[ 33] = -0.014565873;
	h[ 34] =  0.005880084;
	h[ 35] =  0.008642947;
	h[ 36] = -0.005637206;
	h[ 37] = -0.028825353;
	h[ 38] = -0.049764499;
	h[ 39] = -0.059565464;
	h[ 40] = -0.054991562;
	h[ 41] = -0.039033361;
	h[ 42] = -0.018816324;
	h[ 43] = -0.001793913;
	h[ 44] =  0.007220148;
	h[ 45] =  0.007615520;
	h[ 46] =  0.002345580;
	h[ 47] = -0.004079698;
	h[ 48] = -0.007961948;
	h[ 49] = -0.017977752;

	for(int i=0; i<MID_TAP_NUM; i++)
	{
		m_psFIRMIDKnobCoef[i] = SHRT_MAX * h[i];
	}

	// High Pass Filter
	h[  0] =  0.090202282;
	h[  1] = -0.103120506;
	h[  2] = -0.034365487;
	h[  3] =  0.007947852;
	h[  4] =  0.027789776;
	h[  5] =  0.028766965;
	h[  6] =  0.014457359;
	h[  7] = -0.007371041;
	h[  8] = -0.027214665;
	h[  9] = -0.034630217;
	h[ 10] = -0.023382573;
	h[ 11] =  0.003581974;
	h[ 12] =  0.034765133;
	h[ 13] =  0.052865222;
	h[ 14] =  0.042012831;
	h[ 15] = -0.004126802;
	h[ 16] = -0.078164725;
	h[ 17] = -0.159718983;
	h[ 18] = -0.223050925;
	h[ 19] =  0.753046831;
	h[ 20] = -0.223050925;
	h[ 21] = -0.159718983;
	h[ 22] = -0.078164725;
	h[ 23] = -0.004126802;
	h[ 24] =  0.042012831;
	h[ 25] =  0.052865222;
	h[ 26] =  0.034765133;
	h[ 27] =  0.003581974;
	h[ 28] = -0.023382573;
	h[ 29] = -0.034630217;
	h[ 30] = -0.027214665;
	h[ 31] = -0.007371041;
	h[ 32] =  0.014457359;
	h[ 33] =  0.028766965;
	h[ 34] =  0.027789776;
	h[ 35] =  0.007947852;
	h[ 36] = -0.034365487;
	h[ 37] = -0.103120506;
	h[ 38] =  0.090202282;

	for(int i=0; i<TREBLE_TAP_NUM; i++)
	{
		m_psFIRTREBKnobCoef[i] = SHRT_MAX * h[i];
	}
}


/***************************************************************************
 * Biquad                                                                  *
 ***************************************************************************/

void BiQuadFilter::setCoefficients(double a0, double a1, double a2, double b0, double b1, double b2)
{
	double	aNorm = 1.0/a0;	 //Normalize the filter coefficients by a0
	b0 *= aNorm;
	b1 *= aNorm;
	b2 *= aNorm;
	a1 *= aNorm;
	a2 *= aNorm;

	/*aNorm = ABS(b0);
	aNorm = MAX(aNorm,ABS(b1));
	aNorm = MAX(aNorm,ABS(b2));
	aNorm = MAX(aNorm,ABS(a1));
	aNorm = MAX(aNorm,ABS(a2));

	m_Scale = aNorm * (1<<29);

	int32_t iScale = BIQUAD_SCALE_VAL/(double)aNorm;*/
	
	int32_t iScale = BIQUAD_SCALE_VAL/2;

	m_a1 = iScale * -a1;
	m_a2 = iScale * -a2;
	m_b0 = iScale * b0;
	m_b1 = iScale * b1;
	m_b2 = iScale * b2;
}

// The Q factor for low pass filters are not really relevant, so it should be
//	set at either .5 or .707 depending on how flat you want the response
void BiQuadFilter::setLowPass(double corner_frequency, double sampling_frequency, double db_gain, double QFactor)
{
    double w0 = 2 * (double) M_PI * corner_frequency / sampling_frequency;
    double alpha = sinf(w0)/(2 * QFactor);

	double b0 =  (1 - cos(w0))/2;
	double b1 =   1 - cos(w0);
	double b2 =  (1 - cos(w0))/2;
	double a0 =   1 + alpha;
	double a1 =  -2*cos(w0);
	double a2 =   1 - alpha;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}

// The Q factor for high pass filters are not really relevant, so it should be
//	set at either .5 or .707 depending on how flat you want the response
void BiQuadFilter::setHighPass(double corner_frequency, double sampling_frequency, double db_gain, double QFactor)
{
    double w0 = 2 * (double) M_PI * corner_frequency / sampling_frequency;
    double alpha = sinf(w0)/(2 * QFactor);

	double b0 =  (1 + cos(w0))/2;
	double b1 = -(1 + cos(w0));
	double b2 =  (1 + cos(w0))/2;
	double a0 =   1 + alpha;
	double a1 =  -2*cos(w0);
	double a2 =   1 - alpha;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}

/*
 * Peaking equalizer, low shelf and high shelf are taken from
 * the good old Audio EQ Cookbook by Robert Bristow-Johnson.
 */
void BiQuadFilter::setPeakingEqualizer(double center_frequency, double sampling_frequency, double db_gain, double bandwidth)
{
    double w0 = 2 * (double) M_PI * center_frequency / sampling_frequency;
    double A = powf(10, db_gain/40);

    double alpha = sinf(w0)/2 * sinhf( logf(2)/2 * bandwidth * w0/sinf(w0) );
    double b0 =   1 + alpha*A;
    double b1 =  -2*cosf(w0);
    double b2 =   1 - alpha*A;
    double a0 =   1 + alpha/A;
    double a1 =  -2*cosf(w0);
    double a2 =   1 - alpha/A;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void BiQuadFilter::setLowShelf(double corner_frequency, double sampling_frequency, double db_gain, double slope)
{
    double w0 = 2 * (double) M_PI * corner_frequency / sampling_frequency;
    double A = powf(10, db_gain/40);
    double alpha = sinf(w0)/2 * sqrtf( (A + 1/A)*(1/slope - 1) + 2 );

    double b0 =    A*( (A+1) - (A-1)*cosf(w0) + 2*sqrtf(A)*alpha );
    double b1 =  2*A*( (A-1) - (A+1)*cosf(w0)                   );
    double b2 =    A*( (A+1) - (A-1)*cosf(w0) - 2*sqrtf(A)*alpha );
    double a0 =        (A+1) + (A-1)*cosf(w0) + 2*sqrtf(A)*alpha  ;
    double a1 =   -2*( (A-1) + (A+1)*cosf(w0)                   );
    double a2 =        (A+1) + (A-1)*cosf(w0) - 2*sqrtf(A)*alpha  ;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}

void BiQuadFilter::setHighShelf(double corner_frequency, double sampling_frequency, double db_gain, double slope)
{
    double w0 = 2 * (double) M_PI * corner_frequency / sampling_frequency;
    double A = powf(10, db_gain/40);
    double alpha = sinf(w0)/2 * sqrtf( (A + 1/A)*(1/slope - 1) + 2 );

    double b0 =    A*( (A+1) + (A-1)*cosf(w0) + 2*sqrtf(A)*alpha );
    double b1 = -2*A*( (A-1) + (A+1)*cosf(w0)                   );
    double b2 =    A*( (A+1) + (A-1)*cosf(w0) - 2*sqrtf(A)*alpha );
    double a0 =        (A+1) - (A-1)*cosf(w0) + 2*sqrtf(A)*alpha  ;
    double a1 =    2*( (A-1) - (A+1)*cosf(w0)                   );
    double a2 =        (A+1) - (A-1)*cosf(w0) - 2*sqrtf(A)*alpha  ;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}


void BiQuadFilter::setBandPass(double center_frequency, double sampling_frequency, double resonance)
{
    double w0 = 2 * (double) M_PI * center_frequency / sampling_frequency;
    double alpha = sinf(w0) / (2*resonance);

    double b0 =   sinf(w0)/2;
    double b1 =   0;
    double b2 =  -sinf(w0)/2;
    double a0 =   1 + alpha;
    double a1 =  -2*cosf(w0);
    double a2 =   1 - alpha;

    setCoefficients(a0, a1, a2, b0, b1, b2);
}

inline int16_t BiQuadFilter::process(int16_t inSamp)
{
	int x0 = inSamp;

	int64_t temp;

	int32_t y0;

	// we scale the Y variables to a different fixed point
	//	base then the X variables to give a bit of added
	//	precision.  This is only partially needed, so if
	//	speed becomes an issue, a first step would be to
	//	make Y the same base as X
	temp = (int64_t) m_a1 * m_Y1;
	temp += (int64_t) m_a2 * m_Y2;
	temp += (int64_t) 1<<9;
	temp >>= BIQUAD_Y_GUARD;

	temp += (int64_t) m_b0 * x0;
	temp += (int64_t) m_b1 * m_X1;
	temp += (int64_t) m_b2 * m_X2;


	temp += (int64_t) (1<<20);
	temp >>= (BIQUAD_Y_SCALE-1);
	y0 = temp;

	
    m_X2 = m_X1;
    m_X1 = x0;

    m_Y2 = m_Y1;
    m_Y1 = y0;

    y0 += 1<<(BIQUAD_Y_GUARD-1);
    y0 >>= BIQUAD_Y_GUARD;
    if (y0 > SHRT_MAX) y0 = SHRT_MAX;
	if (y0 < SHRT_MIN) y0 = SHRT_MIN;

    return y0;
}

