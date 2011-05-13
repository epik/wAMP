
#include "Indexer.h"
#include "FMGuiDir.h"
#include "GeneralHashFunctions.h"
#include "../WormMacro.h"
#include <cstring>
#include <vector>
#include "../Decoders/Decoders.h"
#include "../WormThread.h"
#include <stdio.h>

int16_t g_IndexingStatus = 0;

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

	if (m_pRoot == NULL)
	{
		m_pRoot = pNode;
		return;
	}

	if (m_pRoot->Hash > pNode->Hash)
	{
		pNode->Next = m_pRoot;
		m_pRoot = pNode;
		return;
	}

	FileEntry *pIter = m_pRoot;

	while ((pIter->Next != NULL) && (pIter->Next->Hash < pNode->Hash))
	{
		pIter = pIter->Next;
	}

	if (pIter->Next == NULL)
		pIter->Next = pNode;
	else
	{
		pNode->Next = pIter->Next;
		pIter->Next = pNode;
	}
}

void FileList::AddLastRunNode(FileEntry *pNode, uint32_t uiHash)
{

	pNode->Hash = uiHash;

	if (m_pPrevRoot == NULL)
	{
		m_pPrevRoot = pNode;
		return;
	}

	if (m_pPrevRoot->Hash > pNode->Hash)
	{
		pNode->Next = m_pPrevRoot;
		m_pPrevRoot = pNode;
		return;
	}

	FileEntry *pIter = m_pPrevRoot;

	while ((pIter->Next != NULL) && (pIter->Next->Hash < pNode->Hash))
	{
		pIter = pIter->Next;
	}

	if (pIter->Next == NULL)
		pIter->Next = pNode;
	else
	{
		pNode->Next = pIter->Next;
		pIter->Next = pNode;
	}
}

int16_t FileList::ReadFile(FILE *pFile)
{
	int32_t iVersion;

	int32_t iCheck = fscanf(pFile, "*version %i\n", &iVersion);

	if (iCheck != 1)
	{
		ReportError("Bad File Read");
		return READ_INDEX_BAD_FILE;
	}

	if (iVersion != 1)
	{
		m_pRoot = NULL;
		m_pPrevRoot = NULL;
		return READ_INDEX_OLD_VER;
	}

	FileEntry *pfeTemp;

	char cItemCode = fgetc(pFile);

	while(cItemCode == '#')
	{
		pfeTemp = FileEntry::ScanEntry(pFile);
		AddLastRunNode(pfeTemp, pfeTemp->Hash);
		cItemCode = fgetc(pFile);
	}

	/*if (cItemCode == '*')
	{
		ReportError("Good File Read");
		return READ_INDEX_GOOD;
	}
	else
	{
		ReportError("Bad File Read");
		return READ_INDEX_BAD_FILE;
	}*/

	return READ_INDEX_GOOD;
}

void FileList::Finalize(const char *cstrFileName)
{
	FILE *pFile;

	pFile = fopen(cstrFileName, "wb");

	fprintf(pFile, "*version 01\n");

	FileEntry *pIter = m_pRoot;

	while(pIter != NULL)
	{
		fputc('#', pFile);
		pIter->WriteEntry(pFile);
		pIter = pIter->Next;
	}

	fprintf(pFile, "*end");

	fclose(pFile);

}

void FileList::FindDifferences(FFmpegWrapper *FFmpeg)
{
	FileEntry *pfeCurIter 	= m_pRoot;
	FileEntry *pfePrevIter;

	ReportError("Start FindDifferences");

	while ((pfeCurIter != NULL) && (m_pPrevRoot != NULL))
	{
		int16_t sRel = pfeCurIter->CheckEquality(m_pPrevRoot);

		if (sRel == 1)
		{
			//ReportError("Dif");
			pfePrevIter 	= m_pPrevRoot;
			m_pPrevRoot 	= m_pPrevRoot->Next;
			pfePrevIter->Uninit();
			free(pfePrevIter);
		}
		if (sRel == -1)
		{
			//ReportError("Dif");
			pfeCurIter->SetMeta(FFmpeg);
			pfeCurIter = pfeCurIter->Next;
		}
		else
		{
			//ReportError("Harvest");
			pfeCurIter->Harvest(m_pPrevRoot);
			pfePrevIter 	= m_pPrevRoot;
			m_pPrevRoot 	= m_pPrevRoot->Next;
			pfePrevIter->Uninit();
			free(pfePrevIter);
			pfeCurIter 	= pfeCurIter->Next;
		}
	}
	
	if (!pfeCurIter && !m_pPrevRoot)
	{
		return;
	}
	else if (pfeCurIter == NULL)
	{
		while(pfePrevIter != NULL)
		{
			pfePrevIter = m_pPrevRoot;
			m_pPrevRoot = m_pPrevRoot->Next;
			pfePrevIter->Uninit();
			free(pfePrevIter);
		}
	}
	else if (m_pPrevRoot == NULL)
	{
		while(pfeCurIter != NULL)
		{
			pfeCurIter->SetMeta(FFmpeg);
			pfeCurIter = pfeCurIter->Next;
		}
	}
}


int32_t FileList::WriteToTempFile(const char *cstrFileName)
{
	FILE *pFile;

	pFile = fopen(cstrFileName, "wb");

	fprintf(pFile, "*version 01\n");

	FileEntry *pIter = m_pRoot;

	while(pIter != NULL)
	{
		fputc('#', pFile);
		pIter->WriteEntry(pFile);
		pIter = pIter->Next;
	}

	fprintf(pFile, "*end");

	fclose(pFile);

	pFile = fopen(cstrFileName, "ab");

	ReportError("Temp file create JSON for error check");

	char *cstrTest = ConvertToJSON(1);

	fprintf(pFile, "%s\n", cstrTest);

	fclose(pFile);

	free(cstrTest);

	return 0;
}

void WormIndexer::BuildIndex(int16_t sUseIndex)
{
	m_sUseCallback = sUseIndex;

	ReportError("**************************************About to reinit the flIndex");

	if (m_sUseCallback)
	{
		m_flIndex.Uninit();
		m_flIndex.Init();
	}

	ReportError("*******************************************Reinited the flIndex");

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

	FILE *pFile;

	pFile = fopen(HOME_DIR INDEX_STUF, "rb");

	if (pFile)
	{
		ReportError("Ping");

		int16_t err = m_flIndex.ReadFile(pFile);
		fclose(pFile);

		if (err == READ_INDEX_GOOD)
			g_IndexingStatus = 2;
		else if (err == READ_INDEX_OLD_VER)
			g_IndexingStatus = 3;
		else
		{
			g_IndexingStatus = -1;
			return;
		}
	}
	else
	{
		ReportError("Pong");

		g_IndexingStatus = 1;
		FILE *pFile;
		pFile = fopen(HOME_DIR INDEX_STUF, "wb");
		fclose(pFile);
	}


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
			free(cstrDirName);
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

				char *strFileFullPath = (char *) malloc(strlen(cstrDirName) +
														5 +
														strlen(pDir->ents[i]));
				strcpy(strFileFullPath, cstrDirName);
				strcat(strFileFullPath, FMGUI_PATHSEP);
				strcat(strFileFullPath, pDir->ents[i]);


				if (FMGUI_GetFileInfo(strFileFullPath, &Info, &Time) == -1)
				{
					free(strFileFullPath);
					continue;
				}

				if ((Info.flags & FMGUI_FILE_HIDDEN) ||
					(Info.flags & FMGUI_FILE_SYSTEM) ||
					(Info.flags & FMGUI_FILE_TEMPORARY))
				{
					free(strFileFullPath);
					continue;
				}


				if (Info.type == FMGUI_FILE_DIRECTORY)
				{
					if (strcmp(strFileFullPath, "/media/internal/ringtones") == 0)
					{
						free(strFileFullPath);
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
						char *cstrName = (char *) malloc(strlen(pDir->ents[i]) + 1);
						strcpy(cstrName, pDir->ents[i]);
						FileEntry *pfeEntry = (FileEntry *) malloc(sizeof(FileEntry));
						pfeEntry->Init(strFileFullPath, cstrName, Time);
						m_flIndex.AddNode((pfeEntry));
					}
					else
					{
						//ReportError("Nope, Freeing");
						free(strFileFullPath);
					}
				} // else if (Info.type == FMGUI_FILE_DIRECTORY)

				//ReportError("Finished whatever it was that we were doing to the file");

			} //for (size_t i = 0; i < pDir->nents; i++)

			//ReportError("****Closing the dir we just searched");
			FMGUI_CloseDir(pDir);

			free(cstrDirName);

		} //if (!bVisited)

	} //while (!vstrDirsToVisit.empty())

	ReportError("No problem Building");

	m_flIndex.SetCurrentSearchDir("Getting Metadata");

	m_flIndex.FindDifferences(&m_ffmpegObject);

	m_flIndex.SetCurrentSearchDir("Saving Index");

	//m_flIndex.WriteToTempFile(HOME_DIR INDEX_TMP);

	m_flIndex.Finalize(HOME_DIR INDEX_STUF);
	
	g_IndexingStatus = 4;

	if (m_sUseCallback)
		m_funcCallBack(m_flIndex.ConvertToJSON());
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
			free(strFileFullPath);
			continue;
		}

		time_t t;

		if (FMGUI_GetFileInfo(strFileFullPath, &Info, &t) == -1)
		{
			free(strFileFullPath);
			continue;
		}

		if ((Info.flags & FMGUI_FILE_HIDDEN) ||
			(Info.flags & FMGUI_FILE_SYSTEM) ||
			(Info.flags & FMGUI_FILE_TEMPORARY))
		{
			free(strFileFullPath);
			continue;
		}


		if (Info.type == FMGUI_FILE_DIRECTORY)
		{
			FileEntry *AddDir = (FileEntry *) malloc(sizeof(FileEntry));
			char *cstrName = (char *) malloc(strlen(pDir->ents[i]) + 1);
			strcpy(cstrName, pDir->ents[i]);
			AddDir->Init(strFileFullPath, cstrName);
			AddDir->Type = DIR;
			flIndex.AddNode(AddDir);
		}
		else
		{
			FileEntry *AddSong = (FileEntry *) malloc(sizeof(FileEntry));
			char *cstrName = (char *) malloc(strlen(pDir->ents[i]) + 1);
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


	cstrRet = (char *) malloc(18 + 16);
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
			cstrRet = (char *) realloc(cstrRet, med);
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
				cstrRet = (char *) realloc(cstrRet, med);
			}
			strcat(cstrRet+(size-2), ",");
			size++;
		}
	}

	if(size+3 >= med)
	{
		med = size+5;
		cstrRet = (char *) realloc(cstrRet, med);
	}
	strcat(cstrRet+(size-2), "]}");

	return cstrRet;
}

char *FileList::ConvertToJSON(int16_t sForce)
{

	char		*cstrRet;
	char		*cstrTemp;
	int32_t		size, med, iStrLen;

	LockFM();
	cstrRet = (char *) malloc(strlen(m_cstrCurSearchDir) + 45 + 16);
	sprintf(cstrRet, "{\"iIndexingStatus\":%i, "
					 "\"strCurSearchDir\":\"%s\"",
					 g_IndexingStatus,
					 m_cstrCurSearchDir);
	UnlockFM();

	size =  strlen(cstrRet) + 1;
	med = size;

	if ((g_IndexingStatus != 4) && (!sForce))
	{
		strcat(cstrRet+(size-2), "}");
	}
	else
	{
		iStrLen = 18;
		if (size + iStrLen >= med)
		{
			med += 512;
			cstrRet = (char *) realloc(cstrRet, med);
		}
		strcat(cstrRet+(size-2), ",\"arrayFileList\":[");
		size += iStrLen;


		FileEntry *pIter = m_pRoot;

		while(pIter)
		{
			cstrTemp = pIter->ToStringMeta();
			iStrLen = strlen(cstrTemp);
			if (size + iStrLen >= med)
			{
				med += 512 + iStrLen;
				cstrRet = (char *) realloc(cstrRet, med);
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
					cstrRet = (char *) realloc(cstrRet, med);
				}
				strcat(cstrRet+(size-2), ",");
				size++;
			}
		}

		if(size+3 >= med)
		{
			med = size+5;
			cstrRet = (char *) realloc(cstrRet, med);
		}
		strcat(cstrRet+(size-2), "]}");
	}
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
	char *cstrTmp = (char *) malloc(tmpSize);

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
	char *cstrTmp = (char *) malloc(tmpSize);

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


char *WormIndexer::GetMetadata(const char *cstrPath)
{
	char *cstrRet = NULL;
	
	if(m_ffmpegObject.PrepareMetadata(cstrPath))
	{
		cstrRet = m_ffmpegObject.GetMetadata();
		m_ffmpegObject.Close();
	}

	return cstrRet;
}
