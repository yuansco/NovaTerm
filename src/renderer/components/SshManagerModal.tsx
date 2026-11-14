import React, { useMemo, useState } from 'react';
import { FolderOpen, Play, Plus, Server, Trash2, X } from 'lucide-react';
import { Translations } from '../../shared/i18n';
import { SshAuthType, SshProfile } from '../../shared/types';

interface SshManagerModalProps {
  t: Translations;
  profiles: SshProfile[];
  onConnect: (profile: SshProfile) => void;
  onSaveProfile: (profile: SshProfile) => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
  onClose: () => void;
}

function emptyDraft(defaultCategory: string): SshProfile {
  return {
    id: `ssh-${Date.now().toString(36)}`,
    name: '',
    category: defaultCategory,
    host: '',
    port: 22,
    username: 'root',
    authType: 'password',
    password: '',
    privateKeyPath: '',
    passphrase: '',
    autoCommand: '',
  };
}

export const SshManagerModal: React.FC<SshManagerModalProps> = ({
  t,
  profiles,
  onConnect,
  onSaveProfile,
  onDeleteProfile,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('__ALL__');
  const [draft, setDraft] = useState<SshProfile | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of profiles) {
      set.add(p.category || t.sshModal.defaultCategory);
    }
    return ['__ALL__', ...Array.from(set)];
  }, [profiles, t.sshModal.defaultCategory]);

  const filtered = useMemo(() => {
    if (selectedCategory === '__ALL__') return profiles;
    return profiles.filter(
      (p) => (p.category || t.sshModal.defaultCategory) === selectedCategory,
    );
  }, [profiles, selectedCategory, t.sshModal.defaultCategory]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !draft.host.trim() || !draft.username.trim()) return;
    await onSaveProfile({
      ...draft,
      name: draft.name.trim() || `${draft.username}@${draft.host}`,
      category: draft.category.trim() || t.sshModal.defaultCategory,
      port: Number(draft.port) || 22,
    });
    setDraft(null);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={16} /> {t.sshModal.title}
          </h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`btn ${selectedCategory === cat ? 'primary' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === '__ALL__' ? t.sshModal.allCategories : cat}
                </button>
              ))}
            </div>
            <button
              className="btn primary"
              onClick={() => setDraft(emptyDraft(t.sshModal.defaultCategory))}
            >
              <Plus size={14} /> {t.sshModal.newProfile}
            </button>
          </div>

          {draft && (
            <form
              onSubmit={(e) => void handleSave(e)}
              style={{
                padding: 12,
                border: '1px solid var(--nt-border-color)',
                borderRadius: 8,
                background: 'var(--nt-window-bg)',
              }}
            >
              <div className="form-grid">
                <div className="form-field">
                  <label>{t.sshModal.profileName}</label>
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder={t.sshModal.profileNamePlaceholder}
                  />
                </div>
                <div className="form-field">
                  <label>{t.sshModal.category}</label>
                  <input
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    placeholder={t.sshModal.categoryPlaceholder}
                  />
                </div>
                <div className="form-field">
                  <label>{t.sshModal.host}</label>
                  <input
                    required
                    value={draft.host}
                    onChange={(e) => setDraft({ ...draft, host: e.target.value })}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="form-field">
                  <label>{t.sshModal.port}</label>
                  <input
                    type="number"
                    value={draft.port}
                    onChange={(e) => setDraft({ ...draft, port: Number(e.target.value) })}
                  />
                </div>
                <div className="form-field">
                  <label>{t.sshModal.username}</label>
                  <input
                    required
                    value={draft.username}
                    onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                    placeholder="ubuntu"
                  />
                </div>
                <div className="form-field">
                  <label>{t.sshModal.authType}</label>
                  <select
                    value={draft.authType}
                    onChange={(e) =>
                      setDraft({ ...draft, authType: e.target.value as SshAuthType })
                    }
                  >
                    <option value="password">{t.sshModal.authPassword}</option>
                    <option value="privateKey">{t.sshModal.authPrivateKey}</option>
                    <option value="agent">{t.sshModal.authAgent}</option>
                  </select>
                </div>

                {draft.authType === 'password' && (
                  <div className="form-field full">
                    <label>{t.sshModal.passwordHint}</label>
                    <input
                      type="password"
                      value={draft.password ?? ''}
                      onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                    />
                  </div>
                )}

                {draft.authType === 'privateKey' && (
                  <>
                    <div className="form-field">
                      <label>{t.sshModal.privateKeyPath}</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          style={{ flex: 1 }}
                          value={draft.privateKeyPath ?? ''}
                          onChange={(e) =>
                            setDraft({ ...draft, privateKeyPath: e.target.value })
                          }
                          placeholder="~/.ssh/id_ed25519"
                        />
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            void window.novaTerm.dialog.pickKeyFile().then((p) => {
                              if (p) setDraft({ ...draft, privateKeyPath: p });
                            });
                          }}
                        >
                          <FolderOpen size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="form-field">
                      <label>{t.sshModal.passphrase}</label>
                      <input
                        type="password"
                        value={draft.passphrase ?? ''}
                        onChange={(e) =>
                          setDraft({ ...draft, passphrase: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}

                <div className="form-field full">
                  <label>{t.sshModal.autoCommand}</label>
                  <input
                    value={draft.autoCommand ?? ''}
                    onChange={(e) => setDraft({ ...draft, autoCommand: e.target.value })}
                    placeholder={t.sshModal.autoCommandPlaceholder}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn" onClick={() => setDraft(null)}>
                  {t.sshModal.cancel}
                </button>
                <button type="submit" className="btn primary">
                  {t.sshModal.saveProfile}
                </button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.length === 0 ? (
              <div style={{ color: 'var(--nt-text-secondary)', padding: 16, textAlign: 'center' }}>
                {t.sshModal.emptyList}
              </div>
            ) : (
              filtered.map((profile) => (
                <div
                  key={profile.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--nt-border-color)',
                    background: 'var(--nt-window-bg)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {profile.name}{' '}
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'var(--nt-surface-bg)',
                          color: 'var(--nt-accent-color)',
                          marginLeft: 6,
                        }}
                      >
                        {profile.category || t.sshModal.defaultCategory}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--nt-text-secondary)', marginTop: 2 }}>
                      {profile.username}@{profile.host}:{profile.port} • {profile.authType}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn primary"
                      onClick={() => {
                        onConnect(profile);
                        onClose();
                      }}
                    >
                      <Play size={13} /> {t.sshModal.connect}
                    </button>
                    <button
                      className="btn"
                      onClick={() => setDraft({ ...profile, password: '', passphrase: '' })}
                    >
                      {t.sshModal.edit}
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => void onDeleteProfile(profile.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            {t.sshModal.close}
          </button>
        </div>
      </div>
    </div>
  );
};
