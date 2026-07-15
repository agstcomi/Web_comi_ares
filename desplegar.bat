@echo off
chcp 65001 > nul
title Despliegue de Supabase - Comissió de Festes d'Ares
echo ===================================================
echo   DESPLIEGUE AUTOMATIZADO DE SUPABASE EDGE FUNCTIONS
echo ===================================================
echo.
echo Este script te ayudará a desplegar las Edge Functions y configurar secretos.
echo Necesitarás tu token de acceso personal de Supabase.
echo Si no lo tienes, créalo aquí: https://supabase.com/dashboard/account/tokens
echo.
set /p SUPABASE_ACCESS_TOKEN="Paso 1: Introduce tu Supabase Access Token: "
if "%SUPABASE_ACCESS_TOKEN%"=="" (
    echo El token no puede estar vacío. Abortando.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo ¿Qué te gustaría hacer?
echo [1] Desplegar todas las Edge Functions (Recomendado)
echo [2] Configurar secretos de entorno en Supabase (WEBHOOK_SECRET, etc.)
echo [3] Hacer ambas cosas (Configurar secretos y desplegar)
echo ===================================================
set /p OPTION="Elige una opción (1, 2 o 3): "

set PROJECT_REF=wqelwzlnxhbhiedmxona
set WEBHOOK_SECRET=417dd2322e472432b0832969f63ae234ee71706f8ccfcb30ad895930c559b75e

if "%OPTION%"=="2" goto secrets
if "%OPTION%"=="3" goto both

:deploy
echo.
echo --- DESPLEGANDO EDGE FUNCTIONS ---
call npx supabase functions deploy --project-ref %PROJECT_REF% aemet-weather translate-text trigger-deploy share
if %errorlevel% neq 0 (
    echo Error durante el despliegue de las Edge Functions.
) else (
    echo ¡Despliegue completado con éxito!
)
goto end

:secrets
echo.
echo --- CONFIGURANDO SECRETOS ---
echo Introduce los siguientes valores si deseas cambiarlos (presiona Enter para mantener vacío o no modificar):
set /p AEMET_KEY="Clave de API de AEMET: "
set /p GITHUB_PAT="GitHub Personal Access Token (PAT): "

echo Subiendo secretos a Supabase...
if not "%AEMET_KEY%"=="" (
    call npx supabase secrets set --project-ref %PROJECT_REF% AEMET_API_KEY="%AEMET_KEY%"
)
if not "%GITHUB_PAT%"=="" (
    call npx supabase secrets set --project-ref %PROJECT_REF% GITHUB_PAT="%GITHUB_PAT%"
)
call npx supabase secrets set --project-ref %PROJECT_REF% WEBHOOK_SECRET="%WEBHOOK_SECRET%"
echo ¡Secretos de entorno configurados!
goto end

:both
echo.
echo --- CONFIGURANDO SECRETOS ---
set /p AEMET_KEY="Clave de API de AEMET: "
set /p GITHUB_PAT="GitHub Personal Access Token (PAT): "

echo Subiendo secretos a Supabase...
if not "%AEMET_KEY%"=="" (
    call npx supabase secrets set --project-ref %PROJECT_REF% AEMET_API_KEY="%AEMET_KEY%"
)
if not "%GITHUB_PAT%"=="" (
    call npx supabase secrets set --project-ref %PROJECT_REF% GITHUB_PAT="%GITHUB_PAT%"
)
call npx supabase secrets set --project-ref %PROJECT_REF% WEBHOOK_SECRET="%WEBHOOK_SECRET%"

echo.
echo --- DESPLEGANDO EDGE FUNCTIONS ---
call npx supabase functions deploy --project-ref %PROJECT_REF% aemet-weather translate-text trigger-deploy share
if %errorlevel% neq 0 (
    echo Error durante el despliegue de las Edge Functions.
) else (
    echo ¡Despliegue y configuración completados con éxito!
)
goto end

:end
echo.
echo Proceso finalizado.
pause
