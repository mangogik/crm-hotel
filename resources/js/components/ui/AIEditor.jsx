import { AiEditor } from "aieditor";
import "aieditor/dist/style.css";
import { forwardRef, useEffect, useRef } from "react";

export default forwardRef(function AIEditor(
    {
        placeholder,
        defaultValue,
        value,
        onChange,
        options = {},
        ...props
    },
    ref
) {
    const divRef = useRef(null);
    const aiEditorRef = useRef(null);

    useEffect(() => {
        if (!divRef.current) return;

        if (!aiEditorRef.current) {
            // Merge konfigurasi AI dari props.options
            const aiOpts = options.ai || {};
            const mergedOptions = {
                ...options,
                ai: {
                    // Aktifkan fitur chat + insert/replace
                    chat: {
                        appendEditorSelectedContentEnable:
                            aiOpts.chat?.appendEditorSelectedContentEnable ?? true,
                        appendEditorSelectedContentProcessor:
                            aiOpts.chat?.appendEditorSelectedContentProcessor,
                    },
                    bubblePanelModel: aiOpts.bubblePanelModel,
                    models: aiOpts.models,
                },
                // Hook untuk hasil AI (Append / Replace)
                onAIResult: (result, mode, editor) => {
                    console.log("AI RESULT HOOK", { result, mode });

                    let text = "";
                    if (typeof result === "string") {
                        text = result;
                    } else if (result && typeof result === "object") {
                        if (typeof result.content === "string") {
                            text = result.content;
                        } else if (typeof result.result === "string") {
                            text = result.result;
                        }
                    }
                    if (!text || !text.trim()) {
                        console.warn("AI RESULT empty, nothing inserted");
                        return;
                    }

                    if (mode === "append") {
                        editor.insertHtml(`<p>${text}</p>`);
                    } else if (mode === "replace") {
                        editor.replaceSelection(text);
                    }

                    if (typeof onChange === "function") {
                        onChange(editor.getHtml());
                    }
                },
            };

            const aiEditor = new AiEditor({
                element: divRef.current,
                placeholder: placeholder,
                content: defaultValue,
                onChange: (ed) => {
                    if (typeof onChange === "function") {
                        onChange(ed.getHtml());
                    }
                },
                ...mergedOptions,
            });

            aiEditorRef.current = aiEditor;
        }

        return () => {
            if (aiEditorRef.current) {
                aiEditorRef.current.destroy();
                aiEditorRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (ref) {
            if (typeof ref === "function") {
                ref(divRef.current);
            } else {
                ref.current = divRef.current;
            }
        }
    }, [ref]);

    useEffect(() => {
        if (
            aiEditorRef.current &&
            value !== aiEditorRef.current.getHtml()
        ) {
            aiEditorRef.current.setContent(value || "");
        }
    }, [value]);

    return <div ref={divRef} {...props} />;
});
