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
#if USE_PDL
#include "PDL.h"
#define REGISTER_WITH_DEVICE Register()
#else
#define REGISTER_WITH_DEVICE 0
#endif


MusController g_MusController;

int32_t	g_iContinue = 1;

int32_t	g_InitError = 0;

#if USE_PDL



PDL_bool Play(PDL_JSParameters *parms)
{

	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET, ATTRIB_MUSCON_PAUSED, "0");


	return PDL_TRUE;
}

PDL_bool Pause(PDL_JSParameters *parms)
{
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET, ATTRIB_MUSCON_PAUSED, "1");

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
	double dGap = PDL_GetJSParamDouble(parms, 2);
	g_MusController.PassMessage(MUS_MESSAGE_SET_NEXT, cstrPath, dGap);

	return PDL_TRUE;
}

PDL_bool SetBass(PDL_JSParameters *parms)
{
	const char *strVal = PDL_GetJSParamString(parms, 0);
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
								ATTRIB_BASSTREB_BASS_VAL,
								strVal);

	return PDL_TRUE;
}

PDL_bool Seek(PDL_JSParameters *parms)
{
	double seekTime = PDL_GetJSParamDouble(parms, 0);
	g_MusController.PassMessage(MUS_MESSAGE_SEEK,
									seekTime);


	return PDL_TRUE;
}

PDL_bool SetVol(PDL_JSParameters *parms)
{
	const char *strVal = PDL_GetJSParamString(parms, 0);
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
								ATTRIB_BASSTREB_VOL_VAL,
								strVal);

	return PDL_TRUE;
}

PDL_bool SetTreble(PDL_JSParameters *parms)
{
	const char *strVal = PDL_GetJSParamString(parms, 0);
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
									ATTRIB_BASSTREB_TREB_VAL,
									strVal);

	return PDL_TRUE;
}

PDL_bool SetSpeed(PDL_JSParameters *parms)
{
	const char *strVal = PDL_GetJSParamString(parms, 0);
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET,
									ATTRIB_RESAMP_SPEED_VAL,
									strVal);

	return PDL_TRUE;
}

PDL_bool PluginQuit(PDL_JSParameters *parms)
{
	g_iContinue = 0;

	return PDL_TRUE;
}

PDL_bool GetState(PDL_JSParameters *parms)
{
	PDL_Err err;

	char *cstrRet;
	cstrRet = g_MusController.PassMessage(MUS_MESSAGE_GET_SONG_STATE);

	err = PDL_JSReply(parms, cstrRet);

	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return PDL_FALSE;
	}

	free(cstrRet);

	return PDL_TRUE;
}

PDL_bool GetMetadata(PDL_JSParameters *parms)
{
	PDL_Err err;

	char *cstrRet;
	cstrRet = g_MusController.PassMessage(MUS_MESSAGE_GET_META);

	err = PDL_JSReply(parms, cstrRet);

	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return PDL_FALSE;
	}

	free(cstrRet);

	return PDL_TRUE;
}

int Register()
{
	PDL_Err err;
	err = PDL_Init(0);

	Worm_OpenLog("wormp3_plugin", LOG_PID, LOG_USER);

	if (err != PDL_NOERROR)
	{
		ReportError1("PDL_Init failed, err = %s", PDL_GetError());
		return 1;
	}


	err = PDL_RegisterJSHandler("Play", Play);
	err = PDL_RegisterJSHandler("Pause", Pause);
	err = PDL_RegisterJSHandler("Open", Open);
	err = PDL_RegisterJSHandler("OpenNext", SetNext);
	err = PDL_RegisterJSHandler("SetBass", SetBass);
	err = PDL_RegisterJSHandler("SetTreble", SetTreble);
	err = PDL_RegisterJSHandler("GetState", GetState);
	err = PDL_RegisterJSHandler("SetSpeed", SetSpeed);
	err = PDL_RegisterJSHandler("SetVol", SetVol);
	err = PDL_RegisterJSHandler("Seek", Seek);
	err = PDL_RegisterJSHandler("Quit", PluginQuit);
	err = PDL_RegisterJSHandler("GetMetadata", GetMetadata);


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

int main()
{

	if (Init()) return 0;

	if(REGISTER_WITH_DEVICE) return 0;

	// Inits the music part of the program.
	g_MusController.Init();
	g_MusController.Start();

	//ReportError("Made it past the init stuff");

#ifndef ON_DEVICE
	
	g_MusController.PassMessage(MUS_MESSAGE_ATTRIB_SET, ATTRIB_MUSCON_PAUSED, "0");

	g_MusController.PassMessage(MUS_MESSAGE_OPEN_SONG, "c:/t2.mp3");

	ReportError1("%s", g_MusController.PassMessage(MUS_MESSAGE_GET_SONG_STATE));

	g_MusController.PassMessage(MUS_MESSAGE_SET_NEXT, "c:/f.m4a", 0.0);

	// this keeps track of how long the user has waited for
	//	the buffering
	uint32_t uiCurWaitTime = 0;

	ReportError1("%s", g_MusController.PassMessage(MUS_MESSAGE_GET_SONG_STATE));

	// This starts the timer running so we can know how long we have
	//	been filling the buffer
	WormMarkStartTime();

	// Run fillbuffer until we meet one of the specified conditions
	while (uiCurWaitTime < 4) // check wait time
	{
		ReportError1("%s", g_MusController.PassMessage(MUS_MESSAGE_GET_SONG_STATE));
		// update time since we started
		uiCurWaitTime = WormCheckTimeSinceMark();
		// Give the gui a chance to work
		WormSleep(1);
	}

	//g_MusController.PassMessage(MUS_MESSAGE_OPEN_SONG, "c:/e.mp3");
	g_MusController.PassMessage(MUS_MESSAGE_OPEN_SONG, "c:/test1.mp3");

	g_MusController.PassMessage(MUS_MESSAGE_SET_NEXT, "c:/test2.mp3", 0.0);
	//g_MusController.PassMessage(MUS_MESSAGE_SET_NEXT, "c:/f.m4a", 0.0);

	while (1)
	{
		WormSleep(50);
		ReportError1("%s", g_MusController.PassMessage(MUS_MESSAGE_GET_SONG_STATE));
	}

#else
	while (1)
	{
		WormSleep(500);
	}
#endif


	Quit();
	return 0;
}
