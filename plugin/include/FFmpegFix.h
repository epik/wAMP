/*
 * FFmpegFix.h
 *
 *  Created on: Feb 20, 2011
 *      Author: Katiebird
 */

#ifndef FFMPEGFIX_H_
#define FFMPEGFIX_H_

#ifdef ON_DEVICE
#define UINT64_C(value) __CONCAT(value, ULL)
#endif

#endif /* FFMPEGFIX_H_ */
