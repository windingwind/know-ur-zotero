// For across-env type sharing

declare namespace _PluginTypes {
  namespace Analyzer {
    type Handlers = (typeof import("../src/webworker/analyzer"))["handlers"];
    interface DataTable {
      schema: Schema;
      data: Array<Array<number | string | null>>;
    }

    interface Schema {
      [key: string]: number;
    }

    interface Result {
      callStack: string;
      cpuTime: number;
      percent: string;
    }

    interface Filter {
      key: string;
      name: string;
      description?: string;
    }

    interface Stats {
      key: string;
      name: string;
      description?: string;
      totalCpuTime: number;
      percent: string;
      results?: Result[];
    }

    interface ParsedData {
      thread: string;
      totalCpuTime: number;
      results: Result[];
      statistics?: Stats[];
    }

    interface ParsedResult {
      parsedData: ParsedData[];
      averageUsage: number;
    }
  }

  namespace Monitor {
    type Handlers = (typeof import("../src/html/monitor"))["handlers"];
  }
}
