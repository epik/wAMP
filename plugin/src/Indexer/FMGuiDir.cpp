/*
 * Copyright (c) 2004-2008 Hypertriton, Inc. <http://hypertriton.com/>
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

#include "../WormDebug.h"

#include <sys/types.h>
#include <stdlib.h>

#include "FMGuiDir.h"

#ifdef _WIN32
# include <windows.h>
#else
# include <sys/stat.h>
# include <dirent.h>
# include <unistd.h>
#endif

#include <cstring>
#include <errno.h>



#ifdef _WIN32
int
FMGUI_GetFileInfo(const char *path, FMGUI_FileInfo *i)
{
	DWORD attrs;
	FILE *f;
	
	if ((attrs = GetFileAttributes(path)) == INVALID_FILE_ATTRIBUTES) {
		ReportError1("%s: Failed to get information", path);
		return (-1);
	}
	i->flags = 0;
	i->perms = 0;

	if (attrs & FILE_ATTRIBUTE_DIRECTORY) {
		i->type = FMGUI_FILE_DIRECTORY;
		i->perms |= FMGUI_FILE_EXECUTABLE;
	} else {
		i->type = FMGUI_FILE_REGULAR;
	}
	if (attrs & FILE_ATTRIBUTE_ARCHIVE) i->flags |= FMGUI_FILE_ARCHIVE;
	if (attrs & FILE_ATTRIBUTE_COMPRESSED) i->flags |= FMGUI_FILE_COMPRESSED;
	if (attrs & FILE_ATTRIBUTE_ENCRYPTED) i->flags |= FMGUI_FILE_ENCRYPTED;
	if (attrs & FILE_ATTRIBUTE_HIDDEN) i->flags |= FMGUI_FILE_HIDDEN;
	if (attrs & FILE_ATTRIBUTE_SPARSE_FILE) i->flags |= FMGUI_FILE_SPARSE;
	if (attrs & FILE_ATTRIBUTE_SYSTEM) i->flags |= FMGUI_FILE_SYSTEM;
	if (attrs & FILE_ATTRIBUTE_TEMPORARY) i->flags |= FMGUI_FILE_TEMPORARY;
	
	if ((f = fopen(path, "rb")) != NULL) {
		fclose(f);
		i->perms |= FMGUI_FILE_READABLE;
	}
	if (((attrs & FILE_ATTRIBUTE_READONLY) == 0) &&
	    (f = fopen(path, "a")) != NULL) {
		fclose(f);
		i->perms |= FMGUI_FILE_WRITEABLE;
	}
	return (0);
}

#else /* !_WIN32 */

int
FMGUI_GetFileInfo(const char *path, FMGUI_FileInfo *i, time_t *ptimeLasMod)
{
	struct stat sb;
	uid_t uid = geteuid();
	gid_t gid = getegid();

	if (stat(path, &sb) == -1) {

		return (-1);
	}
	i->type = FMGUI_FILE_REGULAR;
	i->flags = 0;
	i->perms = 0;

	if (ptimeLasMod)
		*ptimeLasMod = sb.st_mtime;

	if ((sb.st_mode & S_IFDIR)==S_IFDIR) {
		i->type = FMGUI_FILE_DIRECTORY;
	} else if ((sb.st_mode & S_IFLNK)==S_IFLNK) {
		i->type = FMGUI_FILE_SYMLINK;
	} else if ((sb.st_mode & S_IFIFO)==S_IFIFO) {
		i->type = FMGUI_FILE_FIFO;
	} else if ((sb.st_mode & S_IFSOCK)==S_IFSOCK) {
		i->type = FMGUI_FILE_SOCKET;
	} else if ((sb.st_mode & S_IFCHR)==S_IFCHR) {
		i->type = FMGUI_FILE_DEVICE;
	} else if ((sb.st_mode & S_IFBLK)==S_IFBLK) {
		i->type = FMGUI_FILE_DEVICE;
	}
	if ((sb.st_mode & S_ISUID) == S_ISUID) i->flags |= FMGUI_FILE_SUID;
	if ((sb.st_mode & S_ISGID) == S_ISGID) i->flags |= FMGUI_FILE_SGID;

	if (sb.st_uid == uid) {
		i->perms |= (sb.st_mode & S_IRUSR) ? FMGUI_FILE_READABLE : 0;
		i->perms |= (sb.st_mode & S_IWUSR) ? FMGUI_FILE_WRITEABLE : 0;
		i->perms |= (sb.st_mode & S_IXUSR) ? FMGUI_FILE_EXECUTABLE : 0;
	} else if (sb.st_gid == gid) {
		i->perms |= (sb.st_mode & S_IRGRP) ? FMGUI_FILE_READABLE : 0;
		i->perms |= (sb.st_mode & S_IWGRP) ? FMGUI_FILE_WRITEABLE : 0;
		i->perms |= (sb.st_mode & S_IXGRP) ? FMGUI_FILE_EXECUTABLE : 0;
	} else {
		i->perms |= (sb.st_mode & S_IROTH) ? FMGUI_FILE_READABLE : 0;
		i->perms |= (sb.st_mode & S_IWOTH) ? FMGUI_FILE_WRITEABLE : 0;
		i->perms |= (sb.st_mode & S_IXOTH) ? FMGUI_FILE_EXECUTABLE : 0;
	}
	return (0);
}

#endif /* _WIN32 */

int
FMGUI_GetSystemTempDir(char *buf, size_t len)
{
#ifdef _WIN32
	if (GetTempPath((DWORD)len, buf) == 0) {
		ReportError0("GetTempPath() failed");
		return (-1);
	}
	return (0);
#else
	strncpy(buf, "/tmp/", len);
	return (0);
#endif
}

int
FMGUI_FileExists(const char *path)
{
#ifdef _WIN32
	if (GetFileAttributes(path) == INVALID_FILE_ATTRIBUTES) {
		if (GetLastError() == ERROR_FILE_NOT_FOUND ||
		    GetLastError() == ERROR_PATH_NOT_FOUND) {
			return (0);
		} else {
			ReportError2("%s: Failed to determine existence of file (%lu)",
						path, (Ulong)GetLastError());
			return (-1);
		}
	} else {
		return (1);
	}
#else
	struct stat sb;

	if (stat(path, &sb) == -1) {
		if (errno != ENOENT) {
			ReportError2("%s: Failed to determine existence of file (%s)",
					path, strerror(errno));
			return (-1);
		}
		return (0);
	} else {
		return (1);
	}
#endif /* _WIN32 */
}

int
FMGUI_FileDelete(const char *path)
{
#ifdef _WIN32
	if (DeleteFile(path) == 0) {
		ReportError2("%s: Failed to delete file (%lu)", path,
		    (Ulong)GetLastError());
		return (-1);
	}
	return (0);
#else
	if (unlink(path) == -1) {
		ReportError2("%s: Failed to delete file (%s)", path,
		    strerror(errno));
		return (-1);
	}
	return (0);
#endif
}

/* Return the last element in a pathname. */
const char *
FMGUI_ShortFilename(const char *p)
{
	const char *s;

	s = (const char *)strrchr(p, FMGUI_PATHSEPCHAR);
	return (s != NULL && s>p) ? &s[1] : p;
}



int
FMGUI_MkDir(const char *dir)
{
#ifdef _WIN32
	if (CreateDirectory(dir, NULL)) {
		return (0);
	} else {
		ReportError2("%s: Failed to create directory (%d)", dir,
		    (int)GetLastError());
		return (-1);
	}
#else
	if (mkdir(dir, 0700) == 0) {
		return (0);
	} else {
		ReportError2("%s: Failed to create directory (%s)", dir,
		    strerror(errno));
		return (-1);
	}
#endif
}

int
FMGUI_RmDir(const char *dir)
{
#ifdef _WIN32
	if (RemoveDirectory(dir)) {
		return (0);
	} else {
		ReportError2("%s: Failed to remove directory (%d)", dir,
		    (int)GetLastError());
		return (-1);
	}
#else
	if (rmdir(dir) == 0) {
		return (0);
	} else {
		ReportError2("%s: Failed to remove directory (%s)", dir,
		    strerror(errno));
		return (-1);
	}
#endif
}

int
FMGUI_ChDir(const char *dir)
{
#ifdef _WIN32
	if (SetCurrentDirectory(dir)) {
		return (0);
	} else {
		ReportError2("%s: Failed to change directory (%d)", dir,
		    (int)GetLastError());
		return (-1);
	}
#else
	if (chdir(dir) == 0) {
		return (0);
	} else {
		ReportError2("%s: Failed to change directory (%s)", dir,
		    strerror(errno));
		return (-1);
	}
#endif
}

FMGUI_Dir *
FMGUI_OpenDir(const char *path)
{
	FMGUI_Dir *dir;

	dir = (FMGUI_Dir *) Malloc(sizeof(FMGUI_Dir));
	dir->ents = NULL;
	dir->nents = 0;

#ifdef _WIN32
	{
		char dpath[FMGUI_PATHNAME_MAX];
		HANDLE h;
		WIN32_FIND_DATA fdata;
		DWORD rv;

		Strlcpy(dpath, path, sizeof(dpath));
		Strlcat(dpath, "\\*", sizeof(dpath));
		if ((h = FindFirstFile(dpath, &fdata))==INVALID_HANDLE_VALUE) {
			ReportError1("Invalid file handle (%d)",
			    (int)GetLastError());
			goto fail;
		}
		while (FindNextFile(h, &fdata) != 0) {
			dir->ents = Realloc(dir->ents,
			    (dir->nents+1)*sizeof(char *));
			dir->ents[dir->nents++] = Strdup(fdata.cFileName);
		}
		rv = GetLastError();
		FindClose(h);
		if (rv != ERROR_NO_MORE_FILES) {
			ReportError1("FindNextFileError (%lu)", rv);
			goto fail;
		}
	}
#else /* !_WIN32 */
	{
		DIR *dp;
		struct dirent *dent;
		
		if ((dp = opendir(path)) == NULL) {
			ReportError2("%s: Failed to open directory (%s)",
			    path, strerror(errno));
			goto fail;
		}
		while ((dent = readdir(dp)) != NULL) {
			dir->ents = (char **) Realloc(dir->ents,
			    (dir->nents+1)*sizeof(char *));
			dir->ents[dir->nents++] = strdup(dent->d_name);
		}
		closedir(dp);
	}
#endif /* _WIN32 */

	return (dir);
fail:
	Free(dir);
	return (NULL);
}

void
FMGUI_CloseDir(FMGUI_Dir *dir)
{
	int i;

	for (i = 0; i < dir->nents; i++) {
		Free(dir->ents[i]);
	}
	Free(dir->ents);
	Free(dir);
}

int
FMGUI_MkPath(const char *path)
{
	FMGUI_FileInfo info;
	char *pathp, *slash;
	int done = 0;
	int rv;

	slash = pathp = strdup(path);

	while (!done) {
		slash += strspn(slash, FMGUI_PATHSEP);
		slash += strcspn(slash, FMGUI_PATHSEP);

		done = (*slash == '\0');
		*slash = '\0';

		time_t time;

		if (FMGUI_GetFileInfo(pathp, &info, &time) == -1) {
			if ((rv = FMGUI_FileExists(pathp)) == -1) {
				goto fail;
			} else if (rv == 0) {
				if (FMGUI_MkDir(pathp) == -1)
					goto fail;
			}
		} else if (info.type != FMGUI_FILE_DIRECTORY) {
			ReportError1("%s: Existing file", pathp);
			goto fail;
		}

		*slash = FMGUI_PATHSEPCHAR;
	}
	Free(pathp);
	return (0);
fail:
	Free(pathp);
	return (-1);
}

int
FMGUI_GetCWD(char *buf, size_t len)
{
#ifdef _WIN32
	DWORD rv;

	if ((rv = GetCurrentDirectory(len, buf)) == 0) {
		ReportError1("Failed to get current directory (%d)",
		    (int)GetLastError());
		return (-1);
	} else if (rv > len) {
		FReportError1("Failed to get current directory (%s)",
		    "Path name is too long");
		return (-1);
	}
	return (0);
#else
	if (getcwd(buf, len) == NULL) {
		ReportError1("Failed to get current directory (%s)",
		    strerror(errno));
		return (-1);
	}
	return (0);
#endif
}

int
PathIsFilesystemRoot(const char *path)
{
#ifndef ON_DEVICE
#ifdef _WIN32
	return isalpha(path[0]) && path[1] == ':' &&
	       (path[2] == '\0' || (path[2] == '\\' && path[3] == '\0'));
#else
	return (path[0] == FMGUI_PATHSEPCHAR && path[1] == '\0');
#endif
#else
	// Since palm gives us so little access to the file system.  It is
	//	easiest if we just assume root is /media/internal
	return (strcmp(path, "/media/internal") == 0);
#endif
}

char *SafeStringIn(FILE *file)
{
	char	*result;
	int		size, med, c;
	
	med = size = 0;
	result = (char *) malloc(16);
	
	c = fgetc(file);
	
	if(c == EOF)
		return NULL;
	
	while(!(c == EOF || c == '\n' || c == '\0')) {
		if(size == med) {
			med += 64;
			result = (char *) realloc(result, med);
		}
		result[size++] = (char)c;
		c = fgetc(file);
	}
	
	// Trim allocated buffer to contain only the string and terminating '\0'
	result = (char *) realloc(result, size + 1);

	result[size] = '\0';
	
	return result;
}
