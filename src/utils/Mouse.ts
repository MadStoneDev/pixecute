export const currentMousePosition = (
  mouseX: number,
  mouseY: number,
  canvasSize: { width: number; height: number },
  wrapperLeft: number,
  wrapperTop: number,
  wrapperWidth: number,
  wrapperHeight: number,
) => {
  const rawX = Math.floor(
    (canvasSize.width * (mouseX - wrapperLeft)) / wrapperWidth,
  );
  const rawY = Math.floor(
    (canvasSize.height * (mouseY - wrapperTop)) / wrapperHeight,
  );

  // Clamp to canvas bounds
  const normalisedX = Math.max(0, Math.min(rawX, canvasSize.width - 1));
  const normalisedY = Math.max(0, Math.min(rawY, canvasSize.height - 1));

  return { normalisedX, normalisedY };
};
