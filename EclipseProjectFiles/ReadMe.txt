To create an eclipse project, do the following.  You should already have Eclipse CDT installed, Codesourcery's ARM compiler, and if you already have a project called WorMp3, you will have to delete it.

First, click on opencmd.cmd.  This should open a command prompt in the EclipseProjectFiles directory.  If it doesn't, you should open a command prompt manually and move to the EclipseProjectFiles directory.

Then do the following:  (note that this assumes you have Cygwin installed and that cp works from your command prompt.  You can also just drag and drop these files manually using the windows gui).

Replace %EclipseCDTWorkspace% with your actual eclipse CDT workspace (NOT YOUR JAVA WORKSPACE).

>mkdir %EclipseCDTWorkspace%/WorMp3
>cp -r . %EclipseCDTWorkspace%/WorMp3/
>cd ..
>cd ..
>cp -r git %EclipseCDTWorkspace%/WorMp3/git


Then go to Eclipse, click on File->Import and Click on the General and Existing Projects into Workspace
Then click Next.
Then where is says "Select root directory" click on browse and click on the directory %InstallPath%/WorMp3
Then click next.
The project should be installed.

If you have any problems, then create a new project, and just copy the settings from this project.

Note that you will also have to tell Eclipse to ignore the plugin/include/libav directories on its compile path.  Those directories need to be there for header linking, but they also contain code that won't compile properly.  All the code needed for FFmpeg is in the libraries, and the code in the plugin/includelibav directories are there for completeness.

You may also want to point your javascript development environment to the %EclipseCDTWorkspace%/WorMp3/git/mojo directory so you can just use this directory as single location for the git repository.

****If you are compiling on windows, and using cywin to make the build, you may get a make error saying "multiple target patterns."  This may be because of an issue with the make.exe supplied with Cygwin.
In the tools directory of this repository you will find an alternate make.exe that should fix the problem.