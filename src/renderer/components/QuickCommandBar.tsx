import React, { useRef, useState } from 'react';
import { GripVertical, Plus, Settings, Trash2, X } from 'lucide-react';
import { Translations } from '../../shared/i18n';
import { QuickCommandItem } from '../../shared/types';

interface QuickCommandBarProps {
  t: Translations;
  commands: QuickCommandItem[];
  fontFamily: string;
  fontSize: number;
  onExecute: (item: QuickCommandItem) => void;
  onSaveCommands: (nextCommands: QuickCommandItem[]) => Promise<void>;
  onClose: () => void;
}

function computeIdealSize(commands: QuickCommandItem[], fontSize: number): {
  width: number;
  height: number;
} {
  const maxLabelLen = commands.reduce(
    (max, item) => Math.max(max, (item.label || item.command).length),
    10,
  );
  const width = Math.min(380, Math.max(230, maxLabelLen * (fontSize * 0.65) + 64));
  const rowHeight = Math.max(30, fontSize + 20);
  const idealHeight = 46 + commands.length * rowHeight + Math.max(0, commands.length - 1) * 6 + 14;
  const maxAllowedHeight = typeof window !== 'undefined' ? window.innerHeight * 0.65 : 500;
  return {
    width: Math.round(width),
    height: Math.round(Math.min(maxAllowedHeight, Math.max(88, idealHeight))),
  };
}

export const QuickCommandBar: React.FC<QuickCommandBarProps> = ({
  t,
  commands,
  fontFamily,
  fontSize,
  onExecute,
  onSaveCommands,
  onClose,
}) => {
  const barRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>(() =>
    computeIdealSize(commands, fontSize),
  );
  const [pos, setPos] = useState<{ top: number; left: number }>(() => {
    const initial = computeIdealSize(commands, fontSize);
    return {
      top: 46,
      left: Math.max(16, window.innerWidth - initial.width - 18),
    };
  });
  const [hasManualResize, setHasManualResize] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<QuickCommandItem[]>([]);

  React.useEffect(() => {
    if (!hasManualResize) {
      setSize(computeIdealSize(commands, fontSize));
    }
  }, [commands, fontSize, hasManualResize]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialTop = pos.top;
    const initialLeft = pos.left;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setPos({
        top: Math.max(40, Math.min(window.innerHeight - 60, initialTop + dy)),
        left: Math.max(8, Math.min(window.innerWidth - 180, initialLeft + dx)),
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHasManualResize(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const initialW = size.width;
    const initialH = size.height;

    const onMove = (ev: MouseEvent) => {
      setSize({
        width: Math.max(180, Math.min(window.innerWidth * 0.9, initialW + (ev.clientX - startX))),
        height: Math.max(76, Math.min(window.innerHeight * 0.75, initialH + (ev.clientY - startY))),
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const openEditor = () => {
    setDraft(JSON.parse(JSON.stringify(commands)) as QuickCommandItem[]);
    setIsEditing(true);
  };

  const addDraftItem = () => {
    setDraft((prev) => [
      ...prev,
      {
        id: `qc-${Date.now().toString(36)}`,
        label: 'ls -la',
        command: 'ls -la',
        appendNewline: true,
      },
    ]);
  };

  const updateDraftItem = (id: string, patch: Partial<QuickCommandItem>) => {
    setDraft((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const removeDraftItem = (id: string) => {
    setDraft((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    const cleaned = draft
      .filter((item) => item.command.trim() !== '')
      .map((item) => ({
        ...item,
        label: item.label.trim() || item.command.trim(),
      }));
    await onSaveCommands(cleaned);
    setIsEditing(false);
  };

  return (
    <>
      <div
        ref={barRef}
        className="quick-bar-floating"
        style={{ top: pos.top, left: pos.left, width: size.width, height: size.height }}
      >
        <div className="quick-bar-header">
          <span
            className="quick-bar-grip"
            onMouseDown={startDrag}
            title={t.quickBar.dragTitle}
          >
            <GripVertical size={17} />
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              className="icon-btn"
              onClick={openEditor}
              title={t.quickBar.editTitle}
            >
              <Settings size={14} />
            </button>
            <button
              className="icon-btn danger"
              onClick={onClose}
              title={t.quickBar.closeTitle}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <div className="quick-bar-buttons">
          {commands.map((item) => (
            <button
              key={item.id}
              className="quick-cmd-btn"
              style={{ fontFamily, fontSize }}
              onClick={() => onExecute(item)}
              title={item.command}
            >
              {item.label || item.command}
            </button>
          ))}
        </div>

        <div className="quick-bar-resizer" onMouseDown={startResize} />
      </div>

      {isEditing && (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            style={{ width: 640 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{t.quickBar.editorTitle}</h2>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn primary" onClick={addDraftItem}>
                  <Plus size={14} /> {t.quickBar.addBtn}
                </button>
              </div>

              {draft.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 1fr auto auto',
                    gap: 8,
                    alignItems: 'center',
                    padding: 8,
                    borderRadius: 6,
                    border: '1px solid var(--nt-border-color)',
                    background: 'var(--nt-window-bg)',
                  }}
                >
                  <input
                    value={item.label}
                    onChange={(e) =>
                      updateDraftItem(item.id, { label: e.target.value })
                    }
                    placeholder={t.quickBar.labelPlaceholder}
                  />
                  <textarea
                    rows={3}
                    value={item.command}
                    onChange={(e) =>
                      updateDraftItem(item.id, { command: e.target.value })
                    }
                    placeholder={t.quickBar.commandPlaceholder}
                    style={{
                      resize: 'vertical',
                      fontFamily: 'monospace',
                      fontSize: 12,
                      padding: '6px 8px',
                      background: 'var(--nt-surface-bg)',
                      color: 'var(--nt-text-primary)',
                      border: '1px solid var(--nt-border-color)',
                      borderRadius: 5,
                    }}
                  />
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.appendNewline}
                      onChange={(e) =>
                        updateDraftItem(item.id, {
                          appendNewline: e.target.checked,
                        })
                      }
                    />
                    {t.quickBar.autoEnter}
                  </label>
                  <button
                    className="btn danger"
                    onClick={() => removeDraftItem(item.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setIsEditing(false)}>
                {t.quickBar.cancelBtn}
              </button>
              <button className="btn primary" onClick={() => void handleSave()}>
                {t.quickBar.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
