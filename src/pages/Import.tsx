import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { ImportedOwnedData } from '../engine/types';

type Status = 'loading' | 'success' | 'error';

/**
 * Deep-link import endpoint used by the companion save reader.
 * URL shape:  #/import?data=<base64-encoded JSON>
 *
 * The data parameter never leaves the browser; URL hashes are not sent to
 * the GitHub Pages server. After importing, we strip the data from the URL
 * so it doesn't sit in browser history.
 */
export function Import() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const importOwned = useStore(s => s.importOwned);

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);

  // Guard against the effect firing twice. React Router v7 intercepts
  // history.replaceState calls and re-fires searchParams updates, which
  // would re-trigger this effect and cancel the redirect timer. Running
  // the import logic exactly once per mount avoids that entirely.
  const didImport = useRef(false);

  useEffect(() => {
    if (didImport.current) return;
    didImport.current = true;

    const raw = searchParams.get('data');
    if (!raw) {
      setStatus('error');
      setMessage('No import data found in the URL.');
      return;
    }

    try {
      // Accept both standard base64 and URL-safe base64
      const normalised = raw.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalised + '='.repeat((4 - normalised.length % 4) % 4);
      // atob decodes to binary (Latin-1), not UTF-8. Run it through TextDecoder
      // so multi-byte sequences like "Arsène" (0xC3 0xA8) survive intact.
      const binaryStr = atob(padded);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const json = new TextDecoder('utf-8').decode(bytes);
      const parsed = JSON.parse(json) as ImportedOwnedData;

      if (parsed.version !== 1 || !parsed.personas || typeof parsed.personas !== 'object') {
        setStatus('error');
        setMessage('Import data is in an unexpected format.');
        return;
      }

      importOwned(parsed);
      const ownedCount = Object.values(parsed.personas).filter(p => p.owned).length;
      setCount(ownedCount);
      setStatus('success');
      setMessage(`Imported ${ownedCount} owned personas from ${parsed.source === 'save-file' ? 'your save file' : 'backup'}.`);

      // Redirect to the persona list; this also cleans the data param out of
      // the URL naturally (the new hash is #/list, not #/import?data=...).
      const timer = setTimeout(() => navigate('/list', { replace: true }), 2500);
      return () => clearTimeout(timer);
    } catch {
      setStatus('error');
      setMessage('Failed to decode the import data. The URL may be corrupted.');
    }
  }, [searchParams, importOwned, navigate]);

  const borderColor =
    status === 'success' ? 'border-green-500' :
    status === 'error'   ? 'border-p5red'     :
                           'border-p5border';

  return (
    <div className="flex items-center justify-center p-8 min-h-[60vh]">
      <div className={`card-p5 p-8 max-w-md w-full text-center border-2 ${borderColor}`}>
        <div className="flex items-center justify-center gap-3 border-b border-p5border pb-4 mb-4">
          <div className="w-1 h-8 bg-p5red" />
          <h1 className="font-display font-bold text-xl text-p5white tracking-widest uppercase">
            Save Import
          </h1>
        </div>

        {status === 'loading' && (
          <div className="py-4">
            <div className="text-p5white font-display tracking-wider">Processing import…</div>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 flex flex-col gap-3">
            <div className="text-4xl text-green-400">✓</div>
            <div className="text-p5white font-display tracking-wider">{message}</div>
            {count > 0 && (
              <div className="text-xs text-gray-500 font-display">
                Your wishlist and notes were preserved.
              </div>
            )}
            <div className="text-xs text-gray-500 font-display mt-2">
              Redirecting to your persona list…
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 flex flex-col gap-3">
            <div className="text-4xl text-p5red">✕</div>
            <div className="text-p5white font-display tracking-wider">{message}</div>
            <Link to="/list" className="btn-ghost text-sm mt-2 inline-block">
              Back to Personas
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
