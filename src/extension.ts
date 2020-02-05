'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ChildProcess, exec } from 'child_process';
import { platform } from 'os';

// Utility functions
function getSettings(name: string): any {
    const settings = vscode.workspace.getConfiguration('tig', null);
    return settings.get(name);
}

function getFilePath(): string|undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    return editor.document.fileName;
}

function getGitPath(filePath: string|undefined): string|undefined {
    if (!filePath) {
        return vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0].name;
    }

    const filePathInfo = path.parse(filePath);
    let dirPath = filePathInfo.dir;
    let dirPathSplit = dirPath.split(path.sep);

    while (filePathInfo.root !== dirPath) {
        if (fs.existsSync(path.join(dirPath, '.git'))) {
            return dirPath;
        }
        dirPathSplit.pop();
        dirPath = dirPathSplit.join(path.sep);
    }

    return vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0].name;
}

function getTerminal(cmd: string, gitPath?: string): string {
    let terminal = getSettings('terminal.' + platform());

    cmd += "\""+ terminal +"\"";

    // For mac, we need to use osascript to force the app to run a command
    if (platform() === 'darwin') {
        cmd = "osascript -e 'tell application " + cmd + " to do script \"cd " + gitPath + " && ";
    }
    return cmd;
}

function getMaximize(cmd: string): string {
    if (getSettings('openMaximize')) {
        if (platform() === "darwin") {
            const terminal = getSettings('terminal.' + platform());
            cmd += " && osascript -e 'tell application \"Finder\"' -e 'set desktopSize to bounds of window of desktop' -e 'end tell' -e 'tell application \"" + terminal + "\"' -e 'set bounds of window 1 to desktopSize' -e 'activate' -e 'end tell'";
        } else {
            cmd += " " + getSettings('maximizeArg');
        }
    }
    return cmd;
}

function getTig(cmdTig: string): string {
    let executable = getSettings('executable');
    if (platform() === 'darwin') {
        cmdTig += " \\\"" + executable + "\\\"";
    }
    else {
        cmdTig += "\"" + executable + "\"";
    }
    return cmdTig;
}

function getTigFilePath(cmdTig: string, filePath: string): string {
    if (platform() === 'darwin') {
        cmdTig += " \\\"" + filePath + "\\\"";
    } else {
        cmdTig += " \"" + filePath + "\"";
    }
    return cmdTig;
}

function getTigPosition(cmdTig: string, editor: vscode.TextEditor|undefined): string {
    if (editor && editor.selection.isEmpty) {
        cmdTig += " +" + (editor.selection.active.line + 1).toString();
    }
    return cmdTig;
}

function getMergedCmd(cmd: string, cmdTig: string): string {
    if (platform() === 'darwin') {
        cmd += cmdTig;
        cmd += "\" in window 1'";
        if (getSettings('openMaximize')) {
            cmd = getMaximize(cmd);
        }
    } else {
        cmd += " -e \'" + cmdTig + "\'";
    }
    return cmd;
}

function handleProcessError(process: ChildProcess, cmd: string): void {
    process.addListener("exit", (code: number, signal: string) => {
        if (code === 0 && signal === null) return;

        let message = `\`${cmd}\``;
        if (signal !== null) {
            message += ` was killed by ${signal}`;
        } else {
            message += ` exited with code ${code}`;
        }
        vscode.window.showErrorMessage(message);
    });
}

export function activate(context: vscode.ExtensionContext) {

    let disposableHistory = vscode.commands.registerCommand('extension.history', () => {
        const filePath = getFilePath();
        if (!filePath) {
            vscode.window.showErrorMessage('File not found');
            return;
        }
        const gitPath = getGitPath(filePath);
        if (!gitPath) {
            vscode.window.showErrorMessage('Git directory not found');
            return;
        }

        // Start assembling the command line
        let cmd = '';
        cmd = getTerminal(cmd, gitPath);
        if (platform() !== "darwin") {
            cmd = getMaximize(cmd);
        }

        // Build tig part of the command line
        let cmdTig = '';
        cmdTig = getTig(cmdTig);
        cmdTig = getTigFilePath(cmdTig, filePath);

        // Merge both parts and run
        cmd = getMergedCmd(cmd, cmdTig);
        console.log('Executing: ', cmd, gitPath);
        let process = exec(cmd, {cwd: gitPath});
        handleProcessError(process, cmd);
    });

    let disposableBlame = vscode.commands.registerCommand('extension.blame', () => {
        const filePath = getFilePath();
        if (!filePath) {
            vscode.window.showErrorMessage('File not found');
            return;
        }
        const gitPath = getGitPath(filePath);
        if (!gitPath) {
            vscode.window.showErrorMessage('Git directory not found');
            return;
        }

        // Start assembling the command line
        let cmd = '';
        cmd = getTerminal(cmd, gitPath);
        if (platform() !== "darwin") {
            cmd = getMaximize(cmd);
        }

        // Build tig part of the command line
        let cmdTig = '';
        cmdTig = getTig(cmdTig);
        cmdTig += " blame";
        cmdTig = getTigFilePath(cmdTig, filePath);
        cmdTig = getTigPosition(cmdTig, vscode.window.activeTextEditor);

        // Merge both parts and run
        cmd = getMergedCmd(cmd, cmdTig);
        console.log('Executing: ', cmd, gitPath);
        let process = exec(cmd, {cwd: gitPath});
        handleProcessError(process, cmd);
    });

    context.subscriptions.push(disposableHistory);
    context.subscriptions.push(disposableBlame);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
