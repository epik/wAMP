

#ifndef WORMP3_INDEXER_H
#define WORMP3_INDEXER_H

#include "config.h"

#include <stdint.h>
#include <cstring>

#include "FMGuiDir.h"
#include "../Decoders/FFmpegModule.h"

#include "../WormDebug.h"


#define SONG 	1
#define DIR 	2

struct SongItem
{
	char 		Path[1024];
	char		Name[512];

	char		Artist[256];
	char		Album[256];
	char		Genre[256];
	char		Title[256];

	int16_t		Type;

	SongItem	*Next;
	SongItem	*NextArtist;
	SongItem	*NextAlbum;
	SongItem	*NextGenre;
	SongItem	*NextTitle;

	SongItem(const char *cstrPath, const char *cstrName)
	{
		wAMPstrcpy(Path, cstrPath, 1024);

		wAMPstrcpy(Name, cstrName, 512);

		Artist[0] = '\0';
		Album[0] = '\0';
		Genre[0] = '\0';
		Title[0] = '\0';
		Next = NULL;
		Type = SONG;
	};

	void SetArtist(const char *strArtist)
	{
		if (strArtist == NULL)
			return;
		else
			ConvertQuoteStrcpy(Artist, strArtist);
	};

	void SetAlbum(const char *strAlbum)
	{
		if (strAlbum == NULL)
			return;
		else
			ConvertQuoteStrcpy(Album, strAlbum);
	};

	void SetGenre(const char *strGenre)
	{
		if (strGenre == NULL)
			return;
		else
			ConvertQuoteStrcpy(Genre, strGenre);
	};

	void SetTitle(const char *strTitle)
	{
		if (strTitle == NULL)
			return;
		else
			ConvertQuoteStrcpy(Title, strTitle);
	};

	// Returns negative number if this is less than node
	// returns positive number if this is greater than node
	// returns 0 if equal
	int16_t Compare(SongItem *node)
	{
		if (node == NULL)
			return -1;

		if (node->Type != Type)
		{
			if (node->Type == DIR)
				return 1;
			else
				return -1;
		}

		return strcmp(Name,node->Name);
	};


	int16_t CompareArtist(SongItem *node)
	{
		if (node == NULL)
			return -1;

		if (node->Type != Type)
		{
			if (node->Type == DIR)
				return 1;
			else
				return -1;
		}

		return strcmp(Artist,node->Artist);
	};


	int16_t CompareAlbum(SongItem *node)
	{
		if (node == NULL)
			return -1;

		if (node->Type != Type)
		{
			if (node->Type == DIR)
				return 1;
			else
				return -1;
		}

		return strcmp(Album,node->Album);
	};


	int16_t CompareGenre(SongItem *node)
	{
		if (node == NULL)
			return -1;

		if (node->Type != Type)
		{
			if (node->Type == DIR)
				return 1;
			else
				return -1;
		}

		return strcmp(Genre,node->Genre);
	};


	int16_t CompareTitle(SongItem *node)
	{
		if (node == NULL)
			return -1;

		if (node->Type != Type)
		{
			if (node->Type == DIR)
				return 1;
			else
				return -1;
		}

		return strcmp(Title,node->Title);
	};

	// Output to string
	char *ToString();
	char *ToStringMeta();
};


/*****************************
 * Structure to build the list of files
 ****************************/
struct IndexStruct
{
	SongItem *Root;
	SongItem *ArtistRoot;
	SongItem *AlbumRoot;
	SongItem *GenreRoot;
	SongItem *TitleRoot;

	IndexStruct() {Root = NULL;};

	void Clear()
	{
		SongItem *iter = Root;

		while(iter != NULL)
		{
			Root = Root->Next;
			delete[] iter;
			iter = Root;
		}

		Root = NULL;
	}

	void AddNode(SongItem *NewNode)
	{
		if ((Root == NULL) || (NewNode->Compare(Root) < 0))
		{
			NewNode->Next = Root;
			Root = NewNode;
			return;
		}

		SongItem *iter = Root;

		while(NewNode->Compare(iter->Next) > 0)
			iter = iter->Next;

		NewNode->Next = iter->Next;
		iter->Next = NewNode;
	}

};

#define BUILD_TYPE_FAST 0
#define BUILD_TYPE_SLOW 1

class WormIndexer
{
private:

	char *m_cstrIndexJSON;

	int16_t m_sRunYet;

	IndexStruct m_FilesNameIndex;
	SongItem *m_FilesIter;

	IndexStruct	m_CurDirLS;
	SongItem *m_FFIter;
	int16_t	m_iBuildType;

	FFmpegWrapper m_ffmpegObjectAll;
	FFmpegWrapper m_ffmpegObjectDir;
	
	SongItem *GetNextFileFromAll();

	SongItem *GetNextFileFromFolder();

	char m_cstrHomeDir[512];

	char m_cstrCurrentIndexDir[512];

	int m_iIndexingInProgress;

public:

	const char *GetCurrentIndexDir() {return m_cstrCurrentIndexDir;};

	int GetIndex() {return m_iIndexingInProgress;};

	int GetRunYet() {return m_sRunYet;};

	int IsPlayable(const char *m_cstrPath);

	static void *StartIndexThread(void *);

	WormIndexer()
	{
		m_ffmpegObjectDir.Init();
		m_ffmpegObjectAll.Init();
		strcpy(m_cstrHomeDir, HOME_DIR);
		m_iIndexingInProgress = 1;
		m_sRunYet = 0;
	};

	void SetHomeDir(char *cstrDir) {strcpy(m_cstrHomeDir, cstrDir);};

	void BuildIndex();
	
	void ClearIndex();

	void GetFullFileList();

	void GetDirFileList(const char *cstrDirName, int iBuildType = BUILD_TYPE_FAST);

	char *ConvertToJSON(MUS_MESSAGE msg);

	char *GetMetadata(const char *cstrPath);
};





#endif
