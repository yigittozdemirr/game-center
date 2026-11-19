; Ludora.exe is Electron's original, unmodified executable (antivirus software trusts the known file;
; embedding an icon turned it into a "never seen before" file and caused false positives).
; That's why the shortcuts and the Programs list get their icon from a separate .ico file.
; The AUMI stays "com.gamecenter.app" from the app's old name, so notifications and taskbar grouping keep working.

!macro customInstall
  ; shortcuts from the old name (GameCenter) point to an exe that no longer exists
  Delete "$DESKTOP\GameCenter.lnk"
  Delete "$SMPROGRAMS\GameCenter.lnk"
  CreateShortCut "$DESKTOP\Ludora.lnk" "$INSTDIR\Ludora.exe" "" "$INSTDIR\resources\icon.ico" 0
  WinShell::SetLnkAUMI "$DESKTOP\Ludora.lnk" "com.gamecenter.app"
  CreateShortCut "$SMPROGRAMS\Ludora.lnk" "$INSTDIR\Ludora.exe" "" "$INSTDIR\resources\icon.ico" 0
  WinShell::SetLnkAUMI "$SMPROGRAMS\Ludora.lnk" "com.gamecenter.app"
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "DisplayIcon" "$INSTDIR\resources\icon.ico"
!macroend

!macro customUnInstall
  Delete "$DESKTOP\Ludora.lnk"
  Delete "$SMPROGRAMS\Ludora.lnk"
!macroend
