import { useMemo, useRef, useState } from 'react'
import useEntriesStore from '../../../store/entriesStore'
import { buildOtpauthUri } from '../../../lib/otpauthUri'
import { parseImportText } from '../../../lib/importParser'
import { useToast } from '../../components/Toast'
import { Icons } from '../../components/Icons'

export function ImportExportPanel({ hasAccounts = true }: { hasAccounts?: boolean }) {
  const { entries, addEntry } = useEntriesStore()
  const { show } = useToast()
  const [tab, setTab] = useState<'export' | 'import'>('export')
  const [text, setText] = useState('')
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Parsed text state drives inline validation and Import button state.
  const parsed = useMemo(() => parseImportText(text), [text])
  const canImport = !importing && parsed.entries.length > 0 && !parsed.error

  const exportJson = () => {
    if (!hasAccounts) return
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'otp-backup.json' })
    a.click(); URL.revokeObjectURL(a.href); show('Exported!', 'success')
  }

  const copyUris = () => {
    if (!hasAccounts) return
    navigator.clipboard.writeText(entries.map(buildOtpauthUri).join('\n')).then(() => show('URIs copied!', 'success'))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const content = await file.text()
      setText(content)
      show('File loaded — review and click Import', 'info')
    } catch { show('Could not read file', 'error') }
    e.target.value = ''  // Allow re-selecting same file
  }

  const handleUploadClick = async () => {
    // @ts-ignore
    if (window.__TAURI_IPC__) {
      try {
        const { invoke } = await import('@tauri-apps/api/tauri')
        await invoke('set_ignore_blur', { ignore: true })
      } catch (e) { /* ignore */ }
    }
    fileRef.current?.click()
  }

  const doImport = async () => {
    if (!canImport) return
    setImporting(true)
    try {
      for (const entry of parsed.entries) await addEntry(entry)
      show(`Imported ${parsed.entries.length} account${parsed.entries.length !== 1 ? 's' : ''}`, 'success')
      setText('')
    } catch (e) {
      show((e as Error).message, 'error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['export', 'import'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1.5px solid ${tab === t ? 'var(--c-primary)' : 'var(--c-border)'}`, background: tab === t ? 'var(--c-primary)' : 'var(--c-surface)', color: tab === t ? '#fff' : 'var(--c-text)', fontWeight: 700, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'export' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--c-text2)' }}>{entries.length} account{entries.length !== 1 ? 's' : ''} ready to export</p>
          <button onClick={exportJson} disabled={!hasAccounts}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', borderRadius: 10, background: hasAccounts ? 'var(--c-primary)' : 'var(--c-border)', color: hasAccounts ? '#fff' : 'var(--c-text3)', fontWeight: 700, fontSize: 13, border: 'none', cursor: hasAccounts ? 'pointer' : 'not-allowed', opacity: hasAccounts ? 1 : 0.6 }}>
            <Icons.Download size={16} color={hasAccounts ? '#fff' : 'var(--c-text3)'} /> Export JSON
          </button>
          <button onClick={copyUris} disabled={!hasAccounts}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', borderRadius: 10, background: 'var(--c-surface)', color: hasAccounts ? 'var(--c-text)' : 'var(--c-text3)', fontWeight: 700, fontSize: 13, border: '1.5px solid var(--c-border)', cursor: hasAccounts ? 'pointer' : 'not-allowed', opacity: hasAccounts ? 1 : 0.6 }}>
            <Icons.Copy size={16} /> Copy as otpauth URIs
          </button>
        </div>
      ) : (
        <>
          <input ref={fileRef} type="file" accept=".json,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
          <button onClick={handleUploadClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '10px', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text)', fontWeight: 600, fontSize: 13, border: '1.5px dashed var(--c-border)', cursor: 'pointer', marginBottom: 8 }}>
            <Icons.Upload size={15} /> Upload JSON or text file
          </button>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Paste JSON or otpauth:// URIs (one per line)"
            style={{ width: '100%', padding: '9px 10px', border: '1.5px solid var(--c-border)', borderRadius: 8, background: 'var(--c-surface)', color: 'var(--c-text)', resize: 'none', fontSize: 13, outline: 'none', marginBottom: 7, boxSizing: 'border-box' }} />
          {parsed.error && <p style={{ color: 'var(--c-danger)', fontSize: 12, marginBottom: 7 }}>{parsed.error}</p>}
          {!parsed.error && parsed.entries.length > 0 && (
            <p style={{ color: 'var(--c-success)', fontSize: 12, marginBottom: 7 }}>
              ✓ {parsed.entries.length} valid account{parsed.entries.length !== 1 ? 's' : ''} ready to import
            </p>
          )}
          <button onClick={doImport} disabled={!canImport}
            style={{ width: '100%', padding: '11px', borderRadius: 10, background: canImport ? 'var(--c-primary)' : 'var(--c-border)', color: canImport ? '#fff' : 'var(--c-text3)', fontWeight: 700, fontSize: 13, border: 'none', cursor: canImport ? 'pointer' : 'not-allowed', opacity: canImport ? 1 : 0.7 }}>
            {importing ? 'Importing…' : 'Import'}
          </button>
        </>
      )}
    </div>
  )
}
