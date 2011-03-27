/*
 * WormThread.h
 *
 *  Created on: Aug 21, 2010
 *      Author: Katiebird
 */

#ifndef WORMTHREAD_H_
#define WORMTHREAD_H_

#include "config.h"
#include <pthread.h>

// I know, not object oreinted, sue me.
// I thought about making this object oriented, but don't really
//	see the point since it must be tailored to each specific
//	class.

extern pthread_mutex_t 	music_msg_mutex;
extern pthread_mutex_t 	FM_status_mutex;
extern pthread_mutex_t  meta_write_mutex;

#define LockMusMsgQueue() pthread_mutex_lock(&music_msg_mutex)
#define UnlockMusMsgQueue() pthread_mutex_unlock(&music_msg_mutex)

#define LockFM() 		pthread_mutex_lock(&FM_status_mutex)
#define UnlockFM() 	pthread_mutex_unlock(&FM_status_mutex)

#define LockMeta()	pthread_mutex_lock(&meta_write_mutex)
#define UnlockMeta() pthread_mutex_unlock(&meta_write_mutex)

#define WormAlarm(x) alarm(x)
													
extern void WormSleep(unsigned int iMilSeconds);
extern void WormWakeableSleep(unsigned int iMilSeconds);
extern void WormMarkStartTime();
extern unsigned int WormCheckTimeSinceMark();


#ifdef PROFILE
extern void WormProfileInit();
extern unsigned long WormProfileReport();
#else
#define WormProfileInit()
#define WormProfileReport()
#endif


#endif /* WORMTHREAD_H_ */
