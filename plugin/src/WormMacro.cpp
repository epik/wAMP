/*
 * WormMacro.cpp
 *
 *  Created on: Feb 24, 2011
 *      Author: Katiebird
 */
#include "WormMacro.h"
#include <stdlib.h>
#include <cstring>
#include "Indexer/GeneralHashFunctions.h"
#include <cctype>

const int16_t NUM_EXTEN = 18;

// These are all the hash values of the following using DJBHash
const char *g_pcExten[] = {"ra", "3gp", "aac", "als",
						"m4a", "mp1", "mp2", "mp3",
						"mpg", "ogg", "ors", "ram",
						"wav", "wma", "flac", "m3u"};



int QuickExtCheck(const char *filename)
{

    if(!filename)
        return 0;

    const char *ext = strrchr(filename, '.');

    if (ext)
    {
        ext++;

        int16_t sLen = strlen(ext);
        if ((sLen > 4) || (sLen < 2))
        	return 0;

        char lcStr[5];

        lcStr[sLen] = '\0';

        switch (sLen)
        {
        case 4:
        	lcStr[3] = tolower(*(ext+3));
        case 3:
        	lcStr[2] = tolower(*(ext+2));
        case 2:
        	lcStr[1] = tolower(*(ext+1));
        	lcStr[0] = tolower(*ext);
        }

        for (int32_t i = 0; i<16; i++)
        {
        	if (strcmp(lcStr, g_pcExten[i]) == 0)
            	return 1;
        }
    }
    return 0;
}

int32_t SafeStringLen(char *cstr)
{
	if (cstr)
		return strlen(cstr);
	else
		return 6;
}

char *ReallocStringCopy(char *cstrDest, int32_t *iCurAllocSize, const char *cstr)
{
	char	*result = cstrDest;

	int32_t med = *iCurAllocSize;
	int32_t size = 0;
	
	while(*cstr != '\0')
	{
		if(size+1 >= med) 
		{
		
			med += 1024;
			*iCurAllocSize = med;
			result = (char *) REALLOC(result, med);
		}
		result[size++] = *cstr++;
	}
	
	result[size] = '\0';

	return result;
}

char *SafeStringCopy(const char *cstr)
{
	char	*result;
	int		size, med;

	med = size = 0;
	result = (char *) MALLOC(16);

	if(cstr == NULL)
		return NULL;

	char c = *cstr++;

	while(c != '\0')
	{
		if (c == '"')
		{
			if(size+1 >= med)
			{
				med += 64;
				result = (char *) REALLOC(result, med);
			}

			result[size++] = '\\';
			result[size++] = '"';
		}
		else if (c == '\n')
		{
			if(size+1 >= med)
			{
				med += 64;
				result = (char *) REALLOC(result, med);
			}

			result[size++] = '\\';
			result[size++] = 'n';
		}
		else if (c == '\\')
		{
			if(size+1 >= med)
			{
				med += 64;
				result = (char *) REALLOC(result, med);
			}

			result[size++] = '\\';
			result[size++] = '\\';

		}
		else
		{
			if(size >= med) {
				med += 64;
				result = (char *) REALLOC(result, med);
			}
			if (isprint(c))
				result[size++] = c;
			else
				result[size++] = ' ';
		}
		c = *(cstr++);

	}

	// Trim allocated buffer to contain only the string and terminating '\0'
	result = (char *) REALLOC(result, size + 1);

	result[size] = '\0';

	return result;
}

char *ReallocSafeStringCopy(char *existingDest,
							int32_t *iCurAllocSize,
							const char *cstr)
{
	if(cstr == NULL)
	{
		existingDest[0] = '\0';
		return existingDest;
	}

	char	*result = existingDest;

	int32_t med = *iCurAllocSize;
	int32_t size = 0;

	char c = *cstr++;

	while(c != '\0')
	{
		if (c == '"')
		{
			if(size+2 >= med)
			{
				med += 1024;
				*iCurAllocSize = med;
				result = (char *) REALLOC(result, med);
			}

			result[size++] = '\\';
			result[size++] = '"';
		}
		else if (c == '\n')
		{
			if(size+2 >= med)
			{
				med += 1024;
				*iCurAllocSize = med;
				result = (char *) REALLOC(result, med);
			}

			result[size++] = '\\';
			result[size++] = 'n';
		}
		else if (c == '\\')
		{
			if(size+2 >= med)
			{
				med += 1024;
				*iCurAllocSize = med;
				result = (char *) REALLOC(result, med);
			}

			result[size++] = '\\';
			result[size++] = '\\';

		}
		else
		{
			if(size+1 >= med) 
			{
				med += 1024;
				*iCurAllocSize = med;
				result = (char *) REALLOC(result, med);
			}
			if (isprint(c))
				result[size++] = c;
			else
				result[size++] = ' ';
		}
		c = *(cstr++);

	}

	result[size] = '\0';

	return result;
}
