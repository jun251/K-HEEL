"use client";

export default function PrintQrButton() {
  return <button className="traffic-qr-print" type="button" onClick={() => window.print()}>QR카드 인쇄하기</button>;
}
