

#ifndef WORMP3_INDEXER_H
#define WORMP3_INDEXER_H

#include "config.h"

#include <stdint.h>
#include <cstring>

#include "FMGuiDir.h"
#include "GeneralHashFunctions.h"
#include "../Decoders/FFmpegModule.h"

#include "../WormDebug.h"
#include "../WormThread.h"

#include <EASTL/string.h>


#define SONG 	1
#define DIR 	2

#define READ_INDEX_OLD_VER 		2
#define READ_INDEX_BAD_FILE		1
#define READ_INDEX_GOOD			0

#define CHECK_FOR_IMG_MAX		512

extern int16_t g_IndexingStatus;

struct FileEntry
{
	char 		*Path;
	char		*Name;
	char		*Artist;
	char		*Album;
	char		*Title;
	char		*Genre;
	uint32_t	Hash;
	time_t		LastMod;
	FileEntry 	*Next;
	int16_t		Type;

	void Init(char *cstrPath, char *cstrName, time_t tTime)
	{
		Path = cstrPath;
		Name = cstrName;
		LastMod = tTime;
		Next = NULL;
		Genre = NULL;
		Title = NULL;
		Album = NULL;
		Artist = NULL;
		Type = SONG;
	}

	void Init(char *cstrPath, char *cstrName)
	{
		Path = cstrPath;
		Name = cstrName;
		Next = NULL;
		Genre = NULL;
		Title = NULL;
		Album = NULL;
		Artist = NULL;
		Type = SONG;
	}


	void Init()
	{
		Path = NULL;
		Name = NULL;
		Next = NULL;
		Genre = NULL;
		Title = NULL;
		Album = NULL;
		Artist = NULL;
	}

	void SetTitle(const char *cstr)
	{
		Title = SafeStringCopy(cstr);
		if (Title == NULL)
		{
			Title = (char *) MALLOC(2);
			*Title = '\0';
		}
	}

	void SetArtist(const char *cstr)
	{
		Artist = SafeStringCopy(cstr);
		if (Artist == NULL)
		{
			Artist = (char *) MALLOC(2);
			*Artist = '\0';
		}
	}

	void SetAlbum(const char *cstr)
	{
		Album = SafeStringCopy(cstr);
		if (Album == NULL)
		{
			Album = (char *) MALLOC(2);
			*Album = '\0';
		}
	}

	void SetGenre(const char *cstr)
	{
		Genre = SafeStringCopy(cstr);
		if (Genre == NULL)
		{
			Genre = (char *) MALLOC(2);
			*Genre = '\0';
		}
	}

	void SetMeta(FFmpegWrapper *FFmpeg);

	void Uninit()
	{
		FREE(Path);
		FREE(Name);
		FREE(Artist);
		FREE(Genre);
		FREE(Album);
		FREE(Title);
	}

	void Harvest(FileEntry *pNode)
	{
		Artist = pNode->Artist;
		pNode->Artist = NULL;
		Album = pNode->Album;
		pNode->Album = NULL;
		Genre = pNode->Genre;
		pNode->Genre = NULL;
		Title = pNode->Title;
		pNode->Title = NULL;
	}

	/**********************
	 * CheckEquality()
	 *
	 * 	Check the relationship between two nodes
	 *
	 * RETURN:
	 * 		-1 - if this < pCompNode, or if Hash is equal but text is not
	 * 		0 - if equal
	 * 		1 - if this > pCompNode
	 **********************/
	int16_t CheckEquality(FileEntry *pCompNode)
	{

		if (Hash < pCompNode->Hash)
		{
			return -1;
		}
		else if (Hash > pCompNode->Hash)
		{
			return 1;
		}

		if (strcmp(Path, pCompNode->Path) != 0)
			return -1;

		if (LastMod != pCompNode->LastMod)
			return 1;

		return 0;
	}

	char *ToStringSimple();
};


class FileList
{
private:

	int32_t		m_iTempSize;
	FileEntry 	*m_pRoot;
	char		*m_cstrCurSearchDir;

public:

	FileList()
	{
		Init();
	};

	void Init()
	{
		m_pRoot = NULL;
		// rather than worry about reallocing this, just make it big
		m_cstrCurSearchDir = (char *) malloc(8192);
		m_cstrCurSearchDir[0] = '\0';
	}

	void Uninit()
	{
		FREE(m_cstrCurSearchDir);
		FileEntry *pIter = m_pRoot;

		while (pIter != NULL)
		{
			FileEntry *Temp = pIter->Next;
			pIter->Uninit();
			FREE(pIter);
			pIter = Temp;
		}
	}

	~FileList()
	{
		Uninit();
	}

	void AddNode(FileEntry *pNode)
	{
		AddNodeLite(pNode, APHash(pNode->Path, strlen(pNode->Path)));
	}

	void SetCurrentSearchDir(const char *cstrSearchDir)
	{
		LockFM();
		strcpy(m_cstrCurSearchDir, cstrSearchDir);
		UnlockFM();
	}

	int16_t IsEmpty() {return ((m_pRoot == NULL) ? true : false);};

	void AddNodeLite(FileEntry *pNode, uint32_t uiHash);

	char *ConvertToJSONLite();
};


struct VisitQue
{
	eastl::string Dir;
	VisitQue *Next;

	VisitQue(const char *cstrDir):Dir(cstrDir),Next(NULL)
	{
	}
};

class WormIndexer
{
private:

	char 			*m_cstrIndexJSON;
	eastl::string	m_strHomeDir;
	FileList 		m_flIndex;
	FFmpegWrapper 	m_ffmpegObject;

	int32_t			m_bCurIndexPathSet;

	void 			(*m_funcIndexAdd)(const char *, bool);
	void			(*m_funcFinish)();

	time_t			m_timeLastBuild;

public:

	static volatile int32_t READY;

	static void *StartIndexThread(void *);

	WormIndexer():m_strHomeDir(HOME_DIR)
	{
		m_ffmpegObject.Init();
		m_bCurIndexPathSet = 0;
	};

	void BuildIndex(int32_t, const char*);

	void RunIndexer();

	bool CheckForDir(const char *cstrDir, int32_t bCheckForFolder, int32_t bCreate = 0);

	char *GetDirFileList(const char *cstrDirName);

	const char *GetMetadata(const char *cstrTag);

	int32_t	CheckForImg(const char *cstrPath,
						char *retVal);

	void SetMetadataPath(const char *cstrPath);

	void SetCallback(void (*funcFinish)(),
					 void (*funcIndexAdd)(const char *, bool))
	{
		m_funcFinish = funcFinish;
		m_funcIndexAdd = funcIndexAdd;
	}
};





#endif
