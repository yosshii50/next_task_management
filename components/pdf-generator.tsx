"use client";

import NextImage from "next/image";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

const A3_WIDTH = 842; // points
const A3_HEIGHT = 1191; // points

const fontFamilies = {
  title: "600 42px 'Helvetica Neue', 'Hiragino Sans', sans-serif",
  body: "400 20px 'Hiragino Sans', 'Noto Sans JP', sans-serif",
};

type PdfUrls = {
  standard: string | null;
  rotated: string | null;
};

type LayoutVariant = "standard" | "rotated";

export default function PdfGenerator() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [pdfUrls, setPdfUrls] = useState<PdfUrls>({ standard: null, rotated: null });
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    return () => {
      if (pdfUrls.standard) {
        URL.revokeObjectURL(pdfUrls.standard);
      }
      if (pdfUrls.rotated) {
        URL.revokeObjectURL(pdfUrls.rotated);
      }
    };
  }, [pdfUrls.rotated, pdfUrls.standard]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImageSrc(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const canGenerate = useMemo(() => Boolean(title && content && imageSrc), [title, content, imageSrc]);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !imageSrc) {
      setError("タイトル・内容・画像を入力してください。");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const [standardLayout, rotatedLayout] = await Promise.all([
        createLayoutImage(title, content, imageSrc, "standard"),
        createLayoutImage(title, content, imageSrc, "rotated"),
      ]);
      const [standardBytes, rotatedBytes] = await Promise.all([
        buildPdfFromJpeg(standardLayout, A3_WIDTH, A3_HEIGHT),
        buildPdfFromJpeg(rotatedLayout, A3_WIDTH, A3_HEIGHT),
      ]);

      setPdfUrls((prev) => {
        if (prev.standard) {
          URL.revokeObjectURL(prev.standard);
        }
        if (prev.rotated) {
          URL.revokeObjectURL(prev.rotated);
        }
        const standardUrl = URL.createObjectURL(new Blob([standardBytes], { type: "application/pdf" }));
        const rotatedUrl = URL.createObjectURL(new Blob([rotatedBytes], { type: "application/pdf" }));
        return { standard: standardUrl, rotated: rotatedUrl };
      });
    } catch (err) {
      console.error(err);
      setError("PDFの生成に失敗しました。もう一度お試しください。");
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, content, imageSrc, title]);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-2xl font-semibold">PDF生成</h2>
        <p className="mt-2 text-sm text-white/70">A3サイズのPDFに画像・タイトル・本文をレイアウトしてプレビューします。</p>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-white/80">
            タイトル
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="イベントタイトルなど"
              className="mt-1 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
            />
          </label>

          <label className="block text-sm font-semibold text-white/80">
            内容
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="本文や詳細を入力してください"
              rows={6}
              className="mt-1 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
            />
          </label>

          <label className="block text-sm font-semibold text-white/80">
            画像（JPG/PNG）
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
              className="mt-1 w-full rounded-2xl border border-dashed border-white/30 bg-white/5 px-4 py-3 text-white"
            />
          </label>

          {imageSrc ? (
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-sm text-white/70">プレビュー</p>
              <div className="relative mt-2 h-64 w-full overflow-hidden rounded-xl bg-slate-900/20">
                <NextImage
                  src={imageSrc}
                  alt="選択された画像"
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 640px"
                />
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? "生成中..." : "PDFを生成"}
          </button>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>
      </div>

      {pdfUrls.standard || pdfUrls.rotated ? (
        <div className="space-y-6">
          {pdfUrls.standard ? (
            <PdfPreviewCard title="標準レイアウト" description="従来どおりの向きで出力されたPDFです。" url={pdfUrls.standard} />
          ) : null}
          {pdfUrls.rotated ? (
            <PdfPreviewCard title="180°回転レイアウト" description="タイトルと画像を１８０°回転させ、画像は小さめに配置しています。" url={pdfUrls.rotated} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type TitleMetrics = {
  blockHeight: number;
};

function PdfPreviewCard({ title, description, url }: { title: string; description: string; url: string }) {
  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-white/60">{description}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
        >
          新しいタブで開く
        </a>
      </div>
      <iframe src={url} className="mt-4 h-[600px] w-full rounded-2xl border border-white/10 bg-white" title={`${title} PDF preview`} />
    </div>
  );
}

function createLayoutImage(title: string, body: string, imageSrc: string, variant: LayoutVariant): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = A3_WIDTH;
        canvas.height = A3_HEIGHT;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }

        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const margin = 72;

        ctx.fillStyle = "#0f172a";
        ctx.font = fontFamilies.title;
        const titleMetrics = drawTitle(ctx, title, margin, variant);

        const bodyStartY = margin + titleMetrics.blockHeight;
        ctx.font = fontFamilies.body;
        const textHeight = drawWrappedText(ctx, body, margin, bodyStartY, canvas.width - margin * 2, 28);

        const imageTop = Math.max(textHeight + 48, bodyStartY + 60);
        const imageSpaceHeight = canvas.height - imageTop - margin;
        const imageSpaceWidth = canvas.width - margin * 2;
        const sizeFactor = variant === "rotated" ? 0.65 : 1;
        const ratio = Math.min(imageSpaceWidth / image.width, imageSpaceHeight / image.height) * sizeFactor;
        const drawnWidth = image.width * ratio;
        const drawnHeight = image.height * ratio;
        const imageX = margin + (imageSpaceWidth - drawnWidth) / 2;
        const imageY = imageTop + (imageSpaceHeight - drawnHeight) / 2;

        const rotateImage = variant === "rotated";
        ctx.save();
        ctx.translate(imageX + drawnWidth / 2, imageY + drawnHeight / 2);
        if (rotateImage) {
          ctx.rotate(Math.PI);
        }
        ctx.shadowColor = "rgba(15,23,42,0.25)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 20;
        ctx.fillStyle = "white";
        ctx.fillRect(-drawnWidth / 2 - 16, -drawnHeight / 2 - 16, drawnWidth + 32, drawnHeight + 32);
        ctx.shadowColor = "transparent";
        ctx.drawImage(image, -drawnWidth / 2, -drawnHeight / 2, drawnWidth, drawnHeight);
        ctx.restore();

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch (err) {
        reject(err);
      }
    };
    image.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    image.src = imageSrc;
  });
}

function drawTitle(ctx: CanvasRenderingContext2D, title: string, margin: number, variant: LayoutVariant): TitleMetrics {
  const titleBlockHeight = 72;
  if (variant === "rotated") {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(A3_WIDTH / 2, margin + titleBlockHeight / 2);
    ctx.rotate(Math.PI);
    ctx.fillText(title, 0, 0, A3_WIDTH - margin * 2);
    ctx.restore();
  } else {
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(title, margin, margin, A3_WIDTH - margin * 2);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  return { blockHeight: titleBlockHeight };
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
) {
  const paragraphs = text.split(/\n+/);
  let y = startY;

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    let line = "";

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = word;
        y += lineHeight;
      } else {
        line = testLine;
      }
    }

    if (line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }

    y += lineHeight * 0.5; // add spacing between paragraphs
  }

  return y;
}

function buildPdfFromJpeg(dataUrl: string, width: number, height: number) {
  const base64 = dataUrl.split(",")[1];
  const binaryString = atob(base64);
  const imageBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    imageBytes[i] = binaryString.charCodeAt(i);
  }

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let offset = 0;

  const pushString = (value: string) => {
    const bytes = encoder.encode(value);
    chunks.push(bytes);
    offset += bytes.length;
  };

  const pushBinary = (value: Uint8Array) => {
    chunks.push(value);
    offset += value.length;
  };

  pushString("%PDF-1.4\n");

  offsets[1] = offset;
  pushString("1 0 obj\n<< /Type /Pages /Kids [2 0 R] /Count 1 >>\nendobj\n");

  offsets[2] = offset;
  pushString(
    `2 0 obj\n<< /Type /Page /Parent 1 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 3 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 4 0 R >>\nendobj\n`,
  );

  offsets[3] = offset;
  pushString(
    `3 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
  );
  pushBinary(imageBytes);
  pushString("\nendstream\nendobj\n");

  const contentStream = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentLength = encoder.encode(contentStream).length;

  offsets[4] = offset;
  pushString(`4 0 obj\n<< /Length ${contentLength} >>\nstream\n${contentStream}endstream\nendobj\n`);

  offsets[5] = offset;
  pushString("5 0 obj\n<< /Type /Catalog /Pages 1 0 R >>\nendobj\n");

  const xrefOffset = offset;
  pushString("xref\n0 6\n0000000000 65535 f \n");
  for (let i = 1; i <= 5; i += 1) {
    const position = offsets[i] ?? 0;
    pushString(`${position.toString().padStart(10, "0")} 00000 n \n`);
  }
  pushString(`trailer\n<< /Size 6 /Root 5 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const buffer = new Uint8Array(totalLength);
  let cursor = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, cursor);
    cursor += chunk.length;
  }

  return buffer;
}
