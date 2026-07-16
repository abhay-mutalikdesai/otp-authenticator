import { useCallback, useEffect, useRef, useState } from 'react'
import useEntriesStore from '../../store/entriesStore'
import useSettingsStore from '../../store/settingsStore'
import useAuthStore from '../../store/authStore'
import { useNavigationStore } from '../../store/navigationStore'
import type { Algorithm, Encoding, OtpType } from '../../types'
import { validateAndPreview } from '../../lib/otp'
import { parseOtpauthUri } from '../../lib/otpauthUri'
import { detectEncoding } from '../../lib/secretDecoder'
import { getSessionValue, removeSessionValue, setSessionValue, SESSION_KEYS, type DraftSession } from '../../lib/sessionState'
import { useToast } from '../components/Toast'
import { Header, Field, PwInput, TextInput, FSelect } from '../components/primitives'
import { Icons } from '../components/Icons'
import jsQR from 'jsqr'
import { platform } from '../../lib/platform'

const UNPROTECTED_DRAFT_MAX_AGE_MS = 5 * 60 * 1000

/** Add or edit an OTP entry. Handles parsing URIs, drafts, and validation. */
export function AddEditEntry() {
  const { view, params, goBack } = useNavigationStore()
  const { entries, addEntry, updateEntry } = useEntriesStore()
  const { defaultAlgorithm, defaultDigits, defaultPeriod } = useSettingsStore()
  const { show } = useToast()
  const isEdit = view === 'edit'
  const ex = isEdit ? entries.find(e => e.id === params.id) : undefined
  const defaultType: OtpType = (params.defaultType as OtpType) || 'totp'

  const [type, setType] = useState<OtpType>(ex?.type ?? defaultType)
  const [issuer, setIssuer] = useState(ex?.issuer ?? '')
  const [account, setAccount] = useState(ex?.account ?? '')
  const [secret, setSecret] = useState(ex?.secret ?? '')
  const [encoding, setEncoding] = useState<Encoding>(() => {
    if (!ex) return 'auto'
    return ex.encoding === 'auto' ? detectEncoding(ex.secret) : ex.encoding
  })
  const [algorithm, setAlgorithm] = useState<Algorithm>(ex?.algorithm ?? defaultAlgorithm ?? 'SHA256')
  const [digits, setDigits] = useState(String(ex?.digits ?? defaultDigits ?? 6))
  const [period, setPeriod] = useState(String(ex?.period ?? defaultPeriod ?? 30))
  const [counter, setCounter] = useState(String(ex?.counter ?? 0))
  const [uri, setUri] = useState('')
  const [uriErr, setUriErr] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [previewErr, setPreviewErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [adv, setAdv] = useState(false)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const draftRestored = useRef(false)

  // Restore draft state left over from before the popup closed.
  useEffect(() => {
    (async () => {
      const draft = await getSessionValue<DraftSession>(SESSION_KEYS.draft)
      draftRestored.current = true
      if (!draft || draft.view !== view || (isEdit && draft.id !== params.id)) return
      const maxAgeMs = useAuthStore.getState().hasMasterPassword ? null : UNPROTECTED_DRAFT_MAX_AGE_MS
      if (maxAgeMs !== null && Date.now() - draft.savedAt > maxAgeMs) { await removeSessionValue(SESSION_KEYS.draft); return }
      const f = draft.fields as Record<string, string>
      if (f.type) setType(f.type as OtpType)
      if (f.issuer !== undefined) setIssuer(f.issuer)
      if (f.account !== undefined) setAccount(f.account)
      if (f.secret !== undefined) setSecret(f.secret)
      if (f.encoding) setEncoding(f.encoding as Encoding)
      if (f.algorithm) setAlgorithm(f.algorithm as Algorithm)
      if (f.digits) setDigits(f.digits)
      if (f.period) setPeriod(f.period)
      if (f.counter) setCounter(f.counter)
      if (f.adv !== undefined) setAdv(f.adv === 'true')
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist draft state (debounced) so it survives popup closures.
  useEffect(() => {
    if (!draftRestored.current) return
    const t = setTimeout(() => {
      const fields = { type, issuer, account, secret, encoding, algorithm, digits, period, counter, adv: String(adv) }
      void setSessionValue(SESSION_KEYS.draft, { view, id: isEdit ? params.id : undefined, fields, savedAt: Date.now() } satisfies DraftSession)
    }, 300)
    return () => clearTimeout(t)
  }, [type, issuer, account, secret, encoding, algorithm, digits, period, counter, adv, view, isEdit, params.id])

  const doPreview = useCallback(async () => {
    if (!secret.trim()) { setPreview(null); setPreviewErr(''); return }
    try {
      const res = await validateAndPreview(secret.trim(), encoding, { type, algorithm, digits: parseInt(digits), period: parseInt(period), counter: parseInt(counter) })
      if (res.valid) { setPreview(res.preview); setPreviewErr('') }
      else { setPreview(null); setPreviewErr(res.error || 'Invalid secret') }
    } catch { setPreview(null); setPreviewErr('Invalid secret') }
  }, [secret, encoding, type, algorithm, digits, period, counter])

  useEffect(() => { doPreview() }, [doPreview])

  const parseUri = () => {
    try {
      const p = parseOtpauthUri(uri.trim())
      setType(p.type); setIssuer(p.issuer); setAccount(p.account)
      setSecret(p.secret); setAlgorithm(p.algorithm); setDigits(String(p.digits))
      setPeriod(String(p.period)); setCounter(String(p.counter)); setEncoding('base32'); setUriErr('')
    } catch (e) { setUriErr((e as Error).message) }
  }

  const decodeQR = async (file: File | Blob) => {
    try {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.src = url
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject })
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to get canvas context')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      if (code) {
        setUri(code.data)
        try {
          const p = parseOtpauthUri(code.data.trim())
          setType(p.type); setIssuer(p.issuer); setAccount(p.account)
          setSecret(p.secret); setAlgorithm(p.algorithm); setDigits(String(p.digits))
          setPeriod(String(p.period)); setCounter(String(p.counter)); setEncoding('base32'); setUriErr('')
          show('QR Code parsed successfully', 'success')
        } catch (e) { setUriErr((e as Error).message) }
      } else { setUriErr('No QR code found in the image.') }
    } catch { setUriErr('Failed to read image.') }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void decodeQR(file)
    e.target.value = ''
  }

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            await decodeQR(blob)
            return
          }
        }
      }
      setUriErr('No image found in clipboard.')
    } catch { setUriErr('Failed to read clipboard. Please allow clipboard permissions or paste directly into the text field.') }
  }

  const save = async () => {
    const e: Record<string, string> = {}
    if (!account.trim()) e.account = 'Required'
    if (!secret.trim()) e.secret = 'Required'
    if (previewErr) e.secret = previewErr
    setErrs(e)
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      const data = {
        type, issuer: issuer.trim(), account: account.trim(), secret: secret.trim(),
        encoding, algorithm, digits: parseInt(digits), period: parseInt(period),
        counter: parseInt(counter),
      }
      if (isEdit && ex) await updateEntry(ex.id, data)
      else await addEntry(data)
      await removeSessionValue(SESSION_KEYS.draft)
      show(isEdit ? 'Updated!' : 'Account added!', 'success')
      goBack()
    } catch (e) { show((e as Error).message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="view-container anim-slide-right">
      <Header title={isEdit ? 'Edit Account' : 'Add Account'} onBack={goBack} />

      <div className="view-body" style={{ padding: '13px 13px 0' }}>

        {!isEdit && (
          <div className="import-box">
            <p className="import-box__title">Import Account</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input type="password" value={uri} onChange={e => setUri(e.target.value)} placeholder="otpauth://totp/..."
                className="import-box__uri-input" />
              <button onClick={parseUri} className="btn btn--primary" style={{ padding: '8px 13px', borderRadius: 7, whiteSpace: 'nowrap' }}>Parse</button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <label className="import-box__action-btn">
                <Icons.Upload size={16} />
                Upload QR
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onClick={() => { platform.setIgnoreBlur(true).catch(() => {}) }}
                  onChange={handleFileUpload}
                />
              </label>
              <button onClick={handlePaste} className="import-box__action-btn">
                <Icons.Clipboard size={16} />
                Paste QR
              </button>
            </div>
            {uriErr && <p className="msg-error" style={{ marginTop: 6, textAlign: 'center' }}>{uriErr}</p>}
          </div>
        )}

        {!isEdit && (
          <Field label="Type">
            <div style={{ display: 'flex', gap: 6 }}>
              {(['totp', 'hotp'] as OtpType[]).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`type-toggle-btn ${type === t ? 'type-toggle-btn--active' : ''}`}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Issuer (optional)"><TextInput value={issuer} onChange={setIssuer} placeholder="e.g. GitHub" /></Field>
        <Field label="Account" error={errs.account}><TextInput value={account} onChange={setAccount} placeholder="e.g. user@email.com" /></Field>

        <Field label="Secret Key" error={errs.secret}>
          <PwInput value={secret} onChange={v => { setSecret(v); setErrs(p => ({ ...p, secret: '' })) }} placeholder="secret key" />
          {preview && !errs.secret && <p className="msg-success" style={{ marginTop: 4 }}>✓ Valid — preview: {preview}</p>}
          {previewErr && !errs.secret && <p className="msg-error" style={{ marginTop: 4 }}>✗ {previewErr}</p>}
        </Field>

        <button onClick={() => setAdv(v => !v)} className="advanced-toggle">
          {adv ? '▴ Hide' : '▾ Show'} advanced options
        </button>

        {adv && (
          <div className="advanced-box">
            <Field label="Encoding">
              <FSelect value={encoding} onChange={v => setEncoding(v as Encoding)} options={[{ value: 'auto', label: 'Auto-detect' }, { value: 'base32', label: 'Base32' }, { value: 'base64', label: 'Base64' }, { value: 'hex', label: 'Hex' }]} />
            </Field>
            <Field label="Algorithm">
              <FSelect value={algorithm} onChange={v => setAlgorithm(v as Algorithm)} options={[{ value: 'SHA256', label: 'SHA-256' }, { value: 'SHA1', label: 'SHA-1' }, { value: 'SHA512', label: 'SHA-512' }]} />
            </Field>
            <Field label="Digits">
              <FSelect value={digits} onChange={setDigits} options={['4', '6', '8'].map(d => ({ value: d, label: `${d} digits` }))} />
            </Field>
            {type === 'totp' && (
              <Field label="Period">
                <FSelect value={period} onChange={setPeriod} options={['15', '30', '60', '90', '120'].map(p => ({ value: p, label: `${p} seconds` }))} />
              </Field>
            )}
            {type === 'hotp' && (
              <Field label="Initial counter"><TextInput value={counter} onChange={setCounter} type="number" placeholder="0" /></Field>
            )}
          </div>
        )}

        <div style={{ height: 8 }} />
      </div>

      <div className="form-footer">
        <button onClick={save} disabled={saving}
          className={`btn btn--lg btn--full ${saving ? '' : 'btn--primary'}`}
          style={saving ? { background: 'var(--c-border)', color: 'var(--c-text3)', cursor: 'not-allowed' } : undefined}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Account'}
        </button>
      </div>
    </div>
  )
}
