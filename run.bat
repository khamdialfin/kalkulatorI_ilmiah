@echo off
set "PATH=C:\msys64\ucrt64\bin;%PATH%"
echo [1/2] Mengompilasi kalkulator_ilmiah.cpp...
g++ -std=c++17 -Wall kalkulator_ilmiah.cpp -o kalkulator.exe
if %ERRORLEVEL% equ 0 (
    echo [2/2] Kompilasi berhasil! Memulai program...
    echo ----------------------------------------
    kalkulator.exe
) else (
    echo.
    echo [ERROR] Gagal mengompilasi program.
    pause
)
