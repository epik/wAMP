

#ifndef WORMP3_INDEXER_H
#define WORMP3_INDEXER_H

#include "config.h"

#include <stdint.h>

#include "../WormDebug.h"

struct IndexItem
{
	char 		*Path;
	char		*JSON;
	IndexItem	*Next;
};

struct Index
{
	int32_t		NumItems;
	IndexItem	*ItemHead;
};

class WormIndexer
{
private:

	Index m_vIndex;
	
public:

	void Init(const char *cstrSearchPath);
	
};





#endif
