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

Copyright 2015 BIT Systems

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.