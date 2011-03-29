
#include "Indexer.h"
#include "FMGuiDir.h"
#include "../WormMacro.h"
#include <cstring>
#include <vector>
#include "../Decoders/Decoders.h"
#include "../WormThread.h"
#include <stdio.h>

using namespace std;

struct VisitQue
{
	char Dir[1024];
	VisitQue *Next;

	VisitQue(const char *cstrDir)
	{
		wAMPstrcpy(Dir, cstrDir, 512);
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

		while (strcmp(iter->Dir, cstrDirToSearch) != 0)
		{
			if (iter->Next == NULL)
				return 0;

			iter = iter->Next;
		}

		return 1;
	}
};


void WormIndexer::BuildIndex()
{
	// Don't need to save this, Thread should be self sufficient
	pthread_t Thread;

	// spawn the thread to run MusController's logic loop
	pthread_create(&Thread, NULL, StartIndexThread, this);
}


void WormIndexer::ClearIndex()
{
	FMGUI_FileDelete(HOME_DIR INDEX_STUF);
}

void WormIndexer::GetFullFileList()
{
	m_iIndexingInProgress = 2;

	FILE *pFile;

	pFile = fopen(HOME_DIR INDEX_STUF, "rb");

	if (pFile)
	{
		uint32_t iJSONSize;
		fread(&iJSONSize, sizeof(uint32_t), 1, pFile);

		if (iJSONSize != CHECK_INDEX_KEY)
		{
			m_sRunYet = MUS_INDEX_STATE_FAILED;
			return;
		}

		fread(&iJSONSize, sizeof(uint32_t), 1, pFile);

		m_cstrIndexJSON = (char *) malloc(iJSONSize);

		fread(m_cstrIndexJSON, sizeof(char), iJSONSize, pFile);

		fread(&iJSONSize, sizeof(uint32_t), 1, pFile);

		if (iJSONSize != CHECK_INDEX_KEY)
		{
			m_sRunYet = MUS_INDEX_STATE_FAILED;
			return;
		}

		m_iIndexingInProgress = 0;
		ReportError1("%s", m_cstrIndexJSON);

		m_sRunYet = MUS_INDEX_STATE_ALREADY;

		fclose(pFile);
		return;
	}
	else
	{
		m_sRunYet = MUS_INDEX_STATE_FIRST;

		pFile = fopen(HOME_DIR INDEX_STUF, "wb");

		if (pFile)
		{
			uint32_t i = CHECK_INDEX_KEY;
			fwrite(&i, sizeof(uint32_t), 1, pFile);
		}


	}

	VisitQue *DirsToVisit = new VisitQue(m_cstrHomeDir);
	VisitQue *DirsVisited = NULL;

	FMGUI_FileInfo 	Info;
	FMGUI_Dir 		*pDir;

	while (DirsToVisit != NULL)
	{
		// pop the next dir to search
		char cstrDirName[2048];
		strcpy(cstrDirName, DirsToVisit->Dir);
		VisitQue *Cur = DirsToVisit;
		DirsToVisit = DirsToVisit->Next;
		delete Cur;

		//ReportError1("****Starting search of dir: %s", cstrDirName);

		int16_t bVisited;

		if (DirsVisited == NULL)
			bVisited = 0;
		else
			bVisited = DirsVisited->CheckIfValInQue(cstrDirName);
		
		if (!bVisited)
		{
			if (DirsVisited == NULL)
				DirsVisited = new VisitQue(cstrDirName);
			else
				DirsVisited->AddToQue(new VisitQue(cstrDirName));



			pDir = FMGUI_OpenDir(cstrDirName);

			LockFM();

			strcpy(m_cstrCurrentIndexDir, cstrDirName);

			UnlockFM();

			if (pDir == NULL)
			{
				//ReportError1("Error opening %s", cstrDirName);
				continue;
			}
	
			for (size_t i = 0; i < (size_t) pDir->nents; i++)
			{
				
				//ReportError1("Checking info of %s", pDir->ents[i]);

				if (pDir->ents[i][0] == '.')
				{
					continue;
				} //(pDir->ents[i][0] == '.')

				char strFileFullPath[4096];
				assert((strlen(cstrDirName)+strlen(pDir->ents[i])+1)<1024);
				strcpy(strFileFullPath, cstrDirName);
				strcat(strFileFullPath, FMGUI_PATHSEP);
				strcat(strFileFullPath, pDir->ents[i]);
				
				if (strcmp(pDir->ents[i], "palmos") == 0)
					continue;

				if (strcmp(strFileFullPath, "/media/internal/ringtones") == 0)
					continue;

				ReportError1("Full Path Name being searched %s", strFileFullPath);

				if (FMGUI_GetFileInfo(strFileFullPath, &Info) == -1)
				{
					continue;
				}

				if ((Info.flags & FMGUI_FILE_HIDDEN) ||
					(Info.flags & FMGUI_FILE_SYSTEM) ||
					(Info.flags & FMGUI_FILE_TEMPORARY))
				{
					continue;
				}


				if (Info.type == FMGUI_FILE_DIRECTORY)
				{
					//ReportError("Is a directory so add back to search que");

					VisitQue *ArrangeAsStack = new VisitQue(strFileFullPath);

					ArrangeAsStack->Next = DirsToVisit;

					DirsToVisit = ArrangeAsStack;

				} 
				else 
				{
					//ReportError1("Checking if %s a readable song", strFileFullPath);
					
					// just gonna hard code this for now
					//	didn't like the way the more robust solution
					//	worked out in practice
					if (m_ffmpegObjectAll.IsType(strFileFullPath))
					{
						ReportError("Starting to extract metadata info");

						SongItem *AddSong = new SongItem(strFileFullPath, pDir->ents[i]);
						AddSong->Type = SONG;

						AddSong->SetArtist(m_ffmpegObjectAll.GetValue("artist"));
						AddSong->SetAlbum(m_ffmpegObjectAll.GetValue("album"));
						AddSong->SetGenre(m_ffmpegObjectAll.GetValue("genre"));
						AddSong->SetTitle(m_ffmpegObjectAll.GetValue("title"));

						m_FilesNameIndex.AddNode(AddSong);

						m_ffmpegObjectAll.Close();
					}

				} // else if (Info.type == FMGUI_FILE_DIRECTORY)

				WormSleep(100);

			} //for (size_t i = 0; i < pDir->nents; i++)

			//ReportError("****Closing the dir we just searched");
			FMGUI_CloseDir(pDir);


		} //if (!bVisited)

		WormSleep(100);

	} //while (!vstrDirsToVisit.empty())
	
	m_FilesIter = m_FilesNameIndex.Root;

	// For now allocate 2056 characters for the json.
	//	If we need more, we will realloc
	char *cstrRet = (char *) malloc(2056);

	// keep track of how many characters we have in the string
	//	in case we need to realloc
	size_t	SizeLim = 2056;

	SongItem *songVal = GetNextFileFromAll();
	if (songVal == NULL)
	{
		sprintf(cstrRet,"{\"finishedIndexing\":true}");

	}
	else
	{

		char *cstrTmp;

		// add the starting bracket to the json
		sprintf(cstrRet,"{\"finishedIndexing\":true, \"arrayFileList\": [");
		size_t	CurSize = 50;

		while (songVal != NULL)
		{
			cstrTmp = songVal->ToStringMeta();

			// Make sure we have enough room in our main JSON string
			size_t tmpSize = strlen(cstrTmp);
			CurSize += tmpSize;
			if (CurSize > SizeLim)
			{
				tmpSize = MAX(tmpSize+512, 1028);
				// for ease of use, increment in intervals of 1028
				SizeLim += tmpSize;
				cstrRet = (char *) realloc(cstrRet, SizeLim);
			}

			strcat(cstrRet, cstrTmp);
			free(cstrTmp);
			songVal = GetNextFileFromAll();
		}

		cstrTmp = cstrRet;

		while((*cstrTmp) != '\0') cstrTmp++;
		cstrTmp--;
		*cstrTmp = ']';
		strcat(cstrRet, "}");

	}

	pFile = fopen(HOME_DIR INDEX_STUF, "wb");

	uint32_t i;

	if (pFile)
	{
		i = CHECK_INDEX_KEY;
		fwrite(&i, sizeof(uint32_t), 1, pFile);

		i = strlen(cstrRet);
		fwrite(&i, sizeof(uint32_t), 1, pFile);
		fwrite(cstrRet, sizeof(char), i, pFile);
	}

	i = CHECK_INDEX_KEY;
	fwrite(&i, sizeof(uint32_t), 1, pFile);

	fclose(pFile);

	m_cstrIndexJSON = cstrRet;

	m_iIndexingInProgress = 0;
}


SongItem * WormIndexer::GetNextFileFromAll()
{
	SongItem *retVal = m_FilesIter;

	if (m_FilesIter == NULL)
	{
		m_FilesIter = m_FilesNameIndex.Root;
	}
	else
	{

		m_FilesIter = m_FilesIter->Next;
	}

	return retVal;
}


void WormIndexer::GetDirFileList(const char *cstrDirName, int iBuildType)
{
	m_iBuildType = iBuildType;

	m_CurDirLS.Clear();

	FMGUI_FileInfo 	Info;
	FMGUI_Dir 		*pDir;

	pDir = FMGUI_OpenDir(cstrDirName);

	if (pDir == NULL)
	{
		//ReportError1("Error opening %s", cstrDirName);
		return;
	}

	for (size_t i = 0; i < (size_t) pDir->nents; i++)
	{

		//ReportError1("Checking info of %s", pDir->ents[i]);

		if (pDir->ents[i][0] == '.')
		{
			continue;
		} //(pDir->ents[i][0] == '.')

		char strFileFullPath[2048];
		assert((strlen(cstrDirName)+strlen(pDir->ents[i])+1)<1024);
		strcpy(strFileFullPath, cstrDirName);
		strcat(strFileFullPath, FMGUI_PATHSEP);
		strcat(strFileFullPath, pDir->ents[i]);

		if (strcmp(pDir->ents[i], "palmos") == 0)
				continue;

		ReportError1("Full Path Name being searched %s", strFileFullPath);

		if (FMGUI_GetFileInfo(strFileFullPath, &Info) == -1)
		{
			continue;
		}

		if ((Info.flags & FMGUI_FILE_HIDDEN) ||
			(Info.flags & FMGUI_FILE_SYSTEM) ||
			(Info.flags & FMGUI_FILE_TEMPORARY))
		{
			continue;
		}


		if (Info.type == FMGUI_FILE_DIRECTORY)
		{
			//ReportError("Is a directory so add back to search que");

			SongItem *AddDir = new SongItem(strFileFullPath, pDir->ents[i]);
			AddDir->Type = DIR;

			m_CurDirLS.AddNode(AddDir);
		}
		else
		{
			ReportError1("Checking if %s a readable song", strFileFullPath);

			// just gonna hard code this for now
			//	didn't like the way the more robust solution
			//	worked out in practice
			if (m_iBuildType == BUILD_TYPE_SLOW)
			{

				if (m_ffmpegObjectDir.IsType(strFileFullPath))
				{
					ReportError("Starting to extract metadata info");

					SongItem *AddSong = new SongItem(strFileFullPath, pDir->ents[i]);
					AddSong->Type = SONG;


					AddSong->SetArtist(m_ffmpegObjectDir.GetValue("artist"));
					AddSong->SetAlbum(m_ffmpegObjectDir.GetValue("album"));
					AddSong->SetGenre(m_ffmpegObjectDir.GetValue("genre"));
					AddSong->SetTitle(m_ffmpegObjectDir.GetValue("title"));

					m_CurDirLS.AddNode(AddSong);

					m_ffmpegObjectDir.Close();
				}
			}
			else
			{
				SongItem *AddSong = new SongItem(strFileFullPath, pDir->ents[i]);
				AddSong->Type = SONG;
				m_CurDirLS.AddNode(AddSong);
			}

		} // else if (Info.type == FMGUI_FILE_DIRECTORY)

	} //for (size_t i = 0; i < pDir->nents; i++)


	FMGUI_CloseDir(pDir);

	m_FFIter = m_CurDirLS.Root;
	//ReportError("****Closing the dir we just searched");

}

SongItem *WormIndexer::GetNextFileFromFolder()
{
	SongItem *retVal = m_FFIter;

	if (m_FFIter == NULL)
	{
		m_FFIter = m_CurDirLS.Root;
	}
	else
	{
		m_FFIter = m_FFIter->Next;
	}

	return retVal;
}

char *WormIndexer::ConvertToJSON(MUS_MESSAGE msg)
{

	char *cstrTmp;

	switch (msg)
	{
	case MUS_MESSAGE_GET_CURRENT_DIR_LS:
	{
		// For now allocate 2056 characters for the json.
		//	If we need more, we will realloc
		char *cstrRet = (char *) malloc(2056);

		// keep track of how many characters we have in the string
		//	in case we need to realloc
		size_t	SizeLim = 2056;

		// add the starting bracket to the json
		sprintf(cstrRet,"{\"arrayFileList\": [");
		size_t	CurSize = 22;

		SongItem *songVal = GetNextFileFromFolder();
		if (songVal == NULL)
		{
			free(cstrRet);
			return NULL;
		}

		while (songVal != NULL)
		{
			char *cstrTmp;

			if (m_iBuildType == BUILD_TYPE_FAST)
				cstrTmp = songVal->ToString();
			else
				cstrTmp = songVal->ToStringMeta();


			// Make sure we have enough room in our main JSON string
			size_t tmpSize = strlen(cstrTmp);
			CurSize += tmpSize;
			if (CurSize > SizeLim)
			{
				tmpSize = MAX(tmpSize+512, 1028);
				// for ease of use, increment in intervals of 1028
				SizeLim += tmpSize;
				cstrRet = (char *) realloc(cstrRet, SizeLim);
			}

			strcat(cstrRet, cstrTmp);
			free(cstrTmp);
			songVal = GetNextFileFromFolder();
		}

		cstrTmp = cstrRet;

		while((*cstrTmp) != '\0') cstrTmp++;
		cstrTmp--;
		*cstrTmp = ']';
		strcat(cstrRet, "}");
		return cstrRet;
	}
	case MUS_MESSAGE_GET_FULL_SONG_INDEX:
	{
		if (m_iIndexingInProgress)
			return NULL;

		return m_cstrIndexJSON;
	}
	default:
		return NULL;
	}
}


char *SongItem::ToStringMeta()
{
	// first calculate the size of this metadata item
	//	remember to add a buffer to account for the quote marks
	//	and colon used for the JSON item (we use 10 to be safe)
	size_t	tmpSize = strlen(Path) + strlen(Name) +
						strlen(Artist) + strlen(Album) +
						strlen(Genre) + strlen(Title) + 256;

	// allocate a new temp string to place the metadata pair into
	char *cstrTmp = (char *) malloc(tmpSize);

	sprintf(cstrTmp,
			" {\"name\":\"%s\", \"path\":\"%s\", \"artist\":\"%s\", "
				"\"album\":\"%s\", \"genre\":\"%s\", \"title\":\"%s\", "
				"\"isdir\":%s},",
			Name,
			Path,
			Artist,
			Album,
			Genre,
			Title,
			((Type == DIR)?"true":"false"));

	return cstrTmp;
}

char *SongItem::ToString()
{
	// first calculate the size of this metadata item
	//	remember to add a buffer to account for the quote marks
	//	and colon used for the JSON item (we use 10 to be safe)
	size_t	tmpSize = strlen(Path) + strlen(Name) + 50;

	// allocate a new temp string to place the metadata pair into
	char *cstrTmp = (char *) malloc(tmpSize);

	sprintf(cstrTmp,
			" {\"name\":\"%s\", \"path\":\"%s\", \"isdir\":%s},",
			Name,
			Path,
			((Type == DIR)?"true":"false"));

	return cstrTmp;
}

/**************************************
 * ThreadedOperation()
 *
 *	This is a static function that is used by as the launching
 *		point for threaded operation
 *
 *	In
 *		Pointer to music player object to launch
 *
 *	Out
 *		None, return value is a void pointer so the function template
 *		matches the callback
 ***************************************/
void *WormIndexer::StartIndexThread(void *pvObject)
{
	// Cast the object passed by the thread start routine to
	//	MusController
	WormIndexer *pWormIndexer = (WormIndexer *) pvObject;

	// Start MusController's maing logic loop
	pWormIndexer->GetFullFileList();

	// Do not worry about return value for now
	return NULL;
}


/********************************************
 * IsPlayable()
 *
 * Returns whether the passed path is a playable song or not
 ********************************************/
int WormIndexer::IsPlayable(const char *cstrPath)
{
	return m_ffmpegObjectAll.IsType(cstrPath);
}

char *WormIndexer::GetMetadata(const char *cstrPath)
{
	char *cstrRet;

	m_ffmpegObjectDir.Open(cstrPath);
	cstrRet = m_ffmpegObjectDir.GetMetadata();
	m_ffmpegObjectDir.Close();

	return cstrRet;
}
