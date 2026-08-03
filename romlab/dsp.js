// ═══════════════════════════════════════════════════════════════
//  Stem separation without a neural network
//
//  Proper source separation (Spleeter, Demucs) needs a trained model.
//  What is achievable with classical DSP, and works genuinely well:
//
//   • HPSS — harmonic/percussive separation (Fitzgerald 2010). In a
//     spectrogram, sustained pitched content forms horizontal ridges and
//     transients form vertical ones. Median-filtering along time keeps the
//     horizontal structure, along frequency keeps the vertical, and the two
//     results become soft masks. Drums fall out of one side, pitched
//     material out of the other.
//   • Mid/side — lead vocals are almost always centre-panned, so the
//     difference signal drops them and the sum emphasises them.
//   • Band splitting — isolates bass from the harmonic residue.
//
//  Combining these gives drums, bass, a vocal-ish centre and an
//  instrumental bed. It is not model-quality, but it is honest DSP and it
//  runs entirely in the page.
// ═══════════════════════════════════════════════════════════════
const DSP = (function () {
  'use strict';

  // ── in-place iterative radix-2 FFT ───────────────────────────
  function fft(re, im, inverse) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {          // bit reversal
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (inverse ? 2 : -2) * Math.PI / len;
      const wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const ar = re[i + k],           ai = im[i + k];
          const br = re[i + k + len / 2], bi = im[i + k + len / 2];
          const tr = br * cr - bi * ci,   ti = br * ci + bi * cr;
          re[i + k] = ar + tr;            im[i + k] = ai + ti;
          re[i + k + len / 2] = ar - tr;  im[i + k + len / 2] = ai - ti;
          const ncr = cr * wr - ci * wi;
          ci = cr * wi + ci * wr; cr = ncr;
        }
      }
    }
    if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }

  const hann = N => {
    const w = new Float32Array(N);
    for (let i = 0; i < N; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
    return w;
  };

  // ── STFT / inverse, with Hann analysis and synthesis windows ──
  function stft(x, N, hop) {
    const w = hann(N);
    const frames = Math.max(1, Math.ceil((x.length) / hop));
    const bins = N / 2 + 1;
    const re = new Float32Array(frames * bins);
    const im = new Float32Array(frames * bins);
    const br = new Float64Array(N), bi = new Float64Array(N);
    for (let f = 0; f < frames; f++) {
      const off = f * hop;
      for (let i = 0; i < N; i++) {
        const s = off + i - (N >> 1);
        br[i] = (s >= 0 && s < x.length ? x[s] : 0) * w[i];
        bi[i] = 0;
      }
      fft(br, bi, false);
      for (let k = 0; k < bins; k++) { re[f * bins + k] = br[k]; im[f * bins + k] = bi[k]; }
    }
    return { re, im, frames, bins, N, hop };
  }

  function istft(S, length) {
    const { re, im, frames, bins, N, hop } = S;
    const w = hann(N);
    const out = new Float32Array(length);
    const norm = new Float32Array(length);
    const br = new Float64Array(N), bi = new Float64Array(N);
    for (let f = 0; f < frames; f++) {
      for (let k = 0; k < bins; k++) { br[k] = re[f * bins + k]; bi[k] = im[f * bins + k]; }
      for (let k = bins; k < N; k++) {           // rebuild the conjugate half
        br[k] =  re[f * bins + (N - k)];
        bi[k] = -im[f * bins + (N - k)];
      }
      fft(br, bi, true);
      const off = f * hop;
      for (let i = 0; i < N; i++) {
        const s = off + i - (N >> 1);
        if (s < 0 || s >= length) continue;
        out[s]  += br[i] * w[i];
        norm[s] += w[i] * w[i];
      }
    }
    for (let i = 0; i < length; i++) if (norm[i] > 1e-8) out[i] /= norm[i];
    return out;
  }

  // ── median of a small odd window ─────────────────────────────
  function median(buf, n) {
    for (let i = 1; i < n; i++) {                 // insertion sort, n is tiny
      const v = buf[i];
      let j = i - 1;
      while (j >= 0 && buf[j] > v) { buf[j + 1] = buf[j]; j--; }
      buf[j + 1] = v;
    }
    return buf[n >> 1];
  }

  // Median filter the magnitude spectrogram two ways, then turn the pair
  // into soft (Wiener-style) masks.
  // Fills H and P for frames [f0, f1). Call repeatedly, yielding between
  // calls, then finish with normaliseMasks.
  function hpssRange(mag, frames, bins, kt, kf, f0, f1, H, P) {
    const half = kt >> 1, halfF = kf >> 1;
    const win = new Float64Array(Math.max(kt, kf));
    for (let f = f0; f < f1; f++) {
      for (let k = 0; k < bins; k++) {
        let n = 0;
        for (let d = -half; d <= half; d++) {
          const ff = f + d;
          win[n++] = (ff >= 0 && ff < frames) ? mag[ff * bins + k] : 0;
        }
        H[f * bins + k] = median(win, n);
        n = 0;
        for (let d = -halfF; d <= halfF; d++) {
          const kk = k + d;
          win[n++] = (kk >= 0 && kk < bins) ? mag[f * bins + kk] : 0;
        }
        P[f * bins + k] = median(win, n);
      }
    }
  }

  function normaliseMasks(H, P) {
    for (let i = 0; i < H.length; i++) {
      const h = H[i] * H[i], p = P[i] * P[i], s = h + p + 1e-12;
      H[i] = h / s;
      P[i] = p / s;
    }
  }

  function hpssMasks(mag, frames, bins, kt, kf) {
    const H = new Float32Array(frames * bins);
    const P = new Float32Array(frames * bins);
    const half = kt >> 1, halfF = kf >> 1;
    const win = new Float64Array(Math.max(kt, kf));

    for (let f = 0; f < frames; f++) {
      for (let k = 0; k < bins; k++) {
        let n = 0;
        for (let d = -half; d <= half; d++) {     // along time -> harmonic
          const ff = f + d;
          win[n++] = (ff >= 0 && ff < frames) ? mag[ff * bins + k] : 0;
        }
        H[f * bins + k] = median(win, n);
        n = 0;
        for (let d = -halfF; d <= halfF; d++) {   // along frequency -> percussive
          const kk = k + d;
          win[n++] = (kk >= 0 && kk < bins) ? mag[f * bins + kk] : 0;
        }
        P[f * bins + k] = median(win, n);
      }
    }
    // soft masks, squared so the split is decisive without being brittle
    for (let i = 0; i < H.length; i++) {
      const h = H[i] * H[i], p = P[i] * P[i], s = h + p + 1e-12;
      H[i] = h / s;
      P[i] = p / s;
    }
    return { H, P };
  }

  const applyMask = (S, mask) => ({
    re: Float32Array.from(S.re, (v, i) => v * mask[i]),
    im: Float32Array.from(S.im, (v, i) => v * mask[i]),
    frames: S.frames, bins: S.bins, N: S.N, hop: S.hop,
  });

  // Split one channel into harmonic and percussive parts.
  function splitChannel(x, N, hop, kt, kf) {
    const S = stft(x, N, hop);
    const mag = new Float32Array(S.re.length);
    for (let i = 0; i < mag.length; i++) mag[i] = Math.hypot(S.re[i], S.im[i]);
    const { H, P } = hpssMasks(mag, S.frames, S.bins, kt, kf);
    return {
      harmonic:   istft(applyMask(S, H), x.length),
      percussive: istft(applyMask(S, P), x.length),
    };
  }

  // One-pole cascade, used to lift bass out of the harmonic residue.
  function lowpass(x, cutoff, sr, poles) {
    const dt = 1 / sr, rc = 1 / (2 * Math.PI * cutoff);
    const a = dt / (rc + dt);
    let out = Float32Array.from(x);
    for (let p = 0; p < (poles || 2); p++) {
      let prev = 0;
      for (let i = 0; i < out.length; i++) { prev += a * (out[i] - prev); out[i] = prev; }
    }
    return out;
  }
  function highpass(x, cutoff, sr, poles) {
    const lo = lowpass(x, cutoff, sr, poles);
    const out = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) out[i] = x[i] - lo[i];
    return out;
  }

  return { fft, hann, stft, istft, hpssMasks, hpssRange, normaliseMasks,
           splitChannel, lowpass, highpass, median };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = DSP;
