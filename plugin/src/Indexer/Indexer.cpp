
#include "Indexer.h"
#include "FMGuiDir.h"
#include "GeneralHashFunctions.h"
#include "../WormMacro.h"
#include <cstring>
#include <vector>
#include "../Decoders/Decoders.h"
#include "../WormThread.h"
#include <stdio.h>

//#define SPEC_BUILD

void FileEntry::SetMeta(FFmpegWrapper *FFmpeg)
{
	int16_t iCheck = FFmpeg->PrepareMetadata(Path);
	if (!iCheck)
	{
		// maybe do something
		return;
	}
	
	SetArtist(FFmpeg->GetValue("artist"));
	SetAlbum(FFmpeg->GetValue("album"));
	SetGenre(FFmpeg->GetValue("genre"));
	SetTitle(FFmpeg->GetValue("title"));
	
	FFmpeg->Close();

}

void FileList::AddNodeLite(FileEntry *pNode, uint32_t uiHash)
{

	pNode->Hash = uiHash;

	pNode->Next = m_pRoot;
	m_pRoot = pNode;
}

/*Path;
	char		*Name;*/

char *FileList::ConvertToPathString()
{
	char	*cstrRet = (char *) MALLOC(2048);
	char	*cstrTemp = (char *) MALLOC(2048);
	
	int32_t iTmpSiz = 2048;

	int32_t med = 2048;
	int32_t size = 0;
	
	*cstrRet = 0;

	FileEntry *pIter = m_pRoot;
	
	while(pIter != NULL)
	{

		int32_t iStrLen = strlen(pIter->Path) + strlen(pIter->Name) + 30;
		
		if (iStrLen > iTmpSiz)
		{
			iTmpSiz += 1024 + iStrLen;
			cstrTemp = (char *) REALLOC(cstrTemp, med);
		}

		sprintf(cstrTemp, "%s\\\\%u-%u-%s",
							pIter->Path,
							pIter->LastMod,
							pIter->Hash,
							pIter->Name);
		
		//ReportError1("cstrTemp: %s", cstrTemp);

		iStrLen = strlen(cstrTemp);

		if (size + iStrLen + 2 >= med)
		{
			med += 1024 + iStrLen;
			cstrRet = (char *) REALLOC(cstrRet, med);
		}

		strcat(cstrRet + size, cstrTemp);
		size += iStrLen;

		strcat(cstrRet + size, "\\\\");

		size += 2;

		pIter = pIter->Next;
	}
	
	
	free(cstrTemp);
	
	cstrRet[size] = '\0';
	
	return cstrRet;
}

void WormIndexer::BuildIndex(int16_t sUseIndex)
{
	m_sUseCallback = sUseIndex;

	if (m_sUseCallback)
	{
		m_flIndex.Uninit();
		m_flIndex.Init();
	}

	// Don't need to save this, Thread should be self sufficient
	pthread_t Thread;

	// spawn the thread to run MusController's logic loop
	pthread_create(&Thread, NULL, StartIndexThread, this);
}


void WormIndexer::ClearIndex()
{
	FMGUI_FileDelete(HOME_DIR INDEX_STUF);
}


char *WormIndexer::GetIndexer()
{
	return m_flIndex.ConvertToJSON();
}


void WormIndexer::RunIndexer()
{

	VisitQue *DirsToVisit = new VisitQue(HOME_DIR);
	VisitQue *DirsVisited = NULL;

	FMGUI_FileInfo 	Info;
	FMGUI_Dir 		*pDir;
	time_t			Time;

	
	while (DirsToVisit != NULL)
	{
		// pop the next dir to search
		char *cstrDirName = DirsToVisit->Dir;
		VisitQue *Cur = DirsToVisit;
		DirsToVisit = DirsToVisit->Next;
		delete Cur;

		ReportError1("About to visit %s", cstrDirName);

		int16_t bVisited;

		if (DirsVisited == NULL)
			bVisited = 0;
		else
			bVisited = DirsVisited->CheckIfValInQue(cstrDirName);

		if (bVisited)
		{
			FREE(cstrDirName);
		}
		else
		{
			if (DirsVisited == NULL)
				DirsVisited = new VisitQue(cstrDirName);
			else
				DirsVisited->AddToQue(new VisitQue(cstrDirName));

			m_flIndex.SetCurrentSearchDir(cstrDirName);

			pDir = FMGUI_OpenDir(cstrDirName);

			if (pDir == NULL)
				continue;

			for (size_t i = 0; i < (size_t) pDir->nents; i++)
			{
				//ReportError1("Checking File: %s", pDir->ents[i]);

				if (pDir->ents[i][0] == '.')
					continue;
				if (strcmp(pDir->ents[i], "palmos") == 0)
					continue;

				char *strFileFullPath = (char *) MALLOC(strlen(cstrDirName) +
														5 +
														strlen(pDir->ents[i]));
				strcpy(strFileFullPath, cstrDirName);
				strcat(strFileFullPath, FMGUI_PATHSEP);
				strcat(strFileFullPath, pDir->ents[i]);


				if (FMGUI_GetFileInfo(strFileFullPath, &Info, &Time) == -1)
				{
					FREE(strFileFullPath);
					continue;
				}

				if ((Info.flags & FMGUI_FILE_HIDDEN) ||
					(Info.flags & FMGUI_FILE_SYSTEM) ||
					(Info.flags & FMGUI_FILE_TEMPORARY))
				{
					FREE(strFileFullPath);
					continue;
				}


				if (Info.type == FMGUI_FILE_DIRECTORY)
				{
					if (strcmp(strFileFullPath, "/media/internal/ringtones") == 0)
					{
						FREE(strFileFullPath);
						continue;
					}

					//ReportError("It was a dir");
					VisitQue *ArrangeAsStack = new VisitQue(strFileFullPath);
					ArrangeAsStack->Next = DirsToVisit;
					DirsToVisit = ArrangeAsStack;
					free(strFileFullPath);
				}
				else
				{
					//ReportError("About to see if item has our exten");
					if(QuickExtCheck(pDir->ents[i]) != 0)
					{
						//ReportError1("Found Song: %s", pDir->ents[i]);
						char *cstrName = (char *) MALLOC(strlen(pDir->ents[i]) + 1);
						strcpy(cstrName, pDir->ents[i]);
						FileEntry *pfeEntry = (FileEntry *) MALLOC(sizeof(FileEntry));
						pfeEntry->Init(strFileFullPath, cstrName, Time);
						m_flIndex.AddNode((pfeEntry));
					}
					else
					{
						//ReportError("Nope, Freeing");
						FREE(strFileFullPath);
					}
				} // else if (Info.type == FMGUI_FILE_DIRECTORY)

				//ReportError("Finished whatever it was that we were doing to the file");

			} //for (size_t i = 0; i < pDir->nents; i++)

			//ReportError("****Closing the dir we just searched");
			FMGUI_CloseDir(pDir);

			FREE(cstrDirName);

		} //if (!bVisited)

	} //while (!vstrDirsToVisit.empty())

	ReportError("Finished building dir list");
	
	char *cstrJSON = m_flIndex.ConvertToPathString();

	m_funcIndexCB(cstrJSON);

	FREE(cstrJSON);
}


char *WormIndexer::GetDirFileList(const char *cstrDirName)
{
	FMGUI_FileInfo 	Info;
	FMGUI_Dir 		*pDir;

	FileList flIndex;

	pDir = FMGUI_OpenDir(cstrDirName);

	if (pDir == NULL)
	{
		//ReportError1("Error opening %s", cstrDirName);
		return 0;
	}

	for (size_t i = 0; i < (size_t) pDir->nents; i++)
	{

		//ReportError1("Checking info of %s", pDir->ents[i]);

		if (pDir->ents[i][0] == '.')
		{
			continue;
		} //(pDir->ents[i][0] == '.')

		char *strFileFullPath = (char *) malloc(strlen(cstrDirName) +
												5 +
												strlen(pDir->ents[i]));
		strcpy(strFileFullPath, cstrDirName);
		strcat(strFileFullPath, FMGUI_PATHSEP);
		strcat(strFileFullPath, pDir->ents[i]);

		if (strcmp(pDir->ents[i], "palmos") == 0)
		{
			FREE(strFileFullPath);
			continue;
		}

		time_t t;

		if (FMGUI_GetFileInfo(strFileFullPath, &Info, &t) == -1)
		{
			FREE(strFileFullPath);
			continue;
		}

		if ((Info.flags & FMGUI_FILE_HIDDEN) ||
			(Info.flags & FMGUI_FILE_SYSTEM) ||
			(Info.flags & FMGUI_FILE_TEMPORARY))
		{
			FREE(strFileFullPath);
			continue;
		}


		if (Info.type == FMGUI_FILE_DIRECTORY)
		{
			FileEntry *AddDir = (FileEntry *) MALLOC(sizeof(FileEntry));
			char *cstrName = (char *) MALLOC(strlen(pDir->ents[i]) + 1);
			strcpy(cstrName, pDir->ents[i]);
			AddDir->Init(strFileFullPath, cstrName);
			AddDir->Type = DIR;
			flIndex.AddNode(AddDir);
		}
		else
		{
			FileEntry *AddSong = (FileEntry *) MALLOC(sizeof(FileEntry));
			char *cstrName = (char *) MALLOC(strlen(pDir->ents[i]) + 1);
			strcpy(cstrName, pDir->ents[i]);
			AddSong->Init(strFileFullPath, cstrName);
			AddSong->Type = SONG;
			flIndex.AddNode(AddSong);

		} // else if (Info.type == FMGUI_FILE_DIRECTORY)

	} //for (size_t i = 0; i < pDir->nents; i++)


	FMGUI_CloseDir(pDir);

	char *cstrRet = flIndex.ConvertToJSONLite();

	ReportError1("Problem might be with cleanup %s", cstrRet);

	return cstrRet;

}

char *FileList::ConvertToJSONLite()
{

	ReportError("About to convert JSON");

	char		*cstrRet;
	char		*cstrTemp;
	int32_t		size, med, iStrLen;


	cstrRet = (char *) MALLOC(18 + 16);
	strcpy(cstrRet, "{\"arrayFileList\":[");
	size = 18;
	med = 18;

	FileEntry *pIter = m_pRoot;

	while(pIter)
	{
		cstrTemp = pIter->ToStringSimple();
		iStrLen = strlen(cstrTemp);
		if (size + iStrLen >= med)
		{
			med += 512 + iStrLen;
			cstrRet = (char *) REALLOC(cstrRet, med);
		}
		strcat(cstrRet+(size-2), cstrTemp);
		size += iStrLen;

		free(cstrTemp);

		pIter = pIter->Next;

		if (pIter)
		{
			if(size+2 >= med)
			{
				med += 512;
				cstrRet = (char *) REALLOC(cstrRet, med);
			}
			strcat(cstrRet+(size-2), ",");
			size++;
		}
	}

	if(size+3 >= med)
	{
		med = size+5;
		cstrRet = (char *) REALLOC(cstrRet, med);
	}
	strcat(cstrRet+(size-2), "]}");

	return cstrRet;
}

char *FileList::ConvertToJSON(int16_t sForce)
{

	char		*cstrRet;
	char		*cstrTemp;
	int32_t		size, med, iStrLen;


	cstrRet = (char *) MALLOC(25);
	strcpy(cstrRet, "{\"arrayFileList\":[");

	size =  strlen(cstrRet) + 1;
	med = size;

	FileEntry *pIter = m_pRoot;

	while(pIter)
	{
		cstrTemp = pIter->ToStringMeta();
		iStrLen = strlen(cstrTemp);
		if (size + iStrLen >= med)
		{
			med += 512 + iStrLen;
			cstrRet = (char *) REALLOC(cstrRet, med);
		}
		strcat(cstrRet+(size-2), cstrTemp);
		size += iStrLen;

		FREE(cstrTemp);

		pIter = pIter->Next;
		if (pIter)
		{
			if(size+2 >= med)
			{
				med += 512;
				cstrRet = (char *) REALLOC(cstrRet, med);
			}
			strcat(cstrRet+(size-2), ",");
			size++;
		}
	}

	if(size+3 >= med)
	{
		med = size+5;
		cstrRet = (char *) REALLOC(cstrRet, med);
	}
	strcat(cstrRet+(size-2), "]}");

	return cstrRet;
}


char *FileEntry::ToStringMeta()
{
	// first calculate the size of this metadata item
	//	remember to add a buffer to account for the quote marks
	//	and colon used for the JSON item (count is 83 + null +
	//	five for safety).

	size_t	tmpSize = SafeStringLen(Path);
	tmpSize += SafeStringLen(Name);
	tmpSize += SafeStringLen(Artist);
	tmpSize += SafeStringLen(Album);
	tmpSize += SafeStringLen(Genre);
	tmpSize += SafeStringLen(Title) + 90;

	// allocate a new temp string to place the metadata pair into
	char *cstrTmp = (char *) MALLOC(tmpSize);

	sprintf(cstrTmp,
			"{\"name\":\"%s\", \"path\":\"%s\", \"artist\":\"%s\", "
				"\"album\":\"%s\", \"genre\":\"%s\", \"title\":\"%s\", "
				"\"isdir\":%s}",
			Name,
			Path,
			Artist,
			Album,
			Genre,
			Title,
			((Type == DIR)?"true":"false"));

	return cstrTmp;
}

char *FileEntry::ToStringSimple()
{
	// first calculate the size of this metadata item
	//	remember to add a buffer to account for the quote marks
	//	and colon used for the JSON item
	size_t	tmpSize = strlen(Path) + strlen(Name) + 40;

	// allocate a new temp string to place the metadata pair into
	char *cstrTmp = (char *) MALLOC(tmpSize);

	sprintf(cstrTmp,
			" {\"name\":\"%s\", \"path\":\"%s\", \"isdir\":%s}",
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
	pWormIndexer->RunIndexer();

	// Do not worry about return value for now
	return NULL;
}


const char *WormIndexer::GetMetadata(const char *cstrPath)
{
	const char *cstrRet = NULL;
	
	if(m_ffmpegObject.PrepareMetadata(cstrPath))
	{
		cstrRet = m_ffmpegObject.GetMetadata();
		m_ffmpegObject.Close();
	}

	return cstrRet;
}
