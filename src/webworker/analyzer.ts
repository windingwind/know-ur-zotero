// In webworker environment

import { MessageHelper } from "zotero-plugin-toolkit";

export { handlers };

const handlers = {
  analyze,
};

const messageServer = new MessageHelper({
  canBeDestroyed: true,
  dev: __env__ === "development",
  name: "analyzerWorker",
  target: self,
  handlers,
});

messageServer.start();

function analyze(
  profileData: any,
  options: {
    keys: _PluginTypes.Analyzer.Filter[];
    includeDetailedResults?: boolean;
    disallowMultiple?: boolean;
    duration?: number;
    numCpus?: number;
  } = {
    keys: [],
    includeDetailedResults: false,
    disallowMultiple: false,
  },
) {
  const parsedData = _parse(profileData);
  const averageUsage = _averageUsage(
    parsedData,
    options.duration || 0,
    options.numCpus,
  );
  if (options.keys.length === 0) {
    return { parsedData, averageUsage };
  }
  _statistics(parsedData, options.keys, {
    includeDetailedResults: options.includeDetailedResults,
    disallowMultiple: options.disallowMultiple,
  });
  return {
    parsedData,
    averageUsage,
  };
}

function _parse(profileData: any) {
  // Helper function to retrieve a field index from a schema that can be either an array or an object.
  function getFieldIndex(
    schema: _PluginTypes.Analyzer.Schema,
    fieldName: string,
  ) {
    if (Array.isArray(schema)) {
      return schema.indexOf(fieldName);
    } else if (schema && typeof schema === "object") {
      return schema[fieldName];
    }
    return -1;
  }

  // Helper function to recursively resolve a call stack from a given stack index.
  function getCallStack(
    stackIndex: number,
    stackTable: _PluginTypes.Analyzer.DataTable,
    frameTable: _PluginTypes.Analyzer.DataTable,
    stringTable: string[],
  ) {
    const frames = [];
    // Dynamically get field indexes for "prefix" and "frame" from the stack table schema.
    const prefixFieldIndex = getFieldIndex(stackTable.schema, "prefix");
    const frameFieldIndex = getFieldIndex(stackTable.schema, "frame");
    // Get the field index for "location" from the frame table schema.
    const locationFieldIndex = getFieldIndex(frameTable.schema, "location");

    while (stackIndex !== null && stackIndex !== undefined) {
      const entry = stackTable.data[stackIndex];
      if (!entry) break;
      const parentIndex = entry[prefixFieldIndex] as number;
      const frameIndex = entry[frameFieldIndex] as number;
      const frameEntry = frameTable.data[frameIndex];
      if (!frameEntry) break;
      const locationStringIndex = frameEntry[locationFieldIndex] as number;
      const locationString = stringTable[locationStringIndex];
      frames.unshift(locationString);
      stackIndex = parentIndex;
    }
    return frames.join(" -> ");
  }

  // We'll store the sorted results for each thread in an array.
  const allThreadResults: _PluginTypes.Analyzer.ParsedData[] = [];

  profileData.threads.forEach((thread: Record<string, any>) => {
    if (
      !thread.samples ||
      !thread.stackTable ||
      !thread.frameTable ||
      !thread.stringTable
    ) {
      console.warn(
        "Thread",
        thread.name,
        "is missing expected profiling data.",
      );
      return;
    }

    // Dynamically obtain indexes for 'stack' and 'threadCPUDelta' from the samples schema.
    const sampleSchema = thread.samples.schema;
    const sampleStackIndexField = getFieldIndex(sampleSchema, "stack");
    const sampleCpuDeltaField = getFieldIndex(sampleSchema, "threadCPUDelta");

    const samples = thread.samples.data; // Array of sample entries.
    const cpuTimeMap: Record<string, number> = {};
    let totalCpuTime = 0;

    samples.forEach((sample: Record<string, any>) => {
      const stackIndex = sample[sampleStackIndexField];
      const cpuDelta = sample[sampleCpuDeltaField] || 0;
      totalCpuTime += cpuDelta;
      if (stackIndex == null) return;

      const callStack = getCallStack(
        stackIndex,
        thread.stackTable,
        thread.frameTable,
        thread.stringTable,
      );
      cpuTimeMap[callStack] = (cpuTimeMap[callStack] || 0) + cpuDelta;
    });

    // Build an array from the aggregated cpuTimeMap.
    const aggregatedResults = [];
    for (const callStack in cpuTimeMap) {
      const cpuTime = cpuTimeMap[callStack];
      const percent = ((cpuTime / totalCpuTime) * 100).toFixed(2);
      aggregatedResults.push({ callStack, cpuTime, percent });
    }

    // Sort the array by CPU time in descending order.
    aggregatedResults.sort((a, b) => b.cpuTime - a.cpuTime);

    // Store the results for this thread.
    allThreadResults.push({
      thread: thread.name,
      totalCpuTime,
      results: aggregatedResults,
    });
  });

  return allThreadResults;
}

function _statistics(
  data: _PluginTypes.Analyzer.ParsedData[],
  filters: _PluginTypes.Analyzer.Filter[],
  options: {
    includeDetailedResults?: boolean;
    includeOther?: boolean;
    disallowMultiple?: boolean;
  } = {
    includeDetailedResults: false,
    disallowMultiple: false,
    includeOther: false,
  },
) {
  // For each key, filter out by callStack and count the total cpuTime for each key.
  for (const threadData of data) {
    const statistics = [];
    for (const filter of filters) {
      const keyResults = threadData.results.filter((result) =>
        result.callStack.includes(filter.key),
      );
      const totalCpuTime = keyResults.reduce(
        (sum, result) => sum + result.cpuTime,
        0,
      );
      const percent = ((totalCpuTime / threadData.totalCpuTime) * 100).toFixed(
        2,
      );
      const statisticsData = {
        key: filter.key,
        name: filter.name,
        description: filter.description || "No description available.",
        totalCpuTime,
        percent,
        results: [] as _PluginTypes.Analyzer.Result[],
      };
      if (options.includeDetailedResults) {
        statisticsData.results = keyResults;
      }
      statistics.push(statisticsData);

      if (options.disallowMultiple && keyResults) {
        threadData.results = threadData.results.filter(
          (result) => !keyResults.includes(result),
        );
      }
    }

    // Add "Other" statistics for the remaining results.
    if (options.includeOther && options.disallowMultiple) {
      const otherCpuTime = threadData.results.reduce(
        (sum, result) => sum + result.cpuTime,
        0,
      );
      const otherPercent = (
        (otherCpuTime / threadData.totalCpuTime) *
        100
      ).toFixed(2);
      statistics.push({
        key: "other",
        name: "Other",
        totalCpuTime: otherCpuTime,
        percent: otherPercent,
        results: threadData.results,
      });
    }
    threadData.statistics = statistics;
  }
  return data;
}

function _averageUsage(
  data: _PluginTypes.Analyzer.ParsedData[],
  duration: number,
  numCpus: number = 8, // Default to 8 CPUs if not specified
) {
  if (duration === 0) {
    return NaN;
  }
  let totalCpuTime = 0;
  data.forEach((threadData) => {
    totalCpuTime += threadData.totalCpuTime;
  });

  return totalCpuTime / duration / numCpus;
}
