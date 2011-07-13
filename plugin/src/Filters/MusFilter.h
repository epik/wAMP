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

#ifndef MUSFILTER_H_
#define MUSFILTER_H_

#include "config.h"
#include "../WormDebug.h"
#include <stdint.h>
#include <stddef.h>


enum FiltMessage
{
	FILT_Done 		= -1,
	FILT_Success 	= 1,
	FILT_Error		= 0
};




// This class performs the actual resampling.  The important point to realize is that
//	both the input song and the filter table are both packed two values to a Word.
//	The filter is packed [[Entry #2][Entry #1]] while the song is packed
//	[[Sample #1][Sample #2]].  This format occured by historical accident because I was
//	playing around with optimization and thought the alternating pattern would be
//	faster, and then didn't bother to change it once I realized it didn't make a difference.
class ResampleFilter
{
private:
	
	// In order to reduce the number of loads we pack two filter
	//	items (16 bit) into a single 32 bit int.  I have also tried
	//	to cache align the filter in 4 word configurations for each zero
	//	crossing set.  This works only for up scaling, since down
	//	scaling does not traverse the filter in a predictable manner.
	static int32_t  	*m_psImp;

	// VAR SETTING CODE
	float 			m_fRate;
	static int32_t 	m_RefLpScl;
	static int32_t	m_LpScl;
	int32_t			m_iIncrScale;

	// In
	// ---
	// psInBuffer - Unfiltered song bytes, with psInBuffer[0]
	//					set to the first sample to decode.
	//					Still not sure whether this can be generalized
	//					for all filter types, so may change.
	// psOutBuffer - Ouput buffer containing resampled stream
	// siRequested - Number of samples required to fill outbuffer
	// 
	// returns - num samples read
	size_t SrcUp(uint32_t psInBuffer[], short psOutBuffer[],
					size_t siRequested);
	size_t SrcDwn(uint32_t psInBuffer[], short psOutBuffer[],
					size_t siRequested);
	
	// These functions are the basic filter for up sampling.  We have two
	//	for the Left Wing (negative step) and Two for the Right Wing (positive
	//	step).  In addition, for each of those, we have two varients, one if the
	//	initial value to filter is on a word boundary, and one if it is on the
	//	half word boundary.
	// In
	// ---
	// vfpNewValD4 - this is the int64_t used to accumulate the filtered
	//				sample.  It eventually gets converted back into an
	//				int16_t, but using a 64 bit prevents any overflow
	// psInBuffer - Unfiltered song bytes, set to the current sample
	//				in the buffer to filter.  Remeber these are signed.
	// Phase - position of the new sample between [Cur, Cur+1) where
	//				Cur represents the time of the current sample
	// 
	// returns - num samples read
	// If time segment aligned along a word break
	void FilterUpRWAL(int64_t &vfpNewValD4, int32_t psInBuffer[], unsigned short Phase); // inc +1
	void FilterUpLWAL(int64_t &vfpNewValD4, int32_t psInBuffer[], unsigned short Phase); // inc -1
	// aligned in the middle of a word
	void FilterUpRWNAL(int64_t &vfpNewValD4, int32_t psInBuffer[], unsigned short Phase); // inc +1
	void FilterUpLWNAL(int64_t &vfpNewValD4, int32_t psInBuffer[], unsigned short Phase); // inc -1


	// These functions are the basic filter for down sampling.  We have two
	//	for the Left Wing (negative step) and Two for the Right Wing (positive
	//	step).  In addition, for each of those, we have two varients, one if the
	//	initial value to filter is on a word boundary, and one if it is on the
	//	half word boundary.
	// In
	// ---
	// vfpNewValD4 - this is the int64_t used to accumulate the filtered
	//				sample.  It eventually gets converted back into an
	//				int16_t, but using a 64 bit prevents any overflow
	// psInBuffer - Unfiltered song bytes, set to the current sample
	//				in the buffer to filter.  Remeber these are signed.
	// Phase - position of the new sample between [Cur, Cur+1) where
	//				Cur represents the time of the current sample
	// dhb - This is the value we use to step through the filter
	//
	// returns - num samples read
	// And the down version
	void FilterDnRWAL(int64_t &vfpNewValD4, int32_t psInBuffer[],
							unsigned short Phase, unsigned short dhb ); // inc +1
	void FilterDnLWAL(int64_t &vfpNewValD4, int32_t psInBuffer[],
							unsigned short Phase, unsigned short dhb); // inc -1
	// aligned in the middle of a word
	void FilterDnRWNAL(int64_t &vfpNewValD4, int32_t psInBuffer[],
							unsigned short Phase, unsigned short dhb); // inc +1
	void FilterDnLWNAL(int64_t &vfpNewValD4, int32_t psInBuffer[],
							unsigned short Phase, unsigned short dhb); // inc -1
	

	// This is needed for doing the fixed point arithmetic.
	short Scale64toShort(int64_t v);

	// These are used for building the table
	double Izero(double x);
	void lrsLpFilter(double c[], int N, double frq, double Beta, int Num);

	// this is used for saving the table so we can use it on the device
#ifdef WRITE_NEW_FILTER_TABLE
	void TableWrite(const char *FileName);
#endif
	
	// this is used for recovering the table on the device
	static void TableRead(const char *FileName);



public:

	static const double c_LOWFILTER 			= LOW_SPEED_RATIO_LIM;
	static const double c_HIGHFILTER 			= HIGH_SPEED_RATIO_LIM;
	static const double c_ROLLOFF				= 0.90;
	static const double c_BETA					= 6;
	static const unsigned short c_NlpScl 		= 16;
	static const unsigned short c_NHC			= 16;
	static const unsigned short c_NH			= 16;
	static const unsigned short c_NP			= 16;
	static const unsigned int 	c_NPC			= (1 << c_NHC);
	static const unsigned short c_Pmask			= ((1<<c_NP)-1);
	static const unsigned short c_NMULT			= 15;
	static const unsigned int	c_NWING			= c_NPC * (c_NMULT-1)/2;
	static const unsigned short c_NB			= 16;
	static const unsigned short c_NHG			= 16;
	static const unsigned short c_PackFiltLen	= ((c_NMULT-1)/4)+1;
	static const unsigned int	c_PackNWing		= c_NPC * c_PackFiltLen;


	static FiltMessage Init();

	static FiltMessage Uninit();

	FiltMessage Filter(uint32_t *psChanin, size_t uiStartPos, size_t *piNumRead,
								int16_t *pucOutBuffer, size_t pRequested);
	float GetSpeed() {return m_fRate;};
	void SetFilterRate(float f);
	int32_t AdvanceByAmount(int32_t iRequested);

	static int32_t AdvanceByAmtStat(int32_t iRequested, int32_t FilterRate);
};




#endif /* MUSFILTER_H_ */
