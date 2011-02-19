/******************
 * This class is used to abstract the setting and getting
 *	of values used by modules of a controller.  It is
 *	used to simplify the message passing code, so it does
 *	not have to have a case statement for every possible
 *	value that can be set in something like a filter.
 ******************/
#ifndef WORMATTRIBUTE_H
#define WORMATTRIBUTE_H

#include "Messages.h"
#include <stdint.h>

#define AttribID uint32_t

enum AttributeType
{
	ATTRIBUTE_INT,
	ATTRIBUTE_DOUBLE,
	ATTRIBUTE_STRING,
	ATTRIBUTE_NOTSET
};

struct AttributeStruct
{
	AttributeType	Type;
	
	char *(*GetFunction)();
	void (*IntSet)(int32_t);
	void (*StrSet)(const char *);
	void (*DoubleSet)(double);
	
	AttributeStruct() {Type = ATTRIBUTE_NOTSET;};
};

class AttributeHandler
{
private:
	
	AttributeStruct m_pASRoot[ATTRIBID_MAX];
	
public:

	void RegisterIntAttribute(char*(*AttributeGetFunc)(),
							  void (*AttributeSetFunc)(int32_t),
							  AttribID ID);
								 
	void RegisterDoubleAttribute(char*(*AttributeGetFunc)(),
								 void (*AttributeSetFunc)(double),
								 AttribID ID);
								 
 	void RegisterStringAttribute(char*(*AttributeGetFunc)(),
								 void (*AttributeSetFunc)(const char*),
								 AttribID ID);
	
	int16_t GetAttribute(AttribID ID, char *RetVal);
	int16_t SetAttribute(AttribID ID, char *val);

	AttributeType GetType(AttribID ID) {return m_pASRoot[ID].Type;};
};

#endif
