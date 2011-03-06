/*
 * WormDebug.cpp
 *
 *  Created on: Jan 29, 2011
 *      Author: Katiebird
 */

#include "WormDebug.h"
#include <stdint.h>

// this is for keeping track of error status codes
int32_t g_iErrorCode = MUS_ERROR_NOT_INIT;
// this is for keeping track of error msgs
char g_cstrErrorStr[500];


int16_t SafeStrcpy(char *cstrDest, const char *cstrSrc, int limit)
{
	const char *iter = cstrSrc;
	char *destIter = cstrDest;

	int i = 0;

	while (*iter != 0)
	{
		*destIter++ = *iter++;
		if(++i >= limit)
		{
			assert(0);
			return 0;
		}
	}

	*destIter = *iter;
	return 1;
}
