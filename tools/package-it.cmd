@rem if run in the windows script folder, change to parent
@if not exist plugin ( pushd .. ) else pushd .

set STAGING_DIR=STAGING\com.palmdts.app.simplepdk

rmdir /s/q %STAGING_DIR%
del *.ipk
mkdir %STAGING_DIR%
xcopy /e/y mojo %STAGING_DIR%
call windows\buildit.cmd
copy shapespin_plugin %STAGING_DIR%
echo filemode.755=shapespin_plugin > %STAGING_DIR%\package.properties
palm-package %STAGING_DIR%

popd