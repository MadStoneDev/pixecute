// Alternative: Single CanvasLayer that composites all layers
"use client";

import React, { useEffect, useRef, forwardRef } from "react";

interface CompositeCanvasLayerProps {
    canvasSize: { width: number; height: number };
    layers: Array<{
        frame: ImageData | null;
        visible: boolean;
        opacity: number;
        blendMode: string;
    }>;
    selectedFrame: number;
    className?: string;
}

const CompositeCanvasLayer = forwardRef<HTMLCanvasElement, CompositeCanvasLayerProps>(({
                                                                                           canvasSize,
                                                                                           layers,
                                                                                           selectedFrame,
                                                                                           className = "",
                                                                                       }, ref) => {
    const internalRef = useRef<HTMLCanvasElement>(null);

    const renderAllLayers = () => {
        const canvas = internalRef.current;
        if (!canvas) return;

        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Create a temporary canvas for proper compositing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasSize.width;
        tempCanvas.height = canvasSize.height;
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) return;
        tempCtx.imageSmoothingEnabled = false;

        // Render each visible layer in order
        layers.forEach((layer) => {
            if (layer.visible && layer.frame && layer.frame.width > 1 && layer.frame.height > 1) {
                // Clear temp canvas
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                // Put the layer data on temp canvas
                tempCtx.putImageData(layer.frame, 0, 0);

                // Set layer properties and composite onto main canvas
                ctx.globalAlpha = (layer.opacity || 100) / 100;
                ctx.globalCompositeOperation = layer.blendMode || 'source-over';

                // Draw temp canvas onto main canvas (this properly composites)
                ctx.drawImage(tempCanvas, 0, 0);
            }
        });

        // Reset context properties
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    };

    useEffect(() => {
        renderAllLayers();
    }, [layers, selectedFrame, canvasSize]);

    // Forward ref to internal canvas
    useEffect(() => {
        if (typeof ref === 'function') {
            ref(internalRef.current);
        } else if (ref) {
            ref.current = internalRef.current;
        }
    }, [ref]);

    return (
        <canvas
            ref={internalRef}
    className={`absolute top-0 left-0 w-full h-full z-10 ${className}`}
    style={{
        imageRendering: "pixelated",
    }}
    />
);
});

CompositeCanvasLayer.displayName = "CompositeCanvasLayer";

export default CompositeCanvasLayer;
