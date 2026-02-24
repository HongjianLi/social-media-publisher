#!/usr/bin/env bash
for dir in *; do
	if [ -d "$dir" ]; then # The -d flag checks if the given path exists and is a directory.
		echo "$dir"
		cd "$dir"
		magick mogrify -format jpg *.HEIC
		rm *.HEIC
		cd ..
	fi
done
