
#include "Indexer.h"
#include "FMGuiDir.h"
#include "GeneralHashFunctions.h"
#include "../WormMacro.h"
#include <cstring>
#include "../Decoders/Decoders.h"
#include <pthread.h>
#include "../WormThread.h"
#include <stdio.h>
#include <EASTL/set.h>
# include <sys/stat.h>

//#define SPEC_BUILD

volatile int32_t WormIndexer::READY = 0;

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


bool WormIndexer::CheckForDir(const char *cstrDir, int32_t bCheckFolder, int32_t bCreate)
{
	ReportError("In Check Dir For Music");

	if (bCreate)
	{
		if (!FMGUI_MkDir(cstrDir)) //HOME_DIR "/music"))
			return true;
		else
			return false;
	}
	else
	{
		ReportError("About to run stat");
		struct stat sb;

		if (stat(cstrDir, &sb) == -1)
			return false;

		ReportError("Got a stat result");

		if (bCheckFolder)
		{
			if ((sb.st_mode & S_IFDIR)==S_IFDIR)
				return true;
			else
				return false;
		}
		else
			return true;
	}
}

void WormIndexer::BuildIndex(int32_t lastBuild, const char *path)
{

	m_strHomeDir = path;

	m_timeLastBuild = lastBuild;

	// Don't need to save this, Thread should be self sufficient
	pthread_t Thread;

	// spawn the thread to run MusController's logic loop
	pthread_create(&Thread, NULL, StartIndexThread, this);
}



void WormIndexer::RunIndexer()
{

	// Lets profile for faster start up
	//WormMarkStartTime();

	eastl::set<eastl::string> DirsVisited;

	VisitQue *DirsToVisit = new VisitQue(m_strHomeDir.c_str());
	//VisitQue *DirsVisited = NULL;

	FMGUI_FileInfo 	Info;
	FMGUI_Dir 		*pDir;
	bool			bFirst = true;
	time_t			Time;
	
	while (DirsToVisit != NULL)
	{
		VisitQue *Cur = DirsToVisit;
		DirsToVisit = DirsToVisit->Next;


		//ReportError1("About to visit %s", Cur->Dir.c_str());

		if (DirsVisited.insert(Cur->Dir).second)
		{

			pDir = FMGUI_OpenDir(Cur->Dir.c_str());

			if (pDir == NULL)
				continue;

			for (size_t i = 0; i < (size_t) pDir->nents; i++)
			{
				//ReportError1("Checking File: %s", pDir->ents[i]);

				if (pDir->ents[i][0] == '.')
					continue;

				if (bFirst)
				{
					if ((strcmp(pDir->ents[i], "palmos") == 0) ||
						(strcmp(pDir->ents[i], "ringtones") == 0))
						continue;
				}

				char *strFileFullPath = (char *) MALLOC(strlen(Cur->Dir.c_str()) +
														64 +
														strlen(pDir->ents[i]));
				strcpy(strFileFullPath, Cur->Dir.c_str());
				strcat(strFileFullPath, FMGUI_PATHSEP);
				strcat(strFileFullPath, pDir->ents[i]);


				if (FMGUI_GetFileInfo(strFileFullPath, &Info, &Time) == -1)
				{
					FREE(strFileFullPath);
					continue;
				}

				if (Info.flags &
							(FMGUI_FILE_HIDDEN | FMGUI_FILE_SYSTEM | FMGUI_FILE_TEMPORARY))
				{
					FREE(strFileFullPath);
					continue;
				}


				if (Info.type == FMGUI_FILE_DIRECTORY)
				{
					//ReportError("It was a dir");
					VisitQue *ArrangeAsStack = new VisitQue(strFileFullPath);
					ArrangeAsStack->Next = DirsToVisit;
					DirsToVisit = ArrangeAsStack;
					free(strFileFullPath);
				}
				else
				{
					ReportError("About to see if item has our exten");
					if(QuickExtCheck(pDir->ents[i]) != 0)
					{
						//ReportError1("Found Song: %s", pDir->ents[i]);
						/*ReportError3("Song Time: %li > %li %s", Time, m_timeLastBuild,
												((Time > m_timeLastBuild) ?
														"dirty" : "clean"));*/
						m_funcIndexAdd(strFileFullPath, (Time > m_timeLastBuild));
					}

					FREE(strFileFullPath);

				} // else if (Info.type == FMGUI_FILE_DIRECTORY)

			} //for (size_t i = 0; i < pDir->nents; i++)

			bFirst = false;

			ReportError("****Closing the dir we just searched");
			FMGUI_CloseDir(pDir);

			delete Cur;

		} //if (!bVisited)

	} //while (!vstrDirsToVisit.empty())

	ReportError("Finish");

	//ReportError1("***********Finish Time %i********************",
	//		WormCheckTimeSinceMark());
	
	m_funcFinish();
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

		char *strFileFullPath = (char *) MALLOC(strlen(cstrDirName) +
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
	if (!WormIndexer::READY)
		WormSleep(200);

	// Cast the object passed by the thread start routine to
	//	MusController
	WormIndexer *pWormIndexer = (WormIndexer *) pvObject;

	// Start MusController's maing logic loop
	pWormIndexer->RunIndexer();

	// Do not worry about return value for now
	return NULL;
}


const char *WormIndexer::GetMetadata(const char *cstrTag)
{
	if (m_bCurIndexPathSet == 0)
		return "0";
		
	const char *cstrRet = m_ffmpegObject.GetValue(cstrTag);
	
	if (!cstrRet)
		return "0";
	else
		return cstrRet;
}


int32_t	WormIndexer::CheckForImg(const char *cstrPath,
								char *cstrRetVal)
{
	FMGUI_Dir 	*pDir = FMGUI_OpenDir(cstrPath);

	if (pDir == NULL)
	{
		//ReportError1("Error opening %s", cstrDirName);
		return 0;
	}

	for (size_t i = 0; i < (size_t) pDir->nents; i++)
	{
		//ReportError1("File We Are On: %s", pDir->ents[i]);

		if (strlen(pDir->ents[i]) > CHECK_FOR_IMG_MAX)
			continue;

		const char *ext = strrchr(pDir->ents[i], '.');

		//ReportError1("After strrchr: %s", ext);

	    if (ext)
	    {
	        ext++;

	        int16_t sLen = strlen(ext);
	        if (sLen != 3)
	        	continue;

	        char c = tolower(*(ext++));
	        int32_t bFound = 0;

	        if (c == 'b')
	        {
	        	if ((tolower(*(ext++)) == 'm') &&
	        			(tolower(*(ext)) == 'p'))
	        	{
	        		bFound = 1;
	        	}
	        }
	        else if (c == 'g')
	        {
	        	if ((tolower(*(ext++)) == 'i') &&
	        			(tolower(*(ext)) == 'f'))
	        	{
	        		bFound = 1;
	        	}
	        }
	        else if (c == 'p')
	        {
	        	if ((tolower(*(ext++)) == 'n') &&
	        			(tolower(*(ext)) == 'g'))
	        	{
	        		bFound = 1;
	        	}
	        }
	        else if (c == 'j')
	        {
	        	ReportError("We tripped 'J'");

	        	if ((tolower(*(ext++)) == 'p') &&
	        			(tolower(*(ext)) == 'g'))
	        	{
	        		bFound = 1;
	        	}
	        }

	        if (bFound)
	        {
	        	strcpy(cstrRetVal, pDir->ents[i]);
	        	return 1;
	        }
		}
	}

	return 0;
}

void WormIndexer::SetMetadataPath(const char *cstrPath)
{
	if (m_bCurIndexPathSet)
		m_ffmpegObject.Close();
	
	if (!cstrPath)
	{
		m_bCurIndexPathSet = 0;
		return;
	}

	if(m_ffmpegObject.PrepareMetadata(cstrPath))
	{
		m_bCurIndexPathSet = 1;
	}
	else
	{
		m_bCurIndexPathSet = 0;
	}
}
