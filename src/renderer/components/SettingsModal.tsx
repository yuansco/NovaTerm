import React, { useMemo, useState } from 'react';
import { Copy, Download, ExternalLink, Plus, Settings, Terminal, Trash2, Upload, X } from 'lucide-react';
import { getTranslations } from '../../shared/i18n';
import { BUILTIN_THEMES } from '../../shared/themes';
import { AppConfig, AppLanguage, KeyMacro, TabState } from '../../shared/types';

interface SettingsModalProps {
  config: AppConfig;
  tabs: TabState[];
  activeTabId: string;
  onSave: (nextConfig: AppConfig) => Promise<void>;
  onExportJson: () => Promise<{ filePath: string } | null>;
  onImportJson: () => Promise<unknown>;
  onClose: () => void;
}

type SettingsTab = 'appearance' | 'macros' | 'autocommands' | 'logging' | 'backup' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  tabs,
  activeTabId,
  onSave,
  onExportJson,
  onImportJson,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [draft, setDraft] = useState<AppConfig>(() =>
    JSON.parse(JSON.stringify(config)) as AppConfig,
  );
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Live preview of selected language inside the modal!
  const t = useMemo(() => getTranslations(draft.language), [draft.language]);
  const allThemes = [...BUILTIN_THEMES, ...draft.customThemes];

  const jsonPreview = useMemo(() => {
    const previewPayload: AppConfig = {
      ...draft,
      sshProfiles: draft.sshProfiles.map((p) => ({
        ...p,
        password: undefined,
        passphrase: undefined,
      })),
      workspaceSnapshot: {
        tabs,
        activeTabId,
      },
    };
    return JSON.stringify(previewPayload, null, 2);
  }, [draft, tabs, activeTabId]);

  const handleSave = async () => {
    await onSave(draft);
    setStatusMessage(t.settingsModal.savedMsg);
    onClose();
  };

  const addMacro = () => {
    const newMacro: KeyMacro = {
      id: `macro-${Date.now().toString(36)}`,
      name: draft.language === 'en' ? 'New Macro' : '新快捷指令',
      shortcut: 'F2',
      command: 'ls -la',
      appendNewline: true,
    };
    setDraft({ ...draft, macros: [...draft.macros, newMacro] });
  };

  const updateMacro = (id: string, patch: Partial<KeyMacro>) => {
    setDraft({
      ...draft,
      macros: draft.macros.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });
  };

  const removeMacro = (id: string) => {
    setDraft({
      ...draft,
      macros: draft.macros.filter((m) => m.id !== id),
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={16} /> {t.settingsModal.title}
          </h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '10px 16px',
            borderBottom: '1px solid var(--nt-border-color)',
            background: 'var(--nt-window-bg)',
            flexWrap: 'wrap',
          }}
        >
          {(
            [
              ['appearance', t.settingsModal.tabs.appearance],
              ['macros', t.settingsModal.tabs.macros],
              ['autocommands', t.settingsModal.tabs.autocommands],
              ['logging', t.settingsModal.tabs.logging],
              ['backup', t.settingsModal.tabs.backup],
              ['about', t.settingsModal.tabs.about],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              className={`btn ${activeTab === id ? 'primary' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {activeTab === 'appearance' && (
            <div className="form-grid">
              <div className="form-field">
                <label>{t.settingsModal.appearance.language}</label>
                <select
                  value={draft.language || 'zh-TW'}
                  onChange={(e) =>
                    setDraft({ ...draft, language: e.target.value as AppLanguage })
                  }
                >
                  <option value="zh-TW">繁體中文 (zh-TW)</option>
                  <option value="en">English (en)</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t.settingsModal.appearance.theme}</label>
                <select
                  value={draft.themeId}
                  onChange={(e) => setDraft({ ...draft, themeId: e.target.value })}
                >
                  {allThemes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>{t.settingsModal.appearance.fontFamily}</label>
                <input
                  value={draft.fontFamily}
                  onChange={(e) => setDraft({ ...draft, fontFamily: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>{t.settingsModal.appearance.fontSize}</label>
                <input
                  type="number"
                  min={10}
                  max={32}
                  value={draft.fontSize}
                  onChange={(e) =>
                    setDraft({ ...draft, fontSize: Number(e.target.value) || 14 })
                  }
                />
              </div>
              <div className="form-field">
                <label>{t.settingsModal.appearance.lineHeight}</label>
                <input
                  type="number"
                  step={0.05}
                  min={1}
                  max={2}
                  value={draft.lineHeight}
                  onChange={(e) =>
                    setDraft({ ...draft, lineHeight: Number(e.target.value) || 1.25 })
                  }
                />
              </div>
              <div className="form-field">
                <label>{t.settingsModal.appearance.scrollback}</label>
                <input
                  type="number"
                  min={500}
                  max={100000}
                  value={draft.scrollback}
                  onChange={(e) =>
                    setDraft({ ...draft, scrollback: Number(e.target.value) || 10000 })
                  }
                />
              </div>
              <div className="form-field full">
                <label>{t.settingsModal.appearance.webgl}</label>
                <select
                  value={draft.useWebGL ? 'true' : 'false'}
                  onChange={(e) =>
                    setDraft({ ...draft, useWebGL: e.target.value === 'true' })
                  }
                >
                  <option value="true">{t.settingsModal.appearance.webglEnabled}</option>
                  <option value="false">{t.settingsModal.appearance.webglDisabled}</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'macros' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--nt-text-secondary)', fontSize: 12 }}>
                  {t.settingsModal.macros.hint}
                </span>
                <button className="btn primary" onClick={addMacro}>
                  <Plus size={14} /> {t.settingsModal.macros.addMacro}
                </button>
              </div>

              {draft.macros.map((macro) => (
                <div
                  key={macro.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '130px 100px 1fr auto auto',
                    gap: 8,
                    alignItems: 'center',
                    padding: 8,
                    borderRadius: 6,
                    border: '1px solid var(--nt-border-color)',
                    background: 'var(--nt-window-bg)',
                  }}
                >
                  <input
                    value={macro.name}
                    onChange={(e) => updateMacro(macro.id, { name: e.target.value })}
                    placeholder={t.settingsModal.macros.namePlaceholder}
                  />
                  <input
                    value={macro.shortcut}
                    onChange={(e) => updateMacro(macro.id, { shortcut: e.target.value })}
                    placeholder={t.settingsModal.macros.shortcutPlaceholder}
                  />
                  <input
                    value={macro.command}
                    onChange={(e) => updateMacro(macro.id, { command: e.target.value })}
                    placeholder={t.settingsModal.macros.commandPlaceholder}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                    <input
                      type="checkbox"
                      checked={macro.appendNewline}
                      onChange={(e) =>
                        updateMacro(macro.id, { appendNewline: e.target.checked })
                      }
                    />
                    {t.settingsModal.macros.appendNewline}
                  </label>
                  <button
                    className="btn danger"
                    onClick={() => removeMacro(macro.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'autocommands' && (
            <div className="form-grid">
              <div className="form-field full">
                <label>{t.settingsModal.autoCommands.localLabel}</label>
                <input
                  value={draft.autoCommands.onNewLocalTab}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      autoCommands: {
                        ...draft.autoCommands,
                        onNewLocalTab: e.target.value,
                      },
                    })
                  }
                  placeholder="fastfetch"
                />
              </div>
              <div className="form-field full">
                <label>{t.settingsModal.autoCommands.sshLabel}</label>
                <input
                  value={draft.autoCommands.onNewSshTab}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      autoCommands: {
                        ...draft.autoCommands,
                        onNewSshTab: e.target.value,
                      },
                    })
                  }
                  placeholder="uname -a"
                />
              </div>
              <div className="form-field">
                <label>{t.settingsModal.autoCommands.delayLabel}</label>
                <input
                  type="number"
                  min={100}
                  max={5000}
                  value={draft.autoCommands.delayMs}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      autoCommands: {
                        ...draft.autoCommands,
                        delayMs: Number(e.target.value) || 350,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {activeTab === 'logging' && (
            <div className="form-grid">
              <div className="form-field">
                <label>{t.settingsModal.logging.autoStart}</label>
                <select
                  value={draft.logQuota.enabled ? 'true' : 'false'}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      logQuota: {
                        ...draft.logQuota,
                        enabled: e.target.value === 'true',
                      },
                    })
                  }
                >
                  <option value="false">{t.settingsModal.logging.autoStartDisabled}</option>
                  <option value="true">{t.settingsModal.logging.autoStartEnabled}</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t.settingsModal.logging.stripAnsi}</label>
                <select
                  value={draft.logQuota.stripAnsi ? 'true' : 'false'}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      logQuota: {
                        ...draft.logQuota,
                        stripAnsi: e.target.value === 'true',
                      },
                    })
                  }
                >
                  <option value="true">{t.settingsModal.logging.stripAnsiYes}</option>
                  <option value="false">{t.settingsModal.logging.stripAnsiNo}</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t.settingsModal.logging.maxSizeMB}</label>
                <input
                  type="number"
                  min={1}
                  max={1024}
                  value={draft.logQuota.maxFileSizeMB}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      logQuota: {
                        ...draft.logQuota,
                        maxFileSizeMB: Number(e.target.value) || 10,
                      },
                    })
                  }
                />
              </div>
              <div className="form-field">
                <label>{t.settingsModal.logging.maxLines}</label>
                <input
                  type="number"
                  min={100}
                  max={10000000}
                  value={draft.logQuota.maxLines}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      logQuota: {
                        ...draft.logQuota,
                        maxLines: Number(e.target.value) || 100000,
                      },
                    })
                  }
                />
              </div>
              <div className="form-field">
                <label>{t.settingsModal.logging.maxRotated}</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={draft.logQuota.maxRotatedFiles}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      logQuota: {
                        ...draft.logQuota,
                        maxRotatedFiles: Number(e.target.value) || 5,
                      },
                    })
                  }
                />
              </div>
              <div className="form-field">
                <label>{t.settingsModal.logging.logDir}</label>
                <input
                  value={draft.logQuota.logDirectory}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      logQuota: {
                        ...draft.logQuota,
                        logDirectory: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, color: 'var(--nt-text-secondary)' }}>
                {t.settingsModal.backup.description}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="btn primary"
                  onClick={() => {
                    void onExportJson().then((res) => {
                      if (res) {
                        setStatusMessage(`${t.settingsModal.backup.exportedMsg}${res.filePath}`);
                      }
                    });
                  }}
                >
                  <Download size={14} /> {t.settingsModal.backup.exportBtn}
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    void onImportJson().then((res) => {
                      if (res) {
                        setStatusMessage(t.settingsModal.backup.importedMsg);
                        onClose();
                      }
                    });
                  }}
                >
                  <Upload size={14} /> {t.settingsModal.backup.importBtn}
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    void navigator.clipboard.writeText(jsonPreview).then(() => {
                      setStatusMessage(t.settingsModal.backup.copiedMsg);
                    });
                  }}
                >
                  <Copy size={14} /> {t.settingsModal.backup.copyBtn}
                </button>
              </div>
              {statusMessage && (
                <div style={{ color: 'var(--nt-success-color)', fontSize: 12 }}>
                  {statusMessage}
                </div>
              )}
              <div className="form-field">
                <label>{t.settingsModal.backup.previewLabel}</label>
                <textarea
                  className="json-preview-box"
                  readOnly
                  value={jsonPreview}
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 8,
                  border: '1px solid var(--nt-border-color)',
                  background: 'var(--nt-window-bg)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'var(--nt-accent-color)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Terminal size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>NovaTerm</div>
                  <div style={{ fontSize: 12, color: 'var(--nt-text-secondary)', marginTop: 2 }}>
                    {t.settingsModal.about.subtitle}
                  </div>
                </div>
              </div>

              <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--nt-text-primary)' }}>
                {t.settingsModal.about.description}
              </p>

              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--nt-border-color)',
                  background: 'var(--nt-window-bg)',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  {t.settingsModal.about.featuresTitle}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: 'var(--nt-text-secondary)' }}>
                  {t.settingsModal.about.features.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={{ fontSize: 12, color: 'var(--nt-text-secondary)' }}>
                {t.settingsModal.about.techStack}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--nt-text-secondary)' }}>
                  {t.settingsModal.about.repoLabel}:
                </span>
                <a
                  href="https://github.com/yuansco/NovaTerm"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    color: 'var(--nt-accent-color)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  https://github.com/yuansco/NovaTerm <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            {t.settingsModal.cancel}
          </button>
          <button className="btn primary" onClick={() => void handleSave()}>
            {t.settingsModal.save}
          </button>
        </div>
      </div>
    </div>
  );
};
