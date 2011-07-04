/*
 * wormp3.cpp
 *
 *  Created on: Dec 24, 2010
 *      Author: Katiebird
 */

#include "config.h"
#include "WormDebug.h"
#include "WormThread.h"
#include "MusController.h"
#include "SDL.h"
#include "Indexer/Indexer.h"
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


void StartSong(const char *cstrVal)
{
	ReportError1("cstr=%s", cstrVal);

if (!cstrVal)
	cstrVal = "0000";

#if USE_PDL
	const char *params[1];
	params[0] = cstrVal;

	PDL_Err mjErr = PDL_CallJS("StartSong", params, 1);
	if ( mjErr != PDL_NOERROR )
	{
	  printf("error: %s\n", PDL_GetError());
	}

#endif
	ReportError1("*****Callback Val: %s", cstrVal);


}

void FinishIndex(const char *cstrVal)
{
#if USE_PDL

	const char *params[1];
	params[0] = cstrVal;

	PDL_Err mjErr = PDL_CallJS("FinishIndex", params, 1);
	if ( mjErr != PDL_NOERROR )
	{
		ReportError1("error: %s\n", PDL_GetError());
	}
#else
	ReportError1("Callback Val: %s", cstrVal);
#endif
}

void FinishSeek(const char *cstrVal)
{
#if USE_PDL

	ReportError("Entering FinishSeek");

	const char *params[1];
	params[0] = cstrVal;

	PDL_Err mjErr = PDL_CallJS("FinishSeek", params, 1);
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

	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET, ATTRIB_MUSCON_PAUSED, 0, 0);


	return PDL_TRUE;
}

PDL_bool Pause(PDL_JSParameters *parms)
{
#ifdef PROFILE
	FMGUI_ChDir("/media/internal");
	exit(0);
#endif

	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET, ATTRIB_MUSCON_PAUSED, 1, 0);

	return PDL_TRUE;
}

PDL_bool GetMetadata(PDL_JSParameters *parms)
{
	const char *cstrPath = PDL_GetJSParamString(parms, 0);

	ReportError1("Getting meta for %s", cstrPath);
	const char *cstrRet = g_Indexer.GetMetadata(cstrPath);

	PDL_Err err = PDL_JSReply(parms, cstrRet);

	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return PDL_FALSE;
	}

	return PDL_TRUE;
}

PDL_bool SetEQ(PDL_JSParameters *params)
{
	const char *cstrPath = PDL_GetJSParamString(parms, 0);
	ReportError1("Open Message being created for %s", cstrPath);
	g_MusController.PassMessage(MUS_MESSAGE_OPEN_SONG, cstrPath);

	return PDL_TRUE;
}

PDL_bool Open(PDL_JSParameters *parms)
{
	const char *cstrPath = PDL_GetJSParamString(parms, 0);
	ReportError1("Open Message being created for %s", cstrPath);
	g_MusController.PassMessage(MUS_MESSAGE_OPEN_SONG, cstrPath);

	return PDL_TRUE;
}

PDL_bool SetNext(PDL_JSParameters *parms)
{
	const char *cstrPath = PDL_GetJSParamString(parms, 0);
	double dGap = PDL_GetJSParamDouble(parms, 1);
	ReportError1("dGap val: %f", dGap);
	g_MusController.PassMessage(MUS_MESSAGE_SET_NEXT, cstrPath, dGap);

	return PDL_TRUE;
}

PDL_bool SetBass(PDL_JSParameters *parms)
{
	double fVal = PDL_GetJSParamDouble(parms, 0);
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
								ATTRIB_BASSTREB_BASS_VAL,
								fVal, 0);

	return PDL_TRUE;
}

PDL_bool Seek(PDL_JSParameters *parms)
{
	ReportError("Entering Seek");

	double seekTime = PDL_GetJSParamDouble(parms, 0);
	g_MusController.PassMessage(MUS_MESSAGE_SEEK,
									seekTime);

	ReportError("Finishing Seek");

	return PDL_TRUE;
}

PDL_bool SetVol(PDL_JSParameters *parms)
{
	double fVal = PDL_GetJSParamDouble(parms, 0);
	fVal *= 2;
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
								ATTRIB_BASSTREB_VOL_VAL,
								fVal, 0);

	return PDL_TRUE;
}

PDL_bool SetTreble(PDL_JSParameters *parms)
{
	double fVal = PDL_GetJSParamDouble(parms, 0);
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
									ATTRIB_BASSTREB_TREB_VAL,
									fVal, 0);

	return PDL_TRUE;
}

PDL_bool SetMid(PDL_JSParameters *parms)
{
	double fVal = PDL_GetJSParamDouble(parms, 0);
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
									ATTRIB_BASSTREB_MID_VAL,
									fVal, 0);

	return PDL_TRUE;
}

PDL_bool SetSpeed(PDL_JSParameters *parms)
{
	double fVal = PDL_GetJSParamDouble(parms, 0);
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
									ATTRIB_RESAMP_SPEED_VAL,
									fVal, 0);

	return PDL_TRUE;
}

PDL_bool PluginQuit(PDL_JSParameters *parms)
{
	g_iContinue = 0;

	return PDL_TRUE;
}

PDL_bool GetCurTime(PDL_JSParameters *parms)
{
	//ReportError("Entering Get Cur");

	PDL_Err err;

	const char *cstrRet;
	cstrRet = g_MusController.PassMessage(MUS_MESSAGE_GET_SONG_CUR);

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

	const char *cstrRet;
	cstrRet = g_MusController.PassMessage(MUS_MESSAGE_GET_SONG_END);

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


int Register()
{
	PDL_Err err;
	err = PDL_Init(0);

	Worm_OpenLog("wormp3_plugin", LOG_PID, LOG_USER);

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
	err = PDL_RegisterJSHandler("SetEQ", PluginQuit);

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
	/*g_Indexer.BuildIndex();

	g_Indexer.SetCallback(FinishIndex);

	while (1)
	{
		WormSleep(300);
	}*/

	if (Init()) return 0;

	if(REGISTER_WITH_DEVICE) return 0;

	if(argc < 2)
	{
#ifdef ON_DEVICE
		ReportError("In Build Index");

		g_Indexer.SetCallback(FinishIndex);

		g_Indexer.BuildIndex();

#endif
	}

	ReportError("Past Build Index");

	// Inits the music part of the program.
	g_MusController.Init(StartSong, FinishSeek);

	ReportError("About to start the music controller");

	g_MusController.Start();

	ReportError("Made it past the init stuff");

#ifndef ON_DEVICE

	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET, ATTRIB_MUSCON_PAUSED, 0);

	g_MusController.PassMessage(MUS_MESSAGE_OPEN_SONG, "c:/Wildlife.wmv");

	g_MusController.PassMessage(MUS_MESSAGE_SET_NEXT, "c:/test2.mp3", 10.0);

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
		WormSleep(800);
		//ReportError1("State:%s", g_MusController.PassMessage(MUS_MESSAGE_GET_SONG_CUR));
	}

#else
	while (1)
	{
		WormSleep(300);
	}
#endif


	Quit();
	return 0;
}
