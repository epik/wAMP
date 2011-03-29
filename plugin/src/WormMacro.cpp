/*
 * WormMacro.cpp
 *
 *  Created on: Feb 24, 2011
 *      Author: Katiebird
 */
#include "WormMacro.h"
#include <cstring>

void ConvertQuoteStrcpy(char *dest, const char *src)
{
	const char *iter = src;
	const char *iterPrev = NULL;
	char *destIter = dest;

	while (*iter != '\0')
	{
		if (*iter == '"')
		{
			if (*iterPrev != '\\')
			{
				*destIter++ = '\\';
			}
		}
		iterPrev = iter;
		*destIter++ = *iter++;
	}

	*destIter = *iter;

	return;
}
