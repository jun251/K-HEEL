"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type GradeBand = "1-2" | "3-4" | "5-6";
type Material = {
  key: string;
  name: string;
  contentType: string;
  size: number;
  gradeBand: GradeBand;
  uploadedAt: string;
};

const sections: Array<{
  gradeBand: GradeBand;
  number: string;
  title: string;
  description: string;
  color: string;
  slideCount: number;
}> = [
  {
    gradeBand: "1-2",
    number: "01",
    title: "1·2학년 자료",
    description: "놀이와 그림으로 경제의 첫 개념을 익히는 저학년용 자료입니다.",
    color: "lime",
    slideCount: 23,
  },
  {
    gradeBand: "3-4",
    number: "02",
    title: "3·4학년 자료",
    description: "생활 속 선택과 돈의 흐름을 알아보는 중학년용 자료입니다.",
    color: "yellow",
    slideCount: 29,
  },
  {
    gradeBand: "5-6",
    number: "03",
    title: "5·6학년 자료",
    description: "합리적 선택과 경제 활동을 깊이 살펴보는 고학년용 자료입니다.",
    color: "blue",
    slideCount: 39,
  },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function MaterialsLibrary() {
  const [materials, setMaterials] = useState<Record<GradeBand, Material[]>>({
    "1-2": [],
    "3-4": [],
    "5-6": [],
  });
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [gradeBand, setGradeBand] = useState<GradeBand>("1-2");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [working, setWorking] = useState(false);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const responses = await Promise.all(
        sections.map(({ gradeBand }) =>
          fetch(`/api/materials?gradeBand=${gradeBand}`, { cache: "no-store" }).then((response) => {
            if (!response.ok) throw new Error("목록을 불러오지 못했습니다.");
            return response.json() as Promise<{ materials: Material[]; canManage: boolean }>;
          }),
        ),
      );
      setMaterials({
        "1-2": responses[0].materials,
        "3-4": responses[1].materials,
        "5-6": responses[2].materials,
      });
      setCanManage(responses.some((response) => response.canManage));
    } catch {
      setStatus("자료 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setWorking(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "관리자 로그인에 실패했습니다.");
      setPassword("");
      setCanManage(true);
      setStatus("관리자 모드가 열렸습니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "관리자 로그인에 실패했습니다.");
    } finally {
      setWorking(false);
    }
  }

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setWorking(true);
    setStatus("파일을 올리는 중입니다…");
    try {
      const form = new FormData();
      form.set("gradeBand", gradeBand);
      form.set("file", file);
      const response = await fetch("/api/materials", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "파일을 올리지 못했습니다.");
      setFile(null);
      const input = document.getElementById("material-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setStatus(`${body.material.name} 파일을 등록했습니다.`);
      await loadMaterials();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "파일을 올리지 못했습니다.");
    } finally {
      setWorking(false);
    }
  }

  async function remove(material: Material) {
    if (!window.confirm(`“${material.name}” 자료를 삭제할까요?`)) return;
    setWorking(true);
    setStatus("");
    try {
      const response = await fetch(`/api/materials?key=${encodeURIComponent(material.key)}`, {
        method: "DELETE",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "자료를 삭제하지 못했습니다.");
      setStatus(`${material.name} 파일을 삭제했습니다.`);
      await loadMaterials();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "자료를 삭제하지 못했습니다.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <div className="materials-grid">
        {sections.map((section) => (
          <article className={`material-card ${section.color}`} key={section.gradeBand}>
            <span className="material-number">{section.number}</span>
            <span className="material-status">{section.title}</span>
            <h3>{section.title}</h3>
            <p>{section.description}</p>
            <a className="material-web-link" href={`/materials/lesson/${section.gradeBand}`}>
              <span>
                <small>PPT 기반 웹 학습</small>
                반응형으로 보기
              </span>
              <strong>{section.slideCount}쪽 <i aria-hidden="true">→</i></strong>
            </a>
            <div className="material-file-list" aria-live="polite">
              {loading ? (
                <p className="material-empty">자료를 불러오는 중입니다…</p>
              ) : materials[section.gradeBand].length === 0 ? (
                <p className="material-empty">아직 등록된 자료가 없습니다.</p>
              ) : (
                materials[section.gradeBand].map((material) => (
                  <div className="material-file-row" key={material.key}>
                    <div>
                      <strong>{material.name}</strong>
                      <small>
                        {formatBytes(material.size)} · {new Date(material.uploadedAt).toLocaleDateString("ko-KR")}
                      </small>
                    </div>
                    <div className="material-file-actions">
                      <a href={`/api/materials/file?key=${encodeURIComponent(material.key)}`}>받기</a>
                      {canManage && (
                        <button type="button" onClick={() => void remove(material)} disabled={working}>
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        ))}
      </div>

      <section className="material-admin-panel">
        <button
          className="material-admin-toggle"
          type="button"
          onClick={() => setAdminOpen((open) => !open)}
          aria-expanded={adminOpen}
        >
          관리자 자료 올리기 <span>{adminOpen ? "−" : "+"}</span>
        </button>
        {adminOpen && (
          <div className="material-admin-body">
            {!canManage ? (
              <form onSubmit={login}>
                <label htmlFor="material-admin-password">관리자 비밀번호</label>
                <div className="material-admin-row">
                  <input
                    id="material-admin-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button type="submit" disabled={working || !password}>
                    {working ? "확인 중…" : "관리자 로그인"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={upload}>
                <div className="material-upload-grid">
                  <label>
                    올릴 학년군
                    <select value={gradeBand} onChange={(event) => setGradeBand(event.target.value as GradeBand)}>
                      <option value="1-2">1·2학년</option>
                      <option value="3-4">3·4학년</option>
                      <option value="5-6">5·6학년</option>
                    </select>
                  </label>
                  <label>
                    교육자료 파일
                    <input
                      id="material-file"
                      type="file"
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.hwp,.hwpx,.txt,.csv,.jpg,.jpeg,.png,.webp"
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      required
                    />
                  </label>
                  <button type="submit" disabled={working || !file}>
                    {working ? "처리 중…" : "선택한 학년군에 올리기"}
                  </button>
                </div>
                <p className="material-upload-help">PDF·한글·문서·프레젠테이션·표·이미지, 파일당 최대 20MB</p>
              </form>
            )}
            {status && <p className="form-status" role="status">{status}</p>}
          </div>
        )}
      </section>
    </>
  );
}
