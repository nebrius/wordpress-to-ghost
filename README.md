Wordpress to Ghost Post Processor
=================================

This script takes the output from the [Ghost Wordpress Plugin](http://www.wordpress.org/plugins/ghost/) and updates the image URLs to point to a server of your choice. While the Ghost Wordpress plugin works great with other image providers, it's not so great for using your own server for serving media, which this server fixes

Install the post processor:

```
npm install wp2ghostpp
```

Run the post processor:

```
wp2ghostpp
```

The post processor will prompt you for the needed information. Alternately, you can supply a configuration file with the ```-f``` flag. See the example config file.
