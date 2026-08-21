"use client";

import QrScanner from "qr-scanner";
import { useEffect, useRef, useState } from "react";
import { trafficQrValues, type TrafficQrSignal } from "./trafficQrValues";

const signalByQr = Object.fromEntries(
  Object.entries(trafficQrValues).map(([signal, value]) => [value, signal]),
) as Record<string, TrafficQrSignal>;

export default function TrafficQrScanner({
  scanKey,
  disabled,
  onSignal,
}: {
  scanKey: number;
  disabled: boolean;
  onSignal: (signal: TrafficQrSignal) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const lastValueRef = useRef("");
  const disabledRef = useRef(disabled);
  const onSignalRef = useRef(onSignal);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("카메라를 켜고 초록·노랑·빨강 QR카드 중 하나를 비춰보세요.");

  useEffect(() => {
    lastValueRef.current = "";
  }, [scanKey]);

  useEffect(() => {
    disabledRef.current = disabled;
    onSignalRef.current = onSignal;
  }, [disabled, onSignal]);

  useEffect(() => {
    if (!videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        const value = result.data.trim().toUpperCase();
        const signal = signalByQr[value];

        if (!signal) {
          setMessage("신호등 게임용 QR카드가 아니에요. 초록·노랑·빨강 카드를 비춰주세요.");
          return;
        }
        if (disabledRef.current || value === lastValueRef.current) return;

        lastValueRef.current = value;
        setMessage(`${signal === "green" ? "초록" : signal === "yellow" ? "노랑" : "빨강"} QR을 읽었어요!`);
        onSignalRef.current(signal);
      },
      {
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
      },
    );

    scannerRef.current = scanner;
    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, []);

  async function startCamera() {
    try {
      await scannerRef.current?.start();
      setActive(true);
      setMessage("QR카드를 네모 안에 크게 비춰주세요.");
    } catch {
      setActive(false);
      setMessage("카메라를 열 수 없어요. 브라우저의 카메라 권한을 허용한 뒤 다시 눌러주세요.");
    }
  }

  function stopCamera() {
    scannerRef.current?.stop();
    setActive(false);
    setMessage("카메라가 꺼졌어요.");
  }

  return (
    <section className={`traffic-qr-scanner ${active ? "active" : ""}`} aria-label="신호등 QR카드 스캐너">
      <div className="traffic-qr-camera">
        <video ref={videoRef} muted playsInline aria-label="QR카드 촬영 화면" />
        {!active && <div className="traffic-qr-camera-off"><span aria-hidden="true">▣</span><strong>QR 카메라</strong></div>}
      </div>
      <div className="traffic-qr-controls">
        <strong>{message}</strong>
        <button type="button" onClick={active ? stopCamera : startCamera}>
          {active ? "카메라 끄기" : "카메라 켜기"}
        </button>
      </div>
    </section>
  );
}
