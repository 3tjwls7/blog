"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading2, Quote, List, ListOrdered, Undo2, Redo2 } from "lucide-react";

type Props = { content: string; onChange: (html: string) => void };

export default function Editor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Underline, Placeholder.configure({ placeholder: "당신의 이야기를 들려주세요…" })],
    content,
    immediatelyRender: false,
    editorProps: { attributes: { class: "editor-content" } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return <div className="editor-loading">에디터를 준비하고 있어요…</div>;

  const tools = [
    { label: "굵게", icon: Bold, active: editor.isActive("bold"), action: () => editor.chain().focus().toggleBold().run() },
    { label: "기울임", icon: Italic, active: editor.isActive("italic"), action: () => editor.chain().focus().toggleItalic().run() },
    { label: "밑줄", icon: UnderlineIcon, active: editor.isActive("underline"), action: () => editor.chain().focus().toggleUnderline().run() },
    { label: "취소선", icon: Strikethrough, active: editor.isActive("strike"), action: () => editor.chain().focus().toggleStrike().run() },
    { label: "제목", icon: Heading2, active: editor.isActive("heading", { level: 2 }), action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "인용", icon: Quote, active: editor.isActive("blockquote"), action: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "목록", icon: List, active: editor.isActive("bulletList"), action: () => editor.chain().focus().toggleBulletList().run() },
    { label: "번호 목록", icon: ListOrdered, active: editor.isActive("orderedList"), action: () => editor.chain().focus().toggleOrderedList().run() },
  ];

  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        {tools.map(({ label, icon: Icon, active, action }, index) => (
          <button key={label} type="button" className={active ? "active" : ""} onClick={action} aria-label={label} title={label}>
            <Icon size={18} />
          </button>
        ))}
        <span className="toolbar-separator" />
        <button type="button" onClick={() => editor.chain().focus().undo().run()} aria-label="실행 취소"><Undo2 size={18} /></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} aria-label="다시 실행"><Redo2 size={18} /></button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
