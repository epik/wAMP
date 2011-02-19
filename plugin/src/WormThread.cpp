/*
 * WormThread.cpp
 *
 *  Created on: Aug 22, 2010
 *      Author: Katiebird
 */

#include "WormDebug.h"
#include "config.h"
#include "WormThread.h"
#include <signal.h>
#include <time.h>
#include <unistd.h>

static time_t l_tMark;
#ifdef ON_DEVICE
static timeval l_tsProfileStart;
#endif

pthread_mutex_t music_msg_mutex 	= PTHREAD_MUTEX_INITIALIZER;
pthread_mutex_t FM_status_mutex 	= PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t 	FM_status_cond 		= PTHREAD_COND_INITIALIZER;

void WormSleep(unsigned int iMilSeconds)
{
    struct timespec req={0};
    time_t sec=(int)(iMilSeconds/1000);
    iMilSeconds=iMilSeconds-(sec*1000);
    req.tv_sec=sec;
    req.tv_nsec=iMilSeconds*1000000L;
    while(nanosleep(&req,&req)==-1)
         continue;
}

void WormWakeableSleep(unsigned int iMilSeconds)
{
    struct timespec req={0};
    time_t sec=(int)(iMilSeconds/1000);
    iMilSeconds=iMilSeconds-(sec*1000);
    req.tv_sec=sec;
    req.tv_nsec=iMilSeconds*1000000L;
    nanosleep(&req,&req);
}

void WormMarkStartTime()
{
	l_tMark = time (NULL);
}


unsigned int WormCheckTimeSinceMark()
{
	time_t tCurTime;
	time (&tCurTime);
	unsigned int dif;
	dif = tCurTime - l_tMark;
	return dif;
}

#ifdef PROFILE
void WormProfileInit()
{
#ifdef ON_DEVICE
	gettimeofday(&l_tsProfileStart, NULL);
#endif
}


unsigned long WormProfileReport()
{
#ifdef ON_DEVICE
	timeval tsCurTime;
	gettimeofday(&tsCurTime, NULL);
	unsigned int iSecDif;
	unsigned long lMicDif;
	if ((tsCurTime.tv_usec-l_tsProfileStart.tv_usec)<0) {
		iSecDif = tsCurTime.tv_sec-l_tsProfileStart.tv_sec-1;
		lMicDif = 1000000000+tsCurTime.tv_usec-l_tsProfileStart.tv_usec;
	} else {
		iSecDif = tsCurTime.tv_sec-l_tsProfileStart.tv_sec;
		lMicDif = tsCurTime.tv_usec-l_tsProfileStart.tv_usec;
	}
	ReportError2("**cputime=%i:%li\n" , iSecDif, lMicDif);
	l_tsProfileStart = tsCurTime;
	return lMicDif;
#else
	return 0;
#endif
}
#endif // #ifdef PROFILE
