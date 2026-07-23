import { requireAdminPage } from "../access";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdminPage();

  if (!admin) {
    return (
      <main className="portal-main">
        <section className="portal-card portal-empty">
          <span className="portal-badge">관리자 전용</span>
          <h1>접근 권한이 없습니다</h1>
          <p>머니놀이터 로고를 세 번 누른 뒤 관리자 비밀번호로 로그인해 주세요.</p>
          <a className="portal-link" href="/">머니놀이터로 돌아가기</a>
        </section>
      </main>
    );
  }

  return <AdminDashboard displayName={admin.displayName} />;
}
