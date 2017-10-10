#
# Mapcache-server Dockerfile (master branch)
# Written by Steven D. Lander, RGi
#
# This script will install and configure mapcache-server
# with MrSID support.
#
# ***** NOTE ******
# You will need the MrSID API tarball specified in the environment variable
# MRSID_TARBALL in order to successfully build this image.  Get the API tarball
# by signing up for a developer account at https://www.lizardtech.com/
# ****************
#
FROM debian:jessie

LABEL author="Steven D. Lander"

RUN apt-get update && apt-get -y install \
        git \
        curl \
        wget \
        python \
        python-setuptools \
        pkgconf \
        postgis \
        mongodb \
        gcc-4.8 \
        g++-4.8 \
        libgif-dev \
        libtbb-dev \
        libkrb5-dev \
        libjpeg-dev \
        libgdal-dev \
        openjdk-7-jdk \
        libcairo2-dev \
        build-essential \
        libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME /usr/lib/jvm/java-7-openjdk-amd64

WORKDIR /workspace/mbutil
RUN git clone git://github.com/mapbox/mbutil.git \
    && cd mbutil \
    && python setup.py install

WORKDIR /workspace/nodejs
ENV NVM_VER 0.33.0
ENV NVM_DIR /root/.nvm
ENV NODE_VER 0.12.18
RUN curl https://raw.githubusercontent.com/creationix/nvm/v$NVM_VER/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VER \
    && nvm use $NODE_VER \
    && nvm alias default $NODE_VER

RUN sed -i 's|#port = 27017|port = 27017|' /etc/mongodb.conf
EXPOSE 27017

WORKDIR /workspace/postgis
COPY mapcache.sql mapcache.sql
RUN sed -i 's| md5| trust|g' /etc/postgresql/9.4/main/pg_hba.conf \
    && sed -i 's| peer| trust|g' /etc/postgresql/9.4/main/pg_hba.conf \
    && service postgresql start \
    && createdb -h localhost -p 5432 -U postgres mapcache \
    && su postgres - \
    && export PGOPTIONS='--client-min-messages=warning' \
    && psql -U postgres -X -q -a -1 -v ON_ERROR_STOP=1 --pset pager=off \
       -d mapcache -f /workspace/postgis/mapcache.sql
EXPOSE 5432

#
# WORKDIR /workspace/mrsid
# ENV MRSID_TARBALL MrSID_DSDK-9.5.1.4427-linux.x86-64.gcc48.tar.gz
# ENV MRSID_DIR /workspace/mrsid/MrSID_DSDK
# ENV MRSID_RASTER_DIR $MRSID_DIR/Raster_DSDK
# ENV MRSID_LIDAR_DIR $MRSID_DIR/Lidar_DSDK
# COPY $MRSID_TARBALL $MRSID_TARBALL
# RUN mkdir MrSID_DSDK \
#     && tar -xzf $MRSID_TARBALL -C MrSID_DSDK --strip-components 1 \
#     && ln -s $MRSID_LIDAR_DIR/lib/liblti_lidar_dsdk.so /usr/local/lib/. \
#     && ln -s $MRSID_RASTER_DIR/lib/libltidsdk.so /usr/local/lib/.

WORKDIR /workspace/gdal
ENV GDAL_VER 2.0.1
ENV GDAL_DIR /workspace/gdal/gdal-$GDAL_VER
RUN export CC="gcc-4.8 -fPIC" && export CXX="g++-4.8 -fPIC" \
    && wget http://download.osgeo.org/gdal/$GDAL_VER/gdal-$GDAL_VER.tar.gz \
    && tar -xzvf gdal-$GDAL_VER.tar.gz \
    && cd $GDAL_DIR \
    && ./configure \
#        --with-mrsid=$MRSID_RASTER_DIR \
#        --with-mrsid_lidar=$MRSID_LIDAR_DIR \
        --with-jp2mrsid \
        --with-libtiff \
    && make -j10 && make install
ENV GDAL_DATA /usr/share/gdal/1.10
ENV LD_LIBRARY_PATH /usr/local/lib

WORKDIR /workspace
RUN git clone https://github.com/ngageoint/mapcache-server
WORKDIR /workspace/mapcache-server
RUN . $NVM_DIR/nvm.sh \
    && if [ -d "node_modules" ]; then rm -rf "node_modules"; fi \
    && mkdir node_modules \
    && npm install \
    && npm uninstall gdal --save \
    && npm install gdal --build-from-source --shared-gdal

EXPOSE 4242
ENTRYPOINT service mongodb start; \
        service postgresql start; \
        . $NVM_DIR/nvm.sh; \
        node /workspace/mapcache-server/app.js
