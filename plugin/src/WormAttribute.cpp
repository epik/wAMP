#include "WormAttribute.h"
#include "WormDebug.h"
#include <stdio.h>
#include <cstdlib>

void AttributeHandler::RegisterIntAttribute(char*(*AttributeGetFunc)(),
										 void (*AttributeSetFunc)(int32_t),
										 AttribID ID)
{
	m_pASRoot[ID].Type = ATTRIBUTE_INT;
	m_pASRoot[ID].GetFunction	= AttributeGetFunc;
	m_pASRoot[ID].IntSet		= AttributeSetFunc;
}

void AttributeHandler::RegisterDoubleAttribute(char*(*AttributeGetFunc)(),
										 void (*AttributeSetFunc)(double),
										 AttribID ID)
{
	m_pASRoot[ID].Type = ATTRIBUTE_DOUBLE;
	m_pASRoot[ID].GetFunction	= AttributeGetFunc;
	m_pASRoot[ID].DoubleSet		= AttributeSetFunc;
}

void AttributeHandler::RegisterStringAttribute(char*(*AttributeGetFunc)(),
										void (*AttributeSetFunc)(const char*),
										AttribID ID)
{
	m_pASRoot[ID].Type = ATTRIBUTE_STRING;
	m_pASRoot[ID].GetFunction	= AttributeGetFunc;
	m_pASRoot[ID].StrSet		= AttributeSetFunc;
}

int16_t AttributeHandler::GetAttribute(AttribID ID, char *RetVal)
{
	if (RetVal == NULL) RetVal = (char *) malloc(256);

	if (ID > ATTRIBID_MAX)
	{
		MUS_ERROR(MUS_ERROR_ATTRIBUTE_CALLBACK_ERR,
								"ID value out of range.\n");
		return 1;
	}
	else if (m_pASRoot[ID].Type == ATTRIBUTE_NOTSET)
	{
		MUS_ERROR(MUS_ERROR_ATTRIBUTE_CALLBACK_ERR,
									"ID value not found.\n");
		return 1;
	}
	else
	{
		char *strVal = m_pASRoot[ID].GetFunction();
		strcpy(RetVal,strVal);
		free(strVal);
		return 0;
	}
}

int16_t AttributeHandler::SetAttribute(AttribID ID, char *val)
{
	//ReportError2("Setting Attrib ID=%i, with val \"%s\"", ID, val);

	if (ID > ATTRIBID_MAX)
	{
		MUS_ERROR(MUS_ERROR_ATTRIBUTE_CALLBACK_ERR,
									"ID value out of range.\n");
		return 1;
	}
	else if (m_pASRoot[ID].Type == ATTRIBUTE_NOTSET)
	{
		MUS_ERROR(MUS_ERROR_ATTRIBUTE_CALLBACK_ERR,
										"ID value not found.\n");
		return 1;
	}
	
	if (m_pASRoot[ID].Type == ATTRIBUTE_INT)
	{
		int32_t i;
		sscanf(val, "%i", &i);
		m_pASRoot[ID].IntSet(i);
	}
	else if (m_pASRoot[ID].Type == ATTRIBUTE_DOUBLE)
	{
		float d;
		sscanf(val, "%f", &d);
		m_pASRoot[ID].DoubleSet((double) d);
	}
	else
	{
		const char *str = (const char *) val;
		m_pASRoot[ID].StrSet(str);
	}
	
	return 0;
}
