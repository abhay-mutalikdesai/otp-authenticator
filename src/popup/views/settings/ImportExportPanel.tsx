import { useMemo, useRef, useState } from 'react'
import useEntriesStore from '../../../store/entriesStore'
import { buildOtpauthUri } from '../../../lib/otpauthUri'
import { parseImportText } from '../../../lib/importParser'
import { useToast } from '../../components/Toast'
import { Icons } from '../../components/Icons'
import { platform } from '../../../lib/platform'

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
    try {
      await platform.setIgnoreBlur(true)
    } catch { /* ignore */ }
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
            className={`ie-tab-btn ${tab === t ? 'ie-tab-btn--active' : ''}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'export' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--c-text2)' }}>{entries.length} account{entries.length !== 1 ? 's' : ''} ready to export</p>
          <button onClick={exportJson} disabled={!hasAccounts}
            className={`btn btn--md btn--full ${hasAccounts ? 'btn--primary' : ''}`}
            style={!hasAccounts ? { background: 'var(--c-border)', color: 'var(--c-text3)', cursor: 'not-allowed' } : { gap: 7, padding: 11, borderRadius: 10 }}>
            <Icons.Download size={16} color={hasAccounts ? '#fff' : 'var(--c-text3)'} /> Export JSON
          </button>
          <button onClick={copyUris} disabled={!hasAccounts}
            className="btn btn--md btn--full"
            style={{ gap: 7, padding: 11, borderRadius: 10, background: 'var(--c-surface)', color: hasAccounts ? 'var(--c-text)' : 'var(--c-text3)', border: '1.5px solid var(--c-border)', opacity: hasAccounts ? 1 : 0.6, cursor: hasAccounts ? 'pointer' : 'not-allowed' }}>
            <Icons.Copy size={16} /> Copy as otpauth URIs
          </button>
        </div>
      ) : (
        <>
          <input ref={fileRef} type="file" accept=".json,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
          <button onClick={handleUploadClick} className="ie-upload-btn">
            <Icons.Upload size={15} /> Upload JSON or text file
          </button>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Paste JSON or otpauth:// URIs (one per line)"
            className="ie-textarea" />
          {parsed.error && <p className="msg-error" style={{ marginBottom: 7 }}>{parsed.error}</p>}
          {!parsed.error && parsed.entries.length > 0 && (
            <p className="msg-success" style={{ marginBottom: 7 }}>
              ✓ {parsed.entries.length} valid account{parsed.entries.length !== 1 ? 's' : ''} ready to import
            </p>
          )}
          <button onClick={doImport} disabled={!canImport}
            className={`btn btn--md btn--full ${canImport ? 'btn--primary' : ''}`}
            style={!canImport ? { background: 'var(--c-border)', color: 'var(--c-text3)', cursor: 'not-allowed', opacity: 0.7, padding: 11, borderRadius: 10 } : { padding: 11, borderRadius: 10 }}>
            {importing ? 'Importing…' : 'Import'}
          </button>
        </>
      )}
    </div>
  )
}
