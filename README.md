Wordpress to Ghost Converter
============================

This script takes the output from the [Ghost Wordpress Plugin](http://www.wordpress.org/plugins/ghost/) and a copy of the ```wp-content``` folder from a wordpress installation and creates a new folder for images that matches the Ghost way of doing things and updates image links within the exported posts.

While the Ghost Wordpress plugin works great with other image providers, it's not so great for using your own server for serving media. This script allows you to use your own server.

To use:

* Export your data using the Ghost Wordpress Plugin
* Make sure you have local access to the ```wp-content``` folder from your Wordpress install.
    * If your wordpress install is on a different machine than this script, you should copy the folder to the local machine.
* Update ```config.json``` in the root directory of this script with your information
* Run ```node index.js``` from the root directory of this script
