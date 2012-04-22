#!/bin/bash

########
# [x] Quits if there's nothing to transfer
# [x] Checks if mount went alright before transfering
#
# TODO
# [] Copy and then remove files, to make sure nothing is deleted in case of interruption

SRC=~/totransfer
DST=/Volumes/Storage/auto-moved


# Quit if there's nothing to transfer
if [ ! "$(ls $SRC)" ]; then
  exit 0
fi

if [ ! "$(~/bin/toggle-mount.sh mount)" ]; then
  echo "Unable to mount volume"
  exit 1
fi

mkdir -p $SRC
mkdir -p $DST

# FIXME: do this safely in case computer goes to sleep while copying
mv $SRC/* $DST/

~/bin/toggle-mount.sh unmount
