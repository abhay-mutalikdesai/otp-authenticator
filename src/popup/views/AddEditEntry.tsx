import { useCallback, useEffect, useState } from 'react'
import useEntriesStore from '../../store/entriesStore'
import useSettingsStore from '../../store/settingsStore'
import { useNavigationStore } from '../../store/navigationStore'
import type { Algorithm, Encoding, OtpType } from '../../types'
import { validateAndPreview } from '../../lib/otp'
import { parseOtpauthUri } from '../../lib/otpauthUri'
import { useToast } from '../components/Toast'
import { Header, Field, PwInput, TextInput, FSelect } from '../components/primitives'

/**
 * - Edit mode hides the Type selector (type is fixed for existing accounts)
 * - Advanced HOTP options: only "Initial counter"
 * - Digits: 4, 6, 8 only
 * - Save button is sticky at the bottom
 */
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
  const [encoding, setEncoding] = useState<Encoding>(ex?.encoding ?? 'auto')
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
      show(isEdit ? 'Updated!' : 'Account added!', 'success')
      goBack()
    } catch (e) { show((e as Error).message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} className="anim-slide-right">
      <Header title={isEdit ? 'Edit Account' : 'Add Account'} onBack={goBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '13px 13px 0' }}>

        {!isEdit && (
          <div style={{ background: 'var(--c-surface2)', borderRadius: 10, padding: '10px 12px', marginBottom: 13, border: '1px solid var(--c-border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.05em' }}>Import from URI</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={uri} onChange={e => setUri(e.target.value)} placeholder="otpauth://totp/..."
                style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--c-border)', borderRadius: 7, background: 'var(--c-surface)', color: 'var(--c-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-primary)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')} />
              <button onClick={parseUri} style={{ padding: '8px 13px', borderRadius: 7, background: 'var(--c-primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap' }}>Parse</button>
            </div>
            {uriErr && <p style={{ color: 'var(--c-danger)', fontSize: 12, marginTop: 4 }}>{uriErr}</p>}
          </div>
        )}

        {!isEdit && (
          <Field label="Type">
            <div style={{ display: 'flex', gap: 6 }}>
              {(['totp', 'hotp'] as OtpType[]).map(t => (
                <button key={t} onClick={() => setType(t)}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: `1.5px solid ${type === t ? 'var(--c-primary)' : 'var(--c-border)'}`, background: type === t ? 'var(--c-primary)' : 'var(--c-surface)', color: type === t ? '#fff' : 'var(--c-text)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Issuer (optional)"><TextInput value={issuer} onChange={setIssuer} placeholder="e.g. GitHub" /></Field>
        <Field label="Account" error={errs.account}><TextInput value={account} onChange={setAccount} placeholder="e.g. user@email.com" /></Field>

        <Field label="Secret Key" error={errs.secret}>
          <PwInput value={secret} onChange={v => { setSecret(v); setErrs(p => ({ ...p, secret: '' })) }} placeholder="Base32 encoded secret" />
          {preview && !errs.secret && <p style={{ fontSize: 12, color: 'var(--c-success)', marginTop: 4 }}>✓ Valid — preview: {preview}</p>}
          {previewErr && !errs.secret && <p style={{ fontSize: 12, color: 'var(--c-danger)', marginTop: 4 }}>✗ {previewErr}</p>}
        </Field>

        <button onClick={() => setAdv(v => !v)}
          style={{ fontSize: 13, color: 'var(--c-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
          {adv ? '▴ Hide' : '▾ Show'} advanced options
        </button>

        {adv && (
          <div style={{ background: 'var(--c-surface2)', borderRadius: 10, padding: '12px 12px 2px', marginBottom: 13, border: '1px solid var(--c-border)' }}>
            <Field label="Encoding">
              <FSelect value={encoding} onChange={v => setEncoding(v as Encoding)} options={[{ value: 'auto', label: 'Auto-detect' }, { value: 'base32', label: 'Base32' }, { value: 'base64', label: 'Base64' }, { value: 'hex', label: 'Hex' }]} />
            </Field>
            <Field label="Algorithm">
              <FSelect value={algorithm} onChange={v => setAlgorithm(v as Algorithm)} options={[{ value: 'SHA256', label: 'SHA-256 (recommended)' }, { value: 'SHA1', label: 'SHA-1' }, { value: 'SHA512', label: 'SHA-512' }]} />
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

      <div style={{ flexShrink: 0, padding: '10px 13px 13px', borderTop: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
        <button onClick={save} disabled={saving}
          style={{ width: '100%', padding: '12px', borderRadius: 11, background: saving ? 'var(--c-border)' : 'var(--c-primary)', color: saving ? 'var(--c-text3)' : '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Account'}
        </button>
      </div>
    </div>
  )
}
