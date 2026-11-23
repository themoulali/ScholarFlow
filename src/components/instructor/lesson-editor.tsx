
"use client";

import { useEffect, useRef, useState } from "react";
import { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Youtube from "@tiptap/extension-youtube";

type LessonEditorProps = {
  lessonId?: string;
  content?: string;
  onChange?: (markdown: string, contentJson: JSONContent) => void;
  editable?: boolean;
};

export default function LessonEditor({
  lessonId,
  content = "",
  onChange,
  editable = true,
}: LessonEditorProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(lessonId));
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable,
      extensions: [
        StarterKit,
        Markdown,
        Youtube.configure({
          controls: true,
          nocookie: true,
          modestBranding: true,
          width: 640,
          height: 360,
        }),
      ],
      content: "",
      onUpdate: ({ editor }) => {
        const markdown = editor.getMarkdown();
        const contentJson = editor.getJSON();

        setIsDirty(true);
        setStatusMessage("");

        onChangeRef.current?.(markdown, contentJson);
      },
    },
    []
  );

  useEffect(() => {
    if (!editor) return;

    let cancelled = false;

    async function loadLessonContent(currentEditor: NonNullable<typeof editor>) {
      if (!lessonId) {
        currentEditor.commands.setContent(content, {
          contentType: "markdown",
          emitUpdate: false,
        });

        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setStatusMessage("");

      try {
        const response = await fetch(
          `/api/lessons/${encodeURIComponent(lessonId)}/content`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load lesson content."
          );
        }

        if (cancelled) return;

        if (data.content?.contentJson) {
          currentEditor.commands.setContent(
            data.content.contentJson as JSONContent,
            { emitUpdate: false }
          );
        } else if (content) {
          currentEditor.commands.setContent(content, {
            contentType: "markdown",
            emitUpdate: false,
          });
        } else {
          currentEditor.commands.clearContent();
        }

        setIsDirty(false);
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(
            error instanceof Error
              ? error.message
              : "Unable to load lesson content."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadLessonContent(editor);

    return () => {
      cancelled = true;
    };
  }, [editor, lessonId, content]);

  // Keep the editor's editability synchronized with its prop.
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Save both TipTap JSON and Markdown.
  async function saveLessonContent() {
    if (!editor || !lessonId || isSaving || !editable) return;

    setIsSaving(true);
    setStatusMessage("");

    try {
      const response = await fetch(
        `/api/lessons/${encodeURIComponent(lessonId)}/content`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contentJson: editor.getJSON(),
            markdown: editor.getMarkdown(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save lesson content."
        );
      }

      setIsDirty(false);
      setStatusMessage("Lesson content saved successfully!");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to save lesson content."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function addYoutubeVideo() {
    if (!editor) return;

    const url = youtubeUrl.trim();

    if (!url) return;

    try {
      const parsedUrl = new URL(url);

      if (
        ![
          "youtube.com",
          "www.youtube.com",
          "youtu.be",
          "www.youtube-nocookie.com",
        ].includes(parsedUrl.hostname)
      ) {
        setStatusMessage("Please enter a valid YouTube URL.");
        return;
      }

      editor.commands.setYoutubeVideo({
        src: url,
      });

      setYoutubeUrl("");
      setStatusMessage("");
    } catch {
      setStatusMessage("Please enter a valid YouTube URL.");
    }
  }

  const toolbarButton =
    "rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40";

  if (!editor || isLoading) {
    return (
      <div className="rounded-lg border p-6 text-sm text-gray-500">
        {isLoading
          ? "Loading lesson content..."
          : "Loading lesson editor..."}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 border-b bg-gray-50 p-3">
        <button
          type="button"
          className={toolbarButton}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>

        <button
          type="button"
          className={`${toolbarButton} italic`}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>

        <button
          type="button"
          className={`${toolbarButton} underline`}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          Underline
        </button>

        <button
          type="button"
          className={toolbarButton}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          H1
        </button>

        <button
          type="button"
          className={toolbarButton}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </button>

        <button
          type="button"
          className={toolbarButton}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          H3
        </button>

        <button
          type="button"
          className={toolbarButton}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Bullet List
        </button>

        <button
          type="button"
          className={toolbarButton}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          Numbered List
        </button>

        <button
          type="button"
          className={toolbarButton}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </button>

        <button
          type="button"
          className={toolbarButton}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          Code Block
        </button>

        <button
          type="button"
          className={toolbarButton}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          Divider
        </button>

        <button
          type="button"
          className={toolbarButton}
          onClick={() => editor.chain().focus().undo().run()}
        >
          Undo
        </button>

        <button
          type="button"
          className={toolbarButton}
          onClick={() => editor.chain().focus().redo().run()}
        >
          Redo
        </button>
      </div>

      <div className="flex flex-col gap-2 border-b bg-gray-50 p-3 sm:flex-row">
        <input
          type="url"
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
          placeholder="Paste YouTube video URL..."
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={addYoutubeVideo}
          disabled={!youtubeUrl.trim() || !editable}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add YouTube Video
        </button>
      </div>

      <EditorContent
        editor={editor}
        className="min-h-[350px] p-5 text-gray-800 [&_.tiptap]:min-h-[310px] [&_.tiptap]:outline-none [&_.tiptap_h1]:my-4 [&_.tiptap_h1]:text-3xl [&_.tiptap_h1]:font-bold [&_.tiptap_h2]:my-3 [&_.tiptap_h2]:text-2xl [&_.tiptap_h2]:font-semibold [&_.tiptap_h3]:my-3 [&_.tiptap_h3]:text-xl [&_.tiptap_h3]:font-semibold [&_.tiptap_p]:my-3 [&_.tiptap_ul]:my-3 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6 [&_.tiptap_ol]:my-3 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6 [&_.tiptap_blockquote]:my-4 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-blue-400 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:italic [&_.tiptap_pre]:my-4 [&_.tiptap_pre]:overflow-x-auto [&_.tiptap_pre]:rounded-lg [&_.tiptap_pre]:bg-gray-900 [&_.tiptap_pre]:p-4 [&_.tiptap_pre]:text-white [&_.tiptap_hr]:my-6 [&_.tiptap_hr]:border-gray-300 [&_.tiptap_iframe]:my-5 [&_.tiptap_iframe]:max-w-full"
      />

      <div className="flex flex-col gap-3 border-t bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">
            {editable ? "Lesson editor" : "Read-only mode"}
          </span>

          <span className="text-xs text-gray-500">
            Markdown supported
          </span>

          {statusMessage && (
            <span
              role="status"
              className="text-xs text-blue-700"
            >
              {statusMessage}
            </span>
          )}

          {isDirty && (
            <span className="text-xs text-amber-600">
              Unsaved changes
            </span>
          )}
        </div>

        {lessonId && editable && (
          <button
            type="button"
            onClick={saveLessonContent}
            disabled={isSaving || !isDirty}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Lesson"}
          </button>
        )}
      </div>
    </div>
  );
}