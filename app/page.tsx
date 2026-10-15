"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { authors, currentUser, seedPosts, type Author, type Post } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/AuthModal";
import { ArrowLeft, Bell, BookOpen, ChevronRight, Eye, Heart, MessageCircle, MoreHorizontal, PenLine, Plus, Search, Sparkles, User, Users, X } from "lucide-react";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });
const categories = ["전체", "디자인", "개발", "커리어", "라이프", "여행"];
type Tab = "home" | "following" | "mine";

const plainText = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const compact = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}천` : String(value);

export default function Home() {
  const [posts, setPosts] = useState<Post[]>(seedPosts);
  const [people, setPeople] = useState(authors);
  const [following, setFollowing] = useState<string[]>(["a1", "a3"]);
  const [liked, setLiked] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>("home");
  const [category, setCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState("라이프");
  const [draftContent, setDraftContent] = useState("");
  const [comment, setComment] = useState("");
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [me, setMe] = useState<Author | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getAuthor = (id: string) => people.find((author) => author.id === id) ?? (id === me?.id ? me : currentUser);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("moi-blog-state");
      if (saved) {
        const value = JSON.parse(saved);
        if (value.posts) setPosts(value.posts);
        if (value.following) setFollowing(value.following);
        if (value.liked) setLiked(value.liked);
      }
    } catch { /* keep seed data */ }
    setReady(true);
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "error") {
      setAuthMessage("구글 로그인에 실패했어요. 잠시 후 다시 시도해주세요.");
      setAuthOpen(true);
      params.delete("auth");
      const query = params.toString();
      window.history.replaceState(null, "", query ? `/?${query}` : "/");
    }
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const sync = async () => {
      const { data: authData } = await client.auth.getUser();
      const user = authData.user;
      const signedInId = user?.id ?? null;
      setUserId(signedInId);
      let mePerson: Author | null = null;
      if (user) {
        const { data: row } = await client.from("profiles").select("id,username,display_name,bio").eq("id", user.id).maybeSingle();
        const meta = user.user_metadata ?? {};
        const name = row?.display_name || meta.display_name || meta.full_name || meta.name || user.email?.split("@")[0] || "나";
        mePerson = { id: user.id, name, handle: row?.username ?? "", bio: row?.bio ?? "", avatar: name.slice(0, 1), color: "#3182f6" };
        const { data: followRows, error: followError } = await client.from("follows").select("following_id").eq("follower_id", user.id);
        if (!followError && followRows) {
          const remoteIds = followRows.map((item) => item.following_id);
          setFollowing((current) => {
            const demoIds = current.filter((id) => !/^[0-9a-f-]{36}$/i.test(id));
            return [...new Set([...remoteIds, ...demoIds])];
          });
        }
      }
      setMe(mePerson);
      const { data, error } = await client.from("posts").select("id,author_id,title,excerpt,content_html,category,cover_style,view_count,published_at,profiles!posts_author_id_fkey(id,username,display_name,bio,avatar_url),comments(id,body,created_at,profiles!comments_author_id_fkey(display_name)),likes(user_id)").order("published_at", { ascending: false });
      if (!error && data?.length) {
        const foundPeople = new Map(authors.map((person) => [person.id, person]));
        if (mePerson) foundPeople.set(mePerson.id, mePerson);
        const remotePosts: Post[] = data.map((row: any) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          if (profile) foundPeople.set(profile.id, { id: profile.id, name: profile.display_name, handle: profile.username, bio: profile.bio ?? "", avatar: profile.display_name?.slice(0, 1) ?? "?", color: "#3182f6" });
          return { id: row.id, authorId: row.author_id, title: row.title, excerpt: row.excerpt, content: row.content_html, category: row.category, cover: row.cover_style, createdAt: new Date(row.published_at).toLocaleDateString("ko-KR"), readTime: Math.max(1, Math.ceil(plainText(row.content_html).length / 450)), likes: row.likes?.length ?? 0, views: Number(row.view_count), comments: (row.comments ?? []).map((item: any) => ({ id: item.id, author: item.profiles?.display_name ?? "독자", avatar: (item.profiles?.display_name ?? "독").slice(0, 1), body: item.body, createdAt: new Date(item.created_at).toLocaleDateString("ko-KR") })) };
        });
        setPeople([...foundPeople.values()]);
        setPosts(remotePosts);
        setLiked(data.filter((row: any) => row.likes?.some((like: any) => like.user_id === signedInId)).map((row: any) => row.id));
      } else if (mePerson) {
        const person = mePerson;
        setPeople((items) => items.some((item) => item.id === person.id) ? items.map((item) => item.id === person.id ? person : item) : [...items, person]);
      }
    };
    sync();
    const { data: listener } = client.auth.onAuthStateChange(() => { sync(); });
    return () => listener.subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("moi-blog-state", JSON.stringify({ posts, following, liked }));
  }, [posts, following, liked, ready]);

  const selected = posts.find((post) => post.id === selectedId) ?? null;
  const filteredPosts = useMemo(() => posts.filter((post) => {
    const author = getAuthor(post.authorId);
    const tabMatch = tab === "home" || (tab === "following" ? following.includes(post.authorId) : Boolean(userId) && post.authorId === userId);
    const categoryMatch = category === "전체" || post.category === category;
    const searchMatch = !query.trim() || `${post.title} ${post.excerpt} ${author.name}`.toLowerCase().includes(query.toLowerCase());
    return tabMatch && categoryMatch && searchMatch;
  }), [posts, tab, following, category, query, userId, people]);

  const openPost = (id: string) => {
    setPosts((items) => items.map((item) => item.id === id ? { ...item, views: item.views + 1 } : item));
    setSelectedId(id);
    if (supabase && /^[0-9a-f-]{36}$/i.test(id)) supabase.rpc("increment_post_views", { post_uuid: id });
    setComment("");
    document.body.classList.add("modal-open");
  };

  const closeModal = () => {
    setSelectedId(null);
    setEditorOpen(false);
    setPendingDelete(false);
    setDeleting(false);
    document.body.classList.remove("modal-open");
  };

  const deletePost = async () => {
    if (!selected || selected.authorId !== userId || deleting) return;
    const id = selected.id;
    setDeleting(true);
    if (supabase && /^[0-9a-f-]{36}$/i.test(id)) {
      const { error } = await supabase.from("posts").delete().eq("id", id).eq("author_id", userId);
      if (error) { setDeleting(false); return; }
    }
    setPosts((items) => items.filter((item) => item.id !== id));
    setLiked((items) => items.filter((item) => item !== id));
    closeModal();
  };

  const toggleLike = (id: string) => {
    if (!userId) { setAuthOpen(true); return; }
    const isLiked = liked.includes(id);
    setLiked((items) => isLiked ? items.filter((item) => item !== id) : [...items, id]);
    setPosts((items) => items.map((item) => item.id === id ? { ...item, likes: Math.max(0, item.likes + (isLiked ? -1 : 1)) } : item));
    if (supabase && /^[0-9a-f-]{36}$/i.test(id)) {
      if (isLiked) supabase.from("likes").delete().eq("user_id", userId).eq("post_id", id);
      else supabase.from("likes").insert({ user_id: userId, post_id: id });
    }
  };

  const toggleFollow = async (id: string) => {
    if (!userId) { setAuthOpen(true); return; }
    const isFollowing = following.includes(id);
    const next = isFollowing ? following.filter((item) => item !== id) : [...following, id];
    setFollowing(next);
    if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) return;
    const result = isFollowing
      ? await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", id)
      : await supabase.from("follows").insert({ follower_id: userId, following_id: id });
    if (result.error) setFollowing(following);
  };

  const startWriting = (post?: Post) => {
    if (!userId) { setAuthOpen(true); return; }
    setPendingDelete(false);
    setEditingId(post?.id ?? null);
    setDraftTitle(post?.title ?? "");
    setDraftCategory(post?.category ?? "라이프");
    setDraftContent(post?.content ?? "");
    setSelectedId(null);
    setEditorOpen(true);
    document.body.classList.add("modal-open");
  };

  const savePost = async () => {
    if (!draftTitle.trim() || !plainText(draftContent)) return;
    if (editingId) {
      setPosts((items) => items.map((item) => item.id === editingId ? { ...item, title: draftTitle.trim(), category: draftCategory, content: draftContent, excerpt: plainText(draftContent).slice(0, 110) } : item));
      if (supabase && /^[0-9a-f-]{36}$/i.test(editingId)) await supabase.from("posts").update({ title: draftTitle.trim(), category: draftCategory, content_html: draftContent, excerpt: plainText(draftContent).slice(0, 110), updated_at: new Date().toISOString() }).eq("id", editingId).eq("author_id", userId!);
    } else {
      const cover = ["blue", "violet", "mint", "coral"][posts.length % 4];
      const payload = { author_id: userId!, title: draftTitle.trim(), category: draftCategory, content_html: draftContent, excerpt: plainText(draftContent).slice(0, 110), cover_style: cover };
      const { data } = supabase ? await supabase.from("posts").insert(payload).select("id").single() : { data: null };
      const post: Post = { id: data?.id ?? `post-${Date.now()}`, authorId: userId!, title: draftTitle.trim(), category: draftCategory, content: draftContent, excerpt: payload.excerpt, cover, createdAt: "방금 전", readTime: Math.max(1, Math.ceil(plainText(draftContent).length / 450)), likes: 0, views: 0, comments: [] };
      setPosts((items) => [post, ...items]);
      setTab("mine");
    }
    closeModal();
  };

  const addComment = async () => {
    if (!selected || !comment.trim()) return;
    if (!userId) { setAuthOpen(true); return; }
    setPosts((items) => items.map((item) => item.id === selected.id ? { ...item, comments: [...item.comments, { id: `comment-${Date.now()}`, author: me?.name ?? "나", avatar: me?.avatar ?? "나", body: comment.trim(), createdAt: "방금 전" }] } : item));
    setComment("");
    if (supabase && /^[0-9a-f-]{36}$/i.test(selected.id)) await supabase.from("comments").insert({ post_id: selected.id, author_id: userId, body: comment.trim() });
  };

  return (
    <main>
      <header className="topbar">
        <div className="nav-wrap">
          <button className="brand" onClick={() => { setTab("home"); setCategory("전체"); }} aria-label="MOI 홈">moi<span>.</span></button>
          <nav>
            <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}>홈</button>
            <button className={tab === "following" ? "active" : ""} onClick={() => setTab("following")}>팔로잉</button>
            <button className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>내 블로그</button>
          </nav>
          <div className="nav-actions">
            <div className={`search-box ${searchOpen ? "open" : ""}`}>
              {searchOpen && <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="글과 작가 검색" />}
              <button aria-label="검색" onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setQuery(""); }}><Search size={20} /></button>
            </div>
            <button className="icon-button notification" aria-label="알림"><Bell size={20} /><i /></button>
            <button className="write-button" onClick={() => startWriting()}><PenLine size={18} />글쓰기</button>
            <button className="avatar me" onClick={() => userId ? setTab("mine") : setAuthOpen(true)} aria-label={userId ? "내 프로필" : "로그인"}>{me?.avatar ?? <User size={18} />}</button>
          </div>
        </div>
      </header>

      {tab === "home" && !query && (
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={15} /> 오늘의 영감</span>
            <h1>나다운 이야기가<br />모이는 곳</h1>
            <p>좋아하는 것을 쓰고, 새로운 관점을 만나보세요.</p>
            <button onClick={() => startWriting()}>첫 이야기 쓰기 <ChevronRight size={18} /></button>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orb one" /><div className="orb two" />
            <div className="floating-card card-a"><span>“</span><p>좋은 생각은<br />기록할 때 선명해져요.</p></div>
            <div className="floating-card card-b"><Heart size={21} fill="currentColor" /><b>2,841</b><small>오늘의 공감</small></div>
            <div className="pen-shape"><i /></div>
          </div>
        </section>
      )}

      <div className="page-grid">
        <section className="feed">
          <div className="feed-heading">
            <div><p>{tab === "home" ? "Discover" : tab === "following" ? "Following" : "My stories"}</p><h2>{tab === "home" ? "오늘의 추천 이야기" : tab === "following" ? "팔로우한 작가의 이야기" : "내가 쓴 이야기"}</h2></div>
            <span>{filteredPosts.length}개의 글</span>
          </div>
          <div className="category-tabs">
            {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? "active" : ""}>{item}</button>)}
          </div>
          {filteredPosts.length > 0 ? <div className="post-list">
            {filteredPosts.map((post) => {
              const author = getAuthor(post.authorId);
              return <article className="post-card" key={post.id} onClick={() => openPost(post.id)}>
                <div className={`cover ${post.cover}`}><span>{post.category}</span><div className="cover-mark">m</div></div>
                <div className="post-copy">
                  <div className="author-line"><span className="avatar mini" style={{ background: author.color }}>{author.avatar}</span><b>{author.name}</b><span>·</span><span>{post.createdAt}</span></div>
                  <h3>{post.title}</h3><p>{post.excerpt}</p>
                  <div className="metrics"><span><Eye size={16} />{compact(post.views)}</span><button className={liked.includes(post.id) ? "liked" : ""} onClick={(event) => { event.stopPropagation(); toggleLike(post.id); }}><Heart size={16} fill={liked.includes(post.id) ? "currentColor" : "none"} />{compact(post.likes)}</button><span><MessageCircle size={16} />{post.comments.length}</span><em>{post.readTime}분 읽기</em></div>
                </div>
              </article>;
            })}
          </div> : <div className="empty-state"><BookOpen size={30} /><h3>아직 이야기가 없어요</h3><p>{tab === "following" ? "마음에 드는 작가를 팔로우해보세요." : "새로운 이야기를 가장 먼저 들려주세요."}</p>{tab === "mine" && <button onClick={() => startWriting()}>글 쓰기</button>}</div>}
        </section>

        <aside>
          <div className="aside-title"><div><Users size={18} /><b>주목할 작가</b></div><button>더보기</button></div>
          <div className="creator-list">
            {authors.filter((author) => author.id !== "me").map((author) => <div className="creator" key={author.id}>
              <span className="avatar creator-avatar" style={{ background: author.color }}>{author.avatar}</span><div><b>{author.name}</b><p>{author.bio}</p></div><button className={following.includes(author.id) ? "following" : ""} onClick={() => toggleFollow(author.id)}>{following.includes(author.id) ? "팔로잉" : "팔로우"}</button>
            </div>)}
          </div>
          <div className="weekly-card"><span>WEEKLY</span><h3>이번 주, 사람들이<br />가장 많이 읽은 이야기</h3><p>읽을수록 생각이 넓어지는 글 10편을 모았어요.</p><button onClick={() => openPost("p1")}>컬렉션 보기 <ChevronRight size={16} /></button></div>
        </aside>
      </div>

      <button className="mobile-write" onClick={() => startWriting()} aria-label="새 글 쓰기"><Plus size={25} /></button>

      {selected && <div className="modal-layer article-layer">
        <div className="modal-top"><button onClick={closeModal}><ArrowLeft size={21} />돌아가기</button><div>{selected.authorId === userId && <><button className="edit-link" onClick={() => startWriting(selected)}>수정하기</button><button className="delete-link" onClick={() => setPendingDelete(true)}>삭제</button></>}<button className="icon-button"><MoreHorizontal size={21} /></button></div></div>
        <article className="article-view">
          <span className="article-category">{selected.category}</span><h1>{selected.title}</h1><p className="article-excerpt">{selected.excerpt}</p>
          <div className="article-author"><span className="avatar" style={{ background: getAuthor(selected.authorId).color }}>{getAuthor(selected.authorId).avatar}</span><div><b>{getAuthor(selected.authorId).name}</b><p>{selected.createdAt} · {selected.readTime}분 읽기</p></div>{selected.authorId !== userId && <button className={following.includes(selected.authorId) ? "following" : ""} onClick={() => toggleFollow(selected.authorId)}>{following.includes(selected.authorId) ? "팔로잉" : "팔로우"}</button>}</div>
          <div className={`article-cover cover ${selected.cover}`}><span>moi journal</span><div className="cover-mark">m</div></div>
          <div className="article-body" dangerouslySetInnerHTML={{ __html: selected.content }} />
          <div className="article-reactions"><button className={liked.includes(selected.id) ? "liked" : ""} onClick={() => toggleLike(selected.id)}><Heart size={21} fill={liked.includes(selected.id) ? "currentColor" : "none"} />좋아요 {selected.likes}</button><span><Eye size={19} />{selected.views}명이 읽었어요</span></div>
          <section className="comments"><h2>댓글 <span>{selected.comments.length}</span></h2><div className="comment-write"><span className="avatar me">{me?.avatar ?? <User size={16} />}</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="따뜻한 댓글을 남겨보세요." /><button disabled={!comment.trim()} onClick={addComment}>등록</button></div>{selected.comments.map((item) => <div className="comment" key={item.id}><span className="avatar mini">{item.avatar}</span><div><b>{item.author}</b><time>{item.createdAt}</time><p>{item.body}</p></div></div>)}</section>
        </article>
      </div>}

      {editorOpen && <div className="modal-layer editor-layer">
        <div className="editor-top"><button onClick={closeModal}><X size={22} /></button><span>{editingId ? "이야기 수정" : "새 이야기"}</span><button className="publish-button" disabled={!draftTitle.trim() || !plainText(draftContent)} onClick={savePost}>{editingId ? "수정 완료" : "발행하기"}</button></div>
        <div className="writing-area"><select value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select><input className="title-input" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="제목을 입력하세요" maxLength={80} /><Editor content={draftContent} onChange={setDraftContent} /><div className="writing-footer"><span>자동 저장됨</span><span>{plainText(draftContent).length}자</span></div></div>
      </div>}
      {pendingDelete && selected && <div className="auth-backdrop" onMouseDown={() => { if (!deleting) setPendingDelete(false); }}>
        <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title" onMouseDown={(event) => event.stopPropagation()}>
          <h2 id="delete-title">글을 삭제할까요?</h2>
          <p>삭제한 글과 댓글은 다시 볼 수 없어요.</p>
          <div className="confirm-actions">
            <button className="cancel" disabled={deleting} onClick={() => setPendingDelete(false)}>취소</button>
            <button className="danger" disabled={deleting} onClick={deletePost}>{deleting ? "삭제 중…" : "삭제"}</button>
          </div>
        </section>
      </div>}
      {authOpen && <AuthModal initialMessage={authMessage} onClose={() => { setAuthOpen(false); setAuthMessage(""); }} />}
    </main>
  );
}
