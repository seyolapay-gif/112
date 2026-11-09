@echo off
chcp 65001 > nul
echo ========================================================
echo   تصدير وبناء ملف التثبيت التنفيذي (Windows .exe)
echo   نظام إدارة التحويلات المالية وخطوط الكاش الذكي
echo ========================================================
echo.

echo 1. التحقق من تثبيت Node.js و npm...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [خطأ] Node.js غير مثبت على جهازك. يرجى تثبيته من https://nodejs.org
    pause
    exit /b 1
)

echo 2. بناء ملفات الواجهة والإنتاج (Vite Production Build)...
if exist dist rmdir /s /q dist
set ELECTRON_BUILD=true
set NODE_ENV=production
call npm run build
if %errorlevel% neq 0 (
    echo [خطأ] فشل في بناء الواجهة.
    pause
    exit /b 1
)

echo 3. بناء وتجهيز تطبيق سطح المكتب المستقل...
call npx electron-builder --win --x64
if %errorlevel% neq 0 (
    echo.
    echo لم يتم العثور على حزم electron المحلية، جاري التثبيت التلقائي...
    call npm install --save-dev electron electron-builder
    call npx electron-builder --win --x64
)

echo.
echo ========================================================
echo تم بنجاح إنشاء ملف التثبيت التنفيذي (.exe)!
echo ستجد الملف داخل مجلد: dist-electron/
echo عند تشغيل ملف التثبيت، يمكنك اختيار أي مسار تثبيت تريده
echo وسيتم حفظ كافة البيانات والملفات بالكامل داخل ذلك المجلد.
echo ========================================================
pause
