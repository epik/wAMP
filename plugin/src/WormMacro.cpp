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


const int16_t NUM_EXTEN = 18;

uint32_t g_puiExtenHashVals[] = {5863768, 193436047, 193485930, 193486309, 193497511, 193499443, 193499444,
						193499445, 193499446, 193499497, 193501378, 193501753, 193504453, 193509907,
						193510282, 193510303, 2089074171, 2090260091};
// These are all the hash values of the following using DJBHash
char *g_pcExten[] = {"ra", "3gp", "aac", "als", "m4a", "mp1", "mp2",
					 "mp3", "mp4", "mpg", "ogg", "ors", "ram", "wav",
					 "wma", "wmv", "FLAC", "flac"};



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

        uint32_t iHash = DJBHash(ext, sLen);

        for(int i=0; i<18; i++)
        {
            if (iHash < g_puiExtenHashVals[i])
            	return 0;
            else if (iHash == g_puiExtenHashVals[i])
            {
            	if (strcmp(ext, g_pcExten[i]) == 0)
            		return 1;
            	else
            		return 0;
            }
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

char *SafeStringCopy(const char *cstr)
{
	char	*result;
	int		size, med;

	med = size = 0;
	result = (char *) malloc(16);

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
				result = (char *) realloc(result, med);
			}

			result[size++] = '\\';
			result[size++] = '"';
		}
		else if (c == '\n')
		{
			if(size+1 >= med)
			{
				med += 64;
				result = (char *) realloc(result, med);
			}

			result[size++] = '\\';
			result[size++] = 'n';
		}
		else if (c == '\\')
		{
			if(size+1 >= med)
			{
				med += 64;
				result = (char *) realloc(result, med);
			}

			result[size++] = '\\';
			result[size++] = '\\';

		}
		else
		{
			if(size >= med) {
				med += 64;
				result = (char *) realloc(result, med);
			}
			result[size++] = c;
		}
		c = *(cstr++);

	}

	// Trim allocated buffer to contain only the string and terminating '\0'
	result = (char *) realloc(result, size + 1);

	result[size] = '\0';

	return result;
}
