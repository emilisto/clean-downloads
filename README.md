# clean-downloads

The script finds all files in your `Download` folder > 500 M and moves
them to another folder. Since these more than often are active transfers in
Transmission (http://www.transmissionbt.com) I've made the script
connect to Transmission's API to remove them, as long as they're not
unfinished or partially transferred (i.e. have unchecked files). In the
latter case the files are kept in the Downloads folder.

## Usage
`clean-downloads.js` - moves files to `~/totransfer`
`movefiles.sh` transfers the files to another volume, in my case mounts
a second harddrive.

I have these `cron` scheduled.

## Authors

  - Emil Stenqvist @emilisto

## TODO

  - Clean up code
  - Make more general - specify paths as command line parameters
  - Move the Transmission library to a separate project and develop it
