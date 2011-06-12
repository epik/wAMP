/*
 * wormp3macro.h
 *
 *  Created on: Aug 19, 2010
 *      Author: Katiebird
 */

#include "config.h"

#ifndef WORMP3MACRO_H_
#define WORMP3MACRO_H_

#include <assert.h>
#include <stdio.h>
#include <syslog.h>
#include <stdlib.h>
#include "WormDebug.h"


// Graphics Macros
#define AssignProperVertsWithC(x, y, w, h, c) \
{	\
	(GLfloat)x, (GLfloat)y, (GLfloat) c, \
	(GLfloat)(x+w), (GLfloat)y, (GLfloat) c,	\
	(GLfloat)x, (GLfloat)(y+h), (GLfloat) c,	\
	(GLfloat)(x+w), (GLfloat)(y+h), (GLfloat) c	\
}

#define AssignProperVerts(x, y, w, h) \
{	\
	(GLfloat)x, (GLfloat)y,	\
	(GLfloat)(x+w), (GLfloat)y,	\
	(GLfloat)x, (GLfloat)(y+h),	\
	(GLfloat)(x+w), (GLfloat)(y+h),	\
}

#define AssignProperUVCoord(u1, v1, u2, v2) \
{	\
	u1, v2, \
	u2, v2, \
	u1, v1, \
	u2, v1  \
}

#define Distance(x, y) sqrt((x*x)+(y*y))

#define MAX(a,b) ((a) > (b) ? (a) : (b))

#define MIN(a,b) ((a) < (b) ? (a) : (b))

// A macro to generate the standard enum functions
#define DefineEnumIteratorsMacro(eEnumType) \
inline void operator++(eEnumType& eVal) \
{ \
    eVal = eEnumType(eVal+1); \
} \
\
inline void operator++(eEnumType& eVal, int)  \
{ \
    eVal = eEnumType(eVal+1); \
} \
\
inline void operator--(eEnumType& eVal) \
{ \
    eVal = eEnumType(eVal-1); \
} \
\
inline void operator--(eEnumType& eVal, int)  \
{ \
    eVal = eEnumType(eVal-1); \
}

// Macro used to allow other macros to encase a variable
//	in quotes
#define QUOTEME_(x) #x
#define QUOTEME(x) QUOTEME_(x)


// Memory Macros
#define MEM_ALIGN_AMT 32
#ifdef DEBUG
inline void *WormMalloc(char *filename, int line, size_t size)
#else
inline void *WormMalloc(size_t size)
#endif
{
	void *temp;

#ifdef DEBUG
	int32_t iErr = posix_memalign(&temp, MEM_ALIGN_AMT, size);
/*
	if (iErr != 0)
	{
		syslog(LOG_WARNING, "[MemEvent]: ***PROBLEM with memalign", iErr);
		assert(0);
	}
	syslog(LOG_WARNING, "[MemEvent]: Reading Mem %s (%i) at mem: %i\n", filename, line, temp);
	fprintf(stderr, "[MemEvent]: Reading Mem %s (%i) at mem: %i\n", filename, line, temp);*/
#else
	posix_memalign(&temp, MEM_ALIGN_AMT, size);
#endif
	return temp;
}

// Since we are working with bytes we need to worry about if we are Big or small endian
//	so to keep the code easily portable, we do it automatically with tests.
// (Luckily this has not been a problem so this code really doesn't get used)

//extern bool BigEndianSystem;  //you might want to extern this

//extern void InitEndian();

//extern short ShortSwap(short s);

#define BytesToShort(X, Y) (short)((Y<<8)|(X&0xff))

// This is a function to copy a string and make sure any " are
//	marked with an escape character
extern char *SafeStringCopy(const char *cstr);
extern char *ReallocSafeStringCopy(char *existingDest,
								   int32_t *curAllocSize,
								   const char *cstr);

extern int32_t SafeStringLen(char *);

extern char *ReallocStringCopy(char *dest, int32_t *size, const char *cstr);

extern int QuickExtCheck(const char *filename);

// this is for run time checking, which we don't need here
//#define BytesToShort(X, Y) BigEndianSystem ?(short)((X<<8)|(Y&0xff)):(short)((Y<<8)|(X&0xff))

#endif /* WORMP3MACRO_H_ */
