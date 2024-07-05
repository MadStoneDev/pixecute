class MockImageData {
  private width: number;
  private height: number;
  public data: Uint8ClampedArray;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}

global.ImageData = MockImageData as any;
