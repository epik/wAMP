/*
 * wormp3.cpp
 *
 *  Created on: Dec 24, 2010
 *      Author: Katiebird
 */

#include "config.h"
#include <iostream>
#include <string.h>

#include "WormDebug.h"
#include "WormThread.h"
#include "MusController.h"
#include "SDL.h"
#include "Indexer/Indexer.h"

#include "taglib/toolkit/tbytevector.h"


#include "taglib/fileref.h"
#include "taglib/tag.h"
#include "taglib/mp4/mp4tag.h"
#include "taglib/mp4/mp4file.h"
#include "taglib/toolkit/tbytevector.h"
#include "taglib/mpeg/mpegfile.h"
#include "taglib/mpeg/id3v2/id3v2tag.h"
#include "taglib/mpeg/id3v2/id3v2frame.h"
#include "taglib/mpeg/id3v2/id3v2header.h"
#include "taglib/flac/flacfile.h"
#include "taglib/ogg/xiphcomment.h"
#include "taglib/asf/asffile.h"
#include "taglib/asf/asftag.h"
#include "taglib/mpeg/id3v1/id3v1tag.h"
#include "taglib/ape/apetag.h"

#if USE_PDL
#include "PDL.h"
#define REGISTER_WITH_DEVICE Register()
#else
#define REGISTER_WITH_DEVICE 0
#endif

MusController g_MusController;

WormIndexer g_Indexer;

int32_t	g_iContinue = 1;

int32_t	g_InitError = 0;

TagLib::FileRef *ptagFile = 0;

void StartSong(const char *cstrPath,
				const char *cstrArtist,
				const char *cstrTitle,
				int32_t iTrack)
{
	if (!cstrPath)
		cstrPath = "0";
	if (!cstrArtist)
		cstrArtist = "0";
	if (!cstrTitle)
		cstrTitle = "0";
		

	const char *params[4];
	params[0] = cstrPath;
	params[1] = cstrArtist;
	params[2] = cstrTitle;
	
	char cstrIndex[15];
	sprintf(cstrIndex,"%i",iTrack);
	
	params[3] = cstrIndex;

#if USE_PDL
	PDL_Err mjErr = PDL_CallJS("StartSong", params, 4);

	if ( mjErr != PDL_NOERROR )
	{
	  printf("error: %s\n", PDL_GetError());
	}

#endif
	ReportError4("*****Callback Val: %s, %s, %s, %s", params[0],
													  params[1],
													  params[2],
													  params[3]);


}

void FinishIndex()
{
#if USE_PDL

	const char *params[1];

	PDL_Err mjErr = PDL_CallJS("FinishIndex", params, 0);
	if ( mjErr != PDL_NOERROR )
	{
		ReportError1("error: %s\n", PDL_GetError());
	}
#endif
	ReportError("Finish Index");

}

#define EnsureZero(x, y) (y = (x.isEmpty()) ? "0" : x.toCString())


void AddToIndex(const char *path, bool dirty)
{
	const char *params[2];

	params[0] = path;
	if (!dirty)
		params[1] = "clean";
	else
		params[1] = "dirty";

#if USE_PDL

	PDL_Err mjErr = PDL_CallJS("AddToIndex", params, 2);
	if ( mjErr != PDL_NOERROR )
	{
		ReportError1("error: %s\n", PDL_GetError());
	}

#endif

	/*ReportError7("Callback Val: %s : %s\n", params[0],
										params[1])*/;

}

void FinishSeek(const char *cstrVal, int32_t iTrack)
{
#if USE_PDL

	ReportError("Entering FinishSeek");

	const char *params[2];
	params[0] = cstrVal;

	char cstrIndex[15];
	sprintf(cstrIndex,"%i",iTrack);

	params[1] = cstrIndex;

	PDL_Err mjErr = PDL_CallJS("FinishSeek", params, 2);
	if ( mjErr != PDL_NOERROR )
	{
		ReportError1("error: %s\n", PDL_GetError());
	}
#endif
	ReportError1("Callback Val From FinishSeek: %s", cstrVal);

}

#if USE_PDL
PDL_bool Play(PDL_JSParameters *parms)
{

	int32_t iTrack = PDL_GetJSParamInt(parms, 0);

	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET, ATTRIB_MUSCON_PAUSED, 0, iTrack);


	return PDL_TRUE;
}

PDL_bool Pause(PDL_JSParameters *parms)
{
#ifdef PROFILE
	FMGUI_ChDir("/media/internal");
	exit(0);
#endif

	int32_t iTrack = PDL_GetJSParamInt(parms, 0);

	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET, ATTRIB_MUSCON_PAUSED, 1, iTrack);

	return PDL_TRUE;
}

PDL_bool SetMetadataPath(PDL_JSParameters *parms)
{
	const char *cstrPath = PDL_GetJSParamString(parms, 0);

	if (ptagFile)
		delete ptagFile;

	ptagFile = new TagLib::FileRef(cstrPath);

	//ReportError1("Setting meta path %s", cstrPath);

	return PDL_TRUE;
}

PDL_bool GetMetadata(PDL_JSParameters *parms)
{
	PDL_JSReply(parms, "0");

	TagLib::Tag *t;

	//ReportError("Starting a get Metadata");

	if ((ptagFile->isNull()) ||
		!(t = ptagFile->tag()))
	{
		PDL_JSReply(parms, "0");
		return PDL_TRUE;
	}

	if (t->isEmpty())
	{
		PDL_JSReply(parms, "0");
		return PDL_TRUE;
	}

	//ReportError("The file and tag tested OK, getting param");

	int iItem = PDL_GetJSParamInt(parms, 0);

	//ReportError1("Getting meta #%i", iItem);
	TagLib::String s;

	switch (iItem)
	{
	case 0:
		s = t->genre();
		break;
	case 1:
		s = t->artist();
		break;
	case 2:
		s = t->album();
		break;
	case 3:
		s = t->title();
		break;
	case 4:
		char cstrTrack[25];
		sprintf(cstrTrack, "%i", t->track());
		PDL_JSReply(parms, cstrTrack);
		return PDL_TRUE;
	case 5:
		s = t->albumArtist();
	}

	//ReportError1("Got param: %s", s.toCString());

	if (!s.isEmpty())
		PDL_JSReply(parms, s.toCString());
	else
		PDL_JSReply(parms, "0");

	return PDL_TRUE;
}

PDL_bool SetEQ(PDL_JSParameters *params)
{

	const char *cstrPath = PDL_GetJSParamString(params, 0);
	ReportError1("Open Message being created for %s", cstrPath);
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET, ATTRIB_EQ, cstrPath);

	return PDL_TRUE;
}

PDL_bool Open(PDL_JSParameters *parms)
{
	const char *cstrPath = PDL_GetJSParamString(parms, 0);
	int32_t iTrack = PDL_GetJSParamInt(parms, 1);

	ReportError2("Open Message being created for %s, for track %i", cstrPath, iTrack);
	g_MusController.PassMessage(MUS_MESSAGE_OPEN_SONG, cstrPath, iTrack, 0);

	return PDL_TRUE;
}

PDL_bool SetNext(PDL_JSParameters *parms)
{
	const char *cstrPath = PDL_GetJSParamString(parms, 0);
	double dGap = PDL_GetJSParamDouble(parms, 1);
	int32_t iTrack = PDL_GetJSParamInt(parms, 2);
	ReportError1("dGap val: %f", dGap);
	g_MusController.PassMessage(MUS_MESSAGE_SET_NEXT, cstrPath, dGap, iTrack);

	return PDL_TRUE;
}

PDL_bool SetBass(PDL_JSParameters *parms)
{
	double fVal = PDL_GetJSParamDouble(parms, 0);
	int32_t iTrack = PDL_GetJSParamInt(parms, 1);
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
								ATTRIB_BASSTREB_BASS_VAL,
								fVal, iTrack);

	return PDL_TRUE;
}

PDL_bool Seek(PDL_JSParameters *parms)
{
	ReportError("Entering Seek");

	double seekTime = PDL_GetJSParamDouble(parms, 0);
	int32_t iTrack = PDL_GetJSParamInt(parms, 1);
	g_MusController.PassMessage(MUS_MESSAGE_SEEK,
									seekTime, iTrack);

	ReportError("Finishing Seek");

	return PDL_TRUE;
}

PDL_bool SetCrossfade(PDL_JSParameters *parms)
{
	double fVal = PDL_GetJSParamDouble(parms, 0);
	ReportError1("Setting Crossfade to %f", fVal);

	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
								ATTRIB_CROSS_FADE,
								fVal);

	return PDL_TRUE;
}

PDL_bool SetVol(PDL_JSParameters *parms)
{
	double fVal = PDL_GetJSParamDouble(parms, 0);
	int32_t iTrack = PDL_GetJSParamInt(parms, 1);
	fVal *= 2;
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
								ATTRIB_BASSTREB_VOL_VAL,
								fVal, iTrack);

	return PDL_TRUE;
}

PDL_bool SetTreble(PDL_JSParameters *parms)
{
	double fVal = PDL_GetJSParamDouble(parms, 0);
	int32_t iTrack = PDL_GetJSParamInt(parms, 1);

	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
									ATTRIB_BASSTREB_TREB_VAL,
									fVal, iTrack);

	return PDL_TRUE;
}

PDL_bool SetMid(PDL_JSParameters *parms)
{
	double fVal = PDL_GetJSParamDouble(parms, 0);
	int32_t iTrack = PDL_GetJSParamInt(parms, 1);

	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
									ATTRIB_BASSTREB_MID_VAL,
									fVal, iTrack);

	return PDL_TRUE;
}

PDL_bool SetSpeed(PDL_JSParameters *parms)
{
	double fVal = PDL_GetJSParamDouble(parms, 0);
	int32_t iTrack = PDL_GetJSParamInt(parms, 1);

	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
									ATTRIB_RESAMP_SPEED_VAL,
									fVal, iTrack);

	return PDL_TRUE;
}

PDL_bool SetNoNext(PDL_JSParameters *parms)
{
	int32_t iTrack = PDL_GetJSParamInt(parms, 0);

	g_MusController.PassMessage(MUS_MESSAGE_SET_NO_NEXT,
									iTrack);

	return PDL_TRUE;
}

PDL_bool PluginQuit(PDL_JSParameters *parms)
{
	FMGUI_ChDir("/media/internal");
	g_iContinue = 0;

	return PDL_TRUE;
}

PDL_bool GetCurTime(PDL_JSParameters *parms)
{
	//ReportError("Entering Get Cur");

	PDL_Err err;

	int32_t iTrack = PDL_GetJSParamInt(parms, 0);

	const char *cstrRet;
	cstrRet = g_MusController.PassMessage(MUS_MESSAGE_GET_SONG_CUR, iTrack);

	err = PDL_JSReply(parms, cstrRet);

	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return PDL_FALSE;
	}

	//ReportError("Exiting Get Cur");

	return PDL_TRUE;
}

PDL_bool GetBPM(PDL_JSParameters *parms)
{
	//ReportError("Entering Get Cur");

	PDL_Err err;

	int32_t iTrack = PDL_GetJSParamInt(parms, 0);

	const char *cstrRet;
	cstrRet = g_MusController.PassMessage(MUS_MESSAGE_GET_BPM, iTrack);

	err = PDL_JSReply(parms, cstrRet);

	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return PDL_FALSE;
	}

	//ReportError("Exiting Get Cur");

	return PDL_TRUE;
}

PDL_bool GetEndTime(PDL_JSParameters *parms)
{
	//ReportError("Entering Get End");

	PDL_Err err;

	int32_t iTrack = PDL_GetJSParamInt(parms, 0);

	const char *cstrRet;
	cstrRet = g_MusController.PassMessage(MUS_MESSAGE_GET_SONG_END, iTrack);

	err = PDL_JSReply(parms, cstrRet);

	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return PDL_FALSE;
	}

	//ReportError("Exiting Get End");

	return PDL_TRUE;
}


PDL_bool GetCurrentDirLS(PDL_JSParameters *parms)
{
	PDL_Err err;

	const char *strVal = PDL_GetJSParamString(parms, 0);

	char *cstrRet = g_Indexer.GetDirFileList(strVal);

	err = PDL_JSReply(parms, cstrRet);

	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return PDL_FALSE;
	}

	free(cstrRet);

	return PDL_TRUE;
}


PDL_bool Ping(PDL_JSParameters *parms)
{
	PDL_Err err = PDL_JSReply(parms, "Pong");

	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return PDL_FALSE;
	}

	return PDL_TRUE;
}

PDL_bool GetFreqString(PDL_JSParameters *parms)
{
	//ReportError("Entering Get Cur");

	PDL_Err err;

	int32_t iTrack = PDL_GetJSParamInt(parms, 0);

	//ReportError1("GetFreq - iTrack:%i", iTrack);

	const char *cstrRet;
	cstrRet = g_MusController.PassMessage(MUS_MESSAGE_GET_FREQ_STR, iTrack);

	//ReportError1("GetFreq:%s", cstrRet);

	err = PDL_JSReply(parms, cstrRet);

	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return PDL_FALSE;
	}

	//ReportError("Exiting Get Cur");

	return PDL_TRUE;
}

PDL_bool GetAvgMagString(PDL_JSParameters *parms)
{
	//ReportError("Entering Get Cur");

	PDL_Err err;

	int32_t iTrack = PDL_GetJSParamInt(parms, 0);

	//ReportError1("GetAvg - iTrack:%i", iTrack);

	const char *cstrRet;
	cstrRet = g_MusController.PassMessage(MUS_MESSAGE_GET_MAG_STR, iTrack);

	//ReportError1("GetAvg:%s", cstrRet);

	err = PDL_JSReply(parms, cstrRet);

	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return PDL_FALSE;
	}

	//ReportError("Exiting Get Cur");

	return PDL_TRUE;
}

PDL_bool CheckPathForImg(PDL_JSParameters *parms)
{
	PDL_Err err;

	char retVal[512];

	const char *strVal = PDL_GetJSParamString(parms, 0);

	if (g_Indexer.CheckForImg(strVal, retVal))
	{
		err = PDL_JSReply(parms, retVal);

		if (err != PDL_NOERROR)
		{
			ReportError1("PDL_Init failed, err = %s", PDL_GetError());
			return PDL_FALSE;
		}
	}
	else
	{
		err = PDL_JSReply(parms, "-1");

		if (err != PDL_NOERROR)
		{
			ReportError1("PDL_Init failed, err = %s", PDL_GetError());
			return PDL_FALSE;
		}
	}


	return PDL_TRUE;
}

PDL_bool StartIndex(PDL_JSParameters *parms)
{
	int32_t iTime = PDL_GetJSParamInt(parms, 0);
	const char *cstrPath = PDL_GetJSParamString(parms, 1);

	ReportError1("Start Index with %s", cstrPath);

	if (iTime < 0)
		iTime = 0;
	else if (iTime > time (NULL))
	{
		ReportError("Time mismatch error");
		iTime = 0;
	}

	ReportError("Made if past time");

	g_Indexer.BuildIndex(iTime, cstrPath);

	return PDL_TRUE;
}


PDL_bool CheckDir(PDL_JSParameters *parms)
{
	const char *cstrPath = PDL_GetJSParamString(parms, 0);

	int32_t iDir = PDL_GetJSParamInt(parms, 1);

	int32_t iForce = PDL_GetJSParamInt(parms, 2);

	ReportError3("CheckDir with: %s : %i : %i", cstrPath, iDir, iForce);

	PDL_Err err;

	bool retVal;

	retVal = g_Indexer.CheckForDir(cstrPath, iDir, iForce);


	ReportError("Back From retval");

	if (retVal)
	{
		err = PDL_JSReply(parms, "1");

		if (err != PDL_NOERROR)
		{
			ReportError1("PDL_Init failed, err = %s", PDL_GetError());
			return PDL_FALSE;
		}
	}
	else
	{
		err = PDL_JSReply(parms, "0");

		if (err != PDL_NOERROR)
		{
			ReportError1("PDL_Init failed, err = %s", PDL_GetError());
			return PDL_FALSE;
		}
	}

	ReportError("Problem is probably in start indexing");

	return PDL_TRUE;
}

int Register()
{
	PDL_Err err;
	err = PDL_Init(0);

	Worm_OpenLog("wormp3_plugin", LOG_PID | LOG_PERROR, LOG_USER);

	ReportError("*****************TEST***********************");

	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return 1;
	}

	err = PDL_RegisterJSHandler("Ping", Ping);
	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return 1;
	}

	err = PDL_RegisterJSHandler("GetCurrentDirLS", GetCurrentDirLS);
	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return 1;
	}


	err = PDL_RegisterJSHandler("Play", Play);
	err = PDL_RegisterJSHandler("Pause", Pause);
	err = PDL_RegisterJSHandler("Open", Open);
	err = PDL_RegisterJSHandler("SetNext", SetNext);
	err = PDL_RegisterJSHandler("SetBass", SetBass);
	err = PDL_RegisterJSHandler("SetTreble", SetTreble);
	err = PDL_RegisterJSHandler("SetMid", SetMid);
	err = PDL_RegisterJSHandler("GetCurTime", GetCurTime);
	err = PDL_RegisterJSHandler("GetMetadata", GetMetadata);
	err = PDL_RegisterJSHandler("GetEndTime", GetEndTime);
	err = PDL_RegisterJSHandler("SetSpeed", SetSpeed);
	err = PDL_RegisterJSHandler("SetVol", SetVol);
	err = PDL_RegisterJSHandler("Seek", Seek);
	err = PDL_RegisterJSHandler("Quit", PluginQuit);
	err = PDL_RegisterJSHandler("SetEQ", SetEQ);
	err = PDL_RegisterJSHandler("SetCrossfade", SetCrossfade);
	err = PDL_RegisterJSHandler("StartIndex", StartIndex);
	err = PDL_RegisterJSHandler("SetMetadataPath", SetMetadataPath);
	err = PDL_RegisterJSHandler("GetBPM", GetBPM);
	err = PDL_RegisterJSHandler("SetNoNext", SetNoNext);
	err = PDL_RegisterJSHandler("GetFreqString", GetFreqString);
	err = PDL_RegisterJSHandler("GetAvgMagString", GetAvgMagString);
	err = PDL_RegisterJSHandler("CheckPathForImg", CheckPathForImg);
	err = PDL_RegisterJSHandler("CheckDir", CheckDir);

	err = PDL_JSRegistrationComplete();
	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return 1;
	}

	return 0;
}
#endif

SDL_Surface* g_screen;

int Init()
{

	// init SDL. This function is all it takes to init both
	// the audio and video.
	if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO ))
	{
		ReportError1("SDL_Init failed, err = %s", SDL_GetError());
		return 1;
	}

	// Should not need this to be called, but not sure, so leaving it commented
	//	until we can be sure it is not needed.

	Uint32 videoFlags = SDL_SWSURFACE;

	// Note that these were originally the full screen.  Don't think that is
	// needed but just in case it is being marked here.
	g_screen = SDL_SetVideoMode(100, 100, 0, videoFlags);
	if ( g_screen == NULL )
	{
		// couldn't make that screen
		return 1;
	}


	// return 0 for success
	return 0;
}


void Quit()
{
#ifdef ON_DEVICE
	PDL_Quit();
#endif

	SDL_Quit();
}


int main(int argc,char *argv[])
{
	/*g_Indexer.SetCallback(FinishIndex, AddToIndex);

	g_Indexer.BuildIndex();

	while (1)
	{
		WormSleep(10000);
	}*/

	if (Init()) return 0;

	g_Indexer.SetCallback(FinishIndex, AddToIndex);

	if(REGISTER_WITH_DEVICE) return 0;

	ReportError("In Build Index");

	ReportError("Past Build Index");

	// Inits the music part of the program.
	g_MusController.Init(StartSong, FinishSeek);

	ReportError("About to start the music controller");

	g_MusController.Start();

	ReportError("Made it past the init stuff");

	WormIndexer::READY = 1;

#ifndef ON_DEVICE

	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
								ATTRIB_MUSCON_PAUSED,
								MUS_PLAY_CONST,
								0);


	//g_MusController.PassMessage(MUS_MESSAGE_OPEN_SONG, "http://dl.dropbox.com/u/8094086/ICD.mp3", 0, 0);

	//AddToIndex("c:/aobdt.mp3");

	//TagLib::FileRef f("c:/aobdt.mp3");

	//TagLib::Tag *t = f.tag();

	/*TagLib::ASF::AttributeListMap::ConstIterator iter = t->attributeListMap().begin();

	    for(; iter != t->attributeListMap().end(); iter++)
		{
			fprintf(stderr, "Please Work!!!!!  %s- %s\n",
					(*iter).first.toCString(),
					(*iter).second.front().toString().toCString());
		}*/

	//t->setAlbumArtist("Test it");

	//f->save();

	//delete f;
	//xcom->addField("ALBUMARTIST", "The Killers");
	//t->setAlbum("test");


	//fprintf(stderr, "What is our outpput: %s\n", t->title().toCString());



	//fprintf(stderr, "Album Artist: %s", (*tag).albumArtist().toCString());
	//delete f;

	g_MusController.PassMessage(MUS_MESSAGE_OPEN_SONG, "c:/amazing_grace.ogg", 0);
	g_MusController.PassMessage(MUS_MESSAGE_SET_NO_NEXT,
										0);
	//g_MusController.PassMessage(MUS_MESSAGE_OPEN_SONG, "c:/test1.mp3", 0);

	/*g_MusController.PassMessage(MUS_MESSAGE_SET_NEXT, "c:/amazing_grace.ogg", -10.0, 0);

	//g_MusController.PassMessage(MUS_MESSAGE_SET_NEXT, "c:/test2.mp3", -10.0, 0);

	ReportError("Made it past SetNext");

	// this keeps track of how long the user has waited for
	//	the buffering
	uint32_t uiCurWaitTime;

	uiCurWaitTime = 0;

	// routine to stop for a set time
	/*WormMarkStartTime();
	while (uiCurWaitTime < 10) // check wait time
	{
		uiCurWaitTime = WormCheckTimeSinceMark();
		WormSleep(100);
	}

	g_MusController.PassMessage(MUS_MESSAGE_SEEK,
									100.0);*/


	while (g_iContinue)
	{
		WormSleep(1800);
		//ReportError1("BPM:%s", g_MusController.PassMessage(MUS_MESSAGE_GET_BPM, 0));
		//ReportError1("CurTime:%s", g_MusController.PassMessage(MUS_MESSAGE_GET_SONG_CUR, 0));
		/*const char *cstrRet = g_MusController.PassMessage(MUS_MESSAGE_GET_MAG_STR, 0);
		for (int i=0; i<256; i++)
		{
			fprintf(ERROUT,"%i|", cstrRet[i]);
		}
		fprintf(ERROUT, "\n");*/
	}

#else
	while (g_iContinue)
	{
		WormSleep(1000);
	}
#endif


	Quit();
	return 0;
}
