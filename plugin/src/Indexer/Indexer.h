

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


	char *ToStringMeta();
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

	char *ConvertToPathString();
	
	char *ConvertToJSON(int16_t sForce = 0);

	char *ConvertToJSONLite();
};


struct VisitQue
{
	char 	 *Dir;
	int32_t	 Hash;
	VisitQue *Next;

	VisitQue(const char *cstrDir)
	{
		Dir = (char *) malloc(strlen(cstrDir) + 2);
		strcpy(Dir, cstrDir);
		Hash = SDBMHash(Dir, strlen(Dir));
		Next = NULL;
	}

	void AddToQue(VisitQue *NewNode)
	{
		VisitQue *iter = this;

		while(iter->Next != NULL)
			iter = iter->Next;

		iter->Next = NewNode;
	}

	int16_t CheckIfValInQue(char *cstrDirToSearch)
	{
		VisitQue *iter = this;

		int32_t iHash = SDBMHash(cstrDirToSearch, strlen(cstrDirToSearch));

		while ((iHash != iter->Hash) && (strcmp(iter->Dir, cstrDirToSearch) != 0))
		{
			if (iter->Next == NULL)
				return 0;

			iter = iter->Next;
		}

		return 1;
	}
};

class WormIndexer
{
private:

	char 			*m_cstrIndexJSON;
	char 			*m_cstrHomeDir;
	FileList 		m_flIndex;
	FFmpegWrapper 	m_ffmpegObject;

	int32_t			m_bCurIndexPathSet;

	void 			(*m_funcIndexAdd)(const char *, int32_t);
	void			(*m_funcFinish)();

public:

	static volatile int32_t READY;

	static void *StartIndexThread(void *);

	WormIndexer()
	{
		m_ffmpegObject.Init();
		m_cstrHomeDir = (char *) MALLOC(strlen(HOME_DIR) + 1);
		strcpy(m_cstrHomeDir, HOME_DIR);
		m_bCurIndexPathSet = 0;
	};

	void BuildIndex();
	
	void ClearIndex();

	void RunIndexer();

	char *GetIndexer();

	char *GetDirFileList(const char *cstrDirName);

	const char *GetMetadata(const char *cstrTag);

	int32_t	CheckForImg(const char *cstrPath,
						char *retVal);

	void SetMetadataPath(const char *cstrPath);

	void SetCallback(void (*funcFinish)(),
					 void (*funcIndexAdd)(const char *, int32_t))
	{
		m_funcFinish = funcFinish;
		m_funcIndexAdd = funcIndexAdd;
	}
};





#endif
