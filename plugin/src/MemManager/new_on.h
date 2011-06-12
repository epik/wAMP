/***
 * File:   new_on.h - Header File
 *         -----------------------------------------------------
 * Author: Peter Dalton
 * Date:   4/10/2001 2:08:48 PM
 *
 * Description:
			This header allows for the Memory Manager to be turned on/off seamlessly.  Including
			this header will turn the Memory Manager on.
 *
 * Copyright (C) Peter Dalton, 2001. 
 * All rights reserved worldwide.
 *
 * This software is provided "as is" without express or implied warranties. You may freely copy 
 * and compile this source into applications you distribute provided that the copyright text
 * below is included in the resulting source code, for example:
 *                  "Portions Copyright (C) Peter Dalton, 2001"
 */

 #ifndef NEW_ON_H
 #define NEW_ON_H
 
 #include "../WormMacro.h"
 
/*******************************************************************************************/
// These #defines are the core of the memory manager.  This overrides standard memory 
// allocation and de-allocation routines and replaces them with the memory manager's versions.
// This allows for memory tracking and statistics to be generated.

#ifdef ACTIVATE_MEMORY_MANAGER

#include "../WormDebug.h"

#define MALLOC(sz)		 AllocateMemory(   __FILE__, __LINE__, sz,     MM_MALLOC       )
#define CALLOC(num, sz)  AllocateMemory(   __FILE__, __LINE__, sz*num, MM_CALLOC       )
#define REALLOC(ptr, sz) AllocateMemory(   __FILE__, __LINE__, sz,     MM_REALLOC, ptr )
#define FREE(sz)         deAllocateMemory( __FILE__, __LINE__, sz,     MM_FREE         )

#define INIT_LOG(s, f, l) const char *name = s; \
						  const char *file = f; int line = l

#define LogMemEvent(s) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line);
#define LogMemEvent1(s, a) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a)
#define LogMemEvent2(s, a, b) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b)
#define LogMemEvent3(s, a, b, c) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b, c)
#define LogMemEvent4(s, a, b, c, d) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b, c, d)
#define LogMemEvent5(s, a, b, c, d, e) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b, c, d, e)
#define LogMemEvent6(s, a, b, c, d, e, f) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b, c, d, e, f)
#define LogMemEvent7(s, a, b, c, d, e, f, g) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b, c, d, e, f, g)
#define LogMemEvent8(s, a, b, c, d, e, f, g, h) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b, c, d, e, f, g, h)
#define LogMemEvent9(s, a, b, c, d, e, f, g, h, i) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b, c, d, e, f, g, h, i)
#define LogMemEvent10(s, a, b, c, d, e, f, g, h, i, j) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b, c, d, e, f, g, h, i, j)
#define LogMemEvent11(s, a, b, c, d, e, f, g, h, i, j, k) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b, c, d, e, f, g, h, i, j, k)
#define LogMemEvent12(s, a, b, c, d, e, f, g, h, i, j, k, l) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b, c, d, e, f, g, h, i, j, k, l)
#define LogMemEvent13(s, a, b, c, d, e, f, g, h, i, j, k, l, m) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b, c, d, e, f, g, h, i, j, k, l, m)
#define LogMemEvent14(s, a, b, c, d, e, f, g, h, i, j, k, l, m, n) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
#define LogMemEvent15(s, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) fprintf(ERROUT, "**LogMemEvent: [%s]:(%s:%i)" s "\n", name, file, line, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)

#else

#ifdef DEBUG
#define MALLOC(sz)			WormMalloc(__FILE__, __LINE__, sz);
#else
#define MALLOC(sz)			WormMalloc(sz);
#endif

#define CALLOC(num, sz)		calloc(num, sz)
#define REALLOC(ptr, sz)	realloc(ptr, sz)
#define FREE(sz)			/*ReportError1("Free Addy=%i ***********", sz);*/ free(sz)

#define INIT_LOG(s, f, l)

#define LogMemEvent(s)
#define LogMemEvent1(s, a)
#define LogMemEvent2(s, a, b)
#define LogMemEvent3(s, a, b, c)
#define LogMemEvent4(s, a, b, c, d)
#define LogMemEvent5(s, a, b, c, d, e)
#define LogMemEvent6(s, a, b, c, d, e, f)
#define LogMemEvent7(s, a, b, c, d, e, f, g)
#define LogMemEvent8(s, a, b, c, d, e, f, g, h)
#define LogMemEvent9(s, a, b, c, d, e, f, g, h, i)
#define LogMemEvent10(s, a, b, c, d, e, f, g, h, i, j)
#define LogMemEvent11(s, a, b, c, d, e, f, g, h, i, j, k)
#define LogMemEvent12(s, a, b, c, d, e, f, g, h, i, j, k, l)
#define LogMemEvent13(s, a, b, c, d, e, f, g, h, i, j, k, l, m)
#define LogMemEvent14(s, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
#define LogMemEvent15(s, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)

#endif


#endif
// ***** End of new_on.h
/*******************************************************************************************/
/*******************************************************************************************/
