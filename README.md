Wordpress to Ghost Image URL Converter
================================

This script takes the output from the [Ghost Wordpress Plugin](http://www.wordpress.org/plugins/ghost/) and updates the image URLs to point to a server of your choice. While the Ghost Wordpress plugin works great with other image providers, it's not so great for using your own server for serving media, which this server fixes

To use:
* Clone this repo to your local machine
* Export your data using the Ghost Wordpress Plugin
* Update ```config.json``` in the root directory of this script with your information
* Run ```node index.js``` from the root directory of this script
* Import the newly created file into your Ghost blog and enjoy!
