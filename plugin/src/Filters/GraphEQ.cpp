
//#include <limits.h>

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




