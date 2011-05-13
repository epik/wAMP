/*
 * WormDebug.h
 *
 *  Created on: Dec 24, 2010
 *      Author: Katiebird
 */

#include "config.h"

#ifndef WORMDEBUG_H_
#define WORMDEBUG_H_

#include <assert.h>
#include <cstring>
#include <stdint.h>
#include "Messages.h"
#include "../src/MemManager/MemoryManager.h"

//**************************************************************
// universal Error stuff -- this handles runtime error passing
//	and is meant for runtime activity, and not just for debuggin.
//*************************************************************
// this is for keeping track of error status codes
extern int32_t g_iErrorCode;
// this is for keeping track of error msgs
extern char g_cstrErrorStr[500];

// Macro for setting the error codes
#define MUS_ERROR(a,b) { \
g_iErrorCode = a; \
strcpy(g_cstrErrorStr, b); \
ReportError1("There was an error: %s", g_cstrErrorStr); \
};

//**************************************************************

#define ERROUT stderr

//**************************************************************
// Code debugging -- this is meant for providing us infor while
//	we are in the development process, and gets turned off in
//	the final release.
//*************************************************************
#ifdef DEBUG

#define wAMPstrcpy(x, y, z)  SafeStrcpy(x, y, z)

extern int16_t SafeStrcpy(char *cstrDest, const char *cstrSrc, int x);

#ifndef ON_DEVICE

#include <stdio.h>

#define ReportError(s) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__)
#define ReportError1(s, a) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a)
#define ReportError2(s, a, b) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b)
#define ReportError3(s, a, b, c) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c)
#define ReportError4(s, a, b, c, d) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d)
#define ReportError5(s, a, b, c, d, e) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e)
#define ReportError6(s, a, b, c, d, e, f) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f)
#define ReportError7(s, a, b, c, d, e, f, g) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g)
#define ReportError8(s, a, b, c, d, e, f, g, h) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h)
#define ReportError9(s, a, b, c, d, e, f, g, h, i) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i)
#define ReportError10(s, a, b, c, d, e, f, g, h, i, j) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i, j)
#define ReportError11(s, a, b, c, d, e, f, g, h, i, j, k) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i, j, k)
#define ReportError12(s, a, b, c, d, e, f, g, h, i, j, k, l) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i, j, k, l)
#define ReportError13(s, a, b, c, d, e, f, g, h, i, j, k, l, m) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i, j, k, l, m)
#define ReportError14(s, a, b, c, d, e, f, g, h, i, j, k, l, m, n) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
#define ReportError15(s, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) fprintf(ERROUT, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)



#else


#include <syslog.h>

#define ReportError(s) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__)
#define ReportError1(s, a) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a)
#define ReportError2(s, a, b) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b)
#define ReportError3(s, a, b, c) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c)
#define ReportError4(s, a, b, c, d) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d)
#define ReportError5(s, a, b, c, d, e) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e)
#define ReportError6(s, a, b, c, d, e, f) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f)
#define ReportError7(s, a, b, c, d, e, f, g) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g)
#define ReportError8(s, a, b, c, d, e, f, g, h) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h)
#define ReportError9(s, a, b, c, d, e, f, g, h, i) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i)
#define ReportError10(s, a, b, c, d, e, f, g, h, i, j) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i, j)
#define ReportError11(s, a, b, c, d, e, f, g, h, i, j, k) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i, j, k)
#define ReportError12(s, a, b, c, d, e, f, g, h, i, j, k, l) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i, j, k, l)
#define ReportError13(s, a, b, c, d, e, f, g, h, i, j, k, l, m) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i, j, k, l, m)
#define ReportError14(s, a, b, c, d, e, f, g, h, i, j, k, l, m, n) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
#define ReportError15(s, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) syslog(LOG_WARNING, "[" __FILE__ ":%i] ReportError: " s "\n", __LINE__, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)

#define Worm_OpenLog(a,b,c) openlog(a, b, c);


#endif // #if DEBUG

#else

#define wAMPstrcpy(x, y, z)  strcpy(x, y)

// No Debug Options go below
#define ReportError(s)
#define ReportError1(s, a)
#define ReportError2(s, a, b)
#define ReportError3(s, a, b, c)
#define ReportError4(s, a, b, c, d)
#define ReportError5(s, a, b, c, d, e)
#define ReportError6(s, a, b, c, d, e, f)
#define ReportError7(s, a, b, c, d, e, f, g)
#define ReportError8(s, a, b, c, d, e, f, g, h)
#define ReportError9(s, a, b, c, d, e, f, g, h, i)
#define ReportError10(s, a, b, c, d, e, f, g, h, i, j)
#define ReportError11(s, a, b, c, d, e, f, g, h, i, j, k)
#define ReportError12(s, a, b, c, d, e, f, g, h, i, j, k, l)
#define ReportError13(s, a, b, c, d, e, f, g, h, i, j, k, l, m)
#define ReportError14(s, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
#define ReportError15(s, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)

#ifndef NDEBUG
#define NDEBUG
#endif


#endif // not on dev

#endif /* WORMDEBUG_H_ */
