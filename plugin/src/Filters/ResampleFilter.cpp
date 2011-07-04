/*
 * MusFilter.cpp
 *
 *  Created on: Aug 21, 2010
 *      Author: Nyuepik
 *
 *      Based on resample-1.7:
 *      http://www-ccrma.stanford.edu/~jos/resample/
 *
 *		and the work of Dominic Mazzoni on libresample which
 *		really helped in understanding the algorithm.
 */

/*
 *		Given the floating point limitations of the Palm,
 *		it is not advisable to calculate the filter table
 *		on the device, as a result, I precompute them with a
 *		different program.  I have however left the table
 *		creation code in for completeness.
 *
 *		I have also attempted as best I can to add my own
 *		comments along with the resample original comments
 *		to explain what is going on in the algorithm and
 *		code.  However, sample theory is a relatively new
 *		area for me, so please let me know if I got something
 *		wrong in the comments. - Nyuepik
 */

#include "MusFilter.h"
#include "../WormDebug.h"
#include <math.h>
#include <stdint.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>

// These libraries increase executable size considerable, but are easy to
//	work with, so we use them when we create the table, but not for reading
#ifndef ON_DEVICE
#include <fstream>
#include <iostream>
#endif

//*********************
// Defines
//*********************
#ifndef MAX
#define MAX(x,y) ((x)>(y) ?(x):(y))
#endif
#ifndef MIN
#define MIN(x,y) ((x)<(y) ?(x):(y))
#endif

#ifndef PI
#define PI (3.14159265358979232846)
#endif

#ifndef PI2
#define PI2 (6.28318530717958465692)
#endif

#define D2R (0.01745329348)          /* (2*pi)/360 */
#define R2D (57.29577951)            /* 360/(2*pi) */

// need to define the static variable here
int32_t *ResampleFilter::m_psImp = NULL;

int32_t ResampleFilter::m_RefLpScl 	= 0;
int32_t ResampleFilter::m_LpScl 	= 0;

//*********************
// Inlines
//*********************

// Converts the filtered value to a short
inline short ResampleFilter::Scale64toShort(int64_t v)
{
#ifdef DEBUG_RESAMPLE
	uint32_t pof = 0;
	uint32_t nof = 0;
#endif
    short out;
    uint32_t llsb = (1<<(c_NlpScl-1));
    v += llsb;          /* round */
    v >>= c_NlpScl;
    if (v>SHRT_MAX) {
#ifdef DEBUG_RESAMPLE
        if (pof == 0)
          fprintf(stderr, "*** resample: sound sample overflow\n");
        else if ((pof % 10000) == 0)
          fprintf(stderr, "*** resample: another ten thousand overflows\n");
        pof++;
#endif
        v = SHRT_MAX;
    } else if (v < SHRT_MIN) {
#ifdef DEBUG_RESAMPLE
        if (nof == 0)
          fprintf(stderr, "*** resample: sound sample (-) overflow\n");
        else if ((nof % 1000) == 0)
          fprintf(stderr, "*** resample: another thousand (-) overflows\n");
        nof++;
#endif
        v = SHRT_MIN;
    }   
    out = (short) v;
    return out;
}


#define IzeroEPSILON 1E-21               /* Max error acceptable in Izero */

inline double ResampleFilter::Izero(double x)
{
   double sum, u, halfx, temp;
   int n;

   sum = u = n = 1;
   halfx = x/2.0;
   do {
      temp = halfx/(double)n;
      n += 1;
      temp *= temp;
      u *= temp;
      sum += u;
   } while (u >= IzeroEPSILON*sum);
   return(sum);
}




void ResampleFilter::SetFilterRate(float f)
{
	if (f<0.25) f = 0.25;
	m_fRate = f;
	m_LpScl = (f<1)?m_RefLpScl*f:m_RefLpScl;
	m_iIncrScale = (1<<10)*1/f;
};

// Used to figure out how far to advance the read pointer
int32_t ResampleFilter::AdvanceByAmount(int32_t iRequested)
{
	int32_t retVal = iRequested * m_iIncrScale;
	retVal += (1<<9);
	return retVal>>10;
};

// Used to figure out how far to advance the read pointer
int32_t ResampleFilter::AdvanceByAmtStat(int32_t iRequested, int32_t FilterRate)
{
	int32_t retVal = iRequested * FilterRate;
	retVal += (1<<9);
	return retVal>>10;
};

// In
// ---
// psInBuffer - Unfiltered song bytes, set to the current sample
//				in the buffer to filter
// Phase - position of the new sample between [Cur, Cur+1) where
//				Cur represents the time of the current sample
// 
// returns - num samples read

// Filter Up, inc +1
// If the phase is zero then we have to skip the first sample
void ResampleFilter::FilterUpRWAL(int64_t &vfpNewValD4, int32_t psInBuffer[], unsigned short Phase)
{
	register int32_t		R1, R2, R3, R4;

	int32_t *Imp = &m_psImp[Phase*c_PackFiltLen];

	R1 = *psInBuffer++;
	R3 = R1 << 16;
	R3 >>= 16;
	R4 = *Imp++;

	if (Phase != 0)
	{
		R1 >>= 16;
		R2 = R4 << 16;
		R2 >>= 16;
		vfpNewValD4 += R1 * R2;
	}

	R4 >>= 16;
	vfpNewValD4 += R3 * R4;


	R1 = *psInBuffer++;
	R3 = R1 << 16;
	R3 >>= 16;
	R1 >>= 16;

	R4 = *Imp++;
	R2 = R4 << 16;
	R2 >>= 16;
	R4 >>= 16;


	vfpNewValD4 += R1 * R2;
	vfpNewValD4 += R3 * R4;

	R1 = *psInBuffer++;
	R3 = R1 << 16;
	R3 >>= 16;
	R1 >>= 16;

	R4 = *Imp++;
	R2 = R4 << 16;
	R2 >>= 16;
	R4 >>= 16;


	vfpNewValD4 += R1 * R2;
	vfpNewValD4 += R3 * R4;


	if (Phase == 0x8000) return;
	R2 = *Imp;
	R1 = *psInBuffer;
	R1 >>= 16;
	vfpNewValD4 += R2 * R1;
}

void ResampleFilter::FilterUpRWNAL(int64_t &vfpNewValD4, int32_t psInBuffer[], unsigned short Phase)
{
	register int32_t		R1, R2, R3, R4;

	int32_t *Imp = &m_psImp[Phase*c_PackFiltLen];

	R3 = *psInBuffer++;
	R4 = *Imp++;

	if (Phase != 0)
	{
		R1 = R3 << 16;
		R1 >>= 16;
		R2 = R4 << 16;
		R2 >>= 16;
		vfpNewValD4 += R1 * R2;
	}

	R3 = *psInBuffer++;
	R1 = R3 >> 16;
	R4 >>= 16;
	vfpNewValD4 += R1 * R4;

	R1 = R3 << 16;
	R1 >>= 16;

	R4 = *Imp++;
	R2 = R4 << 16;
	R2 >>= 16;
	R4 >>= 16;

	vfpNewValD4 += R1 * R2;

	R3 = *psInBuffer++;
	R1 = R3 >> 16;

	vfpNewValD4 += R1 * R4;

	R1 = R3 << 16;
	R1 >>= 16;

	R4 = *Imp++;
	R2 = R4 << 16;
	R2 >>= 16;
	R4 >>= 16;

	vfpNewValD4 += R1 * R2;

	R3 = *psInBuffer++;
	R1 = R3 >> 16;

	vfpNewValD4 += R1 * R4;


	if (Phase == 0x8000) return;
	R2 = *Imp;
	R1 = R3 << 16;
	R1 >>= 16;
	vfpNewValD4 += R2 * R1;
}

void ResampleFilter::FilterUpLWNAL(int64_t &vfpNewValD4, int32_t psInBuffer[], unsigned short Phase)
{
	register int32_t		R1, R2, R3, R4;

	int32_t *Imp = &m_psImp[Phase*c_PackFiltLen];

	R3 = *psInBuffer--;
	R4 = *Imp++;
	R2 = R4 << 16;
	R2 >>= 16;
	R4 >>= 16;

	R1 = R3 >> 16;
	vfpNewValD4 += R1 * R2;

	R3 = *psInBuffer--;
	R1 = R3 << 16;
	R1 >>= 16;

	vfpNewValD4 += R1 * R4;

	R1 = R3 >> 16;

	R4 = *Imp++;
	R2 = R4 << 16;
	R2 >>= 16;
	R4 >>= 16;

	vfpNewValD4 += R1 * R2;

	R3 = *psInBuffer--;
	R1 = R3 << 16;
	R1 >>= 16;

	vfpNewValD4 += R1 * R4;

	R1 = R3 >> 16;

	R4 = *Imp++;
	R2 = R4 << 16;
	R2 >>= 16;
	R4 >>= 16;

	vfpNewValD4 += R1 * R2;

	R3 = *psInBuffer--;
	R1 = R3 << 16;
	R1 >>= 16;

	vfpNewValD4 += R1 * R4;

	R2 = *Imp;
	R1 = R3 >> 16;
	vfpNewValD4 += R2 * R1;
}

void ResampleFilter::FilterUpLWAL(int64_t &vfpNewValD4, int32_t psInBuffer[], unsigned short Phase)
{
	register int32_t		R1, R2, R3, R4;

	int32_t *Imp = &m_psImp[Phase*c_PackFiltLen];

	R3 = *psInBuffer--;
	R1 = R3 << 16;
	R1 >>= 16;
	R3 >>= 16;

	R4 = *Imp++;
	R2 = R4 << 16;
	R2 >>= 16;
	R4 >>= 16;

	vfpNewValD4 += R1 * R2;
	vfpNewValD4 += R3 * R4;

	R3 = *psInBuffer--;
	R1 = R3 << 16;
	R1 >>= 16;
	R3 >>= 16;

	R4 = *Imp++;
	R2 = R4 << 16;
	R2 >>= 16;
	R4 >>= 16;


	vfpNewValD4 += R1 * R2;
	vfpNewValD4 += R3 * R4;

	R3 = *psInBuffer--;
	R1 = R3 << 16;
	R1 >>= 16;
	R3 >>= 16;

	R4 = *Imp++;
	R2 = R4 << 16;
	R2 >>= 16;
	R4 >>= 16;


	vfpNewValD4 += R1 * R2;
	vfpNewValD4 += R3 * R4;

	R2 = *Imp;
	R3 = *psInBuffer;
	R1 = R3 << 16;
	R1 >>= 16;
	vfpNewValD4 += R2 * R1;
}

//int64_t FilterDnRW(short *psInBuffer, short Phase); // inc +1
void ResampleFilter::FilterDnRWAL(int64_t &vfpNewValD4, int32_t psInBuffer[],
						unsigned short Phase, unsigned short dhb )
{
	register int32_t		R1, R2, R4;
	register uint32_t		R3;

	R3 = dhb * Phase;
	if (R3 == 0)
		R3 = dhb;
	else
		R3 >>= c_NP;

	while (1)
	{
		//if (Count == 0)
		R1 = R3 & 0xFFFF;
		R2 = R1 * c_PackFiltLen;
		R1 = R3 >> 17;
		R2 += R1;
		R2 = *(m_psImp + R2);
		R1 = R3 & 1<<16;
		if (R1 == 0)
			R2 = (R2<<16);
		R2 >>= 16;
		R4 = *psInBuffer++;
		R1 = R4 >> 16;
		vfpNewValD4 += R2 * R1;
		R3 += dhb;
		if (R3 >= c_PackNWing) break;
		//if (Count == 1)
		R1 = R3 & 0xFFFF;
		R2 = R1 * c_PackFiltLen;
		R1 = R3 >> 17;
		R2 += R1;
		R2 = *(m_psImp + R2);
		R1 = R3 & 1<<16;
		if (R1 == 0)
			R2 = (R2<<16);
		R2 >>= 16;
		R1 = R4 << 16;
		R1 >>= 16;
		vfpNewValD4 += R2 * R1;
		R3 += dhb;
		if (R3 >= c_PackNWing) break;
	}

	if (Phase == 0x8000)
		vfpNewValD4 -= R1 * R2;
}

void ResampleFilter::FilterDnRWNAL(int64_t &vfpNewValD4, int32_t psInBuffer[],
						unsigned short Phase, unsigned short dhb )
{
	register int32_t		R1, R2, R4;
	register uint32_t		R3;

	R3 = dhb * Phase;
	if (R3 == 0)
		R3 = dhb;
	else
		R3 >>= c_NP;

	//if (Count == 1)
	R4 = *psInBuffer++;
	R1 = R3 & 0xFFFF;
	R2 = R1 * c_PackFiltLen;
	R1 = R3 >> 17;
	R2 += R1;
	R2 = *(m_psImp + R2);
	R1 = R3 & 1<<16;
	if (R1 == 0)
		R2 = (R2<<16);
	R2 >>= 16;
	R1 = R4 << 16;
	R1 >>= 16;
	vfpNewValD4 += R2 * R1;
	R3 += dhb;

	while (1)
	{
		//if (Count == 0)
		R1 = R3 & 0xFFFF;
		R2 = R1 * c_PackFiltLen;
		R1 = R3 >> 17;
		R2 += R1;
		R2 = *(m_psImp + R2);
		R1 = R3 & 1<<16;
		if (R1 == 0)
			R2 = (R2<<16);
		R2 >>= 16;
		R4 = *psInBuffer++;
		R1 = R4 >> 16;
		vfpNewValD4 += R2 * R1;
		R3 += dhb;
		if (R3 >= c_PackNWing) break;
		//if (Count == 1)
		R1 = R3 & 0xFFFF;
		R2 = R1 * c_PackFiltLen;
		R1 = R3 >> 17;
		R2 += R1;
		R2 = *(m_psImp + R2);
		R1 = R3 & 1<<16;
		if (R1 == 0)
			R2 = (R2<<16);
		R2 >>= 16;
		R1 = R4 << 16;
		R1 >>= 16;
		vfpNewValD4 += R2 * R1;
		R3 += dhb;
		if (R3 >= c_PackNWing) break;
	}

	if (Phase == 0x8000)
		vfpNewValD4 -= R1 * R2;
}


void ResampleFilter::FilterDnLWAL(int64_t &vfpNewValD4, int32_t psInBuffer[],
						unsigned short Phase, unsigned short dhb )
{
	register int32_t		R1, R2, R4;
	register uint32_t		R3;

	R3 = dhb * Phase;
	R3 >>= c_NP;

	while (1)
	{
		//if (Count == 0)
		R1 = R3 & 0xFFFF;
		R2 = R1 * c_PackFiltLen;
		R1 = R3 >> 17;
		R2 += R1;
		R2 = *(m_psImp + R2);
		R1 = R3 & 1<<16;
		if (R1 == 0)
			R2 = (R2<<16);
		R2 >>= 16;
		R4 = *psInBuffer--;
		R1 = R4 << 16;
		R1 >>= 16;
		R1 = R4 >> 16;
		vfpNewValD4 += R2 * R1;
		R3 += dhb;
		if (R3 >= c_PackNWing) break;
		//if (Count == 1)
		R1 = R3 & 0xFFFF;
		R2 = R1 * c_PackFiltLen;
		R1 = R3 >> 17;
		R2 += R1;
		R2 = *(m_psImp + R2);
		R1 = R3 & 1<<16;
		if (R1 == 0)
			R2 = (R2<<16);
		R2 >>= 16;
		R1 = R4 >> 16;
		vfpNewValD4 += R2 * R1;
		R3 += dhb;
		if (R3 >= c_PackNWing) break;
	}
}


//int64_t FilterDnRW(short *psInBuffer, short Phase); // inc +1
void ResampleFilter::FilterDnLWNAL(int64_t &vfpNewValD4, int32_t psInBuffer[],
						unsigned short Phase, unsigned short dhb )
{
	register int32_t		R1, R2, R4;
	register uint32_t		R3;

	R3 = dhb * Phase;
	R3 >>= c_NP;

	//if (Count == 1)
	R1 = R3 & 0xFFFF;
	R2 = R1 * c_PackFiltLen;
	R1 = R3 >> 17;
	R2 += R1;
	R2 = *(m_psImp + R2);
	R1 = R3 & 1<<16;
	if (R1 == 0)
		R2 = (R2<<16);
	R2 >>= 16;
	R4 = *psInBuffer--;
	R1 = R4 >> 16;
	vfpNewValD4 += R2 * R1;
	R3 += dhb;

	while (1)
	{
		//if (Count == 0)
		R1 = R3 & 0xFFFF;
		R2 = R1 * c_PackFiltLen;
		R1 = R3 >> 17;
		R2 += R1;
		R2 = *(m_psImp + R2);
		R1 = R3 & 1<<16;
		if (R1 == 0)
			R2 = (R2<<16);
		R2 >>= 16;
		R4 = *psInBuffer--;
		R1 = R4 << 16;
		R1 >>= 16;
		vfpNewValD4 += R2 * R1;
		R3 += dhb;
		if (R3 >= c_PackNWing) break;
		//if (Count == 1)
		R1 = R3 & 0xFFFF;
		R2 = R1 * c_PackFiltLen;
		R1 = R3 >> 17;
		R2 += R1;
		R2 = *(m_psImp + R2);
		R1 = R3 & 1<<16;
		if (R1 == 0)
			R2 = (R2<<16);
		R2 >>= 16;
		R1 = R4 >> 16;
		vfpNewValD4 += R2 * R1;
		R3 += dhb;
		if (R3 >= c_PackNWing) break;
	}
}


//int64_t FilterDnLW(short *psInBuffer, short Phase); // inc -1


// In
// ---
// psInBuffer - Unfiltered song bytes, with psInBuffer[0]
//					set to the first sample to decode.
// psOutBuffer - Ouput buffer containing resampled stream
// siRequested - Number of samples required to fill outbuffer
// 
// returns - num samples read
size_t ResampleFilter::SrcUp(uint32_t psIn[], short psOutStart[],
							size_t siRequested)
{
	int32_t *Xp;
	short *psOut;
    int64_t v;
    uint32_t Time = 0;
	
    double dt;                  // Step through input signal
    uint32_t dtb;               // Fixed-point version of Dt

    
    dt = 1.0/m_fRate;            // Output sampling period
    dtb = dt*(1<<c_NP) + 0.5;     // Fixed-point representation
    
    psOut = psOutStart;

    while (psOut < (psOutStart + siRequested))
    {

    	v = 0;
    	int temp = (Time>>c_NP)/2;
        Xp = (int32_t *)&psIn[temp];      // Ptr to current input sample


        // Perform left-wing inner product
       if ((Time>>c_NP)%2 == 1)
        {
        	FilterUpLWAL(v, Xp, (short)(Time&c_Pmask));
        	// Perform right-wing inner product
			// because of the way we have things implemented, if phase
			//	is zero, we want to send the first sample so it can
			//	be skipped

        	if ((-((int32_t) Time)&c_Pmask) == 0)
        		FilterUpRWNAL(v, Xp, (short)(-((int32_t) Time)&c_Pmask));
        	else
        		FilterUpRWAL(v, Xp+1, (short)(-((int32_t) Time)&c_Pmask));
        }
        else
        {
        	FilterUpLWNAL(v, Xp, (short)(Time&c_Pmask));
        	// Perform right-wing inner product

        	if ((-((int32_t) Time)&c_Pmask) == 0)
        		FilterUpRWAL(v, Xp, (short)(-((int32_t) Time)&c_Pmask));
        	else
        		FilterUpRWNAL(v, Xp, (short)(-((int32_t) Time)&c_Pmask));

		}
        v >>= c_NHG;
       	v *= m_LpScl;             // Normalize for unity filter gain
        *psOut++ = Scale64toShort(v);   // strip guard bits, deposit output*/
        								// move to the next position for this channel
        //psOut+=2;
        Time += dtb;           // Move to next sample by time increment
    }
    return Time>>c_NP;        // Return the number of input samples consumed
}

size_t ResampleFilter::SrcDwn(uint32_t psIn[], short psOutStart[],
								size_t siRequested)
{
	int32_t *Xp;
	short *psOut;
    int64_t v;
    uint32_t Time = 0;

    double dt, dh;                  // Step through input signal
    uint32_t dtb, dhb;               // Fixed-point version of Dt


    dt = 1.0/m_fRate;            // Output sampling period
    dtb = dt*(1<<c_NP) + 0.5;     // Fixed-point representation

    dh = m_fRate*c_NPC + 0.5;  /* Filter sampling period */
    dhb = dh;     /* Fixed-point representation */

    psOut = psOutStart;

    while (psOut < (psOutStart + siRequested))
    {
    	v = 0;
    	int temp = (Time>>c_NP)/2;
        Xp = (int32_t *)&psIn[temp];      // Ptr to current input sample


        // Perform left-wing inner product
        if ((Time>>c_NP)%2 == 1)
        {
        	FilterDnLWAL(v, Xp, (short)(Time&c_Pmask), dhb);
        	// Perform right-wing inner product
			FilterDnRWAL(v, Xp+1, (short)(-((int32_t) Time)&c_Pmask), dhb);
		}
        else
        {
        	FilterDnLWNAL(v, Xp, (short)(Time&c_Pmask), dhb);
        	// Perform right-wing inner product

			FilterDnRWNAL(v, Xp, (short)(-((int32_t) Time)&c_Pmask), dhb);
		}

        v >>= c_NHG;
       	v *= m_LpScl;             // Normalize for unity filter gain
        *psOut++ = Scale64toShort(v);   // strip guard bits, deposit output*/
        //psOut+=2;								// and move to the next position for this channel
        Time += dtb;           // Move to next sample by time increment
    }
    return Time>>c_NP;        // Return the number of input samples consumed
}

//*********************************
// Create the Kaiser window
//*********************************
void ResampleFilter::lrsLpFilter(double c[], int N, double frq, double Beta, int Num)
{
   double IBeta, temp, temp1, inm1;
   int i;

   /* Calculate ideal lowpass filter impulse response coefficients: */
   c[0] = 2.0*frq;
   for (i=1; i<N; i++) {
      temp = PI*(double)i/(double)Num;
      c[i] = sin(2.0*temp*frq)/temp; /* Analog sinc function, cutoff = frq */
   }

   /* 
    * Calculate and Apply Kaiser window to ideal lowpass filter.
    * Note: last window value is IBeta which is NOT zero.
    * You're supposed to really truncate the window here, not ramp
    * it to zero. This helps reduce the first sidelobe. 
    */
   IBeta = 1.0/Izero(Beta);
   inm1 = 1.0/((double)(N-1));
   for (i=1; i<N; i++) {
      temp = (double)i * inm1;
      temp1 = 1.0 - temp*temp;
      temp1 = (temp1<0? 0: temp1);
      c[i] *= Izero(Beta*sqrt(temp1)) * IBeta;
   }
}

//************************************
// Create the filter
//************************************
FiltMessage ResampleFilter::Init()
{

#ifdef BUILD_FILT_TABLE_DYNAMIC
	m_psImp = (int32_t *) malloc(ResampleFilter::c_PackNWing*sizeof(int32_t));

	double *ImpR = new double[c_NWING];
	double DCgain, Scl, Maxh, temp;
	int Dh;
	unsigned int i;

	FILE* pFile;
	pFile = fopen ("compare.txt","w");

	fprintf(pFile, "New Run\n");
	fclose (pFile);


	// Design Kaiser-windowed sinc-function low-pass filter

	lrsLpFilter(ImpR, c_NWING, 0.5*c_ROLLOFF, c_BETA, c_NPC);

	// Compute the DC gain of the lowpass filter, and its maximum coefficient
	//* magnitude. Scale the coefficients so that the maximum coeffiecient just
	//* fits in Nh-bit fixed-point, and compute LpScl as the NLpScl-bit (signed)
	//* scale factor which when multiplied by the output of the lowpass filter
	//* gives unity gain.
	DCgain = 0;
	Dh = c_NPC;                       // Filter sampling period for factors>=1
	for (i=Dh; i<c_NWING; i+=Dh)
	  DCgain += ImpR[i];
	DCgain = 2*DCgain + ImpR[0];    // DC gain of real coefficients

	for (Maxh=i=0; i<c_NWING; i++)
	  Maxh = MAX(Maxh, fabs(ImpR[i]));

	Scl = ((1<<(c_NH-1))-1)/Maxh;     // Map largest coeff to 16-bit maximum
	double tIM = UINT_MAX+1.0;
	temp = fabs(tIM/(DCgain*Scl));
	if (temp > UINT_MAX)
		assert(0);
	m_LpScl = temp;
	m_RefLpScl = m_LpScl;

	// Scale filter coefficients for Nh bits and convert to integer
	if (ImpR[0] < 0)                // Need pos 1st value for LpScl storage
	  Scl = -Scl;
	for (i=0; i<c_NWING; i++)         // Scale them
	  ImpR[i] *= Scl;

#ifdef DEBUG_RESAMPLE
	short  		**ImpTest = new short* [c_NPC];

	for (i=0; i<c_NPC; i++)
	{
		ImpTest[i] = new short[((c_NMULT-1)/2)+1];
	}
#endif

	for (i=0; i<c_NWING; i++)
	{
		assert(ImpR[i] <= SHRT_MAX);
		assert(ImpR[i] >= SHRT_MIN);

		// We load the filter in reverse order
		if(((i/c_NPC)/2) == (c_PackFiltLen-1))
		{
			m_psImp[(i%c_NPC)*c_PackFiltLen+(i/c_NPC)/2] = (short)(ImpR[i] + 0.5);
		}
		else if (((i/c_NPC)%2) == 0)
		{
			m_psImp[(i%c_NPC)*c_PackFiltLen+(i/c_NPC)/2] = (((short)(ImpR[i] + 0.5))&0xFFFF);	// Round them
		}
		else
		{
			short st = (short)(ImpR[i] + 0.5);
			int it = st;
			it = it << 16;
			int itmp = (m_psImp[(i%c_NPC)*c_PackFiltLen+(i/c_NPC)/2] & 0xFFFF);
			itmp |= (it & 0xFFFF0000);
			m_psImp[(i%c_NPC)*c_PackFiltLen+(i/c_NPC)/2] = itmp;
		}


#ifdef DEBUG_RESAMPLE
		ImpTest[i%c_NPC][i/c_NPC] = ImpR[i] + 0.5;	// Round them
#endif
	}

	// Since we should only be running this code to create the filter
	// table for loading on the device, we write and then load the
	// filter table to make sure we have no errors.
#ifdef WRITE_NEW_FILTER_TABLE
	TableWrite(RESAMPLE_RES_FILE_NAME);
#endif

#ifdef DEBUG_RESAMPLE
	TableRead(RESAMPLE_RES_FILE_NAME);

	for (i=0; i<c_NWING; i++)
	{
		short s;

		if (((i/c_NPC)%2) == 0)
		{
			s = m_psImp[(i%c_NPC)*c_PackFiltLen+(i/c_NPC)/2] & 0xFFFF;;	// Round them
		}
		else
		{
			s = m_psImp[(i%c_NPC)*c_PackFiltLen+(i/c_NPC)/2]>>16;
		}

		if (s != ImpTest[i%c_NPC][(i/c_NPC)])
		{
			if ((i/c_NPC) == 6)
			{
				ReportError3("On i=%i, we are supposed to have 0x0000%0X but actually have 0x%08X",
						i, ImpTest[i%c_NPC][i/c_NPC],
						m_psImp[(i%c_NPC)*c_PackFiltLen+(i/c_NPC)/2]);
				assert(0);
			}
			else if ((i/c_NPC)%2 == 0)
			{
				ReportError4("On i=%i, we are supposed to have 0x%04X%04X but actually have 0x%08X",
						i, ImpTest[i%c_NPC][(i/c_NPC)+1],
						ImpTest[i%c_NPC][i/c_NPC],
						m_psImp[(i%c_NPC)*c_PackFiltLen+(i/c_NPC)/2]);
				assert(0);
			}
			else
			{
				ReportError4("On i=%i, we are supposed to have 0x%04X%04X but actually have 0x%08X",
						i, ImpTest[i%c_NPC][(i/c_NPC)-1],
						ImpTest[i%c_NPC][i/c_NPC],
						m_psImp[(i%c_NPC)*c_PackFiltLen+(i/c_NPC)/2]);
				assert(0);
			}
		}
	}
#endif //#ifdef DEBUG_RESAMPLE

	delete [] ImpR;

#else //#ifndef ON_DEVICE

	if (m_psImp == NULL)
	{

		m_psImp = (int32_t *) MALLOC(ResampleFilter::c_PackNWing*sizeof(int32_t));

		//ReportError1("About to read filter table, %s", RESAMPLE_RES_PATH);
		ResampleFilter::TableRead(RESAMPLE_RES_PATH);
		// We have an error
		if (m_psImp == NULL)
			return FILT_Error;
		//ReportError("Finished reading in filter table");
	}
#endif //#ifndef ON_DEVICE

	return FILT_Success;
};


using namespace std;

#ifdef WRITE_NEW_FILTER_TABLE
// helps for debugging
//#define HUMAN_READABLE_RESAMPLE_OUT
void ResampleFilter::TableWrite(const char *FileName)
{
#ifndef HUMAN_READABLE_RESAMPLE_OUT
	fstream file (FileName, ios::out|ios::binary);

	file.write((const char *)&m_LpScl, sizeof(uint32_t));

	for (size_t i=0; i<c_PackNWing; i++)
	{
		file.write((const char *)&m_psImp[i], sizeof(int));
	}

	file.close();
#else
	fstream file (FileName, ios::out);

	file << m_LpScl << "\n";

	file.setf ( ios::showbase );
	for (size_t i=0; i<c_PackNWing; i++)
	{
		file << hex << m_psImp[i] << "\n";
	}

	file.close();
#endif
}
#endif

// In case you want to use this outside my code interface, I have included
//	the loading routines directly.  However, for my purposes I don't need
//	them.
#ifndef BUILD_FILT_TABLE_DYNAMIC

#ifdef READ_LITTLE_ENDIAN
#define READ_BIG_ENDIAN 0
#else
#define READ_BIG_ENDIAN 1
#endif

#define FilterBytesToInt(W, X, Y, Z) READ_BIG_ENDIAN ? \
		(int)(((W<<24)&0xFF000000)| \
			  ((X<<16)&0x00FF0000)| \
			  ((Y<<8)&0x0000FF00)| \
			  ((Z&0x000000FF))) : \
		(int)(((Z<<24)&0xFF000000)| \
			  ((Y<<16)&0x00FF0000)| \
			  ((X<<8)&0x0000FF00)| \
			  ((W&0x000000FF)))

void ResampleFilter::TableRead(const char *FileName)
{
#ifndef HUMAN_READABLE_RESAMPLE_OUT
	//ReportError1("Filename = %s", FileName);

	FILE *pFile;

	pFile = fopen(FileName, "rb");

	if (pFile == NULL)
	{
		MUS_ERROR(MUS_ERROR_NOT_INIT, "Error opening filter table");
		m_psImp = NULL;
		return;
	}

	fread(&m_LpScl, sizeof(uint32_t), 1, pFile);

	m_RefLpScl = m_LpScl;

	for (size_t i=0; i<c_PackNWing; i++)
	{
		char pcByte0;
		char pcByte1;
		char pcByte2;
		char pcByte3;

		fread(&pcByte0, sizeof(char), 1, pFile);
		fread(&pcByte1, sizeof(char), 1, pFile);
		fread(&pcByte2, sizeof(char), 1, pFile);
		fread(&pcByte3, sizeof(char), 1, pFile);

		m_psImp[i] = FilterBytesToInt(pcByte0,pcByte1,pcByte2,pcByte3);
	}

	fclose(pFile);
#else //#ifndef HUMAN_READABLE_RESAMPLE_OUT
	fstream file (FileName, ios::in);

	file >> m_LpScl;

	file.setf ( ios::showbase );
	for (size_t i=0; i<c_PackNWing; i++)
	{
		file >> hex >> m_psImp[i];
	}

	file.close();
#endif //#ifndef HUMAN_READABLE_RESAMPLE_OUT
}

#endif //#ifndef BUILD_FILT_TABLE_DYNAMIC

FiltMessage ResampleFilter::Uninit()
{
	FREE(m_psImp);

	return FILT_Success;
};


FiltMessage ResampleFilter::Filter(uint32_t *psChanIn, size_t uiStartPos, size_t *piNumRead,
							int16_t *psOutBuffer, size_t pRequested)
{
	uint32_t *psChan = &psChanIn[uiStartPos];


	if ((m_fRate) < 1.0)
	{
		*piNumRead = SrcDwn(psChan, psOutBuffer, pRequested);
	}
	else
	{
		*piNumRead = SrcUp(psChan, psOutBuffer, pRequested);
	}

	*piNumRead = *piNumRead/2;

	return FILT_Success;
}
