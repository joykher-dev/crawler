#! /bin/bash

# setup the package registry repo
npm config set registry https://registry.npmjs.org/

# setup the proxy port
# use "netstat -tunlp  | grep 127.0.0.1:2017*" to lookup the potential proxy ports
npm config set https-proxy=http://127.0.0.1:20171
npm config set httpsproxy=http://127.0.0.1:20171

