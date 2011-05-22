/*
 * FFmpegFix.h
 *
 *  Created on: Feb 20, 2011
 *      Author: Katiebird
 */

#ifndef FFMPEGFIX_H_
#define FFMPEGFIX_H_

#ifdef ON_DEVICE
#ifndef UINT64_C
#define UINT64_C(value) __CONCAT(value, ULL)
#endif
#ifndef INT64_C
#define INT64_C(value) __CONCAT(value, LL)
#endif
#endif

#endif /* FFMPEGFIX_H_ */
