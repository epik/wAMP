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
