#!/usr/bin/env bash
for dir in *; do
	if [ -d "$dir" ]; then # The -d flag checks if the given path exists and is a directory.
		echo "$dir"
		cd "$dir"
		magick mogrify -format jpg *.HEIC
#       for filename in *.HEIC; do
#	        ~/Image-ExifTool-13.32/exiftool -overwrite_original -tagsFromFile $filename -gps:all ${filename:0:-5}.jpg
#       done
		rm *.HEIC *.mp4
		cd ..
	fi
done
