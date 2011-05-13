/***
 * File:   MemoryManager.h - Header File
 *         -----------------------------------------------------
 * Author: Peter Dalton
 * Date:   3/23/01 1:15:27 PM
 *
 * Description:
			This Memory Manager software provides the following functionality:
			  1. Seamless interface.
			  2. Tracking all memory allocations and deallocations.
				3. Reporting memory leaks, unallocated memory.
				4. Reporting memory bounds violations.
				5. Reporting the percentage of allocated memory that is actually being used.
				6. Customizable tracking.

	    The code is self documented, thus reading through this header file should tell you
			everything that you would ever need to know inorder to use the memory manager. 
 *
 * Copyright (C) Peter Dalton, 2001. 
 * All rights reserved worldwide.
 *
 * This software is provided "as is" without express or implied warranties. You may freely copy 
 * and compile this source into applications you distribute provided that the copyright text
 * below is included in the resulting source code, for example:
 *                  "Portions Copyright (C) Peter Dalton, 2001"
 */

#ifndef _MEMORYMANAGER_H__
#define _MEMORYMANAGER_H__   

#ifdef _DEBUG 
#define ACTIVATE_MEMORY_MANAGER
#endif

//#define ACTIVATE_MEMORY_MANAGER

#include "new_on.h"
#include <stdlib.h>           // Required for malloc() and free()

// Only activate the memory manager if the flag has been defined.  This allows for the 
// performance hit to be avoided if desired.
#ifdef ACTIVATE_MEMORY_MANAGER

/*******************************************************************************************/
// ***** User interface, these methods can be used to set parameters within the Memory 
// ***** Manager to control the type and extent of the memory tests that are performed.  Note 
// ***** that it is not necessary to call any of these methods, you will get the default 
// ***** Memory Manager automatically.

void dumpLogReport( void );          
/* dumpLogReport():
 *  Dump the log report to the file, this is the same method that is automatically called 
 *  upon the programs termination to report all statistical information.
 */ 

void dumpMemoryAllocations( void );  
/* dumpMemoryAllocations():
 *  Report all allocated memory to the log file.
 */ 

void setLogFile( char *file ); 
/* setLogFile():
 *  Allows for the log file to be changed from the default.
 */

void setExhaustiveTesting( bool test = true );
/* setExhaustiveTesting():
 *  This method allows for exhaustive testing.  It has the same functionality as the following
 *  function calls => setLogAlways( true ); setPaddingSize( 1024 ); 
 */ 

void setLogAlways( bool log = true );
/* setLogAlways():
 *  Sets the flag for exhaustive information logging.  All information is sent to the log file.
 */
 
void setPaddingSize( int size = 4 );
/* setPaddingSize():
 *  Sets the padding size for memory bounds checks.
 */
 
void cleanLogFile( bool clean = true );
/* cleanLogFile():
 *  Cleans out the log file by deleting it.
 */ 

void breakOnAllocation( int allocationCount );
/* breakOnAllocation():
 *  Allows you to set a break point on the n-th allocation.
 */ 

void breakOnDeallocation( void *address ); 
/* breakOnDeallocation():
 *  Sets a flag that will set a break point when the specified memory is deallocated.
 */ 

void breakOnReallocation( void *address );
/* breakOnReallocation():
 *  Sets a flag that will set a break point when the specified memory is reallocated by 
 *  using the realloc() method.
 */


/*******************************************************************************************/
// ***** Memory Manager specific definitions.  Below are the definitions that make up the 
// ***** Memory Manager.
 
// Posible allocation/deallocation types.  
typedef char ALLOC_TYPE;
const ALLOC_TYPE MM_UNKNOWN        = 0;  // Declared as characters to minimize memory footprint, 
const ALLOC_TYPE MM_NEW            = 1;  //   char = 1 byte
const ALLOC_TYPE MM_NEW_ARRAY      = 2;  //   enum types = int = 32 bits = 8 bytes on standard machines
const ALLOC_TYPE MM_MALLOC         = 3;
const ALLOC_TYPE MM_CALLOC         = 4;
const ALLOC_TYPE MM_REALLOC        = 5;
const ALLOC_TYPE MM_DELETE         = 6;
const ALLOC_TYPE MM_DELETE_ARRAY   = 7;
const ALLOC_TYPE MM_FREE           = 8;

extern void *AllocateMemory( const char *file, int line, size_t size, ALLOC_TYPE type, void *address = NULL );
/* AllocateMemory():
 *  This is the main memory allocation routine, this is called by all of the other 
 *  memory allocation routines to allocate and track memory.
 */ 

extern void deAllocateMemory( const char *file, int line, void *address, ALLOC_TYPE type );
/* deAllocateMemory():
 *  This is the main memory deallocation routine.  This method is used by all of the 
 *  other de-allocation routines for de-allocating and tracking memory.
 */ 


/*******************************************************************************************/
// ***** Here we define a static class that will be responsible for initializing the Memory
// ***** Manager.  It is critical that it is placed here within the header file to ensure
// ***** that this static object will be created before any other static objects are 
// ***** intialized.  This will ensure that the Memory Manager is alive when other static
// ***** objects allocate and deallocate memory.  Note that static objects are deallocated
// ***** in the reverse order in which they are allocated, thus this class will be 
// ***** deallocated last.

class Initialize { public: Initialize(); };
static Initialize InitMemoryManager;


#endif /* ACTIVATE_MEMORY_MANAGER */

#endif /* _MEMORYMANAGER_H__ */

// ***** End of MemoryManager.h
/*******************************************************************************************/
/*******************************************************************************************/
