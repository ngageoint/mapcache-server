
# OS X Installation

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

```
git clone git://github.com/mapbox/mbutil.git
cd mbutil
sudo python setup.py install
mb-util
```

# Linux Install

Please use these instructions to install on Linux.  Docker is still being worked.

## Install mongo 2.6
```
vi /etc/yum.repos.d/mongodb-org-2.6.repo
```  

Add this:   
```
[mongodb-org-2.6]
name=MongoDB 2.6 Repository
baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64/
gpgcheck=0
enabled=1
```

Run this:  

```
sudo yum install -y mongodb-org

```

<details><summary>Results of commands</summary><p>

[ec2-user@ip-10-4-0-85 ~]$ sudo vi /etc/yum.repos.d/mongodb-org-2.6.repo  
[mongodb-org-2.6]  
name=MongoDB 2.6 Repository  
baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64/  
gpgcheck=0  
enabled=1  

[ec2-user@ip-10-4-0-85 ~]$ sudo yum install -y mongodb-org  
Loaded plugins: priorities, update-motd, upgrade-helper  
amzn-main                                                                                                                                                                                                        | 2.1 kB  00:00:00     
amzn-updates                                                                                                                                                                                                     | 2.5 kB  00:00:00     
mongodb-org-2.6                                                                                                                                                                                                  |  951 B  00:00:00     
mongodb-org-2.6/primary                                                                                                                                                                                          |  45 kB  00:00:00     
mongodb-org-2.6                                                                                                                                                                                                                 279/279  
Resolving Dependencies  
--> Running transaction check  
---> Package mongodb-org.x86_64 0:2.6.12-1 will be installed  
--> Processing Dependency: mongodb-org-shell = 2.6.12 for package: mongodb-org-2.6.12-1.x86_64  
--> Processing Dependency: mongodb-org-server = 2.6.12 for package: mongodb-org-2.6.12-1.x86_64  
--> Processing Dependency: mongodb-org-tools = 2.6.12 for package: mongodb-org-2.6.12-1.x86_64  
--> Processing Dependency: mongodb-org-mongos = 2.6.12 for package: mongodb-org-2.6.12-1.x86_64  
--> Running transaction check  
---> Package mongodb-org-mongos.x86_64 0:2.6.12-1 will be installed  
---> Package mongodb-org-server.x86_64 0:2.6.12-1 will be installed  
---> Package mongodb-org-shell.x86_64 0:2.6.12-1 will be installed  
---> Package mongodb-org-tools.x86_64 0:2.6.12-1 will be installed  
--> Finished Dependency Resolution  

Dependencies Resolved  

========================================================================================================================================================================================================================================  
 Package                                                       Arch                                              Version                                               Repository                                                  Size  
========================================================================================================================================================================================================================================  
Installing:  
 mongodb-org                                                   x86_64                                            2.6.12-1                                              mongodb-org-2.6                                            4.6 k  
Installing for dependencies:  
 mongodb-org-mongos                                            x86_64                                            2.6.12-1                                              mongodb-org-2.6                                            6.9 M  
 mongodb-org-server                                            x86_64                                            2.6.12-1                                              mongodb-org-2.6                                            9.1 M  
 mongodb-org-shell                                             x86_64                                            2.6.12-1                                              mongodb-org-2.6                                            4.3 M  
 mongodb-org-tools                                             x86_64                                            2.6.12-1                                              mongodb-org-2.6                                             90 M  

Transaction Summary  
========================================================================================================================================================================================================================================  
Install  1 Package (+4 Dependent packages)  

Total download size: 110 M  
Installed size: 279 M  
Downloading packages:  
(1/5):   mongodb-org-2.6.12-1.x86_64.rpm                                                                                                                                                                           | 4.6 kB  00:00:00     
(2/5): mongodb-org-mongos-2.6.12-1.x86_64.rpm                                                                                                                                                                    | 6.9 MB  00:00:00     
(3/5): mongodb-org-server-2.6.12-1.x86_64.rpm                                                                                                                                                                    | 9.1 MB  00:00:00     
(4/5): mongodb-org-shell-2.6.12-1.x86_64.rpm                                                                                                                                                                     | 4.3 MB  00:00:00     
(5/5): mongodb-org-tools-2.6.12-1.x86_64.rpm                                                                                                                                                                     |  90 MB  00:00:01     
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  
Total                                                                                                                                                                                                    76 MB/s | 110 MB  00:00:01     
Running transaction check  
Running transaction test  
Transaction test succeeded  
Running transaction  
  Installing : mongodb-org-server-2.6.12-1.x86_64                                                                                                                                                                                   1/5  
  Installing : mongodb-org-mongos-2.6.12-1.x86_64                                                                                                                                                                                   2/5  
  Installing : mongodb-org-tools-2.6.12-1.x86_64                                                                                                                                                                                    3/5  
  Installing : mongodb-org-shell-2.6.12-1.x86_64                                                                                                                                                                                    4/5  
  Installing : mongodb-org-2.6.12-1.x86_64                                                                                                                                                                                          5/5  
  Verifying  : mongodb-org-shell-2.6.12-1.x86_64                                                                                                                                                                                    1/5  
  Verifying  : mongodb-org-tools-2.6.12-1.x86_64                                                                                                                                                                                    2/5  
  Verifying  : mongodb-org-mongos-2.6.12-1.x86_64                                                                                                                                                                                   3/5  
  Verifying  : mongodb-org-server-2.6.12-1.x86_64                                                                                                                                                                                   4/5  
  Verifying  : mongodb-org-2.6.12-1.x86_64                                                                                                                                                                                          5/5  

Installed:
  mongodb-org.x86_64 0:2.6.12-1                                                                                                                                                                                                         

Dependency Installed:  
  mongodb-org-mongos.x86_64 0:2.6.12-1                      mongodb-org-server.x86_64 0:2.6.12-1                      mongodb-org-shell.x86_64 0:2.6.12-1                      mongodb-org-tools.x86_64 0:2.6.12-1                     

Complete!  
[ec2-user@ip-10-4-0-85 ~]$  
</p></details>  


## Install Node 0.12

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.4/install.sh | bash
nvm install 0.12
nvm use 0.12
nvm alias default node
```
Do the above on both the ec2-user and the root user

<details><summary>Results of Node commands</summary><p>

[ec2-user@ip-10-4-0-85 ~]$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.4/install.sh | bash  
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed  
100  7149  100  7149    0     0  36757      0 --:--:-- --:--:-- --:--:-- 36661  
=> Downloading nvm as script to '/home/ec2-user/.nvm'  

=> Appending source string to /home/ec2-user/.bashrc  
=> Close and reopen your terminal to start using nvm  
[ec2-user@ip-10-4-0-85 ~]$  nvm install 0.12  
-bash: nvm: command not found  
[ec2-user@ip-10-4-0-85 ~]$ source /home/ec2-user/.bashrc   
[ec2-user@ip-10-4-0-85 ~]$ nvm install 0.12  
######################################################################## 100.0%  
Now using node v0.12.18 (npm v2.15.11)  
[ec2-user@ip-10-4-0-85 ~]$ nvm use 0.12  
Now using node v0.12.18 (npm v2.15.11)  
[ec2-user@ip-10-4-0-85 ~]$ nvm alias default node  
default -> node (-> v0.12.18)  
[ec2-user@ip-10-4-0-85 ~]$ sudo su -  
[root@ip-10-4-0-85 ~]# curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.4/install.sh | bash  
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed  
100  7149  100  7149    0     0  52464      0 --:--:-- --:--:-- --:--:-- 52566  
=> Downloading nvm as script to '/root/.nvm'  

=> Appending source string to /root/.bashrc  
=> Close and reopen your terminal to start using nvm  
[root@ip-10-4-0-85 ~]# source /root/.bashrc   
[root@ip-10-4-0-85 ~]# nvm install 0.12  
######################################################################## 100.0%  
Now using node v0.12.18 (npm v2.15.11)  
[root@ip-10-4-0-85 ~]# nvm use 0.12  
Now using node v0.12.18 (npm v2.15.11)  
[root@ip-10-4-0-85 ~]# nvm alias default node  
default -> node (-> v0.12.18)  
[root@ip-10-4-0-85 ~]#   

</p>
</details>  

## Install GDAL

Install GDAL (as root in home directory)

Download gdal 1.11.2
```
wget http://download.osgeo.org/gdal/1.11.2/gdal-1.11.2.tar.gz  
tar -xzf gdal-1.11.2.tar.gz  
cd gdal-1.11.2  
yum install gcc
yum install gcc-c++
./configure
make
make install
```

<details><summary>Results of GDAL commands</summary><p>
[root@ip-10-4-0-85 ~]# wget http://download.osgeo.org/gdal/1.11.2/gdal-1.11.2.tar.gz  
--2017-10-09 16:20:33--  http://download.osgeo.org/gdal/1.11.2/gdal-1.11.2.tar.gz  
Resolving download.osgeo.org (download.osgeo.org)... 140.211.15.132  
Connecting to download.osgeo.org (download.osgeo.org)|140.211.15.132|:80... connected.  
HTTP request sent, awaiting response... 200 OK  
Length: 10746847 (10M) [application/x-gzip]  
Saving to: ‘gdal-1.11.2.tar.gz’  

gdal-1.11.2.tar.gz                                        100%[=====================================================================================================================================>]  10.25M  7.18MB/s    in 1.4s    

2017-10-09 16:20:35 (7.18 MB/s) - ‘gdal-1.11.2.tar.gz’ saved [10746847/10746847]  

[root@ip-10-4-0-85 ~]# tar -xzf gdal-1.11.2.tar.gz  
[root@ip-10-4-0-85 ~]# cd gdal-1.11.2  
[root@ip-10-4-0-85 gdal-1.11.2]#  
[root@ip-10-4-0-85 gdal-1.11.2]# yum install gcc
Loaded plugins: priorities, update-motd, upgrade-helper
amzn-main                                                                                                                                                                                                        | 2.1 kB  00:00:00     
amzn-updates                                                                                                                                                                                                     | 2.5 kB  00:00:00     
Resolving Dependencies
--> Running transaction check
---> Package gcc.noarch 0:4.8.5-1.22.amzn1 will be installed
--> Processing Dependency: gcc48 >= 4.8.5 for package: gcc-4.8.5-1.22.amzn1.noarch
--> Running transaction check
---> Package gcc48.x86_64 0:4.8.5-11.135.amzn1 will be installed
--> Processing Dependency: libgcc48(x86-64) = 4.8.5 for package: gcc48-4.8.5-11.135.amzn1.x86_64
--> Processing Dependency: cpp48(x86-64) = 4.8.5-11.135.amzn1 for package: gcc48-4.8.5-11.135.amzn1.x86_64
--> Processing Dependency: libgomp(x86-64) >= 4.8.5-11.135.amzn1 for package: gcc48-4.8.5-11.135.amzn1.x86_64
--> Processing Dependency: glibc-devel(x86-64) >= 2.2.90-12 for package: gcc48-4.8.5-11.135.amzn1.x86_64
--> Processing Dependency: libmpfr.so.4()(64bit) for package: gcc48-4.8.5-11.135.amzn1.x86_64
--> Processing Dependency: libmpc.so.3()(64bit) for package: gcc48-4.8.5-11.135.amzn1.x86_64
--> Processing Dependency: libgomp.so.1()(64bit) for package: gcc48-4.8.5-11.135.amzn1.x86_64
--> Running transaction check
---> Package cpp48.x86_64 0:4.8.5-11.135.amzn1 will be installed
---> Package glibc-devel.x86_64 0:2.17-196.172.amzn1 will be installed
--> Processing Dependency: glibc-headers = 2.17-196.172.amzn1 for package: glibc-devel-2.17-196.172.amzn1.x86_64
--> Processing Dependency: glibc-headers for package: glibc-devel-2.17-196.172.amzn1.x86_64
---> Package libgcc48.x86_64 0:4.8.5-11.135.amzn1 will be installed
---> Package libgomp.x86_64 0:6.4.1-1.45.amzn1 will be installed
---> Package libmpc.x86_64 0:1.0.1-3.3.amzn1 will be installed
---> Package mpfr.x86_64 0:3.1.1-4.14.amzn1 will be installed
--> Running transaction check
---> Package glibc-headers.x86_64 0:2.17-196.172.amzn1 will be installed
--> Processing Dependency: kernel-headers >= 2.2.1 for package: glibc-headers-2.17-196.172.amzn1.x86_64
--> Processing Dependency: kernel-headers for package: glibc-headers-2.17-196.172.amzn1.x86_64
--> Running transaction check
---> Package kernel-headers.x86_64 0:4.9.51-10.52.amzn1 will be installed
--> Finished Dependency Resolution

Dependencies Resolved

========================================================================================================================================================================================================================================
 Package                                                   Arch                                              Version                                                         Repository                                            Size
========================================================================================================================================================================================================================================
Installing:
 gcc                                                       noarch                                            4.8.5-1.22.amzn1                                                amzn-main                                            4.1 k
Installing for dependencies:
 cpp48                                                     x86_64                                            4.8.5-11.135.amzn1                                              amzn-main                                            6.7 M
 gcc48                                                     x86_64                                            4.8.5-11.135.amzn1                                              amzn-main                                             18 M
 glibc-devel                                               x86_64                                            2.17-196.172.amzn1                                              amzn-main                                            1.1 M
 glibc-headers                                             x86_64                                            2.17-196.172.amzn1                                              amzn-main                                            751 k
 kernel-headers                                            x86_64                                            4.9.51-10.52.amzn1                                              amzn-main                                            1.1 M
 libgcc48                                                  x86_64                                            4.8.5-11.135.amzn1                                              amzn-main                                            150 k
 libgomp                                                   x86_64                                            6.4.1-1.45.amzn1                                                amzn-main                                            204 k
 libmpc                                                    x86_64                                            1.0.1-3.3.amzn1                                                 amzn-main                                             53 k
 mpfr                                                      x86_64                                            3.1.1-4.14.amzn1                                                amzn-main                                            237 k

Transaction Summary
========================================================================================================================================================================================================================================
Install  1 Package (+9 Dependent packages)

Total download size: 28 M
Installed size: 54 M
Is this ok [y/d/N]: y
Downloading packages:
(1/10): gcc-4.8.5-1.22.amzn1.noarch.rpm                                                                                                                                                                          | 4.1 kB  00:00:00     
(2/10): cpp48-4.8.5-11.135.amzn1.x86_64.rpm                                                                                                                                                                      | 6.7 MB  00:00:02     
(3/10): glibc-devel-2.17-196.172.amzn1.x86_64.rpm                                                                                                                                                                | 1.1 MB  00:00:00     
(4/10): glibc-headers-2.17-196.172.amzn1.x86_64.rpm                                                                                                                                                              | 751 kB  00:00:00     
(5/10): kernel-headers-4.9.51-10.52.amzn1.x86_64.rpm                                                                                                                                                             | 1.1 MB  00:00:00     
(6/10): libgcc48-4.8.5-11.135.amzn1.x86_64.rpm                                                                                                                                                                   | 150 kB  00:00:00     
(7/10): libgomp-6.4.1-1.45.amzn1.x86_64.rpm                                                                                                                                                                      | 204 kB  00:00:00     
(8/10): libmpc-1.0.1-3.3.amzn1.x86_64.rpm                                                                                                                                                                        |  53 kB  00:00:00     
(9/10): mpfr-3.1.1-4.14.amzn1.x86_64.rpm                                                                                                                                                                         | 237 kB  00:00:00     
(10/10): gcc48-4.8.5-11.135.amzn1.x86_64.rpm                                                                                                                                                                     |  18 MB  00:00:05     
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Total                                                                                                                                                                                                   5.3 MB/s |  28 MB  00:00:05     
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  Installing : mpfr-3.1.1-4.14.amzn1.x86_64                                                                                                                                                                                        1/10
  Installing : libmpc-1.0.1-3.3.amzn1.x86_64                                                                                                                                                                                       2/10
  Installing : cpp48-4.8.5-11.135.amzn1.x86_64                                                                                                                                                                                     3/10
  Installing : libgomp-6.4.1-1.45.amzn1.x86_64                                                                                                                                                                                     4/10
  Installing : libgcc48-4.8.5-11.135.amzn1.x86_64                                                                                                                                                                                  5/10
  Installing : kernel-headers-4.9.51-10.52.amzn1.x86_64                                                                                                                                                                            6/10
  Installing : glibc-headers-2.17-196.172.amzn1.x86_64                                                                                                                                                                             7/10
  Installing : glibc-devel-2.17-196.172.amzn1.x86_64                                                                                                                                                                               8/10
  Installing : gcc48-4.8.5-11.135.amzn1.x86_64                                                                                                                                                                                     9/10
  Installing : gcc-4.8.5-1.22.amzn1.noarch                                                                                                                                                                                        10/10
  Verifying  : gcc-4.8.5-1.22.amzn1.noarch                                                                                                                                                                                         1/10
  Verifying  : kernel-headers-4.9.51-10.52.amzn1.x86_64                                                                                                                                                                            2/10
  Verifying  : glibc-headers-2.17-196.172.amzn1.x86_64                                                                                                                                                                             3/10
  Verifying  : glibc-devel-2.17-196.172.amzn1.x86_64                                                                                                                                                                               4/10
  Verifying  : cpp48-4.8.5-11.135.amzn1.x86_64                                                                                                                                                                                     5/10
  Verifying  : libmpc-1.0.1-3.3.amzn1.x86_64                                                                                                                                                                                       6/10
  Verifying  : libgcc48-4.8.5-11.135.amzn1.x86_64                                                                                                                                                                                  7/10
  Verifying  : mpfr-3.1.1-4.14.amzn1.x86_64                                                                                                                                                                                        8/10
  Verifying  : gcc48-4.8.5-11.135.amzn1.x86_64                                                                                                                                                                                     9/10
  Verifying  : libgomp-6.4.1-1.45.amzn1.x86_64                                                                                                                                                                                    10/10

Installed:
  gcc.noarch 0:4.8.5-1.22.amzn1                                                                                                                                                                                                         

Dependency Installed:
  cpp48.x86_64 0:4.8.5-11.135.amzn1 gcc48.x86_64 0:4.8.5-11.135.amzn1 glibc-devel.x86_64 0:2.17-196.172.amzn1 glibc-headers.x86_64 0:2.17-196.172.amzn1 kernel-headers.x86_64 0:4.9.51-10.52.amzn1 libgcc48.x86_64 0:4.8.5-11.135.amzn1
  libgomp.x86_64 0:6.4.1-1.45.amzn1 libmpc.x86_64 0:1.0.1-3.3.amzn1   mpfr.x86_64 0:3.1.1-4.14.amzn1         

Complete!
[root@ip-10-4-0-85 gdal-1.11.2]#  
[root@ip-10-4-0-85 gdal-1.11.2]# yum install gcc-c++
Loaded plugins: priorities, update-motd, upgrade-helper
amzn-main                                                                                                                                                                                                        | 2.1 kB  00:00:00     
amzn-updates                                                                                                                                                                                                     | 2.5 kB  00:00:00     
Resolving Dependencies
--> Running transaction check
---> Package gcc-c++.noarch 0:4.8.5-1.22.amzn1 will be installed
--> Processing Dependency: gcc48-c++ >= 4.8.5 for package: gcc-c++-4.8.5-1.22.amzn1.noarch
--> Processing Dependency: libstdc++48 >= 4.8.5 for package: gcc-c++-4.8.5-1.22.amzn1.noarch
--> Running transaction check
---> Package gcc48-c++.x86_64 0:4.8.5-11.135.amzn1 will be installed
---> Package libstdc++48.x86_64 0:4.8.5-11.135.amzn1 will be installed
--> Finished Dependency Resolution

Dependencies Resolved

========================================================================================================================================================================================================================================
 Package                                                 Arch                                               Version                                                         Repository                                             Size
========================================================================================================================================================================================================================================
Installing:
 gcc-c++                                                 noarch                                             4.8.5-1.22.amzn1                                                amzn-main                                             4.0 k
Installing for dependencies:
 gcc48-c++                                               x86_64                                             4.8.5-11.135.amzn1                                              amzn-main                                             9.8 M
 libstdc++48                                             x86_64                                             4.8.5-11.135.amzn1                                              amzn-main                                             403 k

Transaction Summary
========================================================================================================================================================================================================================================
Install  1 Package (+2 Dependent packages)

Total download size: 10 M
Installed size: 28 M
Is this ok [y/d/N]: y
Downloading packages:
(1/3): gcc-c++-4.8.5-1.22.amzn1.noarch.rpm                                                                                                                                                                       | 4.0 kB  00:00:00     
(2/3): libstdc++48-4.8.5-11.135.amzn1.x86_64.rpm                                                                                                                                                                 | 403 kB  00:00:00     
(3/3): gcc48-c++-4.8.5-11.135.amzn1.x86_64.rpm                                                                                                                                                                   | 9.8 MB  00:00:06     
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Total                                                                                                                                                                                                   1.6 MB/s |  10 MB  00:00:06     
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  Installing : libstdc++48-4.8.5-11.135.amzn1.x86_64                                                                                                                                                                                1/3
  Installing : gcc48-c++-4.8.5-11.135.amzn1.x86_64                                                                                                                                                                                  2/3
  Installing : gcc-c++-4.8.5-1.22.amzn1.noarch                                                                                                                                                                                      3/3
  Verifying  : gcc-c++-4.8.5-1.22.amzn1.noarch                                                                                                                                                                                      1/3
  Verifying  : libstdc++48-4.8.5-11.135.amzn1.x86_64                                                                                                                                                                                2/3
  Verifying  : gcc48-c++-4.8.5-11.135.amzn1.x86_64                                                                                                                                                                                  3/3

Installed:
  gcc-c++.noarch 0:4.8.5-1.22.amzn1                                                                                                                                                                                                     

Dependency Installed:
  gcc48-c++.x86_64 0:4.8.5-11.135.amzn1                                                                             libstdc++48.x86_64 0:4.8.5-11.135.amzn1                                                                            

Complete!
[root@ip-10-4-0-85 gdal-1.11.2]#

[root@ip-10-4-0-85 gdal-1.11.2]# ./configure
checking build system type... x86_64-unknown-linux-gnu
checking host system type... x86_64-unknown-linux-gnu
checking for gcc... gcc -fPIC
checking whether the C compiler works... yes
checking for C compiler default output file name... a.out
checking for suffix of executables...
checking whether we are cross compiling... no
checking for suffix of object files... o
checking whether we are using the GNU C compiler... yes
checking whether gcc -fPIC accepts -g... yes
checking for gcc -fPIC option to accept ISO C89... none needed
checking C_WFLAGS for maximum warnings... -Wall -Wdeclaration-after-statement
checking whether we are using the GNU C++ compiler... yes
checking whether g++ -fPIC accepts -g... yes
checking CXX_WFLAGS for maximum warnings... -Wall
checking for gcc... (cached) gcc -fPIC
checking whether we are using the GNU C compiler... (cached) yes
checking whether gcc -fPIC accepts -g... (cached) yes
checking for gcc -fPIC option to accept ISO C89... (cached) none needed
checking whether we are using the GNU C++ compiler... (cached) yes
checking whether g++ -fPIC accepts -g... (cached) yes
checking how to print strings... printf
checking for a sed that does not truncate output... /bin/sed
checking for grep that handles long lines and -e... /bin/grep
checking for egrep... /bin/grep -E
checking for fgrep... /bin/grep -F
checking for ld used by gcc -fPIC... /usr/bin/ld
checking if the linker (/usr/bin/ld) is GNU ld... yes
checking for BSD- or MS-compatible name lister (nm)... /usr/bin/nm -B
checking the name lister (/usr/bin/nm -B) interface... BSD nm
checking whether ln -s works... yes
checking the maximum length of command line arguments... 1572864
checking whether the shell understands some XSI constructs... yes
checking whether the shell understands "+="... yes
checking how to convert x86_64-unknown-linux-gnu file names to x86_64-unknown-linux-gnu format... func_convert_file_noop
checking how to convert x86_64-unknown-linux-gnu file names to toolchain format... func_convert_file_noop
checking for /usr/bin/ld option to reload object files... -r
checking for objdump... objdump
checking how to recognize dependent libraries... pass_all
checking for dlltool... dlltool
checking how to associate runtime and link libraries... printf %s\n
checking for ar... ar
checking for archiver @FILE support... @
checking for strip... strip
checking for ranlib... ranlib
checking for gawk... gawk
checking command to parse /usr/bin/nm -B output from gcc -fPIC object... ok
checking for sysroot... no
checking for mt... no
checking if : is a manifest tool... no
checking how to run the C preprocessor... gcc -fPIC -E
checking for ANSI C header files... yes
checking for sys/types.h... yes
checking for sys/stat.h... yes
checking for stdlib.h... yes
checking for string.h... yes
checking for memory.h... yes
checking for strings.h... yes
checking for inttypes.h... yes
checking for stdint.h... yes
checking for unistd.h... yes
checking for dlfcn.h... yes
checking for objdir... .libs
checking if gcc -fPIC supports -fno-rtti -fno-exceptions... no
checking for gcc -fPIC option to produce PIC... -fPIC -DPIC
checking if gcc -fPIC PIC flag -fPIC -DPIC works... yes
checking if gcc -fPIC static flag -static works... no
checking if gcc -fPIC supports -c -o file.o... yes
checking if gcc -fPIC supports -c -o file.o... (cached) yes
checking whether the gcc -fPIC linker (/usr/bin/ld -m elf_x86_64) supports shared libraries... yes
checking whether -lc should be explicitly linked in... no
checking dynamic linker characteristics... GNU/Linux ld.so
checking how to hardcode library paths into programs... immediate
checking whether stripping libraries is possible... yes
checking if libtool supports shared libraries... yes
checking whether to build shared libraries... yes
checking whether to build static libraries... yes
checking how to run the C++ preprocessor... g++ -fPIC -E
checking for ld used by g++ -fPIC... /usr/bin/ld -m elf_x86_64
checking if the linker (/usr/bin/ld -m elf_x86_64) is GNU ld... yes
checking whether the g++ -fPIC linker (/usr/bin/ld -m elf_x86_64) supports shared libraries... yes
checking for g++ -fPIC option to produce PIC... -fPIC -DPIC
checking if g++ -fPIC PIC flag -fPIC -DPIC works... yes
checking if g++ -fPIC static flag -static works... no
checking if g++ -fPIC supports -c -o file.o... yes
checking if g++ -fPIC supports -c -o file.o... (cached) yes
checking whether the g++ -fPIC linker (/usr/bin/ld -m elf_x86_64) supports shared libraries... yes
checking dynamic linker characteristics... (cached) GNU/Linux ld.so
checking how to hardcode library paths into programs... immediate
checking for dlopen in -ldl... yes
checking for nanosleep in -lrt... yes
checking for sin in -lm... yes
checking for ANSI C header files... (cached) yes
checking assert.h usability... yes
checking assert.h presence... yes
checking for assert.h... yes
checking fcntl.h usability... yes
checking fcntl.h presence... yes
checking for fcntl.h... yes
checking for unistd.h... (cached) yes
checking dbmalloc.h usability... no
checking dbmalloc.h presence... no
checking for dbmalloc.h... no
checking for dlfcn.h... (cached) yes
checking for stdint.h... (cached) yes
checking limits.h usability... yes
checking limits.h presence... yes
checking for limits.h... yes
checking locale.h usability... yes
checking locale.h presence... yes
checking for locale.h... yes
checking values.h usability... yes
checking values.h presence... yes
checking for values.h... yes
checking float.h usability... yes
checking float.h presence... yes
checking for float.h... yes
checking errno.h usability... yes
checking errno.h presence... yes
checking for errno.h... yes
checking direct.h usability... no
checking direct.h presence... no
checking for direct.h... no
checking whether byte ordering is bigendian... no
checking for 64bit integer type... long long
checking for 64bit file io... yes
checking for stat64... yes
checking for fopen64... yes
checking for ftruncate64... yes
checking size of int... 4
checking size of unsigned long... 8
checking size of void*... 8
checking for int8... no
checking for int16... no
checking for int32... no
checking native cpu bit order... lsb2msb
checking for vprintf... yes
checking for _doprnt... no
checking for snprintf... yes
checking for vsnprintf... yes
checking for atoll... yes
checking for strtof... yes
checking for getcwd... yes
checking whether strtof is declared... yes
checking for readlink... yes
checking for lstat... yes
checking for posix_spawnp... yes
checking for vfork... yes
checking for gmtime_r... yes
checking for localtime_r... yes
checking for setlocale... yes
checking to enable debug build... no, CFLAGS="-g -O2"
checking whether GCC 4.1 atomic builtins are available... yes
checking whether SSE is available at compile time... yes
checking whether AVX is available at compile time... yes
checking whether we should hide internal symbols... no
checking for local include/lib path... none
checking for pthread_create in -lpthread... yes
checking for PTHREAD_MUTEX_RECURSIVE... yes
checking for deflateInit_ in -lz... no
using internal libz code as deflateInit_ is missing
using internal libz code.
checking for ld used by GCC... /usr/bin/ld -m elf_x86_64
checking if the linker (/usr/bin/ld -m elf_x86_64) is GNU ld... yes
checking for shared library run path origin... /bin/sh: ./config.rpath: No such file or directory
done
checking for iconv... yes
checking for working iconv... yes
checking for iconv declaration...
         extern size_t iconv (iconv_t cd, char * *inbuf, size_t *inbytesleft, char * *outbuf, size_t *outbytesleft);
using ICONV_CPP_CONST=""
checking for pg_config... no
checking for PostgreSQL... no
checking for G_gisinit_2 in -lgrass5... no
checking for ffopen in -lcfitsio... no
libcfitsio not found - FITS support disabled
checking for Mopen in -lcsf... no
checking csf.h usability... no
checking csf.h presence... no
checking for csf.h... no
using internal csf code.
checking for libpng... checking for png_set_IHDR in -lpng... no
checking png.h usability... no
checking png.h presence... no
checking for png.h... no
using internal png code.
checking for libcrunch... dds support disabled.
checking for gta_version in -lgta... no
libgta not found - GTA support disabled
checking for PCIDSK... using internal libpcidsk.
checking for libtiff... checking for TIFFScanlineSize64 in -ltiff... no
using internal TIFF code.
BigTIFF support enabled.
using internal GeoTIFF code.
checking for jpeg_read_scanlines in -ljpeg... no
checking jpeglib.h usability... no
checking jpeglib.h presence... no
checking for jpeglib.h... no
using internal jpeg code.
checking for jpeg12... enabled
checking for DGifOpenFileName in -lgif... no
checking gif_lib.h usability... no
checking gif_lib.h presence... no
checking for gif_lib.h... no
using internal gif code.
checking ecs.h usability... no
checking ecs.h presence... no
checking for ecs.h... no
checking for FMEObjects... no
SOSI support disabled.
checking for SDreaddata in -lmfhdfalt... no
checking for SDreaddata in -lmfhdf... no
checking for SDreaddata in -lhdf4... no
checking for SDreaddata in -lmfhdf... no
checking for SDreaddata in -lmfhdf... no
checking for H5Fopen in -lhdf5... no
checking for nc-config... no
        did not find nc-config, some features may be missing
        use --with-netcdf=/path/to/netcdf or add nc-config to PATH
checking for nc_open in -lnetcdf... no
libnetcdf not found ... netCDF support disabled
checking for jpc_decode in -ljasper... no
checking for jp2_decode in -ljasper... no
checking for pgx_decode in -ljasper... no
checking openjpeg-2.0/openjpeg.h usability... no
checking openjpeg-2.0/openjpeg.h presence... no
checking for openjpeg-2.0/openjpeg.h... no
checking openjpeg-2.1/openjpeg.h usability... no
checking openjpeg-2.1/openjpeg.h presence... no
checking for openjpeg-2.1/openjpeg.h... no
checking for FileGDBAPI... FileGDBAPI not found.
checking for NCScbmOpenFileView in -lNCSEcw... no
checking for NCScbmOpenFileView in -lecwj2... no
checking for Kakadu JPEG2000 support... not requested.
configure: MrSID support disabled.
configure: MrSID/MG4 Lidar support disabled.
checking for MSG... not requested
checking for BSB... enabled
checking if Oracle support is enabled... no
checking for GRIB... enabled
checking for OGR ... enabled
checking for MySQL... no
checking for Ingres... no
checking for Xerces C++ Parser... no
checking for Expat XML Parser... no
checking for Google libkml... no
checking for SQLConnect in -lodbc... no
checking for SQLInstallDriverEx in -lodbcinst... no
checking if Oracle support is enabled... no
checking Checking for DODS... disabled
checking for curl-config... no
checking for xml2-config... no
disabled
checking for SQLite3 library >= 3.0.0... disabled
checking pcre.h usability... no
checking pcre.h presence... no
checking for pcre.h... no
checking Checking for DWGdirect... disabled
configure: IBM Informix DataBlade not supported.
configure: checking whether we should include ESRI SDE support...
        ESRI SDE support not requested.
checking for geos-config... no
checking for OpenCL support... no
checking for FreeXL support... checking freexl.h usability... no
checking freexl.h presence... no
checking for freexl.h... no
checking for freexl_open in -lfreexl... no
checking for freexl_open in -lfreexl... no
checking for freexl_open in -lfreexl... no
checking for freexl_open in -lfreexl... no
checking for freexl_open in -lfreexl... no
libfreexl not found - FreeXL support disabled
checking for json_object_set_serializer in -ljson-c... no
using internal libjson-c code
checking whether to enable PAM... yes
checking for poppler... disabled
checking for podofo... disabled
checking how to link PROJ.4 library... link dynamically.
checking GDAL version information from gdal_version.h: 1.11.2
checking for perl bindings... disabled
checking for php bindings... disabled
checking for ruby bindings... disabled
checking for python bindings... disabled
checking whether we should include Java support... no
checking whether we should include MDB support... no
configure: checking whether we should include rasdaman support...
        rasdaman support not requested.
checking whether we should include Armadillo support... no
configure: creating ./config.status
config.status: creating GDALmake.opt
config.status: WARNING:  'GDALmake.opt.in' seems to ignore the --datarootdir setting
config.status: creating port/cpl_config.h
config.status: executing libtool commands

GDAL is now configured for x86_64-unknown-linux-gnu

  Installation directory:    /usr/local
  C compiler:                gcc -fPIC -g -O2 -DHAVE_SSE_AT_COMPILE_TIME
  C++ compiler:              g++ -fPIC -g -O2 -DHAVE_SSE_AT_COMPILE_TIME

  LIBTOOL support:           yes

  LIBZ support:              internal
  LIBLZMA support:           no
  GRASS support:             no
  CFITSIO support:           no
  PCRaster support:          internal
  LIBPNG support:            internal
  DDS support:               no
  GTA support:               no
  LIBTIFF support:           internal (BigTIFF=yes)
  LIBGEOTIFF support:        internal
  LIBJPEG support:           internal
  12 bit JPEG:               yes
  12 bit JPEG-in-TIFF:       yes
  LIBGIF support:            internal
  OGDI support:              no
  HDF4 support:              no
  HDF5 support:              no
  NetCDF support:            no
  Kakadu support:            no
  JasPer support:            no
  OpenJPEG support:          no
  ECW support:               no
  MrSID support:             no
  MrSID/MG4 Lidar support:   no
  MSG support:               no
  GRIB support:              yes
  EPSILON support:           no
  WebP support:              no
  cURL support (wms/wcs/...):no
  PostgreSQL support:        no
  MySQL support:             no
  Ingres support:            no
  Xerces-C support:          no
  NAS support:               no
  Expat support:             no
  libxml2 support:           no
  Google libkml support:     no
  ODBC support:              no
  PGeo support:              no
  FGDB support:              no
  MDB support:               no
  PCIDSK support:            internal
  OCI support:               no
  GEORASTER support:         no
  SDE support:               no
  Rasdaman support:          no
  DODS support:              no
  SQLite support:            no
  PCRE support:              no
  SpatiaLite support:        no
  DWGdirect support          no
  INFORMIX DataBlade support:no
  GEOS support:              no
  Poppler support:           no
  Podofo support:            no
  OpenCL support:            no
  Armadillo support:         no
  FreeXL support:            no
  SOSI support:              no


  SWIG Bindings:             no

  Statically link PROJ.4:    no
  enable OGR building:       yes
  enable pthread support:    yes
  enable POSIX iconv support:yes
  hide internal symbols:     no

[root@ip-10-4-0-85 gdal-1.11.2]#  make  
 <make happens, lots of output, not putting it in here>
[root@ip-10-4-0-85 gdal-1.11.2]#  make install  
(cd port; make)
make[1]: Entering directory `/root/gdal-1.11.2/port'
make[1]: Nothing to be done for `default'.
make[1]: Leaving directory `/root/gdal-1.11.2/port'
(cd gcore; make)
make[1]: Entering directory `/root/gdal-1.11.2/gcore'
make[1]: Nothing to be done for `default'.
make[1]: Leaving directory `/root/gdal-1.11.2/gcore'
(cd alg; make)
make[1]: Entering directory `/root/gdal-1.11.2/alg'
make[1]: Nothing to be done for `default'.
make[1]: Leaving directory `/root/gdal-1.11.2/alg'
(cd frmts; make)
make[1]: Entering directory `/root/gdal-1.11.2/frmts'
make -C gxf install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/gxf'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/gxf'
make -C gtiff install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/gtiff'
(cd libgeotiff; make install-obj)
make[3]: Entering directory `/root/gdal-1.11.2/frmts/gtiff/libgeotiff'
make[3]: Nothing to be done for `install-obj'.
make[3]: Leaving directory `/root/gdal-1.11.2/frmts/gtiff/libgeotiff'
(cd libtiff; make install-obj)
make[3]: Entering directory `/root/gdal-1.11.2/frmts/gtiff/libtiff'
(cd ../../jpeg; make libjpeg12/jcapimin12.c)
make[4]: Entering directory `/root/gdal-1.11.2/frmts/jpeg'
make[4]: `libjpeg12/jcapimin12.c' is up to date.
make[4]: Leaving directory `/root/gdal-1.11.2/frmts/jpeg'
make[3]: Leaving directory `/root/gdal-1.11.2/frmts/gtiff/libtiff'
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/gtiff'
make -C hfa install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/hfa'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/hfa'
make -C aigrid install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/aigrid'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/aigrid'
make -C aaigrid install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/aaigrid'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/aaigrid'
make -C ceos install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/ceos'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/ceos'
make -C ceos2 install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/ceos2'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/ceos2'
make -C iso8211 install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/iso8211'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/iso8211'
make -C xpm install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/xpm'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/xpm'
make -C sdts install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/sdts'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/sdts'
make -C raw install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/raw'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/raw'
make -C dted install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/dted'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/dted'
make -C mem install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/mem'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/mem'
make -C jdem install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/jdem'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/jdem'
make -C envisat install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/envisat'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/envisat'
make -C elas install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/elas'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/elas'
make -C fit install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/fit'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/fit'
make -C vrt install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/vrt'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/vrt'
make -C usgsdem install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/usgsdem'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/usgsdem'
make -C l1b install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/l1b'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/l1b'
make -C nitf install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/nitf'
(cd ../jpeg; make libjpeg12/jcapimin12.c)
make[3]: Entering directory `/root/gdal-1.11.2/frmts/jpeg'
make[3]: `libjpeg12/jcapimin12.c' is up to date.
make[3]: Leaving directory `/root/gdal-1.11.2/frmts/jpeg'
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/nitf'
make -C bmp install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/bmp'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/bmp'
make -C pcidsk install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/pcidsk'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/pcidsk'
make -C airsar install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/airsar'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/airsar'
make -C rs2 install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/rs2'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/rs2'
make -C ilwis install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/ilwis'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/ilwis'
make -C rmf install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/rmf'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/rmf'
make -C leveller install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/leveller'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/leveller'
make -C sgi install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/sgi'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/sgi'
make -C srtmhgt install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/srtmhgt'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/srtmhgt'
make -C idrisi install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/idrisi'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/idrisi'
make -C gsg install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/gsg'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/gsg'
make -C ingr install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/ingr'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/ingr'
make -C ers install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/ers'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/ers'
make -C jaxapalsar install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/jaxapalsar'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/jaxapalsar'
make -C dimap install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/dimap'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/dimap'
make -C gff install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/gff'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/gff'
make -C cosar install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/cosar'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/cosar'
make -C pds install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/pds'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/pds'
make -C adrg install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/adrg'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/adrg'
make -C coasp install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/coasp'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/coasp'
make -C tsx install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/tsx'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/tsx'
make -C terragen install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/terragen'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/terragen'
make -C blx install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/blx'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/blx'
make -C msgn install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/msgn'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/msgn'
make -C til install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/til'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/til'
make -C r install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/r'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/r'
make -C northwood install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/northwood'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/northwood'
make -C saga install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/saga'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/saga'
make -C xyz install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/xyz'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/xyz'
make -C hf2 install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/hf2'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/hf2'
make -C kmlsuperoverlay install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/kmlsuperoverlay'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/kmlsuperoverlay'
make -C ctg install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/ctg'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/ctg'
make -C e00grid install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/e00grid'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/e00grid'
make -C zmap install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/zmap'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/zmap'
make -C ngsgeoid install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/ngsgeoid'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/ngsgeoid'
make -C iris install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/iris'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/iris'
make -C map install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/map'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/map'
make -C grib install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/grib'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/grib'
make -C bsb install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/bsb'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/bsb'
make -C gif install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/gif'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/gif'
make -C jpeg install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/jpeg'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/jpeg'
make -C png install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/png'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/png'
make -C pcraster install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/pcraster'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/pcraster'
make -C zlib install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/zlib'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/zlib'
make -C rik install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/rik'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/rik'
make -C ozi install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/ozi'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/ozi'
make -C pdf install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/pdf'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/pdf'
make -C arg install-obj
make[2]: Entering directory `/root/gdal-1.11.2/frmts/arg'
make[2]: Nothing to be done for `install-obj'.
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/arg'
make[1]: Leaving directory `/root/gdal-1.11.2/frmts'
(cd ogr; make lib )
make[1]: Entering directory `/root/gdal-1.11.2/ogr'
(cd ogrsf_frmts; make)
make[2]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts'
make -C generic
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/generic'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/generic'
make -C avc
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/avc'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/avc'
make -C bna
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/bna'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/bna'
make -C csv
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/csv'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/csv'
make -C dgn
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/dgn'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/dgn'
make -C geojson
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/geojson'
make -C libjson
make[4]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/geojson/libjson'
make[4]: Nothing to be done for `default'.
make[4]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/geojson/libjson'
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/geojson'
make -C gml
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/gml'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/gml'
make -C gmt
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/gmt'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/gmt'
make -C mem
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/mem'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/mem'
make -C kml
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/kml'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/kml'
make -C mitab
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/mitab'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/mitab'
make -C ntf
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/ntf'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/ntf'
make -C gpx
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/gpx'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/gpx'
make -C rec
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/rec'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/rec'
make -C s57
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/s57'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/s57'
make -C sdts
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/sdts'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/sdts'
make -C shape
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/shape'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/shape'
make -C tiger
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/tiger'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/tiger'
make -C vrt
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/vrt'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/vrt'
make -C geoconcept
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/geoconcept'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/geoconcept'
make -C xplane
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/xplane'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/xplane'
make -C georss
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/georss'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/georss'
make -C gtm
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/gtm'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/gtm'
make -C dxf
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/dxf'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/dxf'
make -C pgdump
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/pgdump'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/pgdump'
make -C gpsbabel
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/gpsbabel'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/gpsbabel'
make -C sua
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/sua'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/sua'
make -C openair
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/openair'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/openair'
make -C pds
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/pds'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/pds'
make -C htf
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/htf'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/htf'
make -C aeronavfaa
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/aeronavfaa'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/aeronavfaa'
make -C edigeo
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/edigeo'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/edigeo'
make -C svg
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/svg'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/svg'
make -C idrisi
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/idrisi'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/idrisi'
make -C arcgen
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/arcgen'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/arcgen'
make -C segukooa
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/segukooa'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/segukooa'
make -C segy
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/segy'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/segy'
make -C sxf
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/sxf'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/sxf'
make -C openfilegdb
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/openfilegdb'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/openfilegdb'
make -C wasp
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/wasp'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/wasp'
make -C pcidsk
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/pcidsk'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/pcidsk'
make -C pdf
make[3]: Entering directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/pdf'
make[3]: Nothing to be done for `default'.
make[3]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts/pdf'
make[2]: Leaving directory `/root/gdal-1.11.2/ogr/ogrsf_frmts'
make[1]: Leaving directory `/root/gdal-1.11.2/ogr'
make libgdal.la
make[1]: Entering directory `/root/gdal-1.11.2'
make[1]: `libgdal.la' is up to date.
make[1]: Leaving directory `/root/gdal-1.11.2'
(cd apps; make)
make[1]: Entering directory `/root/gdal-1.11.2/apps'
make[1]: Nothing to be done for `default'.
make[1]: Leaving directory `/root/gdal-1.11.2/apps'
/root/gdal-1.11.2/install-sh -d /usr/local/lib
for f in libgdal.la ; do /bin/sh /root/gdal-1.11.2/libtool --mode=install  /root/gdal-1.11.2/install-sh -c $f /usr/local/lib ; done
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/libgdal.so.1.18.2 /usr/local/lib/libgdal.so.1.18.2
libtool: install: (cd /usr/local/lib && { ln -s -f libgdal.so.1.18.2 libgdal.so.1 || { rm -f libgdal.so.1 && ln -s libgdal.so.1.18.2 libgdal.so.1; }; })
libtool: install: (cd /usr/local/lib && { ln -s -f libgdal.so.1.18.2 libgdal.so || { rm -f libgdal.so && ln -s libgdal.so.1.18.2 libgdal.so; }; })
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/libgdal.lai /usr/local/lib/libgdal.la
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/libgdal.a /usr/local/lib/libgdal.a
libtool: install: chmod 644 /usr/local/lib/libgdal.a
libtool: install: ranlib /usr/local/lib/libgdal.a
libtool: finish: PATH="/root/.nvm/versions/node/v0.12.18/bin:/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin:/opt/aws/bin:/root/bin:/sbin" ldconfig -n /usr/local/lib
----------------------------------------------------------------------
Libraries have been installed in:
   /usr/local/lib

If you ever happen to want to link against installed libraries
in a given directory, LIBDIR, you must either use libtool, and
specify the full pathname of the library, or use the `-LLIBDIR'
flag during linking and do at least one of the following:
   - add LIBDIR to the `LD_LIBRARY_PATH' environment variable
     during execution
   - add LIBDIR to the `LD_RUN_PATH' environment variable
     during linking
   - use the `-Wl,-rpath -Wl,LIBDIR' linker flag
   - have your system administrator add LIBDIR to `/etc/ld.so.conf'

See any operating system documentation about shared libraries for
more information, such as the ld(1) and ld.so(8) manual pages.
----------------------------------------------------------------------
/root/gdal-1.11.2/install-sh -d /usr/local/lib/gdalplugins
/root/gdal-1.11.2/install-sh -d /usr/local/bin
/root/gdal-1.11.2/install-sh -d /usr/local/share/gdal
/root/gdal-1.11.2/install-sh -d /usr/local/include
(cd port; make install)
make[1]: Entering directory `/root/gdal-1.11.2/port'
for f in *.h ; do /root/gdal-1.11.2/install-sh -c -m 0644 $f /usr/local/include ; done
make[1]: Leaving directory `/root/gdal-1.11.2/port'
(cd gcore; make install)
make[1]: Entering directory `/root/gdal-1.11.2/gcore'
for f in *.h ; do /root/gdal-1.11.2/install-sh -c -m 0644 $f /usr/local/include ; done
make[1]: Leaving directory `/root/gdal-1.11.2/gcore'
(cd frmts; make install)
make[1]: Entering directory `/root/gdal-1.11.2/frmts'
make -C vrt install
make[2]: Entering directory `/root/gdal-1.11.2/frmts/vrt'
/root/gdal-1.11.2/install-sh -c -m 0644 vrtdataset.h /usr/local/include
/root/gdal-1.11.2/install-sh -c -m 0644 gdal_vrt.h /usr/local/include
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/vrt'
make -C mem install
make[2]: Entering directory `/root/gdal-1.11.2/frmts/mem'
/root/gdal-1.11.2/install-sh -c -m 0644 memdataset.h /usr/local/include
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/mem'
make -C raw install
make[2]: Entering directory `/root/gdal-1.11.2/frmts/raw'
/root/gdal-1.11.2/install-sh -c -m 0644 rawdataset.h /usr/local/include
make[2]: Leaving directory `/root/gdal-1.11.2/frmts/raw'
make[1]: Leaving directory `/root/gdal-1.11.2/frmts'
(cd alg; make install)
make[1]: Entering directory `/root/gdal-1.11.2/alg'
for f in *.h ; do /root/gdal-1.11.2/install-sh -c -m 0644 $f /usr/local/include ; done
make[1]: Leaving directory `/root/gdal-1.11.2/alg'
(cd ogr; make install)
make[1]: Entering directory `/root/gdal-1.11.2/ogr'
for f in ogr_core.h ogr_feature.h ogr_geometry.h ogr_p.h ogr_spatialref.h ogr_srs_api.h ogrsf_frmts/ogrsf_frmts.h ogr_featurestyle.h ogr_api.h ogr_geocoding.h ; \
    do /root/gdal-1.11.2/install-sh -c -m 0644 $f /usr/local/include ; \
done
make[1]: Leaving directory `/root/gdal-1.11.2/ogr'
(cd apps; make install)
make[1]: Entering directory `/root/gdal-1.11.2/apps'
for f in gdalinfo gdalserver gdal_translate gdaladdo gdalwarp nearblack gdalmanage gdalenhance gdaltransform gdaldem gdallocationinfo gdalsrsinfo  gdal_contour gdaltindex gdal_rasterize gdal_grid ogrinfo ogr2ogr ogrtindex ogrlineref testepsg gdalbuildvrt ; do /bin/sh /root/gdal-1.11.2/libtool --mode=install  /root/gdal-1.11.2/install-sh -c $f /usr/local/bin ; done
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdalinfo /usr/local/bin/gdalinfo
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdalserver /usr/local/bin/gdalserver
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdal_translate /usr/local/bin/gdal_translate
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdaladdo /usr/local/bin/gdaladdo
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdalwarp /usr/local/bin/gdalwarp
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/nearblack /usr/local/bin/nearblack
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdalmanage /usr/local/bin/gdalmanage
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdalenhance /usr/local/bin/gdalenhance
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdaltransform /usr/local/bin/gdaltransform
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdaldem /usr/local/bin/gdaldem
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdallocationinfo /usr/local/bin/gdallocationinfo
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdalsrsinfo /usr/local/bin/gdalsrsinfo
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdal_contour /usr/local/bin/gdal_contour
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdaltindex /usr/local/bin/gdaltindex
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdal_rasterize /usr/local/bin/gdal_rasterize
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdal_grid /usr/local/bin/gdal_grid
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/ogrinfo /usr/local/bin/ogrinfo
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/ogr2ogr /usr/local/bin/ogr2ogr
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/ogrtindex /usr/local/bin/ogrtindex
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/ogrlineref /usr/local/bin/ogrlineref
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/testepsg /usr/local/bin/testepsg
libtool: install: /root/gdal-1.11.2/install-sh -c .libs/gdalbuildvrt /usr/local/bin/gdalbuildvrt
/bin/sh /root/gdal-1.11.2/libtool --mode=install  /root/gdal-1.11.2/install-sh -c gdal-config-inst /usr/local/bin/gdal-config
libtool: install: /root/gdal-1.11.2/install-sh -c gdal-config-inst /usr/local/bin/gdal-config
make[1]: Leaving directory `/root/gdal-1.11.2/apps'
for f in LICENSE.TXT data/*.* ; do /root/gdal-1.11.2/install-sh -c -m 0644 $f /usr/local/share/gdal ; done
/bin/sh /root/gdal-1.11.2/libtool --mode=finish --silent /usr/local/lib
/root/gdal-1.11.2/install-sh -d /usr/local/lib/pkgconfig
/root/gdal-1.11.2/install-sh -c -m 0644 gdal.pc /usr/local/lib/pkgconfig/gdal.pc
[root@ip-10-4-0-85 gdal-1.11.2]#

</p>
</details>

### Optional MrSID support

You will need to get the MrSID SDK from https://www.lizardtech.com/developer/overview and install GDAL with these instructions

```
tar -xf MrSID_DSDK-9.1.0.4045-linux.x86-64.gcc44.tar.gz

wget http://download.osgeo.org/gdal/1.11.2/gdal-1.11.2.tar.gz
tar -xzvf gdal-1.11.2.tar.gz

yum install gcc
yum install gcc-c++

export CC="gcc -fPIC"
export CXX="g++ -fPIC"

yum install tbb
 
cd gdal-1.11.2

./configure --with-mrsid=/root/MrSID_DSDK-9.1.0.4045-linux.x86-64.gcc44/Raster_DSDK \
              --with-mrsid_lidar=/root/MrSID_DSDK-9.1.0.4045-linux.x86-64.gcc44/Lidar_DSDK \
              --with-jp2mrsid

make
make install
 
export CC="gcc"
export CXX="g++"
 
export LD_LIBRARY_PATH=/usr/local/lib:${LD_LIBRARY_PATH}

cp MrSID_DSDK-9.1.0.4045-linux.x86-64.gcc44/Lidar_DSDK/lib/liblti_lidar_dsdk.so /usr/local/lib/.
cp MrSID_DSDK-9.1.0.4045-linux.x86-64.gcc44/Raster_DSDK/lib/libltidsdk.so* /usr/local/lib/.
```

## Install proj4

```
wget http://download.osgeo.org/proj/proj-4.8.0.tar.gz
wget http://download.osgeo.org/proj/proj-datumgrid-1.5.tar.gz
tar xzf proj-4.8.0.tar.gz
cd proj-4.8.0/nad
tar xzf ../../proj-datumgrid-1.5.tar.gz
cd ..
./configure
make
sudo make install
```

<details><summary>Results of Proj4 commands</summary><p>
[root@ip-10-4-0-85 gdal-1.11.2]# wget http://download.osgeo.org/proj/proj-4.8.0.tar.gz
--2017-10-09 17:07:47--  http://download.osgeo.org/proj/proj-4.8.0.tar.gz
Resolving download.osgeo.org (download.osgeo.org)... 140.211.15.132
Connecting to download.osgeo.org (download.osgeo.org)|140.211.15.132|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 785279 (767K) [application/x-gzip]
Saving to: ‘proj-4.8.0.tar.gz’

proj-4.8.0.tar.gz                                         100%[=====================================================================================================================================>] 766.87K   552KB/s    in 1.4s    

2017-10-09 17:07:48 (552 KB/s) - ‘proj-4.8.0.tar.gz’ saved [785279/785279]

[root@ip-10-4-0-85 gdal-1.11.2]# wget http://download.osgeo.org/proj/proj-datumgrid-1.5.tar.gz
--2017-10-09 17:07:59--  http://download.osgeo.org/proj/proj-datumgrid-1.5.tar.gz
Resolving download.osgeo.org (download.osgeo.org)... 140.211.15.132
Connecting to download.osgeo.org (download.osgeo.org)|140.211.15.132|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 2252308 (2.1M) [application/x-gzip]
Saving to: ‘proj-datumgrid-1.5.tar.gz’

proj-datumgrid-1.5.tar.gz                                 100%[=====================================================================================================================================>]   2.15M   924KB/s    in 2.4s    

2017-10-09 17:08:02 (924 KB/s) - ‘proj-datumgrid-1.5.tar.gz’ saved [2252308/2252308]

[root@ip-10-4-0-85 gdal-1.11.2]# tar xzf proj-4.8.0.tar.gz
[root@ip-10-4-0-85 gdal-1.11.2]# cd proj-4.8.0/nad
[root@ip-10-4-0-85 nad]# tar xzf ../../proj-datumgrid-1.5.tar.gz
[root@ip-10-4-0-85 nad]# cd ..
[root@ip-10-4-0-85 proj-4.8.0]# ./configure
checking for a BSD-compatible install... /usr/bin/install -c
checking whether build environment is sane... yes
checking for a thread-safe mkdir -p... /bin/mkdir -p
checking for gawk... gawk
checking whether make sets $(MAKE)... yes
checking whether to enable maintainer-specific portions of Makefiles... no
checking for gcc... gcc -fPIC
checking whether the C compiler works... yes
checking for C compiler default output file name... a.out
checking for suffix of executables...
checking whether we are cross compiling... no
checking for suffix of object files... o
checking whether we are using the GNU C compiler... yes
checking whether gcc -fPIC accepts -g... yes
checking for gcc -fPIC option to accept ISO C89... none needed
checking for style of include used by make... GNU
checking dependency style of gcc -fPIC... gcc3
checking whether ln -s works... yes
checking whether make sets $(MAKE)... (cached) yes
checking build system type... x86_64-unknown-linux-gnu
checking host system type... x86_64-unknown-linux-gnu
checking how to print strings... printf
checking for a sed that does not truncate output... /bin/sed
checking for grep that handles long lines and -e... /bin/grep
checking for egrep... /bin/grep -E
checking for fgrep... /bin/grep -F
checking for ld used by gcc -fPIC... /usr/bin/ld
checking if the linker (/usr/bin/ld) is GNU ld... yes
checking for BSD- or MS-compatible name lister (nm)... /usr/bin/nm -B
checking the name lister (/usr/bin/nm -B) interface... BSD nm
checking the maximum length of command line arguments... 1572864
checking whether the shell understands some XSI constructs... yes
checking whether the shell understands "+="... yes
checking how to convert x86_64-unknown-linux-gnu file names to x86_64-unknown-linux-gnu format... func_convert_file_noop
checking how to convert x86_64-unknown-linux-gnu file names to toolchain format... func_convert_file_noop
checking for /usr/bin/ld option to reload object files... -r
checking for objdump... objdump
checking how to recognize dependent libraries... pass_all
checking for dlltool... no
checking how to associate runtime and link libraries... printf %s\n
checking for ar... ar
checking for archiver @FILE support... @
checking for strip... strip
checking for ranlib... ranlib
checking command to parse /usr/bin/nm -B output from gcc -fPIC object... ok
checking for sysroot... no
checking for mt... no
checking if : is a manifest tool... no
checking how to run the C preprocessor... gcc -fPIC -E
checking for ANSI C header files... yes
checking for sys/types.h... yes
checking for sys/stat.h... yes
checking for stdlib.h... yes
checking for string.h... yes
checking for memory.h... yes
checking for strings.h... yes
checking for inttypes.h... yes
checking for stdint.h... yes
checking for unistd.h... yes
checking for dlfcn.h... yes
checking for objdir... .libs
checking if gcc -fPIC supports -fno-rtti -fno-exceptions... no
checking for gcc -fPIC option to produce PIC... -fPIC -DPIC
checking if gcc -fPIC PIC flag -fPIC -DPIC works... yes
checking if gcc -fPIC static flag -static works... no
checking if gcc -fPIC supports -c -o file.o... yes
checking if gcc -fPIC supports -c -o file.o... (cached) yes
checking whether the gcc -fPIC linker (/usr/bin/ld -m elf_x86_64) supports shared libraries... yes
checking whether -lc should be explicitly linked in... no
checking dynamic linker characteristics... GNU/Linux ld.so
checking how to hardcode library paths into programs... immediate
checking whether stripping libraries is possible... yes
checking if libtool supports shared libraries... yes
checking whether to build shared libraries... yes
checking whether to build static libraries... yes
checking for exp in -lm... yes
checking for ANSI C header files... (cached) yes
checking jni.h usability... no
checking jni.h presence... no
checking for jni.h... no
checking whether to enable Java/JNI support... disabled
checking for mutexes... enabled, pthread
configure: creating ./config.status
config.status: creating Makefile
config.status: creating src/Makefile
config.status: creating man/Makefile
config.status: creating man/man1/Makefile
config.status: creating man/man3/Makefile
config.status: creating nad/Makefile
config.status: creating jniwrap/Makefile
config.status: creating jniwrap/org/Makefile
config.status: creating jniwrap/org/proj4/Makefile
config.status: creating src/proj_config.h
config.status: executing depfiles commands
config.status: executing libtool commands
configure: creating ./config.status
config.status: creating Makefile
config.status: creating src/Makefile
config.status: creating man/Makefile
config.status: creating man/man1/Makefile
config.status: creating man/man3/Makefile
config.status: creating nad/Makefile
config.status: creating jniwrap/Makefile
config.status: creating jniwrap/org/Makefile
config.status: creating jniwrap/org/proj4/Makefile
config.status: creating proj.pc
config.status: creating src/proj_config.h
config.status: src/proj_config.h is unchanged
config.status: executing depfiles commands
config.status: executing libtool commands
[root@ip-10-4-0-85 proj-4.8.0]# make  
<make runs and lots of output, not putting it al here>
[root@ip-10-4-0-85 proj-4.8.0]# make install  
<make install runs>
</p>
</details>

## Install cairo

If you need to reference the install instructions: https://github.com/Automattic/node-canvas/wiki/Installation---Amazon-Linux-AMI-(EC2)

```
yum install cairo-devel libjpeg-turbo-devel giflib-devel -y
```

<details><summary>Results of Cairo install</summary><p>
[root@ip-10-4-0-85 ~]# sudo yum install cairo-devel libjpeg-turbo-devel giflib-devel -y
Loaded plugins: priorities, update-motd, upgrade-helper
Resolving Dependencies
--> Running transaction check
---> Package cairo-devel.x86_64 0:1.12.14-6.8.amzn1 will be installed
--> Processing Dependency: cairo = 1.12.14-6.8.amzn1 for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: pkgconfig(xrender) >= 0.6 for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: pkgconfig(xcb-render) >= 1.6 for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: pkgconfig(xcb) >= 1.6 for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: pkgconfig(freetype2) >= 9.7.3 for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: pkgconfig(fontconfig) >= 2.2.95 for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: freetype-devel >= 2.1.9 for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: fontconfig-devel >= 2.2.95 for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: pkgconfig(xext) for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: pkgconfig(xcb-shm) for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: pkgconfig(x11) for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: pkgconfig(libpng) for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: pkgconfig(gobject-2.0) for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: pkgconfig(glib-2.0) for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: pkgconfig(gl) for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: libpng-devel for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: libXrender-devel for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: libcairo.so.2()(64bit) for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
--> Processing Dependency: libcairo-script-interpreter.so.2()(64bit) for package: cairo-devel-1.12.14-6.8.amzn1.x86_64
---> Package giflib-devel.x86_64 0:4.1.6-3.1.6.amzn1 will be installed
---> Package libjpeg-turbo-devel.x86_64 0:1.2.90-5.14.amzn1 will be installed
--> Running transaction check
---> Package cairo.x86_64 0:1.12.14-6.8.amzn1 will be installed
--> Processing Dependency: libGL.so.1()(64bit) for package: cairo-1.12.14-6.8.amzn1.x86_64
---> Package fontconfig-devel.x86_64 0:2.8.0-5.8.amzn1 will be installed
---> Package freetype-devel.x86_64 0:2.3.11-15.14.amzn1 will be installed
--> Processing Dependency: zlib-devel for package: freetype-devel-2.3.11-15.14.amzn1.x86_64
---> Package glib2-devel.x86_64 0:2.36.3-5.18.amzn1 will be installed
---> Package libX11-devel.x86_64 0:1.6.0-2.2.12.amzn1 will be installed
--> Processing Dependency: pkgconfig(xproto) for package: libX11-devel-1.6.0-2.2.12.amzn1.x86_64
--> Processing Dependency: pkgconfig(kbproto) for package: libX11-devel-1.6.0-2.2.12.amzn1.x86_64
---> Package libXext-devel.x86_64 0:1.3.2-2.1.10.amzn1 will be installed
---> Package libXrender-devel.x86_64 0:0.9.8-2.1.9.amzn1 will be installed
---> Package libpng-devel.x86_64 2:1.2.49-2.14.amzn1 will be installed
---> Package libxcb-devel.x86_64 0:1.11-2.21.amzn1 will be installed
--> Processing Dependency: pkgconfig(xau) >= 0.99.2 for package: libxcb-devel-1.11-2.21.amzn1.x86_64
---> Package mesa-libGL-devel.x86_64 0:17.1.5-2.41.amzn1 will be installed
--> Processing Dependency: mesa-libGL(x86-64) = 17.1.5-2.41.amzn1 for package: mesa-libGL-devel-17.1.5-2.41.amzn1.x86_64
--> Processing Dependency: pkgconfig(xdamage) >= 1.1 for package: mesa-libGL-devel-17.1.5-2.41.amzn1.x86_64
--> Processing Dependency: pkgconfig(libdrm) >= 2.4.75 for package: mesa-libGL-devel-17.1.5-2.41.amzn1.x86_64
--> Processing Dependency: pkgconfig(xxf86vm) for package: mesa-libGL-devel-17.1.5-2.41.amzn1.x86_64
--> Processing Dependency: pkgconfig(xfixes) for package: mesa-libGL-devel-17.1.5-2.41.amzn1.x86_64
--> Processing Dependency: libglvnd-devel(x86-64) for package: mesa-libGL-devel-17.1.5-2.41.amzn1.x86_64
--> Processing Dependency: libglapi.so.0()(64bit) for package: mesa-libGL-devel-17.1.5-2.41.amzn1.x86_64
--> Running transaction check
---> Package libXau-devel.x86_64 0:1.0.6-4.9.amzn1 will be installed
---> Package libXdamage-devel.x86_64 0:1.1.3-4.7.amzn1 will be installed
--> Processing Dependency: libXdamage = 1.1.3-4.7.amzn1 for package: libXdamage-devel-1.1.3-4.7.amzn1.x86_64
--> Processing Dependency: libXdamage.so.1()(64bit) for package: libXdamage-devel-1.1.3-4.7.amzn1.x86_64
---> Package libXfixes-devel.x86_64 0:5.0.1-2.1.8.amzn1 will be installed
--> Processing Dependency: libXfixes = 5.0.1-2.1.8.amzn1 for package: libXfixes-devel-5.0.1-2.1.8.amzn1.x86_64
--> Processing Dependency: libXfixes.so.3()(64bit) for package: libXfixes-devel-5.0.1-2.1.8.amzn1.x86_64
---> Package libXxf86vm-devel.x86_64 0:1.1.3-2.1.9.amzn1 will be installed
--> Processing Dependency: libXxf86vm = 1.1.3-2.1.9.amzn1 for package: libXxf86vm-devel-1.1.3-2.1.9.amzn1.x86_64
--> Processing Dependency: libXxf86vm.so.1()(64bit) for package: libXxf86vm-devel-1.1.3-2.1.9.amzn1.x86_64
---> Package libdrm-devel.x86_64 0:2.4.82-1.14.amzn1 will be installed
--> Processing Dependency: libdrm(x86-64) = 2.4.82-1.14.amzn1 for package: libdrm-devel-2.4.82-1.14.amzn1.x86_64
--> Processing Dependency: libkms.so.1()(64bit) for package: libdrm-devel-2.4.82-1.14.amzn1.x86_64
--> Processing Dependency: libdrm_radeon.so.1()(64bit) for package: libdrm-devel-2.4.82-1.14.amzn1.x86_64
--> Processing Dependency: libdrm_nouveau.so.2()(64bit) for package: libdrm-devel-2.4.82-1.14.amzn1.x86_64
--> Processing Dependency: libdrm_intel.so.1()(64bit) for package: libdrm-devel-2.4.82-1.14.amzn1.x86_64
--> Processing Dependency: libdrm_amdgpu.so.1()(64bit) for package: libdrm-devel-2.4.82-1.14.amzn1.x86_64
--> Processing Dependency: libdrm.so.2()(64bit) for package: libdrm-devel-2.4.82-1.14.amzn1.x86_64
---> Package libglvnd-devel.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1 will be installed
--> Processing Dependency: libglvnd-opengl(x86-64) = 1:0.2.999-14.20170308git8e6e102.3.amzn1 for package: 1:libglvnd-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64
--> Processing Dependency: libglvnd-gles(x86-64) = 1:0.2.999-14.20170308git8e6e102.3.amzn1 for package: 1:libglvnd-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64
--> Processing Dependency: libglvnd-egl(x86-64) = 1:0.2.999-14.20170308git8e6e102.3.amzn1 for package: 1:libglvnd-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64
--> Processing Dependency: libglvnd-core-devel(x86-64) = 1:0.2.999-14.20170308git8e6e102.3.amzn1 for package: 1:libglvnd-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64
--> Processing Dependency: libglvnd(x86-64) = 1:0.2.999-14.20170308git8e6e102.3.amzn1 for package: 1:libglvnd-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64
--> Processing Dependency: libOpenGL.so.0()(64bit) for package: 1:libglvnd-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64
--> Processing Dependency: libGLdispatch.so.0()(64bit) for package: 1:libglvnd-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64
--> Processing Dependency: libGLESv2.so.2()(64bit) for package: 1:libglvnd-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64
--> Processing Dependency: libGLESv1_CM.so.1()(64bit) for package: 1:libglvnd-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64
--> Processing Dependency: libEGL.so.1()(64bit) for package: 1:libglvnd-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64
---> Package libglvnd-glx.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1 will be installed
---> Package mesa-libGL.x86_64 0:17.1.5-2.41.amzn1 will be installed
--> Processing Dependency: libxshmfence.so.1()(64bit) for package: mesa-libGL-17.1.5-2.41.amzn1.x86_64
---> Package mesa-libglapi.x86_64 0:17.1.5-2.41.amzn1 will be installed
--> Processing Dependency: mesa-dri-drivers(x86-64) = 17.1.5-2.41.amzn1 for package: mesa-libglapi-17.1.5-2.41.amzn1.x86_64
---> Package xorg-x11-proto-devel.noarch 0:7.7-9.10.amzn1 will be installed
---> Package zlib-devel.x86_64 0:1.2.8-7.18.amzn1 will be installed
--> Running transaction check
---> Package libXdamage.x86_64 0:1.1.3-4.7.amzn1 will be installed
---> Package libXfixes.x86_64 0:5.0.1-2.1.8.amzn1 will be installed
---> Package libXxf86vm.x86_64 0:1.1.3-2.1.9.amzn1 will be installed
---> Package libdrm.x86_64 0:2.4.82-1.14.amzn1 will be installed
--> Processing Dependency: libpciaccess.so.0()(64bit) for package: libdrm-2.4.82-1.14.amzn1.x86_64
---> Package libglvnd.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1 will be installed
---> Package libglvnd-core-devel.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1 will be installed
---> Package libglvnd-egl.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1 will be installed
--> Processing Dependency: mesa-libEGL(x86-64) >= 13.0.4-1 for package: 1:libglvnd-egl-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64
---> Package libglvnd-gles.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1 will be installed
---> Package libglvnd-opengl.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1 will be installed
---> Package libxshmfence.x86_64 0:1.2-1.4.amzn1 will be installed
---> Package mesa-dri-drivers.x86_64 0:17.1.5-2.41.amzn1 will be installed
--> Processing Dependency: mesa-filesystem(x86-64) = 17.1.5-2.41.amzn1 for package: mesa-dri-drivers-17.1.5-2.41.amzn1.x86_64
--> Running transaction check
---> Package libpciaccess.x86_64 0:0.13.1-4.1.11.amzn1 will be installed
---> Package mesa-filesystem.x86_64 0:17.1.5-2.41.amzn1 will be installed
---> Package mesa-libEGL.x86_64 0:17.1.5-2.41.amzn1 will be installed
--> Processing Dependency: libgbm.so.1()(64bit) for package: mesa-libEGL-17.1.5-2.41.amzn1.x86_64
--> Running transaction check
---> Package mesa-libgbm.x86_64 0:17.1.5-2.41.amzn1 will be installed
--> Finished Dependency Resolution

Dependencies Resolved

========================================================================================================================================================================================================================================
 Package                                                  Arch                                       Version                                                                        Repository                                     Size
========================================================================================================================================================================================================================================
Installing:
 cairo-devel                                              x86_64                                     1.12.14-6.8.amzn1                                                              amzn-main                                     609 k
 giflib-devel                                             x86_64                                     4.1.6-3.1.6.amzn1                                                              amzn-main                                      87 k
 libjpeg-turbo-devel                                      x86_64                                     1.2.90-5.14.amzn1                                                              amzn-main                                     105 k
Installing for dependencies:
 cairo                                                    x86_64                                     1.12.14-6.8.amzn1                                                              amzn-main                                     739 k
 fontconfig-devel                                         x86_64                                     2.8.0-5.8.amzn1                                                                amzn-main                                     210 k
 freetype-devel                                           x86_64                                     2.3.11-15.14.amzn1                                                             amzn-main                                     411 k
 glib2-devel                                              x86_64                                     2.36.3-5.18.amzn1                                                              amzn-main                                     484 k
 libX11-devel                                             x86_64                                     1.6.0-2.2.12.amzn1                                                             amzn-main                                     990 k
 libXau-devel                                             x86_64                                     1.0.6-4.9.amzn1                                                                amzn-main                                      13 k
 libXdamage                                               x86_64                                     1.1.3-4.7.amzn1                                                                amzn-main                                      19 k
 libXdamage-devel                                         x86_64                                     1.1.3-4.7.amzn1                                                                amzn-main                                     9.0 k
 libXext-devel                                            x86_64                                     1.3.2-2.1.10.amzn1                                                             amzn-main                                      74 k
 libXfixes                                                x86_64                                     5.0.1-2.1.8.amzn1                                                              amzn-main                                      18 k
 libXfixes-devel                                          x86_64                                     5.0.1-2.1.8.amzn1                                                              amzn-main                                      13 k
 libXrender-devel                                         x86_64                                     0.9.8-2.1.9.amzn1                                                              amzn-main                                      16 k
 libXxf86vm                                               x86_64                                     1.1.3-2.1.9.amzn1                                                              amzn-main                                      17 k
 libXxf86vm-devel                                         x86_64                                     1.1.3-2.1.9.amzn1                                                              amzn-main                                      18 k
 libdrm                                                   x86_64                                     2.4.82-1.14.amzn1                                                              amzn-main                                     162 k
 libdrm-devel                                             x86_64                                     2.4.82-1.14.amzn1                                                              amzn-main                                     146 k
 libglvnd                                                 x86_64                                     1:0.2.999-14.20170308git8e6e102.3.amzn1                                        amzn-main                                      94 k
 libglvnd-core-devel                                      x86_64                                     1:0.2.999-14.20170308git8e6e102.3.amzn1                                        amzn-main                                      17 k
 libglvnd-devel                                           x86_64                                     1:0.2.999-14.20170308git8e6e102.3.amzn1                                        amzn-main                                     8.5 k
 libglvnd-egl                                             x86_64                                     1:0.2.999-14.20170308git8e6e102.3.amzn1                                        amzn-main                                      41 k
 libglvnd-gles                                            x86_64                                     1:0.2.999-14.20170308git8e6e102.3.amzn1                                        amzn-main                                      31 k
 libglvnd-glx                                             x86_64                                     1:0.2.999-14.20170308git8e6e102.3.amzn1                                        amzn-main                                     156 k
 libglvnd-opengl                                          x86_64                                     1:0.2.999-14.20170308git8e6e102.3.amzn1                                        amzn-main                                      50 k
 libpciaccess                                             x86_64                                     0.13.1-4.1.11.amzn1                                                            amzn-main                                      26 k
 libpng-devel                                             x86_64                                     2:1.2.49-2.14.amzn1                                                            amzn-main                                     116 k
 libxcb-devel                                             x86_64                                     1.11-2.21.amzn1                                                                amzn-main                                     1.0 M
 libxshmfence                                             x86_64                                     1.2-1.4.amzn1                                                                  amzn-main                                     6.0 k
 mesa-dri-drivers                                         x86_64                                     17.1.5-2.41.amzn1                                                              amzn-main                                     5.1 M
 mesa-filesystem                                          x86_64                                     17.1.5-2.41.amzn1                                                              amzn-main                                      23 k
 mesa-libEGL                                              x86_64                                     17.1.5-2.41.amzn1                                                              amzn-main                                      99 k
 mesa-libGL                                               x86_64                                     17.1.5-2.41.amzn1                                                              amzn-main                                     170 k
 mesa-libGL-devel                                         x86_64                                     17.1.5-2.41.amzn1                                                              amzn-main                                     214 k
 mesa-libgbm                                              x86_64                                     17.1.5-2.41.amzn1                                                              amzn-main                                      43 k
 mesa-libglapi                                            x86_64                                     17.1.5-2.41.amzn1                                                              amzn-main                                      51 k
 xorg-x11-proto-devel                                     noarch                                     7.7-9.10.amzn1                                                                 amzn-main                                     317 k
 zlib-devel                                               x86_64                                     1.2.8-7.18.amzn1                                                               amzn-main                                      53 k

Transaction Summary
========================================================================================================================================================================================================================================
Install  3 Packages (+36 Dependent packages)

Total download size: 12 M
Installed size: 36 M
Downloading packages:
(1/39): cairo-devel-1.12.14-6.8.amzn1.x86_64.rpm                                                                                                                                                                 | 609 kB  00:00:00     
(2/39): cairo-1.12.14-6.8.amzn1.x86_64.rpm                                                                                                                                                                       | 739 kB  00:00:00     
(3/39): fontconfig-devel-2.8.0-5.8.amzn1.x86_64.rpm                                                                                                                                                              | 210 kB  00:00:00     
(4/39): giflib-devel-4.1.6-3.1.6.amzn1.x86_64.rpm                                                                                                                                                                |  87 kB  00:00:00     
(5/39): freetype-devel-2.3.11-15.14.amzn1.x86_64.rpm                                                                                                                                                             | 411 kB  00:00:00     
(6/39): glib2-devel-2.36.3-5.18.amzn1.x86_64.rpm                                                                                                                                                                 | 484 kB  00:00:00     
(7/39): libXau-devel-1.0.6-4.9.amzn1.x86_64.rpm                                                                                                                                                                  |  13 kB  00:00:00     
(8/39): libXdamage-1.1.3-4.7.amzn1.x86_64.rpm                                                                                                                                                                    |  19 kB  00:00:00     
(9/39): libX11-devel-1.6.0-2.2.12.amzn1.x86_64.rpm                                                                                                                                                               | 990 kB  00:00:00     
(10/39): libXdamage-devel-1.1.3-4.7.amzn1.x86_64.rpm                                                                                                                                                             | 9.0 kB  00:00:00     
(11/39): libXext-devel-1.3.2-2.1.10.amzn1.x86_64.rpm                                                                                                                                                             |  74 kB  00:00:00     
(12/39): libXfixes-5.0.1-2.1.8.amzn1.x86_64.rpm                                                                                                                                                                  |  18 kB  00:00:00     
(13/39): libXfixes-devel-5.0.1-2.1.8.amzn1.x86_64.rpm                                                                                                                                                            |  13 kB  00:00:00     
(14/39): libXrender-devel-0.9.8-2.1.9.amzn1.x86_64.rpm                                                                                                                                                           |  16 kB  00:00:00     
(15/39): libXxf86vm-1.1.3-2.1.9.amzn1.x86_64.rpm                                                                                                                                                                 |  17 kB  00:00:00     
(16/39): libXxf86vm-devel-1.1.3-2.1.9.amzn1.x86_64.rpm                                                                                                                                                           |  18 kB  00:00:00     
(17/39): libdrm-2.4.82-1.14.amzn1.x86_64.rpm                                                                                                                                                                     | 162 kB  00:00:00     
(18/39): libdrm-devel-2.4.82-1.14.amzn1.x86_64.rpm                                                                                                                                                               | 146 kB  00:00:00     
(19/39): libglvnd-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64.rpm                                                                                                                                               |  94 kB  00:00:00     
(20/39): libglvnd-core-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64.rpm                                                                                                                                    |  17 kB  00:00:00     
(21/39): libglvnd-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64.rpm                                                                                                                                         | 8.5 kB  00:00:00     
(22/39): libglvnd-egl-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64.rpm                                                                                                                                           |  41 kB  00:00:00     
(23/39): libglvnd-gles-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64.rpm                                                                                                                                          |  31 kB  00:00:00     
(24/39): libglvnd-glx-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64.rpm                                                                                                                                           | 156 kB  00:00:00     
(25/39): libglvnd-opengl-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64.rpm                                                                                                                                        |  50 kB  00:00:00     
(26/39): libjpeg-turbo-devel-1.2.90-5.14.amzn1.x86_64.rpm                                                                                                                                                        | 105 kB  00:00:00     
(27/39): libpciaccess-0.13.1-4.1.11.amzn1.x86_64.rpm                                                                                                                                                             |  26 kB  00:00:00     
(28/39): libpng-devel-1.2.49-2.14.amzn1.x86_64.rpm                                                                                                                                                               | 116 kB  00:00:00     
(29/39): libxshmfence-1.2-1.4.amzn1.x86_64.rpm                                                                                                                                                                   | 6.0 kB  00:00:00     
(30/39): libxcb-devel-1.11-2.21.amzn1.x86_64.rpm                                                                                                                                                                 | 1.0 MB  00:00:00     
(31/39): mesa-filesystem-17.1.5-2.41.amzn1.x86_64.rpm                                                                                                                                                            |  23 kB  00:00:00     
(32/39): mesa-libEGL-17.1.5-2.41.amzn1.x86_64.rpm                                                                                                                                                                |  99 kB  00:00:00     
(33/39): mesa-libGL-17.1.5-2.41.amzn1.x86_64.rpm                                                                                                                                                                 | 170 kB  00:00:00     
(34/39): mesa-libGL-devel-17.1.5-2.41.amzn1.x86_64.rpm                                                                                                                                                           | 214 kB  00:00:00     
(35/39): mesa-libgbm-17.1.5-2.41.amzn1.x86_64.rpm                                                                                                                                                                |  43 kB  00:00:00     
(36/39): mesa-libglapi-17.1.5-2.41.amzn1.x86_64.rpm                                                                                                                                                              |  51 kB  00:00:00     
(37/39): xorg-x11-proto-devel-7.7-9.10.amzn1.noarch.rpm                                                                                                                                                          | 317 kB  00:00:00     
(38/39): zlib-devel-1.2.8-7.18.amzn1.x86_64.rpm                                                                                                                                                                  |  53 kB  00:00:00     
(39/39): mesa-dri-drivers-17.1.5-2.41.amzn1.x86_64.rpm                                                                                                                                                           | 5.1 MB  00:00:00     
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Total                                                                                                                                                                                                   3.6 MB/s |  12 MB  00:00:03     
Running transaction check
Running transaction test
Transaction test succeeded
Running transaction
  Installing : xorg-x11-proto-devel-7.7-9.10.amzn1.noarch                                                                                                                                                                          1/39
  Installing : 1:libglvnd-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                             2/39
  Installing : libXfixes-5.0.1-2.1.8.amzn1.x86_64                                                                                                                                                                                  3/39
  Installing : libXdamage-1.1.3-4.7.amzn1.x86_64                                                                                                                                                                                   4/39
  Installing : libXxf86vm-1.1.3-2.1.9.amzn1.x86_64                                                                                                                                                                                 5/39
  Installing : zlib-devel-1.2.8-7.18.amzn1.x86_64                                                                                                                                                                                  6/39
  Installing : freetype-devel-2.3.11-15.14.amzn1.x86_64                                                                                                                                                                            7/39
  Installing : libxshmfence-1.2-1.4.amzn1.x86_64                                                                                                                                                                                   8/39
  Installing : fontconfig-devel-2.8.0-5.8.amzn1.x86_64                                                                                                                                                                             9/39
  Installing : 2:libpng-devel-1.2.49-2.14.amzn1.x86_64                                                                                                                                                                            10/39
  Installing : 1:libglvnd-opengl-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                     11/39
  Installing : libXau-devel-1.0.6-4.9.amzn1.x86_64                                                                                                                                                                                12/39
  Installing : libxcb-devel-1.11-2.21.amzn1.x86_64                                                                                                                                                                                13/39
  Installing : libX11-devel-1.6.0-2.2.12.amzn1.x86_64                                                                                                                                                                             14/39
  Installing : libXext-devel-1.3.2-2.1.10.amzn1.x86_64                                                                                                                                                                            15/39
  Installing : libXfixes-devel-5.0.1-2.1.8.amzn1.x86_64                                                                                                                                                                           16/39
  Installing : libXdamage-devel-1.1.3-4.7.amzn1.x86_64                                                                                                                                                                            17/39
  Installing : libXxf86vm-devel-1.1.3-2.1.9.amzn1.x86_64                                                                                                                                                                          18/39
  Installing : libXrender-devel-0.9.8-2.1.9.amzn1.x86_64                                                                                                                                                                          19/39
  Installing : libpciaccess-0.13.1-4.1.11.amzn1.x86_64                                                                                                                                                                            20/39
  Installing : libdrm-2.4.82-1.14.amzn1.x86_64                                                                                                                                                                                    21/39
  Installing : mesa-libgbm-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                               22/39
  Installing : 1:libglvnd-egl-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                        23/39
  Installing : mesa-libEGL-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                               24/39
  Installing : 1:libglvnd-gles-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                       25/39
  Installing : libdrm-devel-2.4.82-1.14.amzn1.x86_64                                                                                                                                                                              26/39
  Installing : mesa-filesystem-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                           27/39
  Installing : mesa-libglapi-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                             28/39
  Installing : mesa-dri-drivers-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                          29/39
  Installing : 1:libglvnd-glx-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                        30/39
  Installing : mesa-libGL-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                                31/39
  Installing : cairo-1.12.14-6.8.amzn1.x86_64                                                                                                                                                                                     32/39
  Installing : glib2-devel-2.36.3-5.18.amzn1.x86_64                                                                                                                                                                               33/39
  Installing : 1:libglvnd-core-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                 34/39
  Installing : 1:libglvnd-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                      35/39
  Installing : mesa-libGL-devel-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                          36/39
  Installing : cairo-devel-1.12.14-6.8.amzn1.x86_64                                                                                                                                                                               37/39
  Installing : giflib-devel-4.1.6-3.1.6.amzn1.x86_64                                                                                                                                                                              38/39
  Installing : libjpeg-turbo-devel-1.2.90-5.14.amzn1.x86_64                                                                                                                                                                       39/39
  Verifying  : 1:libglvnd-core-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                  1/39
  Verifying  : libX11-devel-1.6.0-2.2.12.amzn1.x86_64                                                                                                                                                                              2/39
  Verifying  : cairo-devel-1.12.14-6.8.amzn1.x86_64                                                                                                                                                                                3/39
  Verifying  : libxshmfence-1.2-1.4.amzn1.x86_64                                                                                                                                                                                   4/39
  Verifying  : 1:libglvnd-devel-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                       5/39
  Verifying  : 1:libglvnd-glx-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                         6/39
  Verifying  : fontconfig-devel-2.8.0-5.8.amzn1.x86_64                                                                                                                                                                             7/39
  Verifying  : freetype-devel-2.3.11-15.14.amzn1.x86_64                                                                                                                                                                            8/39
  Verifying  : xorg-x11-proto-devel-7.7-9.10.amzn1.noarch                                                                                                                                                                          9/39
  Verifying  : 1:libglvnd-gles-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                       10/39
  Verifying  : zlib-devel-1.2.8-7.18.amzn1.x86_64                                                                                                                                                                                 11/39
  Verifying  : glib2-devel-2.36.3-5.18.amzn1.x86_64                                                                                                                                                                               12/39
  Verifying  : cairo-1.12.14-6.8.amzn1.x86_64                                                                                                                                                                                     13/39
  Verifying  : 2:libpng-devel-1.2.49-2.14.amzn1.x86_64                                                                                                                                                                            14/39
  Verifying  : libXext-devel-1.3.2-2.1.10.amzn1.x86_64                                                                                                                                                                            15/39
  Verifying  : mesa-libgbm-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                               16/39
  Verifying  : libdrm-devel-2.4.82-1.14.amzn1.x86_64                                                                                                                                                                              17/39
  Verifying  : libXdamage-1.1.3-4.7.amzn1.x86_64                                                                                                                                                                                  18/39
  Verifying  : libXfixes-devel-5.0.1-2.1.8.amzn1.x86_64                                                                                                                                                                           19/39
  Verifying  : 1:libglvnd-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                            20/39
  Verifying  : libXrender-devel-0.9.8-2.1.9.amzn1.x86_64                                                                                                                                                                          21/39
  Verifying  : mesa-libGL-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                                22/39
  Verifying  : mesa-libGL-devel-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                          23/39
  Verifying  : libdrm-2.4.82-1.14.amzn1.x86_64                                                                                                                                                                                    24/39
  Verifying  : libjpeg-turbo-devel-1.2.90-5.14.amzn1.x86_64                                                                                                                                                                       25/39
  Verifying  : mesa-libEGL-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                               26/39
  Verifying  : libxcb-devel-1.11-2.21.amzn1.x86_64                                                                                                                                                                                27/39
  Verifying  : mesa-dri-drivers-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                          28/39
  Verifying  : giflib-devel-4.1.6-3.1.6.amzn1.x86_64                                                                                                                                                                              29/39
  Verifying  : libXau-devel-1.0.6-4.9.amzn1.x86_64                                                                                                                                                                                30/39
  Verifying  : 1:libglvnd-egl-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                        31/39
  Verifying  : libXfixes-5.0.1-2.1.8.amzn1.x86_64                                                                                                                                                                                 32/39
  Verifying  : libXdamage-devel-1.1.3-4.7.amzn1.x86_64                                                                                                                                                                            33/39
  Verifying  : libXxf86vm-devel-1.1.3-2.1.9.amzn1.x86_64                                                                                                                                                                          34/39
  Verifying  : 1:libglvnd-opengl-0.2.999-14.20170308git8e6e102.3.amzn1.x86_64                                                                                                                                                     35/39
  Verifying  : mesa-filesystem-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                           36/39
  Verifying  : libXxf86vm-1.1.3-2.1.9.amzn1.x86_64                                                                                                                                                                                37/39
  Verifying  : mesa-libglapi-17.1.5-2.41.amzn1.x86_64                                                                                                                                                                             38/39
  Verifying  : libpciaccess-0.13.1-4.1.11.amzn1.x86_64                                                                                                                                                                            39/39

Installed:
  cairo-devel.x86_64 0:1.12.14-6.8.amzn1                                    giflib-devel.x86_64 0:4.1.6-3.1.6.amzn1                                    libjpeg-turbo-devel.x86_64 0:1.2.90-5.14.amzn1                                   

Dependency Installed:
  cairo.x86_64 0:1.12.14-6.8.amzn1                                           fontconfig-devel.x86_64 0:2.8.0-5.8.amzn1                                   freetype-devel.x86_64 0:2.3.11-15.14.amzn1                                     
  glib2-devel.x86_64 0:2.36.3-5.18.amzn1                                     libX11-devel.x86_64 0:1.6.0-2.2.12.amzn1                                    libXau-devel.x86_64 0:1.0.6-4.9.amzn1                                          
  libXdamage.x86_64 0:1.1.3-4.7.amzn1                                        libXdamage-devel.x86_64 0:1.1.3-4.7.amzn1                                   libXext-devel.x86_64 0:1.3.2-2.1.10.amzn1                                      
  libXfixes.x86_64 0:5.0.1-2.1.8.amzn1                                       libXfixes-devel.x86_64 0:5.0.1-2.1.8.amzn1                                  libXrender-devel.x86_64 0:0.9.8-2.1.9.amzn1                                    
  libXxf86vm.x86_64 0:1.1.3-2.1.9.amzn1                                      libXxf86vm-devel.x86_64 0:1.1.3-2.1.9.amzn1                                 libdrm.x86_64 0:2.4.82-1.14.amzn1                                              
  libdrm-devel.x86_64 0:2.4.82-1.14.amzn1                                    libglvnd.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1                     libglvnd-core-devel.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1             
  libglvnd-devel.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1              libglvnd-egl.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1                 libglvnd-gles.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1                   
  libglvnd-glx.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1                libglvnd-opengl.x86_64 1:0.2.999-14.20170308git8e6e102.3.amzn1              libpciaccess.x86_64 0:0.13.1-4.1.11.amzn1                                      
  libpng-devel.x86_64 2:1.2.49-2.14.amzn1                                    libxcb-devel.x86_64 0:1.11-2.21.amzn1                                       libxshmfence.x86_64 0:1.2-1.4.amzn1                                            
  mesa-dri-drivers.x86_64 0:17.1.5-2.41.amzn1                                mesa-filesystem.x86_64 0:17.1.5-2.41.amzn1                                  mesa-libEGL.x86_64 0:17.1.5-2.41.amzn1                                         
  mesa-libGL.x86_64 0:17.1.5-2.41.amzn1                                      mesa-libGL-devel.x86_64 0:17.1.5-2.41.amzn1                                 mesa-libgbm.x86_64 0:17.1.5-2.41.amzn1                                         
  mesa-libglapi.x86_64 0:17.1.5-2.41.amzn1                                   xorg-x11-proto-devel.noarch 0:7.7-9.10.amzn1                                zlib-devel.x86_64 0:1.2.8-7.18.amzn1                                           

Complete!
[root@ip-10-4-0-85 ~]#

</p>
</details>

## Install postgres and postgis

### Install postgres
```
sudo su -
adduser postgres

yum install postgresql93 postgresql93-server postgresql93-devel postgresql93-contrib postgresql93-docs
```

### Install postgis
```
sudo su -
mkdir postgis
cd postgis

yum install geos-devel
yum install libxml2-devel
yum install json-c-devel

wget http://download.osgeo.org/postgis/source/postgis-2.1.7.tar.gz
tar zxvf postgis-2.1.7.tar.gz
cd postgis-2.1.7
./configure --with-geosconfig=/usr/bin/geos-config
make
make install
```

### Start postgres
```
sudo su
echo /usr/local/lib >> /etc/ld.so.conf
ldconfig

service postgresql93 initdb
service postgresql93 start

su postgres -
```

### Initiate postgres
```
psql

CREATE DATABASE mapcache;

CREATE SCHEMA mapcache;

\connect mapcache

CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;
CREATE EXTENSION fuzzystrmatch;
CREATE EXTENSION postgis_tiger_geocoder;

alter user postgres password 'postgres';
\q
```

``` vi /var/lib/pgsql93/data/pg_hba.conf```
Change the connection configurations from ident to trust  
Now run:  
```sudo /etc/init.d/postgresql93 reload```

## Install mb-util as ec2-user

```git clone git://github.com/mapbox/mbutil.git
cd mbutil
sudo python setup.py install
mb-util```

## Install Java as ec2-user
```
sudo yum install java-1.8.0-openjdk-devel
```

## Clone the mapcache Repository as the ec2-user

Ensure git is installed:
```sudo yum install git```

```
cd /opt/mapcache
git clone https://github.com/ngageoint/mapcache-server.git```

## Link gdal to the node library

```
cd /opt/mapcache/mapcache-server  
npm install gdal --build-from-source --shared_gdal```

## Start mongo
```sudo service mongod start```

## Install the mapcache code
```
cd /opt/mapcache/mapcache-server
npm install
cd public
npm install
npm build
```

## Initiate the mongo database
```
cd /opt/mapcache/mapcache-server
./node_modules/.bin/mm
```
## Create directories
```
sudo mkdir -p /data/mapcache
sudo chown ec2-user /data/mapcache
```

## Start mapcache
```
npm install -g forever
cd /opt/mapcache/mapcache-server
forever start app.js
```
