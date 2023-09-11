class NodeCliUtilsConfig {
  private _traceEnabled: boolean = false;

  set traceEnabled(value: boolean) {
    this._traceEnabled = value
  }

  get traceEnabled(): boolean {
    return this._traceEnabled
  }
}

export const config = new NodeCliUtilsConfig()
