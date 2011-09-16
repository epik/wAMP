/*	This is based on code from the following copyright holders.
 *	The code falls under the BSD license
 */

/*
 * Copyright (c) 2004-2008 Hypertriton, Inc. &lt;http://hypertriton.com/&gt;
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
 * USE OF THIS SOFTWARE EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Copyright (c) 1983, 1992, 1993
 *	The Regents of the University of California.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the University nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */
 
 
#ifndef FMGUI_FMGUIDIR_H_
#define FMGUI_FMGUIDIR_H_

#include "config.h"
#include "../WormDebug.h"
#include <stdio.h>
#include <time.h>

#ifndef ON_DEVICE
#define HOME_DIR ON_TEST_RIG_HOME_DIR
#else
#define HOME_DIR "/media/internal"
#endif

#define Malloc malloc
#define Free free
#define Realloc realloc

#ifdef _WIN32
#define FMGUI_PATHSEP "\\"
#define FMGUI_PATHSEPCHAR '\\'
#else
#define FMGUI_PATHSEP "/"
#define FMGUI_PATHSEPCHAR '/'
#endif

struct FMGUI_Dir {
	char **ents;
	int nents;
};


enum fmgui_file_info_type {
	FMGUI_FILE_REGULAR,
	FMGUI_FILE_DIRECTORY,
	FMGUI_FILE_DEVICE,
	FMGUI_FILE_FIFO,
	FMGUI_FILE_SYMLINK,
	FMGUI_FILE_SOCKET
};

typedef struct fmgui_file_info {
	enum fmgui_file_info_type type;
	int perms;
#define FMGUI_FILE_READABLE	0x01
#define FMGUI_FILE_WRITEABLE	0x02
#define FMGUI_FILE_EXECUTABLE	0x04
	int flags;
#define FMGUI_FILE_SUID		0x001
#define FMGUI_FILE_SGID		0x002
#define FMGUI_FILE_ARCHIVE		0x004
#define FMGUI_FILE_COMPRESSED	0x008
#define FMGUI_FILE_ENCRYPTED	0x010
#define FMGUI_FILE_HIDDEN		0x020
#define FMGUI_FILE_REPARSE_PT	0x040
#define FMGUI_FILE_SPARSE		0x080
#define FMGUI_FILE_TEMPORARY	0x100
#define FMGUI_FILE_SYSTEM		0x200
} FMGUI_FileInfo;

extern int	   		FMGUI_MkDir(const char *);
extern int	   		FMGUI_RmDir(const char *);
extern int	   		FMGUI_ChDir(const char *);
extern FMGUI_Dir	*FMGUI_OpenDir(const char *);
extern void	   		FMGUI_CloseDir(FMGUI_Dir *);
extern int	   		FMGUI_MkPath(const char *);
extern int	   		FMGUI_GetCWD(char *, size_t);

extern int 			FMGUI_GetFileInfo(const char *, 
									  FMGUI_FileInfo *, 
									  time_t *t = 0);
extern int 			FMGUI_GetSystemTempDir(char *, size_t);
extern int 			FMGUI_FileExists(const char *);
extern int 			FMGUI_FileDelete(const char *);
extern const char 	*FMGUI_ShortFilename(const char *);

extern char 		*SafeStringIn(FILE *file);

extern int 			PathIsFilesystemRoot(const char *path);


#endif /* _AGAR_CORE_DIR_H_ */
