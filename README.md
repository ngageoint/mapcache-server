mapcache
============

mapcache-server is built with Node.js and MongoDB which allows users to create portable maps from various sources.

Currently supported input formats:
* Tile Servers
* WMS Servers
* GeoTIFF
* MBTiles

Currently supported output formats:
* XYZ/TMS
* GeoPackage
* MBTiles

[Installation](#installation)

![mapcache](screenshots/mapcache.png)

# Installation

## Install Homebrew
```ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"```

## Install Dependencies

### Node.js
```brew install node```

### MongoDB
```brew install mongo```

### GDAL
```brew install libtiff```
```brew install gdal --with-libtiff```

### MBUtil

```git clone git://github.com/mapbox/mbutil.git
cd mbutil
sudo python setup.py install
mb-util```

## Contact

If you have any questions, or would like to get in touch, contact Ben Tuttle.

## License
