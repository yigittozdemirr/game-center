; GameCenter.exe is Electron's original, unmodified executable (antivirus software trusts the known file;
; embedding an icon turned it into a "never seen before" file and caused false positives).
; That's why the shortcuts and the Programs list get their icon from a separate .ico file.

!macro customInstall
  CreateShortCut "$DESKTOP\GameCenter.lnk" "$INSTDIR\GameCenter.exe" "" "$INSTDIR\resources\icon.ico" 0
  WinShell::SetLnkAUMI "$DESKTOP\GameCenter.lnk" "com.gamecenter.app"
  CreateShortCut "$SMPROGRAMS\GameCenter.lnk" "$INSTDIR\GameCenter.exe" "" "$INSTDIR\resources\icon.ico" 0
  WinShell::SetLnkAUMI "$SMPROGRAMS\GameCenter.lnk" "com.gamecenter.app"
  WriteRegStr SHCTX "${UNINSTALL_REGISTRY_KEY}" "DisplayIcon" "$INSTDIR\resources\icon.ico"
!macroend

!macro customUnInstall
  Delete "$DESKTOP\GameCenter.lnk"
  Delete "$SMPROGRAMS\GameCenter.lnk"
!macroend
