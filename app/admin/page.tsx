import { requireAdminApi } from "../access";
import { requireChatGPTUser } from "../chatgpt-auth";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireChatGPTUser("/admin");
  const admin = await requireAdminApi();

  if (!admin) {
    return (
      <main className="portal-main">
        <section className="portal-card portal-empty">
          <span className="portal-badge">관리자 전용</span>
          <h1>접근 권한이 없습니다</h1>
          <p>이 사이트의 관리자 계정으로 다시 로그인해 주세요.</p>
          <a className="portal-link" href="/">머니놀이터로 돌아가기</a>
        </section>
      </main>
    );
  }

  return <AdminDashboard displayName={admin.displayName} />;
}
