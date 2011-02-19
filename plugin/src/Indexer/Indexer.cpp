
#include "Indexer.h"
#include "FMGuiDir.h"
#include <cstring>
/*
using namespace std;

int32_t	IsFlac(size_t iPos, const char *cstrFileName)
{
	if ((iPos - 5) >= 0)
		return 0;
	
	cstrFileName += (iPos - 5);

	if ((cstrFileName[0] ==  '.') &&
		((cstrFileName[1] == 'f') || (cstrFileName[1] == 'F')) &&
		((cstrFileName[2] == 'l') || (cstrFileName[2] == 'L')) &&
		((cstrFileName[3] == 'a') || (cstrFileName[3] == 'A')) &&
		((cstrFileName[4] == 'c') || (cstrFileName[4] == 'C')))
	{
		return 1;
	}
	else
		return 0;
}


void FlacIndexer::error_callback(::FLAC__StreamDecoderErrorStatus status)
{
	ReportError1("Got error callback: %s", FLAC__StreamDecoderErrorStatusString[status]);
}

::FLAC__StreamDecoderWriteStatus FlacIndexer::write_callback(const ::FLAC__Frame *frame, const FLAC__int32 * const buffer[])
{
	// Do Nothing
}

void FlacIndexer::metadata_callback(const ::FLAC__StreamMetadata *metadata)
{
	// print some stats
	if(metadata->type == FLAC__METADATA_TYPE_VORBIS_COMMENT)
	{

	}
	else if (metadata->type == FLAC__METADATA_TYPE_CUESHEET)
	{
	
	}
	else if (metadata->type == FLAC__METADATA_TYPE_PICTURE)
	{
	
	}
}

int16_t FlacIndexer::CheckFile(const char *cstrFileName)
{
	set_metadata_respond(FLAC__METADATA_TYPE_VORBIS_COMMENT);
	set_metadata_respond(FLAC__METADATA_TYPE_CUESHEET);
	set_metadata_respond(FLAC__METADATA_TYPE_PICTURE);

	FLAC__StreamDecoderInitStatus init_status = init(cstrFileName);
	if (init_status != FLAC__STREAM_DECODER_INIT_STATUS_OK)
	{
		ReportError1("ERROR: initializing decoder: %s", 
							FLAC__StreamDecoderInitStatusString[init_status]);
		return 0;
	}
	
	return 1;
}

void FlacIndexer::GetIndex(IndexItem &Item)
{
	m_iiIndexToFill = Item;
	
	process_until_end_of_metadata();
	
	finish();
}*/

void WormIndexer::Init(const char *cstrSearchPath)
{
	/*vector<string> 				vstrDirsToVisit;
	vstrDirsToVisit.push_back(string(cstrSearchPath));
	vector<string> 				vstrVistedDirs;
	vector<string>::iterator 	it;
	
	FMGUI_FileInfo 	Info;
	FMGUI_Dir 		*pDir;

	while (!vstrDirsToVisit.empty())
	{
		ReportError1("The current size of the Dir's to visit is %i",
					vstrDirsToVisit.size());

		// pop the next dir to search
		std::string strDirName = vstrDirsToVisit.back();
		vstrDirsToVisit.pop_back();
	
		ReportError1("****Starting search of dir: %s", strDirName.c_str());

		bool bVisited = false;
		it = vstrVistedDirs.begin();



		//ReportError("Checking if we have visited this dir yet");
		while((it < vstrVistedDirs.end()) && (!bVisited))
		{
			if (strDirName.compare(*it) == 0)
			{
				ReportError("Previously visited");
				bVisited = true;
			}
			else
			{
				it++;
			}
		}
		
		if (!bVisited)
		{

			vstrVistedDirs.push_back(strDirName);
			pDir = FMGUI_OpenDir(strDirName.c_str());

			if (pDir == NULL)
			{
				ReportError1("Error opening %s", strDirName.c_str());
				continue;
			}
	
			for (size_t i = 0; i < (size_t) pDir->nents; i++)
			{
				
				ReportError1("Checking info of %s", pDir->ents[i]);

				if (pDir->ents[i][0] == '.')
				{
					continue;
				} //(pDir->ents[i][0] == '.')

				string strFileFullPath(strDirName);
				strFileFullPath.append(FMGUI_PATHSEP);
				strFileFullPath.append(pDir->ents[i]);
				
				if (strcmp(pDir->ents[i], "palmos") == 0)
						continue;

				ReportError1("Full Path Name being searched %s", strFileFullPath.c_str());

				if (FMGUI_GetFileInfo(strFileFullPath.c_str(), &Info) == -1)
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
					ReportError("Is a directory so add back to search que");

					vstrDirsToVisit.push_back(strFileFullPath);
				} 
				else 
				{
					ReportError("Checking if a readable song");

					const char  *cstrFileName = pDir->ents[i];
					size_t		iStrPos = 0;
					
					// we check for end of string or potential overflow
					while ((cstrFileName[iStrPos] != 0) && (iStrPos < 255))
						iStrPos++;
					
					// just gonna hard code this for now
					//	didn't like the way the more robust solution
					//	worked out in practice
					if (IsFlac(iStrPos, cstrFileName) &&
								m_fiFlacIndexer.CheckFile(strFileFullPath.c_str()))
					{
						
						m_vIndex.push_back(IndexItem());
						m_fiFlacIndexer.GetIndex(m_vIndex.back());
					}

				} // else if (Info.type == FMGUI_FILE_DIRECTORY)

			} //for (size_t i = 0; i < pDir->nents; i++)

			ReportError("****Closing the dir we just searched");
			FMGUI_CloseDir(pDir);
		} //if (!bVisited)

	} //while (!vstrDirsToVisit.empty())*/
	
}
