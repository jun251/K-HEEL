import MaterialsLibrary from "./MaterialsLibrary";

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
          <strong>학년 수준에 맞는 자료를<br />골라서 활용해 보세요.</strong>
          <p>1·2학년, 3·4학년, 5·6학년 자료를 나누어 제공합니다.</p>
        </div>
      </section>

      <section className="materials-library" aria-labelledby="materials-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RESOURCE LIBRARY</p>
            <h2 id="materials-heading">교육 자료 모아보기</h2>
          </div>
          <p>학년군을 확인하고 필요한 파일을 바로 내려받을 수 있습니다.</p>
        </div>

        <MaterialsLibrary />
      </section>

      <footer className="materials-footer">
        <div className="brand"><span>₩</span> 머니놀이터</div>
        <p>놀이와 자료로 함께 배우는 어린이 경제교육</p>
        <small>교육 자료는 학년군별로 업데이트됩니다.</small>
      </footer>
    </main>
  );
}
