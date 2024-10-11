#!/bin/bash

if ! npm -v &> /dev/null; then
    echo "couldn't find npm"
    exit
fi

if ! zip -v &> /dev/null; then
    echo "couldn't find zip utility"
    exit
fi

npm i
clean_build() {
    echo "-- build $TARGET --"
    rm -rf ./dist/* ./dist/.*          # clear build directory
    npm run build                      # build extension
    pushd .                            # save cwd for later
    cd dist                            # cd into dist repo
    zip "../builds/$TARGET.$(          # zip extension
        if [ "$TARGET" = "firefox" ];  #
        then echo 'xpi';               # use xpi extension if firefox
        elif [ "$TARGET" = "chrome" ]; #
        then echo 'crx'; fi            # crx if chrome
    )" -r .                            #
    popd                               # return to cwd
}

rm -rf ./builds
mkdir builds
TARGET="firefox" clean_build
TARGET="chrome"  clean_build