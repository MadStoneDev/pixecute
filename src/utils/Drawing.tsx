export const currentMousePosition = (
  mouseX: number,
  mouseY: number,
  canvasSize: { width: number; height: number },
  wrapper: HTMLElement,
  wrapperLeft: number,
  wrapperTop: number,
  wrapperWidth: number,
  wrapperHeight: number,
) => {
  const normalisedX = Math.floor(
    (canvasSize.width * (mouseX - wrapperLeft)) / wrapperWidth,
  );
  const normalisedY = Math.floor(
    (canvasSize.height * (mouseY - wrapperTop)) / wrapperHeight,
  );

  return { normalisedX, normalisedY };
};

// export const drawAtPixel = (
//     x: number,
//     y: number,
//     pixelSize: { x : number = 1; y: number = 1 },
//     colour: string,
//
