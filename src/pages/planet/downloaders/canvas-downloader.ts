export interface CanvasDownloader {
    download(): Promise<void>;
}

export class SimpleCanvasDownloader implements CanvasDownloader {
    private canvasRef: React.RefObject<HTMLCanvasElement | null>;

    constructor(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
        this.canvasRef = canvasRef;
    }

    async download(): Promise<void> {
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        await new Promise((r) => setTimeout(r, 1000));
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "canvas.png";
        a.click();
    }
}
