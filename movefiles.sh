#!/bin/bash

SRC=~/totransfer
DST=/Volumes/Storage/auto-moved


~/bin/toggle-mount.sh mount

mkdir -p $SRC
mkdir -p $DST

# FIXME: do this safely in case computer goes to sleep while copying
mv $SRC/* $DST/

~/bin/toggle-mount.sh unmount
