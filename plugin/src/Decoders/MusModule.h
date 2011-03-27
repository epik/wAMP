/*
 * musmodule.h
 *
 *  Created on: Aug 17, 2010
 *      Author: Katiebird
 */

#ifndef MUSMODULE_H_
#define MUSMODULE_H_

#include "../WormMacro.h"
#include <stdint.h>


enum MusMessage
{
	MUS_MOD_Done 	= -1,
	MUS_MOD_Success = 1,
	MUS_MOD_Error	= 0,
	MUS_MOD_Too_Short = 2
};

class MusModule 
{
private:
	long	 		m_lBufferSize;
	int				m_iChannels;
	long			m_lRate;
	
public:
	
	MusModule() {};

	long	GetBufferSize() {return m_lBufferSize;};
	void	SetBufferSize(long val) {m_lBufferSize = val;};

	int 	GetNumChannels() {return m_iChannels;};
	void	SetNumChannels(int val) {m_iChannels = val;};

	long	GetSampleRate() {return m_lRate;};
	void	SetSampleRate(long val) {m_lRate = val;};
};



#endif /* MUSMODULE_H_ */
