const materialSections = [
  {
    number: "01",
    icon: "✎",
    title: "교사용 수업자료",
    description: "수업 안내서와 진행 자료를 모아 제공할 예정입니다.",
    color: "lime",
  },
  {
    number: "02",
    icon: "▤",
    title: "학생 활동지",
    description: "게임과 함께 활용할 수 있는 활동지가 등록될 예정입니다.",
    color: "yellow",
  },
  {
    number: "03",
    icon: "⌂",
    title: "가정 연계자료",
    description: "가정에서도 경제 이야기를 이어갈 수 있는 자료를 준비 중입니다.",
    color: "blue",
  },
] as const;

export default function MaterialsPage() {
  return (
    <main className="materials-page">
      <header className="topbar materials-topbar">
        <div className="brand">
          <a className="materials-brand-mark" href="/" aria-label="머니놀이터 홈">₩</a>
          <a href="/">머니놀이터</a>
        </div>
        <nav>
          <a className="materials-nav-link active" href="/materials" aria-current="page">교육 자료</a>
          <a href="/#grades">게임 둘러보기</a>
          <a href="/#results">우리 방 결과</a>
          <a className="teacher-login-link materials-home-link" href="/">홈으로</a>
        </nav>
      </header>

      <section className="materials-hero">
        <div>
          <p className="eyebrow">LEARNING MATERIALS</p>
          <h1>경제교육<br /><em>자료실</em></h1>
          <p className="materials-description">
            머니놀이터의 게임과 함께 사용할 수 있는 경제교육 자료를
            한곳에서 확인할 수 있도록 준비하고 있습니다.
          </p>
        </div>
        <div className="materials-hero-note">
          <span>자료실 안내</span>
          <strong>수업에 바로 활용할 자료를<br />차례대로 공개할게요.</strong>
          <p>새로운 자료가 등록되면 이 페이지에서 확인할 수 있습니다.</p>
        </div>
      </section>

      <section className="materials-library" aria-labelledby="materials-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RESOURCE LIBRARY</p>
            <h2 id="materials-heading">교육 자료 모아보기</h2>
          </div>
          <p>자료가 준비되는 대로 각 항목에서 내려받거나 바로 볼 수 있게 됩니다.</p>
        </div>

        <div className="materials-grid">
          {materialSections.map((material) => (
            <article className={`material-card ${material.color}`} key={material.title}>
              <span className="material-number">{material.number}</span>
              <div className="material-icon" aria-hidden="true">{material.icon}</div>
              <span className="material-status">자료 준비 중</span>
              <h3>{material.title}</h3>
              <p>{material.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="materials-footer">
        <div className="brand"><span>₩</span> 머니놀이터</div>
        <p>놀이와 자료로 함께 배우는 어린이 경제교육</p>
        <small>교육 자료는 순차적으로 업데이트됩니다.</small>
      </footer>
    </main>
  );
}
