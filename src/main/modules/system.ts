export { updateCPUCount };

async function updateCPUCount() {
  try {
    const cpuCount = await getCPUCount();
    addon.data.cpuCount = cpuCount;
    ztoolkit.log(`CPU count updated: ${cpuCount}`);
  } catch (error) {
    Zotero.logError(error as Error);
    addon.data.cpuCount = undefined;
  }
}

/**
 * Retrieves the total number of logical CPUs (N) on the current machine,
 * by running an OS‐specific shell command and capturing its output in a temporary file.
 *
 * @returns {Promise<number>} The total number of logical CPUs (N).
 */
async function getCPUCount(): Promise<number> {
  const tmpFile = Zotero.getTempDirectory();
  tmpFile.append("out.log");
  await Zotero.File.putContentsAsync(tmpFile, "");

  let cmd, args;
  if (Zotero.isLinux) {
    cmd = "/bin/bash";
    args = ["-c", `nproc > "${tmpFile.path}"`];
  } else if (Zotero.isMac) {
    cmd = "/bin/bash";
    args = ["-c", `sysctl -n hw.logicalcpu > "${tmpFile.path}"`];
  } else if (Zotero.isWin) {
    cmd = "C:\\\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
    // Windows‐specific args array, writing the CPU count as UTF‐8 into tmpFile:
    args = [
      "-NoProfile",
      "-WindowStyle",
      "Hidden",
      "-Command",
      // 1) Queries Win32_Processor, 2) sums NumberOfLogicalProcessors,
      // 3) pipes the result into Out-File with UTF-8 encoding:
      `(Get-WmiObject Win32_Processor | Measure-Object -Property NumberOfLogicalProcessors -Sum).Sum | Out-File -FilePath '${tmpFile.path}' -Encoding UTF8`,
    ];
  } else {
    throw new Error(
      "Unsupported OS: cannot determine CPU count on this platform.",
    );
  }

  const success = await Zotero.Utilities.Internal.exec(cmd, args);
  if (!success) {
    throw new Error("Failed to execute CPU‐count command.");
  }

  let outText = await Zotero.File.getContentsAsync(tmpFile);
  if (typeof outText !== "string") {
    throw new Error("Failed to read CPU‐count output from temp file.");
  }

  outText = outText.trim();

  const match = (outText as string).match(/\d+/);
  if (!match) {
    throw new Error(
      "Could not parse CPU count from output: " + JSON.stringify(outText),
    );
  }
  return parseInt(match[0], 10);
}
