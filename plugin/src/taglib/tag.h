/***************************************************************************
    copyright            : (C) 2002 - 2008 by Scott Wheeler
    email                : wheeler@kde.org
 ***************************************************************************/

/***************************************************************************
 *   This library is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU Lesser General Public License version   *
 *   2.1 as published by the Free Software Foundation.                     *
 *                                                                         *
 *   This library is distributed in the hope that it will be useful, but   *
 *   WITHOUT ANY WARRANTY; without even the implied warranty of            *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU     *
 *   Lesser General Public License for more details.                       *
 *                                                                         *
 *   You should have received a copy of the GNU Lesser General Public      *
 *   License along with this library; if not, write to the Free Software   *
 *   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA         *
 *   02110-1301  USA                                                       *
 *                                                                         *
 *   Alternatively, this file is available under the Mozilla Public        *
 *   License Version 1.1.  You may obtain a copy of the License at         *
 *   http://www.mozilla.org/MPL/                                           *
 ***************************************************************************/

#ifndef TAGLIB_TAG_H
#define TAGLIB_TAG_H

#include "taglib_export.h"
#include "toolkit/tstring.h"

namespace TagLib {

  //! A simple, generic interface to common audio meta data fields

  /*!
   * This is an attempt to abstract away the difference in the meta data formats
   * of various audio codecs and tagging schemes.  As such it is generally a
   * subset of what is available in the specific formats but should be suitable
   * for most applications.  This is meant to compliment the generic APIs found
   * in TagLib::AudioProperties, TagLib::File and TagLib::FileRef.
   */

  class TAGLIB_EXPORT Tag
  {
  public:

    /*!
     * Detroys this Tag instance.
     */
    virtual ~Tag();

    /*!
     * Returns the track name; if no track name is present in the tag
     * String::null will be returned.
     */
    virtual String title() const = 0;

    /*!
     * Returns the artist name; if no artist name is present in the tag
     * String::null will be returned.
     */
    virtual String artist() const = 0;

    /*!
     * Returns the album name; if no album name is present in the tag
     * String::null will be returned.
     */
    virtual String album() const = 0;

    /*!
     * Returns the album artist for compilations;
     * if no album name is present in the tag
     * String::null will be returned.
     */
    virtual String albumArtist() const = 0;

    /*!
     * Returns the track comment; if no comment is present in the tag
     * String::null will be returned.
     */
    virtual String comment() const = 0;

    /*!
     * Returns the genre name; if no genre is present in the tag String::null
     * will be returned.
     */
    virtual String genre() const = 0;

    /*!
     * Returns the year; if there is no year set, this will return 0.
     */
    virtual uint year() const = 0;

    /*!
     * Returns the track number; if there is no track number set, this will
     * return 0.
     */
    virtual uint track() const = 0;

    /*!
     * Sets the title to \a s.  If \a s is String::null then this value will be
     * cleared.
     */
    virtual void setTitle(const String &s) = 0;

    /*!
     * Sets the artist to \a s.  If \a s is String::null then this value will be
     * cleared.
     */
    virtual void setArtist(const String &s) = 0;

    /*!
     * Sets the album to \a s.  If \a s is String::null then this value will be
     * cleared.
     */
    virtual void setAlbum(const String &s) = 0;

    /*!
     * Returns the album artist for compilations;
     * if no album name is present in the tag
     * String::null will be returned.
     */
    virtual void setAlbumArtist(const String &s) = 0;

    /*!
     * Sets the comment to \a s.  If \a s is String::null then this value will be
     * cleared.
     */
    virtual void setComment(const String &s) = 0;

    /*!
     * Sets the genre to \a s.  If \a s is String::null then this value will be
     * cleared.  For tag formats that use a fixed set of genres, the appropriate
     * value will be selected based on a string comparison.  A list of available
     * genres for those formats should be available in that type's
     * implementation.
     */
    virtual void setGenre(const String &s) = 0;

    /*!
     * Sets the year to \a i.  If \a s is 0 then this value will be cleared.
     */
    virtual void setYear(uint i) = 0;

    /*!
     * Sets the track to \a i.  If \a s is 0 then this value will be cleared.
     */
    virtual void setTrack(uint i) = 0;

    /*!
     * Returns true if the tag does not contain any data.  This should be
     * reimplemented in subclasses that provide more than the basic tagging
     * abilities in this class.
     */
    virtual bool isEmpty() const;

    /*!
     * Copies the generic data from one tag to another.
     *
     * \note This will no affect any of the lower level details of the tag.  For
     * instance if any of the tag type specific data (maybe a URL for a band) is
     * set, this will not modify or copy that.  This just copies using the API
     * in this class.
     *
     * If \a overwrite is true then the values will be unconditionally copied.
     * If false only empty values will be overwritten.
     */
    static void duplicate(const Tag *source, Tag *target, bool overwrite = true);

  protected:
    /*!
     * Construct a Tag.  This is protected since tags should only be instantiated
     * through subclasses.
     */
    Tag();

  private:
    Tag(const Tag &);
    Tag &operator=(const Tag &);

    class TagPrivate;
    TagPrivate *d;
  };
}

/*************************
 * Here are some general Tags
 *
 * Title
ID3v2: TIT2, TT2
OGG: TITLE
APE: Title
MP4: ©nam
ASF: WM/Title
RIFF: INAM
Alternatives: --

Artist
ID3v2: TPE1, TP1
OGG: ARTIST
APE: Artist
MP4: ©ART
ASF: WM/Author
RIFF: IART
Alternatives: ISTR, AUTHOR

Album
ID3v2: TALB, TAL
OGG: ALBUM
APE: Album
MP4: ©alb
ASF: WM/AlbumTitle
RIFF: IPRD
Alternatives: --

AlbumArtist
ID3v2: TALB, TAL
OGG: ALBUMARTIST
APE: Album Artist
MP4: aART
ASF: WM/AlbumArtist
RIFF: ISBJ
Alternatives: H2_ALBUMARTIST, REMIXER, ENSEMBLE, ORCHESTRA, BAND, PERFORMER, iaar

Track (numbers)
ID3v2: TRCK, TRK
OGG: TRACKNUMBER
APE: Track
MP4: trkn
ASF: WM/TrackNumber
RIFF: IPRT, ITRK
Alternatives: TRACKNUM

Disc (numbers)
ID3v2: TPOS, TPA
OGG: DISCNUMBER
APE: Disc
MP4: disk
ASF: WM/PartOfSet
RIFF: IFRM
Alternatives: DISCNUM

Year
ID3v2: TYER, TYE
OGG: DATE
APE: Year
MP4: ©day
ASF: WM/Year
RIFF: ICRD
Alternatives: TDRC, RELEASEDATE, RELEASE DATE

Genre
ID3v2: TCON, TCO
OGG: GENRE
APE: Genre
MP4: ©gen
ASF: WM/Genre
RIFF: IGNR
Alternatives: --

Copyright
ID3v2: TCOP, TCR
OGG: COPYRIGHT
APE: Copyright
MP4: cprt
ASF: Copyright
RIFF: ICOP
Alternatives: PROVIDER, WM/Provider

EncodedBy
ID3v2: TENC, TEN
OGG: ENCODEDBY
APE: EncodedBy
MP4: ©too
ASF: WM/EncodedBy
RIFF: ISFT
Alternatives: VERSION, ENCODED BY, ENCODED-BY, ENCODER, SOFTWARE, TOOL

Publisher
ID3v2: TPUB, TPB
OGG: LABEL
APE: Label
MP4: ----:com.apple.iTunes:LABEL
ASF: WM/Publisher
RIFF: ICMS
Alternatives: PUBLISHER, ORIGINALSOURCE, VENDOR

Composer
ID3v2: TCOM, TCM
OGG: COMPOSER
APE: Composer
MP4: ©wrt
ASF: WM/Composer
RIFF: IENG
Alternatives: ORGANIZATION, WRITER, IMUS

Conductor
ID3v2: TPE3, TP3
OGG: CONDUCTOR
APE: Conductor
MP4: ----:com.apple.iTunes:CONDUCTOR
ASF: WM/Conductor
RIFF: ITCH
Alternatives: --

Lyricist
ID3v2: TEXT, TXT
OGG: LYRICIST
APE: Lyricist
MP4: ----:com.apple.iTunes:LYRICIST
ASF: WM/Writer
RIFF: IWRI
Alternatives: TEXTER, SONGWRITER

Remixer
ID3v2: TPE4, TP4
OGG: REMIXER
APE: MixArtist
MP4: ----:com.apple.iTunes:REMIXER
ASF: WM/ModifiedBy
RIFF: IEDT
Alternatives: ModifiedBy

Producer
ID3v2: TIPL, IPL
OGG: PRODUCER
APE: Producer
MP4: ----:com.apple.iTunes:PRODUCER
ASF: WM/Producer
RIFF: IPRO
Alternatives: --

Comment
ID3v2: COMM, COM
OGG: COMMENT
APE: Comment
MP4: ©cmt
ASF: WM/Description
RIFF: ICMT
Alternatives: DESCRIPTION

Grouping
ID3v2: TIT1, TT1
OGG: GROUPING
APE: Grouping
MP4: ©grp
ASF: WM/ContentGroupDescription
RIFF: ISRF
Alternatives: GROUP

Mood
ID3v2: TMOO
OGG: MOOD
APE: Mood
MP4: ----:com.apple.iTunes:MOOD
ASF: WM/Mood
RIFF: IKEY
Alternatives: --

Rating*
ID3v2: POPM
OGG: RATING
APE: Rating
MP4: rtng
ASF: WM/SharedUserRating
RIFF: ISHP
Alternatives: TXXX:RATING, IRTD

ISRC
ID3v2: TSCR
OGG: ISRC
APE: ISRC
MP4: ----:com.apple.iTunes:ISRC
ASF: WM/ISRC
RIFF: ISRC
Alternatives: --

BPM
ID3v2: TBPM, TBP
OGG: BPM
APE: BPM
MP4: ----:com.apple.iTunes:BPM
ASF: WM/BeatsPerMinute
RIFF: IBPM
Alternatives: TEMPO, IDPI, tmpo, H2_BPM, BEATSPERMINUTE

Replaygain_Track_Gain
ID3v2: TXXX:replaygain_track_gain
OGG: replaygain_track_gain
APE: replaygain_track_gain
MP4: ----:com.apple.iTunes:replaygain_track_gain
ASF: replaygain_track_gain
RIFF: IRGG
Alternatives: itgl

Replaygain_Track_Peak
ID3v2: TXXX:replaygain_track_peak
OGG: replaygain_track_peak
APE: replaygain_track_peak
MP4: ----:com.apple.iTunes:replaygain_track_peak
ASF: replaygain_track_peak
RIFF: IRGP
Alternatives: --
 *
 *
 *
 */

#endif
