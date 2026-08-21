import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { trafficQrValues, type TrafficQrSignal } from "../trafficQrValues";
import PrintQrButton from "./PrintQrButton";

export const metadata: Metadata = {
  title: "신호등 소비 게임 QR카드 | 머니놀이터",
};

const cards: Array<{ signal: TrafficQrSignal; colorName: string; label: string }> = [
  { signal: "green", colorName: "초록", label: "꼭 필요한 소비" },
  { signal: "yellow", colorName: "노랑", label: "한 번 더 생각할 소비" },
  { signal: "red", colorName: "빨강", label: "필요하지 않은 충동 소비" },
];

export default async function TrafficQrPage() {
  const qrCards = await Promise.all(cards.map(async (card) => ({
    ...card,
    src: await QRCode.toDataURL(trafficQrValues[card.signal], {
      width: 720,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#17332b", light: "#ffffff" },
    }),
  })));

  return (
    <main className="traffic-qr-page">
      <header className="traffic-qr-page-header">
        <div><span>1·2학년 신호등 소비 게임</span><h1>선택 QR카드</h1><p>아래 3장을 인쇄한 뒤 학생이 게임 화면의 카메라로 찍어 선택합니다.</p></div>
        <div className="traffic-qr-page-actions"><Link href="/">홈으로</Link><PrintQrButton /></div>
      </header>
      <section className="traffic-qr-print-sheet" aria-label="신호등 선택 QR카드 3장">
        {qrCards.map((card) => (
          <article className={`traffic-qr-print-card ${card.signal}`} key={card.signal}>
            <div className="traffic-qr-card-title"><i aria-hidden="true" /><div><span>{card.colorName} 신호</span><strong>{card.label}</strong></div></div>
            <Image src={card.src} width={720} height={720} unoptimized alt={`${card.colorName} 신호 선택 QR코드`} />
            <p>머니놀이터 · 신호등 소비 게임 전용</p>
          </article>
        ))}
      </section>
    </main>
  );
}
