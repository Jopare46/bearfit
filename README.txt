BEARFIT LOCAL v1.1
================

What it is
-----------
BearFit Local is a private, offline-first workout and food tracker designed for one user.
No Base44 subscription, Play Store release, or server is required.

Your data
---------
Workout logs, food logs and settings are stored locally on the device/browser using IndexedDB.
Use the three-dot menu in BearFit to export a full JSON backup regularly.
You can also export a training-history CSV.

Important
---------
Opening index.html directly from a file will let you inspect the app, but Android installation and reliable offline PWA behaviour require the files to be served over HTTPS.

Free Android setup (GitHub Pages)
----------------------------------
1. Create a free GitHub account if you do not have one.
2. Create a new repository named: bearfit
3. Upload all files and folders from this BearFit-Local-v1 folder to the repository root.
4. In the repository open Settings > Pages.
5. Under Build and deployment, choose Deploy from a branch.
6. Choose main and /(root), then Save.
7. Open the Pages web address GitHub gives you on your Android phone in Chrome.
8. Chrome menu (three dots) > Add to Home screen / Install app.
9. BearFit will then open like a normal phone app.

No coding is required. You are only uploading the supplied files.

Updating later
--------------
If a newer BearFit package is supplied later, replace the website files but DO NOT clear browser/site data unless you have exported a backup first.

Features in v1
--------------
- TRAIN / FOOD / PROGRESS navigation
- Tuesday, Thursday, Saturday and Sunday workout tabs
- Run any day's workout on any calendar day
- Add, remove and reorder exercises
- Record weight and reps for each set
- Change the number of sets for any exercise at any time with +/- controls
- Previous load automatically suggested from training history
- Finish-workout history
- Automatic completed-workout report with Share and Print / Save PDF
- View and re-share previous workout reports from Progress
- Daily calorie and protein targets
- Food/calorie/protein logging
- Bench progress reference against a 90 kg goal
- Full JSON backup / restore
- Training CSV export
- Offline support after first successful HTTPS load
