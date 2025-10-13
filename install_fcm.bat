@echo off
echo Installing FCM Community Plugin...
npm install @capacitor-community/fcm
echo.
echo Syncing Capacitor...
npx cap sync android
echo.
echo Done! Now rebuild your app.
pause