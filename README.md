# open-tig

The open-tig extension provides keybindings to launch Tig or Tig blame on the file opened.

## Features

open-tig opens an external terminal and launches either `tig` or `tig blame` on the file opened. In
the case of blame, the cursor position is added, so that Tig focuses on the same line.

This extension contributes the following keybindings:

* `ctrl+alt+h`: launch tig
* `ctrl+alt+b`: launch tig blame

`ctrl` is replaced by `cmd` on MacOS.

## Extension Settings

This extension contributes the following settings:

* `tig.terminal.darwin`: terminal application to lauch on MacOS
* `tig.terminal.linux`: terminal application to launch on Linux
* `tig.executable`: Tig executable path
* `tig.openMaximize`: whether the terminal should be opened in full screen
* `tig.maximizeArg`: the terminal option to launch in full screen

## Known Issues

The extension doesn't support Windows. It will most likely never be the case.

## Release Notes

open-tig is still in a beta phase.

### 0.0.1

Initial release
